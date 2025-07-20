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
        // 통합 카드(.chzzk-card)와 기존 카드(.live-card) 모두 지원
        var searchCards = searchContainer ? searchContainer.querySelectorAll('.chzzk-card, .live-card') : [];
        var liveCards = liveContainer ? liveContainer.querySelectorAll('.chzzk-card, .live-card') : [];
        
        var isSearchActive = searchContainer && 
            searchContainer.style.display !== 'none' && 
            searchCards.length > 0;
            
        var isLiveActive = liveContainer && 
            liveContainer.style.display !== 'none' && 
            liveCards.length > 0;
        
        // 검색 결과가 있으면 검색 결과를 먼저 추가하고, 그 다음 라이브 카드 추가
        if (isSearchActive) {
            activeCards = Array.prototype.slice.call(searchCards);
            console.log("[Navigation] Search cards added:", activeCards.length);
            
            // 라이브 카드도 함께 추가 (검색 결과 다음에)
            if (isLiveActive) {
                var liveCardsArray = Array.prototype.slice.call(liveCards);
                activeCards = activeCards.concat(liveCardsArray);
                console.log("[Navigation] Live cards also added:", liveCardsArray.length);
                console.log("[Navigation] Total active cards:", activeCards.length);
            }
        } else if (isLiveActive) {
            // 검색 결과가 없으면 라이브 카드만 사용
            activeCards = Array.prototype.slice.call(liveCards);
            console.log("[Navigation] Only live cards active:", activeCards.length);
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
    
    console.log('[Navigation] Updated focusable elements:', AppState.ui.focusableElements.length);
    console.log('[Navigation] Current focus index before adjustment:', AppState.ui.currentFocusIndex);
    
    // 기존 포커스가 범위를 벗어났다면 적절한 위치로 이동
    if (AppState.ui.currentFocusIndex >= AppState.ui.focusableElements.length) {
        if (activeCards.length > 0) {
            AppState.ui.currentFocusIndex = CARDS_START_INDEX; // 첫 번째 카드
        } else {
            AppState.ui.currentFocusIndex = 0; // 카드가 없으면 검색창
        }
    }
    
    // updateFocusableElements가 호출될 때는 setFocus를 호출하지 않음
    // 호출하는 쪽에서 필요시 별도로 setFocus를 호출하도록 함
    console.log('[Navigation] Current focus index after adjustment:', AppState.ui.currentFocusIndex);
}

/**
 * 지정된 인덱스의 요소에 포커스 설정
 * @param {number} index - 포커스할 요소의 인덱스
 */
