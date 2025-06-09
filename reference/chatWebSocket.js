// Chat WebSocket Module

import { MAX_CHAT_MESSAGES } from './uiUpdater.js'; // MAX_CHAT_MESSAGES 임포트

let chatSocket;
let pingInterval;

// WebSocket Chat Functions
function sendHandshake(ws, chatChannelId, accessToken) {
    const handshakeMessage = {
        ver: "2",
        cmd: 100, // CMD_CONNECT
        svcid: "game",
        cid: chatChannelId,
        bdy: {
            uid: null, 
            devType: 2001, 
            accTkn: accessToken,
            auth: "READ" 
        },
        tid: 1 
    };
    ws.send(JSON.stringify(handshakeMessage));
    console.log("[WebSocket] Handshake sent:", handshakeMessage);
}

function startPing(ws) {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const pingMessage = { ver: "2", cmd: 10002 }; // CMD_PING
            ws.send(JSON.stringify(pingMessage));
        }
    }, 30000); 
}

function stopPing() {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = null;
}

export async function connectChatWebSocket(chatChannelId, accessToken, updateState, appState, renderChatMessage) {
    const serverNo = Math.floor(Math.random() * 10) + 1; 
    const socketUrl = `wss://kr-ss${serverNo}.chat.naver.com/chat`;

    if (chatSocket && chatSocket.readyState === WebSocket.OPEN && appState.chat.chatChannelId === chatChannelId) {
        console.log("[WebSocket] Already connected to this chat.");
        return;
    }
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        disconnectChatWebSocket(); // 다른 채널이었으면 이전 연결 종료
    }

    console.log(`[WebSocket] Connecting to ${socketUrl} for chatChannelId: ${chatChannelId}`);
    chatSocket = new WebSocket(socketUrl);
    updateState('chat.isConnected', false); // 연결 시도 중 상태

    chatSocket.onopen = () => {
        console.log("[WebSocket] Connected.");
        updateState('chat.isConnected', true); 
        sendHandshake(chatSocket, chatChannelId, accessToken);
        startPing(chatSocket);
    };

    chatSocket.onmessage = (event) => {
        handleChatMessage(event, updateState, appState, renderChatMessage);
    };

    chatSocket.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        stopPing();
        updateState('chat.isConnected', false); 
    };

    chatSocket.onclose = (event) => {
        console.log("[WebSocket] Disconnected or connection failed. Code:", event.code, "Reason:", event.reason);
        stopPing();
        updateState('chat.isConnected', false); 
    };
}

function handleChatMessage(event, updateState, appState, renderChatMessage) {
    const message = JSON.parse(event.data);
    
    switch (message.cmd) {
        case 10100: 
            console.log("[WebSocket] Connection successful (CMD_CONNECTED). SID:", message.bdy?.sid || 'N/A');
            break;
        case 93101: // 일반 채팅 메시지
            if (message.bdy && Array.isArray(message.bdy)) {
                handleChatMessages(message, updateState, appState, renderChatMessage);
            } else {
                console.warn("[WebSocket] CMD_CHAT received but no valid message body:", message);
            }
            break;
        case 93102: 
            if (message.bdy && Array.isArray(message.bdy)) {
                message.bdy.forEach(donation => {
                    const extras = donation.extras ? JSON.parse(donation.extras) : {};
                    console.log(`[DONATION] ${extras.nickname || '익명'}님이 ${extras.payAmount}원 후원! 메시지: ${extras.comment || donation.msg || ''}`);
                });
            }
            break;
         case 93103: 
            if (message.bdy && Array.isArray(message.bdy)) {
                message.bdy.forEach(sysMsg => {
                    const extras = sysMsg.extras ? JSON.parse(sysMsg.extras) : {};
                    console.log(`[SYSTEM] ${extras.description || sysMsg.msg}`);
                });
            }
            break;
        case 10002: // CMD_PONG (Ping response from server)
            break;
        default:
            console.log("[WebSocket] Unknown CMD:", message.cmd, message);
    }
}

function handleChatMessages(message, updateState, appState, renderChatMessage) {
    console.log(`[ChatMsgDebug] Received CMD_CHAT. Current appState.chat.autoOpenOnNewMessage: ${appState.chat.autoOpenOnNewMessage}, visibility: ${appState.chat.visibility}`);
    
    if (appState.chat.autoOpenOnNewMessage) {
        handleAutoOpenChat(updateState, appState);
    }

    message.bdy.forEach(chat => {
        // appState.chat.messages 배열에 메시지 추가
        appState.chat.messages.push(chat);

        // 메시지 개수 제한 (appState.chat.messages)
        if (appState.chat.messages.length > MAX_CHAT_MESSAGES) {
            const removeCount = appState.chat.messages.length - MAX_CHAT_MESSAGES;
            appState.chat.messages.splice(0, removeCount);
            console.log(`[AppState] Removed ${removeCount} old messages from appState.chat.messages. Current count: ${appState.chat.messages.length}`);
        }
        // updateState를 사용하여 messages 배열 변경 알림 (필요한 경우, UI가 이 배열을 직접 구독하지 않는다면 생략 가능)
        // updateState('chat.messages', [...appState.chat.messages]); // 새 배열로 교체하여 변경 감지 유도

        renderChatMessage(chat); // 메시지 렌더링 함수 호출 (DOM 업데이트)
    });
}

function handleAutoOpenChat(updateState, appState) {
    // 전역 변수로 타이머 관리 (main.js에서 가져와야 함)
    if (!window.autoHideChatTimerId) window.autoHideChatTimerId = null;
    
    if (appState.chat.visibility === 'expanded' && window.autoHideChatTimerId) {
        // 이미 확장되어 있고 자동 숨김 타이머가 실행 중이면, 타이머 리셋
        console.log('[ChatMsgDebug] Resetting auto-hide timer.');
        clearTimeout(window.autoHideChatTimerId);
        window.autoHideChatTimerId = setTimeout(() => {
            if (appState.chat.visibility === 'expanded' && appState.chat.autoOpenOnNewMessage) {
                console.log('[ChatMsgDebug] Auto-hiding after reset timeout.');
                updateState('chat.visibility', 'hidden');
            }
            window.autoHideChatTimerId = null;
        }, 10000); // 10초 후 숨김
    } else if (appState.chat.visibility === 'hidden' || appState.chat.visibility === 'peek') {
        // 숨겨져 있거나 peek 상태일 때만 새로 확장하고 타이머 시작
        console.log('[ChatMsgDebug] Auto-opening chat to expanded.');
        updateState('chat.visibility', 'expanded'); // 상태 변경 -> updateUIForStateChange에서 포커스 처리
        
        // 자동 숨김 타이머 설정 (새로 확장될 때만)
        if (window.autoHideChatTimerId) { 
            console.log('[ChatMsgDebug] Clearing previous autoHideChatTimerId before setting new one.');
            clearTimeout(window.autoHideChatTimerId);
        }
        window.autoHideChatTimerId = setTimeout(() => {
            if (appState.chat.visibility === 'expanded' && appState.chat.autoOpenOnNewMessage) {
                console.log('[ChatMsgDebug] Auto-hiding after initial timeout (new message).');
                updateState('chat.visibility', 'hidden');
            }
            window.autoHideChatTimerId = null;
        }, 10000); 
        console.log('[ChatMsgDebug] Set new autoHideChatTimerId.');
    }
}

export function disconnectChatWebSocket() {
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.close();
        console.log("[WebSocket] Disconnected.");
    }
    stopPing();
} 