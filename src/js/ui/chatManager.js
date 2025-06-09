// 채팅 관리 모듈 (ES5 호환)

// 채팅 상태 관리 변수들
var chatWebSocket = null;
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
    
    // 후원 메시지인 경우
    if (messageData.isDonation) {
        messageElement.classList.add('donation');
    }
    
    var usernameElement = document.createElement('div');
    usernameElement.className = 'chat-username';
    usernameElement.textContent = messageData.username || '익명';
    
    var contentElement = document.createElement('div');
    contentElement.className = 'chat-content';
    contentElement.textContent = messageData.message || '';
    
    messageElement.appendChild(usernameElement);
    messageElement.appendChild(contentElement);
    
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
 * 채팅 연결 시작
 * @param {string} channelId - 채널 ID
 */
function connectChat(channelId) {
    if (!channelId) {
        console.error('채널 ID가 필요합니다');
        return;
    }
    
    chatChannelId = channelId;
    console.log('채팅 연결 시도:', channelId);
    
    // 목업 데이터로 테스트 (실제 WebSocket 연결 전)
    startMockChatMessages();
    
    // TODO: 실제 WebSocket 연결 구현
    // connectWebSocket(channelId);
}

/**
 * 채팅 연결 해제
 */
function disconnectChat() {
    if (chatWebSocket) {
        chatWebSocket.close();
        chatWebSocket = null;
    }
    
    isConnected = false;
    chatChannelId = null;
    chatAccessToken = null;
    
    // 목업 메시지 타이머 정리
    if (window.mockChatTimer) {
        clearInterval(window.mockChatTimer);
        window.mockChatTimer = null;
    }
    
    console.log('채팅 연결 해제');
}

/**
 * 목업 채팅 메시지 시작 (테스트용)
 */
function startMockChatMessages() {
    var mockMessages = [
        { username: 'viewer123', message: '안녕하세요!', isDonation: false },
        { username: 'gamer456', message: 'ㅋㅋㅋㅋㅋㅋ', isDonation: false },
        { username: 'fan789', message: '오늘 방송 재밌네요', isDonation: false },
        { username: 'supporter', message: '응원합니다!', isDonation: true },
        { username: 'newbie', message: '처음 왔는데 분위기 좋네요', isDonation: false },
        { username: 'oldviewer', message: '오늘도 좋은 방송 감사합니다', isDonation: false }
    ];
    
    var messageIndex = 0;
    
    // 초기 메시지 몇 개 즉시 추가
    for (var i = 0; i < 3; i++) {
        addChatMessage(mockMessages[messageIndex % mockMessages.length]);
        messageIndex++;
    }
    
    // 3초마다 새 메시지 추가
    window.mockChatTimer = setInterval(function() {
        if (isChatPanelVisible || Math.random() < 0.3) { // 채팅창이 보이거나 30% 확률로 메시지 추가
            var randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
            var messageWithTimestamp = {
                username: randomMessage.username,
                message: randomMessage.message + ' (' + new Date().toLocaleTimeString() + ')',
                isDonation: Math.random() < 0.1 // 10% 확률로 후원 메시지
            };
            addChatMessage(messageWithTimestamp);
        }
    }, 3000);
    
    console.log('목업 채팅 메시지 시작');
}

/**
 * 채팅 초기화 (시청 화면 진입 시)
 */
function initializeWatchChat() {
    // 채팅 UI 요소들 숨김
    hideChatPanel();
    hideChatToggleArrow();
    
    // 기존 연결 정리
    disconnectChat();
    
    // 메시지 초기화
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    messageQueue = [];
    
    console.log('시청 채팅 초기화 완료');
}

/**
 * 시청 화면에서 채팅 시작
 * @param {Object} broadcastData - 방송 데이터
 */
function startWatchChat(broadcastData) {
    if (!broadcastData) {
        console.error('방송 데이터가 없습니다');
        return;
    }
    
    // 채널 ID 추출
    var channelId = null;
    if (broadcastData.channel && broadcastData.channel.channelId) {
        channelId = broadcastData.channel.channelId;
    } else if (broadcastData.channelId) {
        channelId = broadcastData.channelId;
    }
    
    if (channelId) {
        console.log('시청 채팅 시작:', channelId);
        // 3초 후 채팅 연결 시작 (요구사항)
        setTimeout(function() {
            connectChat(channelId);
        }, 3000);
    } else {
        console.error('채널 ID를 찾을 수 없습니다');
    }
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