function setFocus(index) {
    if (AppState.ui.focusableElements.length === 0) return;
    
    // 모든 focused 클래스 제거 (이전 포커스가 배열에 없을 수도 있으므로)
    var allFocusedElements = document.querySelectorAll('.focused');
    for (var i = 0; i < allFocusedElements.length; i++) {
        allFocusedElements[i].classList.remove('focused');
        console.log('[Navigation] Removed focus from:', allFocusedElements[i].className);
    }
    
    // 검색창에서 포커스가 벗어날 때 명시적으로 blur 처리
    var searchInput = document.getElementById('search-keyword-input');
    if (searchInput && searchInput.classList.contains('focused')) {
        searchInput.blur();
    }
    
    // 새로운 포커스 설정
    AppState.ui.currentFocusIndex = index;
    var newFocusedElement = AppState.ui.focusableElements[AppState.ui.currentFocusIndex];
    if (newFocusedElement) {
        newFocusedElement.classList.add('focused');
        console.log('[Navigation] Focus set to:', newFocusedElement.className, 'at index:', index);
        
        // 검색창에는 시각적 포커스만 주고, 실제 DOM focus는 Enter 키에서만
        if (newFocusedElement.id === 'search-keyword-input') {
            console.log('검색창에 시각적 포커스만 설정 (키보드 방지)');
            // DOM focus를 주지 않음으로써 키보드가 자동으로 나타나지 않음
            // 하지만 화면은 스크롤해서 검색창이 보이도록 함
            newFocusedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                var currentElement = AppState.ui.focusableElements[AppState.ui.currentFocusIndex];
                var currentPosition = AppState.ui.currentFocusIndex - CARDS_START_INDEX;
                var currentRow = Math.floor(currentPosition / AppState.ui.elementsPerRow);
                var currentCol = currentPosition % AppState.ui.elementsPerRow;
                
                // 검색 결과와 라이브 카드의 경계 찾기
                var searchCards = document.querySelectorAll('#search-results-container .chzzk-card, #search-results-container .live-card');
                var searchCardCount = searchCards.length;
                var firstLiveCardIndex = CARDS_START_INDEX + searchCardCount;
                
                // 현재 검색 결과 카드에 있고, 다음 행이 라이브 카드인 경우
                if (AppState.ui.currentFocusIndex < firstLiveCardIndex) {
                    var searchRows = Math.ceil(searchCardCount / AppState.ui.elementsPerRow);
                    var currentSearchRow = Math.floor((AppState.ui.currentFocusIndex - CARDS_START_INDEX) / AppState.ui.elementsPerRow);
                    
                    if (currentSearchRow === searchRows - 1) {
                        // 검색 결과의 마지막 행에서 아래로 이동 시 라이브 첫 번째 행의 같은 열로 이동
                        newFocusIndex = firstLiveCardIndex + currentCol;
                        if (newFocusIndex >= AppState.ui.focusableElements.length) {
                            newFocusIndex = Math.min(firstLiveCardIndex, AppState.ui.focusableElements.length - 1);
                        }
                        console.log('[Navigation] Moving from search results to live cards, column', currentCol);
                    } else {
                        // 검색 결과 내에서 이동
                        newFocusIndex = Math.min(AppState.ui.focusableElements.length - 1, 
                                               AppState.ui.currentFocusIndex + AppState.ui.elementsPerRow);
                    }
                } else {
                    // 라이브 카드 영역에서 일반적인 이동
                    var proposedIndex = AppState.ui.currentFocusIndex + AppState.ui.elementsPerRow;
                    newFocusIndex = Math.min(AppState.ui.focusableElements.length - 1, proposedIndex);
                }
                
                console.log('[Navigation] Moving down in card area from index', AppState.ui.currentFocusIndex, 'to', newFocusIndex);
            } else if (AppState.ui.currentFocusIndex === SEARCH_INPUT_INDEX && AppState.ui.focusableElements.length > CARDS_START_INDEX) {
                // 검색 입력창에서 첫 번째 카드로 이동
                newFocusIndex = CARDS_START_INDEX;
                console.log('[Navigation] Moving from search input to first card');
            } else if (AppState.ui.currentFocusIndex === SEARCH_BUTTON_INDEX && AppState.ui.focusableElements.length > CARDS_START_INDEX) {
                // 검색 버튼에서 첫 번째 카드로 이동
                newFocusIndex = CARDS_START_INDEX;
                console.log('[Navigation] Moving from search button to first card');
            }
            break;
            
        case 'ArrowUp':
            if (AppState.ui.currentFocusIndex >= CARDS_START_INDEX) {
                var currentPosition = AppState.ui.currentFocusIndex - CARDS_START_INDEX;
                var currentCol = currentPosition % AppState.ui.elementsPerRow;
                
                // 검색 결과와 라이브 카드의 경계 찾기
                var searchCards = document.querySelectorAll('#search-results-container .chzzk-card, #search-results-container .live-card');
                var searchCardCount = searchCards.length;
                var firstLiveCardIndex = CARDS_START_INDEX + searchCardCount;
                
                // 라이브 카드의 첫 번째 행에서 위로 이동하는 경우
                if (AppState.ui.currentFocusIndex >= firstLiveCardIndex && 
                    AppState.ui.currentFocusIndex < firstLiveCardIndex + AppState.ui.elementsPerRow) {
                    
                    if (searchCardCount > 0) {
                        // 검색 결과가 있으면 검색 결과의 마지막 행 같은 열로 이동
                        var searchRows = Math.ceil(searchCardCount / AppState.ui.elementsPerRow);
                        var lastSearchRowStart = CARDS_START_INDEX + (searchRows - 1) * AppState.ui.elementsPerRow;
                        newFocusIndex = Math.min(lastSearchRowStart + currentCol, CARDS_START_INDEX + searchCardCount - 1);
                        console.log('[Navigation] Moving from live cards to search results, column', currentCol);
                    } else {
                        // 검색 결과가 없으면 검색 영역으로 이동
                        newFocusIndex = SEARCH_INPUT_INDEX;
                    }
                } else {
                    // 일반적인 위로 이동
                    var newIndex = AppState.ui.currentFocusIndex - AppState.ui.elementsPerRow;
                    if (newIndex >= CARDS_START_INDEX) {
                        newFocusIndex = newIndex;
                    } else {
                        // 첫 번째 행의 카드에서 검색 영역으로 이동
                        newFocusIndex = SEARCH_INPUT_INDEX;
                    }
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
            } else if (currentElement.classList && (currentElement.classList.contains('live-card') || currentElement.classList.contains('chzzk-card'))) {
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
    if (!cardElement || (!cardElement.classList.contains('live-card') && !cardElement.classList.contains('chzzk-card'))) {
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
    
    if (searchResultsContainer && searchResultsContainer.style.display === 'grid' && searchResultsContainer.querySelectorAll('.chzzk-card, .live-card').length > 0) {
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