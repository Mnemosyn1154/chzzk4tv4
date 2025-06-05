// 포커스 및 네비게이션 관리 모듈 (ES5 호환)

// 포커스 관리 변수들
var focusableElements = []; // 포커스 가능한 요소들
var currentFocusIndex = 0;  // 현재 포커스된 요소의 인덱스
var elementsPerRow = 4;     // 한 줄에 표시되는 카드 수

var SEARCH_INPUT_INDEX = 0;
var SEARCH_BUTTON_INDEX = 1;
var CARDS_START_INDEX = 2;

/**
 * 포커스 가능한 요소 목록 초기화
 */
function initializeFocus() {
    focusableElements = [];
    var searchInput = document.getElementById('search-keyword-input');
    var searchButton = document.getElementById('search-button');
    
    if (searchInput) {
        focusableElements.push(searchInput);
    }
    if (searchButton) {
        focusableElements.push(searchButton);
    }
    
    // 현재 활성 카드들 추가
    focusableElements = focusableElements.concat(getActiveCards());
    
    elementsPerRow = Utils.getColumnCount();
    currentFocusIndex = 0;
    
    updateFocusableElements();
}

function getActiveCards() {
    var liveContainer = document.getElementById('live-stream-list-container');
    var searchContainer = document.getElementById('search-results-container');
    var activeCards = [];
    
    if (searchContainer && searchContainer.style.display === 'grid' && searchContainer.querySelectorAll('.live-card').length > 0) {
        activeCards = Array.prototype.slice.call(searchContainer.querySelectorAll('.live-card'));
    } else if (liveContainer && liveContainer.style.display !== 'none' && liveContainer.querySelectorAll('.live-card').length > 0) {
        activeCards = Array.prototype.slice.call(liveContainer.querySelectorAll('.live-card'));
    }
    
    return activeCards;
}

/**
 * 포커스 가능한 요소 업데이트
 */
function updateFocusableElements() {
    var activeCards = getActiveCards();
    focusableElements = [];
    
    var searchInput = document.getElementById('search-keyword-input');
    var searchButton = document.getElementById('search-button');
    
    if (searchInput) {
        focusableElements.push(searchInput);
    }
    if (searchButton) {
        focusableElements.push(searchButton);
    }
    
    focusableElements = focusableElements.concat(activeCards);
    
    elementsPerRow = Utils.getColumnCount();
    
    // 기존 포커스가 범위를 벗어났다면 첫 번째 요소로 이동
    if (currentFocusIndex >= focusableElements.length) {
        currentFocusIndex = 0;
    }
    
    setFocus(currentFocusIndex);
}

/**
 * 지정된 인덱스의 요소에 포커스 설정
 * @param {number} index - 포커스할 요소의 인덱스
 */
function setFocus(index) {
    if (focusableElements.length === 0) return;
    
    // 이전 포커스 해제
    var oldFocusedElement = focusableElements[currentFocusIndex];
    if (oldFocusedElement) {
        oldFocusedElement.classList.remove('focused');
    }
    
    // 새로운 포커스 설정
    currentFocusIndex = index;
    var newFocusedElement = focusableElements[currentFocusIndex];
    if (newFocusedElement) {
        newFocusedElement.classList.add('focused');
        newFocusedElement.focus();
    }
}

/**
 * 키 입력 처리
 * @param {string} key - 입력된 키
 */
function handleKeyDown(key) {
    if (focusableElements.length === 0) {
        return;
    }
    
    var currentElement = focusableElements[currentFocusIndex];
    var newFocusIndex = currentFocusIndex;
    
    switch (key) {
        case 'ArrowDown':
            if (currentFocusIndex >= CARDS_START_INDEX) {
                // 카드 영역에서 아래로 이동
                newFocusIndex = Math.min(focusableElements.length - 1, 
                                       currentFocusIndex + elementsPerRow);
            } else if (currentFocusIndex === SEARCH_INPUT_INDEX && focusableElements.length > CARDS_START_INDEX) {
                // 검색 입력창에서 첫 번째 카드로 이동
                newFocusIndex = CARDS_START_INDEX;
            } else if (currentFocusIndex === SEARCH_BUTTON_INDEX && focusableElements.length > CARDS_START_INDEX) {
                // 검색 버튼에서 첫 번째 카드로 이동
                newFocusIndex = CARDS_START_INDEX;
            }
            break;
            
        case 'ArrowUp':
            if (currentFocusIndex >= CARDS_START_INDEX) {
                var newIndex = currentFocusIndex - elementsPerRow;
                if (newIndex >= CARDS_START_INDEX) {
                    newFocusIndex = newIndex;
                } else {
                    // 첫 번째 행의 카드에서 검색 영역으로 이동
                    newFocusIndex = SEARCH_INPUT_INDEX;
                }
            }
            break;
            
        case 'ArrowLeft':
            if (currentFocusIndex > 0) {
                newFocusIndex = currentFocusIndex - 1;
            }
            break;
            
        case 'ArrowRight':
            if (currentFocusIndex < focusableElements.length - 1) {
                newFocusIndex = currentFocusIndex + 1;
            }
            break;
            
        case 'Enter':
            if (currentElement.id === 'search-button') {
                currentElement.click();
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
 * OK 버튼 처리
 */
function handleOKButton() {
    var currentElement = focusableElements[currentFocusIndex];
    
    if (currentElement.classList && currentElement.classList.contains('live-card')) {
        console.log('카드 선택됨:', currentElement.chzzkData);
        
        var cardData = currentElement.chzzkData;
        
        // 검색 결과 카드인지 확인
        if (currentElement.classList.contains('search-result-card')) {
            // 검색 결과 카드의 경우: 채널이 라이브 중인지 확인
            if (cardData.channel && cardData.channel.openLive) {
                // 라이브 중인 채널: 상세 정보를 가져와서 방송 화면으로 진입
                ChzzkAPI.fetchFullLiveDetails(cardData).then(function(fullDetails) {
                    if (fullDetails && typeof showWatchScreen === 'function') {
                        console.log('검색 카드 -> 방송 화면 진입:', fullDetails);
                        window.previousView = 'search';
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
                    window.previousView = 'live';
                    showWatchScreen(fullDetails);
                } else {
                    console.log('라이브 상세 정보를 가져올 수 없습니다.');
                }
            });
        }
        
        // 카드 확대 효과
        currentElement.style.transform = 'scale(1.05)';
        setTimeout(function() {
            currentElement.style.transform = 'scale(1)';
        }, 200);
    }
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
        SearchManager.showLiveList();
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
    handleKeyDown: handleKeyDown,
    handleOKButton: handleOKButton,
    handleBackButton: handleBackButton,
    getCurrentFocusIndex: function() { return currentFocusIndex; },
    setCurrentFocusIndex: function(index) { currentFocusIndex = index; }
}; 