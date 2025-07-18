// 포커스 및 네비게이션 관리 모듈 (ES5 호환)

// AppState를 사용하여 상태 관리
// focusableElements, currentFocusIndex, elementsPerRow는 이제 AppState.ui에서 관리됨

var SEARCH_INPUT_INDEX = 0;
var SEARCH_BUTTON_INDEX = 1;
var CARDS_START_INDEX = 2;

/**
 * 포커스 가능한 요소 목록 초기화
 */
function initializeFocus() {
    console.log("[Navigation] Initializing focus...");
    
    // TV 환경에서 초기화 지연
    if (window.isWebOSTV) {
        console.log("[TV Debug] Delaying navigation init for TV");
        setTimeout(function() {
            doInitializeFocus();
        }, 100);
    } else {
        doInitializeFocus();
    }
}

function doInitializeFocus() {
    try {
        AppState.ui.focusableElements = [];
        var searchInput = document.getElementById('search-keyword-input');
        var searchButton = document.getElementById('search-button');
        
        if (searchInput) {
            AppState.ui.focusableElements.push(searchInput);
        }
        if (searchButton) {
            AppState.ui.focusableElements.push(searchButton);
        }
        
        // 현재 활성 카드들 추가
        var activeCards = getActiveCards();
        AppState.ui.focusableElements = AppState.ui.focusableElements.concat(activeCards);
        
        // 컬럼 수 계산 (에러 처리 포함)
        try {
            AppState.ui.elementsPerRow = Utils.getColumnCount();
        } catch (e) {
            console.error("[Navigation] Column count error, using default:", e);
            AppState.ui.elementsPerRow = 4;
        }
        
        console.log("[Navigation] Elements per row:", AppState.ui.elementsPerRow);
        console.log("[Navigation] Total focusable elements:", AppState.ui.focusableElements.length);
        
        // 앱 시작 시 첫 번째 카드에 포커스 (키보드 방지)
        if (activeCards.length > 0) {
            AppState.ui.currentFocusIndex = CARDS_START_INDEX; // 첫 번째 카드
        } else {
            AppState.ui.currentFocusIndex = 0; // 카드가 없으면 검색창
        }
        
        updateFocusableElements();
    } catch (e) {
        console.error("[Navigation] Critical error in initializeFocus:", e);
    }
}

function getActiveCards() {
    var liveContainer = document.getElementById('live-stream-list-container');
    var searchContainer = document.getElementById('search-results-container');
    var activeCards = [];
    
    try {
        // display 속성 체크 개선 (flexbox/grid 모두 지원)
        var isSearchActive = searchContainer && 
            searchContainer.style.display !== 'none' && 
            searchContainer.querySelectorAll('.live-card').length > 0;
            
        var isLiveActive = liveContainer && 
            liveContainer.style.display !== 'none' && 
            liveContainer.querySelectorAll('.live-card').length > 0;
        
        if (isSearchActive) {
            activeCards = Array.prototype.slice.call(searchContainer.querySelectorAll('.live-card'));
            console.log("[Navigation] Active cards from search:", activeCards.length);
        } else if (isLiveActive) {
            activeCards = Array.prototype.slice.call(liveContainer.querySelectorAll('.live-card'));
            console.log("[Navigation] Active cards from live:", activeCards.length);
        }
    } catch (e) {
        console.error("[Navigation] Error getting active cards:", e);
    }
    
    return activeCards;
}

/**
 * 포커스 가능한 요소 업데이트
 */
function updateFocusableElements() {
    var activeCards = getActiveCards();
    AppState.ui.focusableElements = [];
    
    var searchInput = document.getElementById('search-keyword-input');
    var searchButton = document.getElementById('search-button');
    
    if (searchInput) {
        AppState.ui.focusableElements.push(searchInput);
    }
    if (searchButton) {
        AppState.ui.focusableElements.push(searchButton);
    }
    
    AppState.ui.focusableElements = AppState.ui.focusableElements.concat(activeCards);
    
    AppState.ui.elementsPerRow = Utils.getColumnCount();
    
    // 기존 포커스가 범위를 벗어났다면 적절한 위치로 이동
    if (AppState.ui.currentFocusIndex >= AppState.ui.focusableElements.length) {
        if (activeCards.length > 0) {
            AppState.ui.currentFocusIndex = CARDS_START_INDEX; // 첫 번째 카드
        } else {
            AppState.ui.currentFocusIndex = 0; // 카드가 없으면 검색창
        }
    }
    
    setFocus(AppState.ui.currentFocusIndex);
}

