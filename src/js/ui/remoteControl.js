// 리모컨 키 처리 모듈 (ES5 호환)

// watchScreenFocusIndex는 이제 AppState.ui.watchScreenFocusIndex에서 관리
// window.previousView는 이제 AppState.ui.previousView에서 관리

/**
 * 시청 화면에서의 키 처리
 * @param {KeyboardEvent} event - 키보드 이벤트
 */
function handleWatchScreenKeys(event) {
    switch (event.keyCode) {
        case 461: // Back
        case 27:  // Escape
            event.preventDefault();
            handleWatchScreenBack();
            return true;
            
        case 38: // ArrowUp
            event.preventDefault();
            handleInfoPopupToggle();
            return true;
            
        case 40: // ArrowDown
            event.preventDefault();
            handleInfoPopupClose();
            return true;
            
        case 37: // ArrowLeft
            event.preventDefault();
            moveWatchScreenFocus('left');
            return true;
            
        case 39: // ArrowRight
            event.preventDefault();
            moveWatchScreenFocus('right');
            return true;
            
        case 13: // OK
        case 404: // Green button
            event.preventDefault();
            handleWatchScreenOK();
            return true;
            
        case 415: // Play/Pause
            event.preventDefault();
            console.log('Play/Pause button pressed');
            return true;
            
        case 19:  // Pause
            event.preventDefault();
            console.log('Pause button pressed');
            return true;
            
        case 413: // Stop
            event.preventDefault();
            console.log('Stop button pressed');
            return true;
            
        default:
            return false;
    }
}

/**
 * 시청 화면에서 좌우 포커스 이동
 * @param {string} direction - 'left' 또는 'right'
 */
function moveWatchScreenFocus(direction) {
    if (direction === 'right') {
        // 오른쪽 버튼: 채팅창 토글
        AppMediator.publish('chat:togglePanel');
        console.log('채팅창 토글');
        return;
    }
    
    if (direction === 'left') {
        // 왼쪽 버튼: 즐겨찾기 버튼 포커스 항상 유지
        AppState.ui.watchScreenFocusIndex = 0;
        forceFavoriteButtonFocus();
        console.log('즐겨찾기 포커스 설정 (왼쪽 버튼)');
        return;
    }
}

/**
 * 시청 화면에서 OK 버튼 처리
 */
function handleWatchScreenOK() {
    if (AppState.ui.watchScreenFocusIndex === 0) {
        // 즐겨찾기 버튼에 포커스가 있으면 토글 실행
        var favoriteBtn = document.getElementById('watch-favorite-btn');
        if (favoriteBtn && window.WatchFavoriteManager && window.WatchFavoriteManager.toggleFavorite) {
            window.WatchFavoriteManager.toggleFavorite();
        }
    } else if (AppState.ui.watchScreenFocusIndex === 1) {
        // 채팅 화살표에 포커스가 있으면 채팅창 토글
        AppMediator.publish('chat:togglePanel');
        // 채팅창이 열렸으면 화살표 숨기기
        AppMediator.publish('chat:setArrowFocus', { focused: false });
        AppMediator.publish('chat:hideToggleArrow');
        AppState.ui.watchScreenFocusIndex = -1;
        console.log('시청 화면: 채팅창 토글');
    } else {
        // 포커스가 없으면 정보 팝업 토글
        AppMediator.publish('infopopup:show');
    }
}

/**
 * 시청 화면 포커스 토글 (기존 함수, 호환성 유지)
 */
function toggleWatchScreenFocus() {
    moveWatchScreenFocus('right');
}

/**
 * 시청 화면 포커스 초기화
 */
function clearWatchScreenFocus() {
    AppState.ui.watchScreenFocusIndex = -1;
    clearAllWatchFocus();
}

/**
 * 일반 화면(검색/목록)에서의 키 처리
 * @param {KeyboardEvent} event - 키보드 이벤트
 */
