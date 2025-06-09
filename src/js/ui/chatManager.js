// 채팅 관리 모듈 (ES5 호환)

// 채팅 상태 관리 변수들
var chatWebSocket = null;
var pingInterval = null;
var chatChannelId = null;
var chatAccessToken = null;
var isConnected = false;
var messageQueue = [];
var maxMessages = 50; // 최대 메시지 개수 제한

// 채팅창 DOM 요소들
var chatPanel = null;
var chatMessages = null;
var chatCloseBtn = null;
var isChatPanelVisible = false;

/**
 * 채팅 매니저 초기화
 */
function initializeChatManager() {
    chatPanel = document.getElementById('chat-panel');
    chatMessages = document.getElementById('chat-messages');
    chatCloseBtn = document.getElementById('chat-close-btn');
    
    if (!chatPanel || !chatMessages || !chatCloseBtn) {
        console.error('채팅 UI 요소를 찾을 수 없습니다');
        return false;
    }
    
    // 닫기 버튼 이벤트 리스너
    chatCloseBtn.addEventListener('click', function() {
        hideChatPanel();
    });
    
    console.log('채팅 매니저 초기화 완료');
    return true;
}

/**
 * 채팅 토글 화살표 표시 (사용하지 않음)
 */
function showChatToggleArrow() {
    // 화살표 제거됨 - 호환성을 위해 함수만 유지
    console.log('채팅 화살표 기능 비활성화됨');
}

/**
 * 채팅 토글 화살표 숨기기 (사용하지 않음)
 */
function hideChatToggleArrow() {
    // 화살표 제거됨 - 호환성을 위해 함수만 유지
    console.log('채팅 화살표 기능 비활성화됨');
}

/**
 * 채팅 토글 화살표에 포커스 설정/해제 (사용하지 않음)
 * @param {boolean} focused - 포커스 상태
 */
function setArrowFocus(focused) {
    // 화살표 제거됨 - 호환성을 위해 함수만 유지
    console.log('채팅 화살표 포커스 기능 비활성화됨');
}

/**
 * 채팅창 표시
 */
function showChatPanel() {
    if (!chatPanel) return;
    
    chatPanel.style.display = 'flex';
    // 약간의 지연 후 애니메이션 시작 (CSS transition)
    setTimeout(function() {
        chatPanel.classList.add('show');
        isChatPanelVisible = true;
        console.log('채팅창 표시');
    }, 10);
}

/**
 * 채팅창 숨기기
 */
function hideChatPanel() {
    if (!chatPanel) return;
    
    chatPanel.classList.remove('show');
    isChatPanelVisible = false;
    
    // 애니메이션 완료 후 display none
    setTimeout(function() {
        chatPanel.style.display = 'none';
        console.log('채팅창 숨김');
    }, 300);
}

/**
 * 채팅창 토글
 */
function toggleChatPanel() {
    if (isChatPanelVisible) {
        hideChatPanel();
    } else {
        showChatPanel();
    }
}

/**
 * 채팅 메시지 추가
 * @param {Object} messageData - 메시지 데이터
 */
function addChatMessage(messageData) {
    if (!chatMessages) return;
    
    var messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    // 시스템 메시지 처리
    if (messageData.isSystem) {
        messageElement.classList.add('system');
        messageElement.textContent = messageData.message || '';
    } else {
        var usernameElement = document.createElement('div');
        usernameElement.className = 'chat-username';
        usernameElement.textContent = messageData.username || '익명';
        
        var contentElement = document.createElement('div');
        contentElement.className = 'chat-content';
        contentElement.textContent = messageData.message || '';
        
        messageElement.appendChild(usernameElement);
        messageElement.appendChild(contentElement);
    }
    
    // 메시지 큐 관리
    messageQueue.push(messageElement);
    if (messageQueue.length > maxMessages) {
        var oldMessage = messageQueue.shift();
        if (oldMessage && oldMessage.parentNode) {
            oldMessage.parentNode.removeChild(oldMessage);
        }
    }
    
    chatMessages.appendChild(messageElement);
    
    // 자동 스크롤 (최신 메시지로)
    scrollToBottom();
}

/**
 * 채팅 메시지 목록을 최하단으로 스크롤
 */
function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * WebSocket 핸드셰이크 메시지 전송
 */
function sendHandshake(ws) {
    var handshakeMessage = {
        ver: "2",
        cmd: 100, // CMD_CONNECT
        svcid: "game",
        cid: chatChannelId,
        bdy: {
            uid: null,
            devType: 2001,
            accTkn: chatAccessToken,
            auth: "READ"
        },
        tid: 1
    };
    ws.send(JSON.stringify(handshakeMessage));
    console.log("[WebSocket] Handshake sent:", handshakeMessage);
}

/**
 * 30초 주기 PING 시작
 */
function startPing(ws) {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(function() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            var pingMessage = { ver: "2", cmd: 10002 }; // CMD_PING
            ws.send(JSON.stringify(pingMessage));
        }
    }, 30000);
}

/**
 * PING 중지
 */
function stopPing() {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = null;
}

/**
 * WebSocket 메시지 처리
 */