/**
 * 지정된 인덱스의 요소에 포커스 설정
 * @param {number} index - 포커스할 요소의 인덱스
 */
function setFocus(index) {
    if (AppState.ui.focusableElements.length === 0) return;
    
    // 이전 포커스 해제
    var oldFocusedElement = AppState.ui.focusableElements[AppState.ui.currentFocusIndex];
    if (oldFocusedElement) {
        oldFocusedElement.classList.remove('focused');
        // 검색창에서 포커스가 벗어날 때 명시적으로 blur 처리
        if (oldFocusedElement.id === 'search-keyword-input') {
            oldFocusedElement.blur();
        }
    }
    
    // 새로운 포커스 설정
    AppState.ui.currentFocusIndex = index;
    var newFocusedElement = AppState.ui.focusableElements[AppState.ui.currentFocusIndex];
    if (newFocusedElement) {
        newFocusedElement.classList.add('focused');
        
        // 검색창에는 시각적 포커스만 주고, 실제 DOM focus는 Enter 키에서만
        if (newFocusedElement.id === 'search-keyword-input') {
            console.log('검색창에 시각적 포커스만 설정 (키보드 방지)');
            // DOM focus를 주지 않음으로써 키보드가 자동으로 나타나지 않음
        } else {
            // 다른 요소들은 정상적으로 DOM focus 설정
            newFocusedElement.focus();
        }
    }
}

/**
 * 키 입력 처리
 * @param {string} key - 입력된 키
 */
function handleKeyDown(key) {
    if (AppState.ui.focusableElements.length === 0) {
        return;
    }
    
    var currentElement = AppState.ui.focusableElements[AppState.ui.currentFocusIndex];
    var newFocusIndex = AppState.ui.currentFocusIndex;
    
    switch (key) {
        case 'ArrowDown':
            if (AppState.ui.currentFocusIndex >= CARDS_START_INDEX) {
                // 카드 영역에서 아래로 이동
                newFocusIndex = Math.min(AppState.ui.focusableElements.length - 1, 
                                       AppState.ui.currentFocusIndex + AppState.ui.elementsPerRow);
            } else if (AppState.ui.currentFocusIndex === SEARCH_INPUT_INDEX && AppState.ui.focusableElements.length > CARDS_START_INDEX) {
                // 검색 입력창에서 첫 번째 카드로 이동
                newFocusIndex = CARDS_START_INDEX;
            } else if (AppState.ui.currentFocusIndex === SEARCH_BUTTON_INDEX && AppState.ui.focusableElements.length > CARDS_START_INDEX) {
                // 검색 버튼에서 첫 번째 카드로 이동
                newFocusIndex = CARDS_START_INDEX;
            }
            break;
            
        case 'ArrowUp':
            if (AppState.ui.currentFocusIndex >= CARDS_START_INDEX) {
                var newIndex = AppState.ui.currentFocusIndex - AppState.ui.elementsPerRow;
                if (newIndex >= CARDS_START_INDEX) {
                    newFocusIndex = newIndex;
                } else {
                    // 첫 번째 행의 카드에서 검색 영역으로 이동
                    newFocusIndex = SEARCH_INPUT_INDEX;
                }
            }
            break;
            
        case 'ArrowLeft':
            if (AppState.ui.currentFocusIndex > 0) {
                newFocusIndex = AppState.ui.currentFocusIndex - 1;
            }
            break;
            
        case 'ArrowRight':
            if (AppState.ui.currentFocusIndex < AppState.ui.focusableElements.length - 1) {
                newFocusIndex = AppState.ui.currentFocusIndex + 1;
            }
            break;
            
        case 'Enter':
            if (currentElement.id === 'search-button') {
                currentElement.click();
            } else if (currentElement.id === 'search-keyword-input') {
                // 검색창에서 Enter 시 실제 DOM focus 설정 (키보드 활성화)
                currentElement.focus();
                console.log('검색창에 키보드 활성화');
                return true; // setFocus 호출하지 않고 바로 리턴
            } else if (currentElement.classList && currentElement.classList.contains('live-card')) {
                // 카드 선택 시 OK 버튼과 동일한 동작
                handleOKButton();
            }
            break;
            
        default:
            if (currentElement.id === 'search-keyword-input') {
                // 검색 입력창에서는 기본 키 입력 허용
                return false; // 기본 키 처리 계속
            }
            break;
    }
    
    setFocus(newFocusIndex);
    return true; // 키 이벤트 처리됨
}