function handleNormalScreenKeys(event) {
    var searchSection = document.getElementById('search-section');
    var liveStreamListContainer = document.getElementById('live-stream-list-container');
    var searchResultsContainer = document.getElementById('search-results-container');
    
    // 검색/목록 화면이 표시중인지 확인
    if (!searchSection || 
        (liveStreamListContainer && liveStreamListContainer.style.display === 'none' && 
         searchResultsContainer && searchResultsContainer.style.display === 'none')) {
        return false;
    }
    
    var key = '';
    switch (event.keyCode) {
        case 37: key = 'ArrowLeft'; break;
        case 38: key = 'ArrowUp'; break;
        case 39: key = 'ArrowRight'; break;
        case 40: key = 'ArrowDown'; break;
        case 13: key = 'Enter'; break;
        case 461: // webOS Back button
        case 27:  // Escape
            event.preventDefault();
            if (window.Navigation && typeof Navigation.handleBackButton === 'function') {
                Navigation.handleBackButton();
            }
            return true;
        case 404: // Green button (OK)
            event.preventDefault();
            if (window.Navigation && typeof Navigation.handleOKButton === 'function') {
                Navigation.handleOKButton();
            }
            return true;
        default:
            return false;
    }
    
    if (key && window.Navigation && typeof Navigation.handleKeyDown === 'function') {
        event.preventDefault();
        var handled = Navigation.handleKeyDown(key);
        return handled;
    }
    
    return false;
}

/**
 * 이전 뷰 복원
 */
function restorePreviousView() {
    var searchSection = document.getElementById('search-section');
    var liveStreamListContainer = document.getElementById('live-stream-list-container');
    var searchResultsContainer = document.getElementById('search-results-container');
    
    if (searchSection) searchSection.style.display = 'block';
    
    if (AppState.ui.previousView === 'search' && searchResultsContainer) {
        searchResultsContainer.style.display = 'grid';
        if (liveStreamListContainer) liveStreamListContainer.style.display = 'none';
    } else if (liveStreamListContainer) {
        liveStreamListContainer.style.display = 'grid';
        if (searchResultsContainer) searchResultsContainer.style.display = 'none';
    } else {
        // fallback: 라이브 목록 다시 로드
        AppMediator.publish('search:showLiveList');
    }
}

/**
 * 리모컨 이벤트 리스너 초기화
 */
function initializeRemoteControl() {
    console.log("Initializing remote control...");
    
    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', function(event) {
        var watchSection = document.getElementById('watch-section');
        
        // 시청 화면이 활성화된 경우
        if (watchSection && watchSection.style.display !== 'none') {
            return handleWatchScreenKeys(event);
        } else {
            // 일반 화면 (검색/목록)
            return handleNormalScreenKeys(event);
        }
    });
    
    console.log("Remote control initialized!");
}

/**
 * 리모컨 이벤트 리스너 제거
 */
function destroyRemoteControl() {
    // ES5에서는 함수 참조를 저장해서 제거해야 하므로 현재는 비워둠
    console.log("Remote control destroyed!");
}

/**
 * 방송정보 팝업 토글 (위쪽 버튼)
 */
function handleInfoPopupToggle() {
    var isVisible = false;
    
    // 현재 팝업 상태 확인
    isVisible = AppState.ui.isInfoPopupVisible;
    
    console.log('팝업 토글 - 현재 상태:', isVisible);
    
    if (isVisible) {
        // 팝업이 보이면 숨기기 + 포커스 유지
        AppMediator.publish('infopopup:hide');
        // 포커스는 즐겨찾기에 계속 유지
        AppState.ui.watchScreenFocusIndex = 0;
        setTimeout(function() {
            forceFavoriteButtonFocus();
        }, 50);
        console.log('방송정보 팝업 숨김 + 즐겨찾기 포커스 유지');
    } else {
        // 팝업이 안 보이면 표시 + 즐겨찾기 강제 포커스
        AppMediator.publish('infopopup:show');
        AppState.ui.watchScreenFocusIndex = 0;
        // 팝업 표시 후 포커스 설정
        setTimeout(function() {
            forceFavoriteButtonFocus();
        }, 150);
        console.log('방송정보 팝업 표시 + 즐겨찾기 강제 포커스');
    }
}

/**
 * 방송정보 팝업 닫기 (아래쪽 버튼)
 */
