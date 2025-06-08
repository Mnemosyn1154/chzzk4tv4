// 리모컨 키 처리 모듈 (ES5 호환)

// 시청 화면 포커스 상태
var watchScreenFocusIndex = -1; // -1: 포커스 없음, 0: 즐겨찾기 버튼

/**
 * 시청 화면에서의 키 처리
 * @param {KeyboardEvent} event - 키보드 이벤트
 */
function handleWatchScreenKeys(event) {
    switch (event.keyCode) {
        case 461: // Back
        case 27:  // Escape
            event.preventDefault();
            clearWatchScreenFocus();
            if (typeof hideWatchScreen === 'function') {
                hideWatchScreen();
                restorePreviousView();
                if (window.Navigation) {
                    Navigation.initializeFocus();
                }
            }
            return true;
            
        case 37: // ArrowLeft
        case 39: // ArrowRight
            event.preventDefault();
            toggleWatchScreenFocus();
            return true;
            
        case 13: // OK
        case 404: // Green button
            event.preventDefault();
            if (watchScreenFocusIndex === 0) {
                // 즐겨찾기 버튼에 포커스가 있으면 토글 실행
                var favoriteBtn = document.getElementById('watch-favorite-btn');
                if (favoriteBtn && typeof toggleWatchFavorite === 'function') {
                    toggleWatchFavorite();
                }
            } else {
                // 포커스가 없으면 정보 팝업 토글
                if (typeof showInfoPopup === 'function') {
                    showInfoPopup();
                }
            }
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
 * 시청 화면 포커스 토글
 */
function toggleWatchScreenFocus() {
    var favoriteBtn = document.getElementById('watch-favorite-btn');
    if (!favoriteBtn) return;
    
    if (watchScreenFocusIndex === -1) {
        // 포커스가 없으면 즐겨찾기 버튼에 포커스
        watchScreenFocusIndex = 0;
        favoriteBtn.focus();
        console.log('시청 화면: 즐겨찾기 버튼에 포커스');
    } else {
        // 포커스가 있으면 해제
        watchScreenFocusIndex = -1;
        favoriteBtn.blur();
        console.log('시청 화면: 포커스 해제');
    }
}

/**
 * 시청 화면 포커스 초기화
 */
function clearWatchScreenFocus() {
    watchScreenFocusIndex = -1;
    var favoriteBtn = document.getElementById('watch-favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.blur();
    }
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
    
    if (window.previousView === 'search' && searchResultsContainer) {
        searchResultsContainer.style.display = 'grid';
        if (liveStreamListContainer) liveStreamListContainer.style.display = 'none';
    } else if (liveStreamListContainer) {
        liveStreamListContainer.style.display = 'grid';
        if (searchResultsContainer) searchResultsContainer.style.display = 'none';
    } else {
        // fallback: 라이브 목록 다시 로드
        if (window.SearchManager) {
            window.SearchManager.showLiveList();
        }
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

// 모듈 내보내기
window.RemoteControl = {
    initializeRemoteControl: initializeRemoteControl,
    destroyRemoteControl: destroyRemoteControl,
    handleWatchScreenKeys: handleWatchScreenKeys,
    handleNormalScreenKeys: handleNormalScreenKeys,
    restorePreviousView: restorePreviousView,
    toggleWatchScreenFocus: toggleWatchScreenFocus,
    clearWatchScreenFocus: clearWatchScreenFocus
}; 