// ui/watchScreen.js (ES5 호환) - 리팩토링된 통합 인터페이스

// currentWatchData는 이제 AppState.player.currentWatchData에서 관리
// 모든 매니저 초기화는 App.js에서 수행됨

function showWatchScreen(broadcastData) {
    var startTime = Date.now();
    console.log("Showing watch screen with data:", broadcastData);

    // 현재 방송 데이터 저장
    AppState.player.currentWatchData = broadcastData;

    // WatchFavoriteManager에 데이터 설정
    if (window.WatchFavoriteManager) {
        window.WatchFavoriteManager.setCurrentWatchData(broadcastData);
    }

    // 1. UI 표시 (AppMediator event)
    AppMediator.publish('watchui:show');
    
    // 정보 표시
    AppMediator.publish('watchui:populate', broadcastData);

    // 2. 즐겨찾기 버튼 초기화 및 상태 설정
    if (window.WatchFavoriteManager) {
        window.WatchFavoriteManager.initializeButton();
        window.WatchFavoriteManager.setFavoriteState(broadcastData);
    }

    // 3. 채팅 UI 초기화
    AppMediator.publish('chat:initializeWatch');

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
    if (chatChannelId) {
        console.log("Found chatChannelId. Attempting to start chat: " + chatChannelId);
        
        ChzzkAPI.fetchChatAccessToken(chatChannelId).then(function(accessToken) {
            if (accessToken) {
                console.log("Successfully got accessToken, now starting chat.");
                var chatDetails = {
                    chatChannelId: chatChannelId,
                    accessToken: accessToken
                };
                AppMediator.publish('chat:startWatch', chatDetails);
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
        // 정보 팝업 표시 이벤트 발행
        AppMediator.publish('infopopup:show');
        
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
    // 정보 팝업 정리
    AppMediator.publish('infopopup:hide');
    
    // 3. 채팅 연결 해제
    AppMediator.publish('chat:disconnect');
    AppMediator.publish('chat:hidePanel');
    
    // 4. 즐겨찾기 매니저 정리
    if (window.WatchFavoriteManager) {
        window.WatchFavoriteManager.cleanup();
    }
    
    // 5. UI 숨김
    AppMediator.publish('watchui:hide');
    
    // 6. 즐겨찾기 변경사항 반영을 위해 라이브 목록 새로고침
    console.log("Refreshing live list to reflect favorite changes");
    AppMediator.publish('search:refreshLiveList');
    
    // 현재 시청 데이터 초기화
    AppState.player.currentWatchData = null;
}