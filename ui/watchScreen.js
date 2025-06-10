// ui/watchScreen.js (ES5 호환) - 리팩토링된 통합 인터페이스

// 현재 시청 중인 방송 데이터
var currentWatchData = null;

// DOMContentLoaded 시점에 주요 요소들 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log("WatchScreen: Starting manager initialization");
    
    // 매니저들 초기화 (의존성 순서대로)
    var initResults = {
        playerStatus: false,
        stream: false,
        infoPopup: false,
        watchUI: false,
        watchFavorite: false
    };
    
    // 1. PlayerStatusManager 초기화
    if (window.PlayerStatusManager) {
        window.PlayerStatusManager.initialize();
        initResults.playerStatus = true;
    }
    
    // 2. StreamManager 초기화 (PlayerStatusManager에 의존)
    if (window.StreamManager) {
        initResults.stream = window.StreamManager.initialize();
    }
    
    // 3. InfoPopupManager 초기화
    if (window.InfoPopupManager) {
        window.InfoPopupManager.initialize();
        initResults.infoPopup = true;
    }
    
    // 4. WatchUIManager 초기화
    if (window.WatchUIManager) {
        initResults.watchUI = window.WatchUIManager.initialize();
    }
    
    // 5. WatchFavoriteManager 초기화
    if (window.WatchFavoriteManager) {
        window.WatchFavoriteManager.initialize();
        initResults.watchFavorite = true;
    }
    
    // 6. 기존 ChatManager 초기화
    if (window.ChatManager) {
        window.ChatManager.initialize();
    }
    
         console.log("WatchScreen: Manager initialization results:", initResults);
     
     // 핵심 매니저들이 초기화되지 않으면 경고
     if (!initResults.stream || !initResults.watchUI) {
         console.error("WatchScreen: Critical managers failed to initialize!");
     }
});

function showWatchScreen(broadcastData) {
    var startTime = Date.now();
    console.log("Showing watch screen with data:", broadcastData);

    // 현재 방송 데이터 저장
    currentWatchData = broadcastData;

    // WatchFavoriteManager에 데이터 설정
    if (window.WatchFavoriteManager) {
        window.WatchFavoriteManager.setCurrentWatchData(broadcastData);
    }

    // 1. UI 표시 (WatchUIManager)
    if (window.WatchUIManager) {
        if (!window.WatchUIManager.showWatchScreen()) {
            console.error("Failed to show watch screen UI");
            return;
        }
        
        // 정보 표시
        window.WatchUIManager.populateWatchInfo(broadcastData);
    } else {
        console.error("WatchUIManager not available");
        return;
    }

    // 2. 즐겨찾기 버튼 초기화 및 상태 설정
    if (window.WatchFavoriteManager) {
        window.WatchFavoriteManager.initializeButton();
        window.WatchFavoriteManager.setFavoriteState(broadcastData);
    }

    // 3. 채팅 UI 초기화
    if (window.ChatManager) {
        window.ChatManager.initializeWatch();
    }

    // 4. 플레이어 로딩 표시
    if (window.PlayerStatusManager) {
        window.PlayerStatusManager.showLoading(true, '방송 정보 확인 중...');
    }

    // 5. 스트림 초기화 및 채팅 연결
    if (!broadcastData) {
        if (window.PlayerStatusManager) {
            window.PlayerStatusManager.showError('방송 정보를 가져올 수 없습니다.');
        }
        setTimeout(hideWatchScreen, 2000);
        return;
    }

    // 스트림 초기화
    if (window.StreamManager) {
        window.StreamManager.initAndPlayStream(broadcastData);
    }

    // 채팅 연결 시작
    var chatChannelId = broadcastData.chatChannelId;
    if (window.ChatManager && chatChannelId) {
        console.log("Found chatChannelId. Attempting to start chat: " + chatChannelId);
        
        ChzzkAPI.fetchChatAccessToken(chatChannelId).then(function(accessToken) {
            if (accessToken) {
                console.log("Successfully got accessToken, now starting chat.");
                var chatDetails = {
                    chatChannelId: chatChannelId,
                    accessToken: accessToken
                };
                window.ChatManager.startWatch(chatDetails);
            } else {
                console.error("Failed to get chat accessToken. Chat will not be available.");
            }
        }).catch(function(error) {
            console.error("An error occurred while fetching chat access token:", error);
        });
    } else {
        console.error("Could not start chat: chatChannelId is missing in broadcastData.", broadcastData);
    }

    // 6. 정보 팝업 표시 및 포커스 설정
    setTimeout(function() {
        if (window.InfoPopupManager) {
            window.InfoPopupManager.showInfoPopup();
        }
        
        // 즐겨찾기 버튼에 초기 포커스 설정
        setTimeout(function() {
            if (window.RemoteControl && window.RemoteControl.setInitialWatchFocus) {
                window.RemoteControl.setInitialWatchFocus();
            } else {
                var favoriteBtn = document.getElementById('watch-favorite-btn');
                if (favoriteBtn) {
                    favoriteBtn.focus();
                    console.log('시청 화면 초기 포커스: 즐겨찾기 버튼');
                }
            }
        }, 150);
    }, 200);
}

function hideWatchScreen() {
    console.log("Hiding watch screen");
    
    // 1. 스트림 정지
    if (window.StreamManager) {
        window.StreamManager.stopPlayer();
    }
    
    // 2. 정보 팝업 숨김
    if (window.InfoPopupManager) {
        window.InfoPopupManager.cleanup();
    }
    
    // 3. 채팅 연결 해제
    if (window.ChatManager) {
        window.ChatManager.disconnect();
        window.ChatManager.hidePanel();
    }
    
    // 4. 즐겨찾기 매니저 정리
    if (window.WatchFavoriteManager) {
        window.WatchFavoriteManager.cleanup();
    }
    
    // 5. UI 숨김
    if (window.WatchUIManager) {
        window.WatchUIManager.hideWatchScreen();
    }
    
    // 6. 즐겨찾기 변경사항 반영을 위해 라이브 목록 새로고침
    if (window.SearchManager && window.SearchManager.refreshLiveList) {
        console.log("Refreshing live list to reflect favorite changes");
        window.SearchManager.refreshLiveList();
    }
    
    // 현재 시청 데이터 초기화
    currentWatchData = null;
}

// 레거시 호환성을 위한 전역 함수들 (필요한 경우)
function showPlayerLoading(isLoading, message) {
    if (window.PlayerStatusManager) {
        window.PlayerStatusManager.showLoading(isLoading, message);
    }
}

function showPlayerError(errorMessage) {
    if (window.PlayerStatusManager) {
        window.PlayerStatusManager.showError(errorMessage);
    }
}

function showInfoPopup() {
    if (window.InfoPopupManager) {
        window.InfoPopupManager.showInfoPopup();
    }
}

function hideInfoPopup() {
    if (window.InfoPopupManager) {
        window.InfoPopupManager.hideInfoPopup();
    }
}

function isInfoPopupVisible() {
    if (window.InfoPopupManager) {
        return window.InfoPopupManager.isPopupVisible();
    }
    return false;
}

function toggleWatchFavorite() {
    if (window.WatchFavoriteManager) {
        window.WatchFavoriteManager.toggleFavorite();
    } else {
        console.error('WatchFavoriteManager not available');
    }
}

// 전역 함수로 노출 (레거시 호환성)
window.isInfoPopupVisible = isInfoPopupVisible;
window.showInfoPopup = showInfoPopup;
window.hideInfoPopup = hideInfoPopup;
window.toggleWatchFavorite = toggleWatchFavorite; 