function handleInfoPopupClose() {
    var isVisible = false;
    
    // 현재 팝업 상태 확인
    isVisible = AppState.ui.isInfoPopupVisible;
    
    if (isVisible) {
        // 팝업이 있으면 닫기 + 포커스 유지
        AppMediator.publish('infopopup:hide');
        // 포커스는 즐겨찾기에 계속 유지
        AppState.ui.watchScreenFocusIndex = 0;
        forceFavoriteButtonFocus();
        console.log('방송정보 팝업 닫기 + 즐겨찾기 포커스 유지');
    } else {
        // 팝업이 없으면 아무 반응 없음
        console.log('방송정보 팝업 없음 - 아래쪽 버튼 무시');
    }
}

/**
 * 뒤로가기 우선순위 처리
 */
function handleWatchScreenBack() {
    // 1순위: 채팅창이 열려있으면 채팅창 닫기
    var isChatVisible = AppState.ui.isChatPanelVisible;
    if (isChatVisible) {
        AppMediator.publish('chat:hidePanel');
        console.log('뒤로가기: 채팅창 닫기');
        return;
    }
    
    // 2순위: 방송정보 팝업이 표시되어 있으면 팝업 닫기
    var isPopupVisible = AppState.ui.isInfoPopupVisible;
    
    if (isPopupVisible) {
        AppMediator.publish('infopopup:hide');
        AppState.ui.watchScreenFocusIndex = -1;
        clearAllWatchFocus();
        console.log('뒤로가기: 방송정보 팝업 닫기');
        return;
    }
    
    // 3순위: 둘 다 없으면 시청 화면 나가기
    clearWatchScreenFocus();
    if (typeof hideWatchScreen === 'function') {
        hideWatchScreen();
        restorePreviousView();
        if (window.Navigation) {
            AppMediator.publish('navigation:initializeFocus');
        }
    }
    console.log('뒤로가기: 시청 화면 나가기');
}

/**
 * 즐겨찾기 버튼 포커스 설정/해제
 * @param {boolean} focused - 포커스 상태
 */
function setFavoriteButtonFocus(focused) {
    var favoriteBtn = document.getElementById('watch-favorite-btn');
    if (!favoriteBtn) {
        console.warn('즐겨찾기 버튼을 찾을 수 없습니다');
        return;
    }
    
    if (focused) {
        // 다른 요소의 포커스 해제
        if (document.activeElement && document.activeElement !== favoriteBtn) {
            document.activeElement.blur();
        }
        
        // 즐겨찾기 버튼에 포커스 설정
        favoriteBtn.focus();
        
        // 포커스가 제대로 설정되었는지 확인
        setTimeout(function() {
            if (document.activeElement !== favoriteBtn) {
                favoriteBtn.focus();
                console.log('즐겨찾기 버튼 포커스 재시도');
            }
        }, 50);
        
        console.log('즐겨찾기 버튼 포커스 설정');
    } else {
        favoriteBtn.blur();
        console.log('즐겨찾기 버튼 포커스 해제');
    }
}

/**
 * 모든 시청 화면 포커스 해제
 */
function clearAllWatchFocus() {
    // 즐겨찾기 버튼 포커스 유지 (해제하지 않음)
    // setFavoriteButtonFocus(false);
    
    // 채팅창만 숨김
    AppMediator.publish('chat:hidePanel');
    
    console.log('채팅창 숨김 (즐겨찾기 포커스 유지)');
}

/**
 * 즐겨찾기 버튼 포커스 강제 설정
 */
function forceFavoriteButtonFocus() {
    setFavoriteButtonFocus(true);
}

/**
 * 시청 화면 초기 포커스 설정
 */
function setInitialWatchFocus() {
    AppState.ui.watchScreenFocusIndex = 0;
    forceFavoriteButtonFocus();
    console.log('시청 화면 초기 포커스 설정: 즐겨찾기 버튼');
}

// 모듈 내보내기
window.RemoteControl = {
    initialize: initializeRemoteControl,
    destroy: destroyRemoteControl,
    setInitialWatchFocus: setInitialWatchFocus,
    forceFavoriteButtonFocus: forceFavoriteButtonFocus
}; 