function handleChatMessage(event) {
    // 1. 원본 메시지를 콘솔에 출력 (테스트 목적)
    console.log("[WebSocket] Raw message received:", event.data);

    var message;
    try {
        message = JSON.parse(event.data);
    } catch (e) {
        console.error("[WebSocket] Failed to parse message JSON:", event.data, e);
        return; // 파싱 실패 시 더 이상 진행하지 않음
    }
    
    switch (message.cmd) {
        case 10100: // CMD_CONNECTED
            console.log("[WebSocket] Connection successful. SID:", message.bdy ? message.bdy.sid : 'N/A');
            addChatMessage({
                isSystem: true,
                message: '채팅 서버에 연결되었습니다.'
            });
            break;
        case 93101: // CMD_CHAT (일반 채팅)
            if (message.bdy && Array.isArray(message.bdy)) {
                message.bdy.forEach(function(chat) {
                    var profile = chat.profile ? JSON.parse(chat.profile) : {};
                    var extras = chat.extras ? JSON.parse(chat.extras) : {};
                    addChatMessage({
                        username: profile.nickname || '익명',
                        message: chat.msg || '',
                        isDonation: false,
                        // TODO: 뱃지, 이모티콘 등 추가 처리
                    });
                });
            }
            break;
        case 93102: // CMD_DONATION (후원)
            if (message.bdy && Array.isArray(message.bdy)) {
                message.bdy.forEach(function(donation) {
                    var extras = donation.extras ? JSON.parse(donation.extras) : {};
                    addChatMessage({
                        username: extras.nickname || '익명',
                        message: (extras.payAmount || '') + '원 후원: ' + (extras.comment || donation.msg || ''),
                        isDonation: true
                    });
                });
            }
            break;
        case 93103: // 시스템 메시지
             if (message.bdy && Array.isArray(message.bdy)) {
                message.bdy.forEach(function(sysMsg) {
                    var extras = sysMsg.extras ? JSON.parse(sysMsg.extras) : {};
                    addChatMessage({
                        isSystem: true,
                        message: extras.description || sysMsg.msg
                    });
                });
            }
            break;
        case 10002: // CMD_PONG (서버의 Ping 응답)
            break;
        default:
            console.log("[WebSocket] Unknown CMD:", message.cmd, message);
    }
}

/**
 * 채팅 연결 시작
 */
function connectChat() {
    if (!chatChannelId || !chatAccessToken) {
        console.error('Chat Channel ID or Access Token is missing.');
        return;
    }
    if (chatWebSocket && chatWebSocket.readyState === WebSocket.OPEN) {
        console.log("[WebSocket] Already connected.");
        return;
    }

    var serverNo = Math.floor(Math.random() * 9) + 1; // 1~9
    var socketUrl = 'wss://kr-ss' + serverNo + '.chat.naver.com/chat';

    console.log('[WebSocket] Connecting to ' + socketUrl);
    addChatMessage({ isSystem: true, message: '채팅 서버에 연결을 시도합니다...' });

    chatWebSocket = new WebSocket(socketUrl);
    isConnected = false;

    chatWebSocket.onopen = function() {
        console.log("[WebSocket] Connected.");
        isConnected = true;
        sendHandshake(chatWebSocket);
        startPing(chatWebSocket);
    };

    chatWebSocket.onmessage = handleChatMessage;

    chatWebSocket.onerror = function(error) {
        console.error("[WebSocket] Error:", error);
        stopPing();
        isConnected = false;
        addChatMessage({ isSystem: true, message: '채팅 서버 연결 오류가 발생했습니다.' });
    };

    chatWebSocket.onclose = function(event) {
        console.log("[WebSocket] Disconnected. Code:", event.code, "Reason:", event.reason);
        stopPing();
        isConnected = false;
        if (!event.wasClean) {
             addChatMessage({ isSystem: true, message: '채팅 서버와 연결이 끊어졌습니다. 재연결을 시도합니다...' });
             setTimeout(connectChat, 3000); // 3초 후 재연결 시도
        } else {
             addChatMessage({ isSystem: true, message: '채팅 서버와 연결이 종료되었습니다.' });
        }
    };
}

/**
 * 채팅 연결 해제
 */
function disconnectChat() {
    stopPing();
    if (chatWebSocket) {
        chatWebSocket.close(1000, "User disconnected"); // 1000: 정상 종료
        chatWebSocket = null;
    }
    isConnected = false;
    chatChannelId = null;
    chatAccessToken = null;
    console.log('채팅 연결 해제');
}

/**
 * 채팅 초기화 (시청 화면 진입 시)
 */
function initializeWatchChat() {
    hideChatPanel();
    disconnectChat();
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    messageQueue = [];
    console.log('시청 채팅 초기화 완료');
}

/**
 * 시청 화면에서 채팅 시작
 * @param {Object} liveDetails - 방송 상세 정보
 */
function startWatchChat(liveDetails) {
    if (!liveDetails || !liveDetails.chatChannelId || !liveDetails.accessToken) {
        console.error('채팅 시작 실패: liveDetails에 chatChannelId 또는 accessToken이 없습니다.', liveDetails);
        addChatMessage({ isSystem: true, message: '채팅 정보를 가져올 수 없습니다.' });
        return;
    }
    
    chatChannelId = liveDetails.chatChannelId;
    chatAccessToken = liveDetails.accessToken;
    
    console.log('시청 채팅 시작:', chatChannelId);
    
    // 3초 후 채팅 연결 시작
    setTimeout(function() {
        connectChat();
    }, 3000);
}

// 모듈 내보내기
window.ChatManager = {
    initialize: initializeChatManager,
    showToggleArrow: showChatToggleArrow,
    hideToggleArrow: hideChatToggleArrow,
    setArrowFocus: setArrowFocus,
    showPanel: showChatPanel,
    hidePanel: hideChatPanel,
    togglePanel: toggleChatPanel,
    addMessage: addChatMessage,
    connect: connectChat,
    disconnect: disconnectChat,
    initializeWatch: initializeWatchChat,
    startWatch: startWatchChat,
    isVisible: function() { return isChatPanelVisible; }
}; 