/**
 * 카드 선택 처리 (OK 버튼 또는 클릭 시 공통)
 * @param {HTMLElement} cardElement - 선택된 카드 요소
 */
function selectCard(cardElement) {
    if (!cardElement || !cardElement.classList.contains('live-card')) {
        return;
    }
    
    console.log('카드 선택됨:', cardElement.chzzkData);
    
    var cardData = cardElement.chzzkData;
    
    // 검색 결과 카드인지 확인
    if (cardElement.classList.contains('search-result-card')) {
        // 검색 결과 카드의 경우: 채널이 라이브 중인지 확인
        if (cardData.channel && cardData.channel.openLive) {
            // 라이브 중인 채널: 상세 정보를 가져와서 방송 화면으로 진입
            ChzzkAPI.fetchFullLiveDetails(cardData).then(function(fullDetails) {
                if (fullDetails && typeof showWatchScreen === 'function') {
                    console.log('검색 카드 -> 방송 화면 진입:', fullDetails);
                    AppState.ui.previousView = 'search';
                    showWatchScreen(fullDetails);
                } else {
                    console.log('라이브 상세 정보를 가져올 수 없습니다.');
                }
            });
        } else {
            // 오프라인 채널: 알림 표시
            console.log('오프라인 채널입니다:', cardData.channel.channelName);
            alert(cardData.channel.channelName + '은(는) 현재 오프라인입니다.');
        }
    } else {
        // 일반 라이브 카드의 경우: 기존 로직 사용
        ChzzkAPI.fetchFullLiveDetails(cardData).then(function(fullDetails) {
            if (fullDetails && typeof showWatchScreen === 'function') {
                console.log('라이브 카드 -> 방송 화면 진입:', fullDetails);
                AppState.ui.previousView = 'live';
                showWatchScreen(fullDetails);
            } else {
                console.log('라이브 상세 정보를 가져올 수 없습니다.');
            }
        });
    }
    
    // 카드 확대 효과
    cardElement.style.transform = 'scale(1.05)';
    setTimeout(function() {
        cardElement.style.transform = 'scale(1)';
    }, 200);
}

/**
 * OK 버튼 처리
 */
function handleOKButton() {
    var currentElement = AppState.ui.focusableElements[AppState.ui.currentFocusIndex];
    selectCard(currentElement);
}

/**
 * 뒤로가기 버튼 처리
 */
function handleBackButton() {
    var searchResultsContainer = document.getElementById('search-results-container');
    var searchInput = document.getElementById('search-keyword-input');
    
    if (searchResultsContainer && searchResultsContainer.style.display === 'grid' && searchResultsContainer.querySelectorAll('.live-card').length > 0) {
        // 검색 결과 화면에서 라이브 목록으로 돌아가기
        searchResultsContainer.style.display = 'none';
        searchResultsContainer.innerHTML = '';
        if (searchInput) {
            searchInput.value = '';
        }
        
        // 라이브 목록만 표시하도록 복원
        AppMediator.publish('search:showLiveList');
        initializeFocus();
    } else {
        // 기본 화면에서 앱 종료 시도
        var liveContainer = document.getElementById('live-stream-list-container');
        if (liveContainer && liveContainer.style.display !== 'none') {
            // webOS에서 앱 종료
            Utils.handlePlatformBack();
        }
    }
}


// 모듈 내보내기
window.Navigation = {
    initializeFocus: initializeFocus,
    updateFocusableElements: updateFocusableElements,
    setFocus: setFocus,
    selectCard: selectCard,
    handleKeyDown: handleKeyDown,
    handleOKButton: handleOKButton,
    handleBackButton: handleBackButton,
    getCurrentFocusIndex: function() { return AppState.ui.currentFocusIndex; },
    setCurrentFocusIndex: function(index) { AppState.ui.currentFocusIndex = index; }
}; 