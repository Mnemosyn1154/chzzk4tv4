// Main JavaScript for Chzzk4LGTV4
console.log("Chzzk4LGTV4 App Started!");

const CHZZK_API_LIVES = 'https://api.chzzk.naver.com/service/v1/lives';
const CHZZK_API_SEARCH_CHANNELS = 'https://api.chzzk.naver.com/service/v1/search/channels';

// API 호출 기본 함수
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // 치지직 API는 보통 content 객체 안에 실제 데이터가 있음
    return data.content || data;
}

// 실시간 방송 목록 가져오기
async function fetchLives() {
    const data = await fetchData(CHZZK_API_LIVES);
    return data.data || []; // 실제 방송 목록은 data.data 에 있을 수 있음 (API 응답 구조에 따라 다름)
}

// 채널 검색 결과 가져오기
async function fetchSearchResults(keyword) {
    const url = `${CHZZK_API_SEARCH_CHANNELS}?keyword=${encodeURIComponent(keyword)}`;
    const data = await fetchData(url);
    return data.data || []; // 실제 채널 목록은 data.data 에 있을 수 있음
}

// 이미지 로드 실패 시 플레이스홀더 생성
function createPlaceholderThumbnail(text = "No Image") {
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder-thumbnail';
    const span = document.createElement('span');
    span.textContent = text;
    placeholder.appendChild(span);
    return placeholder;
}

// 라이브 방송 카드 생성
function createLiveCard(stream, container) {
    const card = document.createElement('div');
    card.className = 'live-card';
    if (stream.livePlaybackJson) { // livePlaybackJson 유무로 실제 라이브 판별 가능성
        try {
            const livePlayback = JSON.parse(stream.livePlaybackJson);
            if (livePlayback && livePlayback.status === "STARTED") { // 보다 정확한 라이브 상태 확인
                 card.classList.add('live-now');
            }
        } catch (e) {
            console.warn("Error parsing livePlaybackJson for stream: ", stream.liveTitle, e);
        }
    }

    let thumbnailUrl = stream.liveImageUrl?.replace('{type}', '480'); // 썸네일 URL
    if (!thumbnailUrl) { // 썸네일 URL이 없는 경우 (예: 일부 종료된 방송)
        thumbnailUrl = stream.channel?.channelImageUrl; // 채널 이미지로 대체 시도
    }


    const imageElement = document.createElement('img');
    imageElement.className = 'live-card-thumbnail';
    imageElement.alt = stream.liveTitle;
    imageElement.onerror = function() {
        const placeholder = createPlaceholderThumbnail("이미지 로드 실패");
        this.parentNode.replaceChild(placeholder, this);
    };
    imageElement.src = thumbnailUrl || ''; // src가 null이면 오류 발생 가능성 있으므로 빈 문자열 처리

    if (!thumbnailUrl) { // 썸네일 URL이 아예 없는 경우, 처음부터 플레이스홀더
        const placeholder = createPlaceholderThumbnail("No Image");
        card.appendChild(placeholder);
    } else {
        card.appendChild(imageElement);
    }

    const info = document.createElement('div');
    info.className = 'live-card-info';

    const title = document.createElement('h3');
    title.className = 'live-card-title';
    title.textContent = stream.liveTitle.replace(/[<]/g, '&lt;').replace(/[>]/g, '&gt;');

    const channelName = document.createElement('p');
    channelName.className = 'live-card-channel';
    channelName.textContent = stream.channel.channelName;

    const viewers = document.createElement('p');
    viewers.className = 'live-card-viewers';
    viewers.textContent = `시청자 ${stream.concurrentUserCount.toLocaleString()}명`;

    info.appendChild(title);
    info.appendChild(channelName);
    info.appendChild(viewers);

    // 라이브 상태 배지 (선택적)
    if (stream.livePlaybackJson) { // 실제 라이브 여부 확인 후 배지 추가 가능
        const liveBadge = document.createElement('span');
        liveBadge.className = 'live-status-badge live';
        liveBadge.textContent = 'LIVE';
        info.appendChild(liveBadge);
    }

    card.appendChild(info);
    card.setAttribute('tabindex', '-1'); // 포커스 가능하도록 tabindex 추가
    container.appendChild(card);
}


// 검색 결과 카드 생성
function createSearchResultCard(item, container) {
    const channel = item.channel; // 실제 채널 정보는 item.channel 내부에 있음
    if (!channel) return; // 채널 정보가 없으면 카드 생성 안함

    const card = document.createElement('div');
    card.className = 'live-card search-result-card'; // 검색 결과용 클래스 추가 가능
    if (channel.openLive) {
        card.classList.add('live-now');
    }

    const imageElement = document.createElement('img');
    imageElement.className = 'live-card-thumbnail'; // 검색 결과 썸네일은 원형이 아님 (CSS에서 #search-results-container .live-card-thumbnail로 제어)
    imageElement.alt = `${channel.channelName} 썸네일`;
    imageElement.onerror = function() {
        const placeholder = createPlaceholderThumbnail("이미지 로드 실패");
        // this.parentNode.replaceChild(placeholder, this); // 검색 결과 카드에서는 placeholder가 다를 수 있음
        // 검색 카드는 썸네일이 카드 상단에 꽉 차는 형태이므로, placeholder도 그에 맞게 조정 필요
        // 여기서는 간단히 에러 발생 시 기존 이미지 요소를 플레이스홀더 div로 교체
        if (this.parentNode) {
            this.parentNode.replaceChild(placeholder, this);
        }

    };
    imageElement.src = channel.channelImageUrl || '';

    if (!channel.channelImageUrl) {
        const placeholder = createPlaceholderThumbnail("No Image");
        card.appendChild(placeholder);
    } else {
        card.appendChild(imageElement);
    }

    const info = document.createElement('div');
    info.className = 'live-card-info'; // 검색 결과용 info 클래스 추가 가능

    const title = document.createElement('h3');
    title.className = 'live-card-title';
    title.textContent = channel.channelName;
    if (channel.verifiedMark) { // API v1에서는 verifiedMark가 boolean으로 제공됨
        const verifiedBadge = document.createElement('span');
        verifiedBadge.className = 'verified-badge';
        verifiedBadge.textContent = ' ✔️'; // 간단한 텍스트 배지
        title.appendChild(verifiedBadge);
    }

    const followers = document.createElement('p');
    followers.className = 'live-card-channel'; // CSS 클래스 재활용 또는 새 클래스
    followers.textContent = `팔로워: ${channel.followerCount ? channel.followerCount.toLocaleString() : '정보 없음'}`;

    info.appendChild(title);
    info.appendChild(followers);

    if (channel.openLive) {
        const liveBadgeHTML = document.createElement('span');
        liveBadgeHTML.className = 'live-status-badge live';
        liveBadgeHTML.textContent = 'LIVE';
        info.appendChild(liveBadgeHTML);
    }
    
    // 채널 설명 (선택적)
    if (channel.channelDescription) {
        const description = document.createElement('p');
        description.className = 'channel-description';
        description.textContent = channel.channelDescription.replace(/[<]/g, '&lt;').replace(/[>]/g, '&gt;');
        info.appendChild(description);
    }

    card.appendChild(info);
    card.setAttribute('tabindex', '-1'); // 포커스 가능하도록 tabindex 추가
    container.appendChild(card);
}


// API로부터 라이브 목록을 가져와 화면에 표시하는 함수
async function fetchAndDisplayLives() {
    const liveStreamListContainer = document.getElementById('live-stream-list-container');
    const searchResultsContainer = document.getElementById('search-results-container');
    if (!liveStreamListContainer || !searchResultsContainer) return;

    searchResultsContainer.style.display = 'none'; // 검색 결과 숨김
    liveStreamListContainer.innerHTML = '<p>로딩 중...</p>';
    liveStreamListContainer.style.display = 'grid'; // 라이브 목록 표시

    try {
        const lives = await fetchLives();
        liveStreamListContainer.innerHTML = ''; // 로딩 메시지 제거
        if (lives && lives.length > 0) {
            lives.forEach(stream => {
                createLiveCard(stream, liveStreamListContainer);
            });
            currentFocusIndex = CARDS_START_INDEX; // 라이브 목록의 첫번째 카드로 포커스 준비
        } else {
            liveStreamListContainer.innerHTML = '<p>현재 진행중인 라이브 방송이 없습니다.</p>';
            currentFocusIndex = SEARCH_INPUT_INDEX; // 방송 없을 시 검색창으로 포커스 준비
        }
    } catch (error) {
        console.error('Error fetching lives:', error);
        liveStreamListContainer.innerHTML = '<p>방송 목록을 가져오는 중 오류가 발생했습니다.</p>';
        currentFocusIndex = SEARCH_INPUT_INDEX; // 오류 시 검색창으로 포커스 준비
    }
    initializeFocus(); // 포커스 시스템 초기화
}

// 스트리머 검색 결과를 가져와 화면에 표시하는 함수
async function fetchAndDisplaySearchResults(keyword) {
    const searchResultsContainer = document.getElementById('search-results-container');
    const liveStreamListContainer = document.getElementById('live-stream-list-container');
    if (!searchResultsContainer || !liveStreamListContainer) return;

    liveStreamListContainer.style.display = 'none';
    searchResultsContainer.innerHTML = '<p>검색 중...</p>';
    searchResultsContainer.style.display = 'grid';

    try {
        const searchData = await fetchSearchResults(keyword);
        searchResultsContainer.innerHTML = '';
        if (searchData && searchData.length > 0) {
            searchData.forEach(item => {
                createSearchResultCard(item, searchResultsContainer);
            });
            currentFocusIndex = CARDS_START_INDEX; // 검색 성공 시 첫번째 카드로 포커스 준비
        } else {
            searchResultsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
            currentFocusIndex = SEARCH_INPUT_INDEX; // 검색 결과 없을 시 검색창으로 포커스 준비
        }
    } catch (error) {
        console.error('Error fetching search results:', error);
        searchResultsContainer.innerHTML = '<p>검색 결과를 가져오는 중 오류가 발생했습니다.</p>';
        currentFocusIndex = SEARCH_INPUT_INDEX; // 오류 시 검색창으로 포커스 준비
    }
    initializeFocus(); // 포커스 시스템 초기화
}

// HTML 특수문자 이스케이프 함수
function escapeHTML(str) {
    if (typeof str !== 'string') {
        return '';
    }
    return str.replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

// DOM 로드 완료 후 함수 실행
document.addEventListener('DOMContentLoaded', function () {
    fetchAndDisplayLives(); // 초기 라이브 목록 로드 및 포커스 설정

    var searchButton = document.getElementById('search-button');
    var searchKeywordInput = document.getElementById('search-keyword-input');

    if (searchButton && searchKeywordInput) {
        searchButton.addEventListener('click', function () {
            var keyword = searchKeywordInput.value;
            fetchAndDisplaySearchResults(keyword);
        });

        searchKeywordInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                var keyword = searchKeywordInput.value;
                fetchAndDisplaySearchResults(keyword);
            }
        });
    } else {
        console.error('Search UI elements not found!');
    }
}); 

// --- 리모컨 네비게이션 ---
var focusableElements = []; // 포커스 가능한 요소들 (검색창, 검색버튼, live-card)
var currentFocusIndex = 0;  // 현재 포커스된 요소의 인덱스
var elementsPerRow = 4;     // 한 줄에 표시되는 카드 수 (CSS의 grid-template-columns와 일치)
const SEARCH_INPUT_INDEX = 0;
const SEARCH_BUTTON_INDEX = 1;
const CARDS_START_INDEX = 2;

function initializeFocus() {
    const searchInput = document.getElementById('search-keyword-input');
    const searchButton = document.getElementById('search-button');

    focusableElements = [];
    if (searchInput) {
        searchInput.setAttribute('tabindex', '-1');
        focusableElements.push(searchInput);
    }
    if (searchButton) {
        searchButton.setAttribute('tabindex', '-1');
        focusableElements.push(searchButton);
    }

    const liveContainer = document.getElementById('live-stream-list-container');
    const searchContainer = document.getElementById('search-results-container');
    let activeCards = [];
    let activeContainer = null;

    if (searchContainer?.style.display === 'grid' && searchContainer.querySelectorAll('.live-card').length > 0) {
        activeContainer = searchContainer;
        elementsPerRow = 6;
        console.log("InitializeFocus: Search Results active");
    } else if (liveContainer?.style.display !== 'none' && liveContainer.querySelectorAll('.live-card').length > 0) {
        activeContainer = liveContainer;
        elementsPerRow = 4;
        console.log("InitializeFocus: Live Streams active");
    } else {
        console.log("InitializeFocus: No active card container or cards are empty.");
    }

    if (activeContainer) {
        activeCards = activeContainer.querySelectorAll('.live-card');
    }
    focusableElements = focusableElements.concat(Array.from(activeCards));

    if (focusableElements.length === 0) {
        console.warn("initializeFocus: No focusable elements found. Cannot set focus.");
        return;
    }

    if (currentFocusIndex >= focusableElements.length) {
        currentFocusIndex = focusableElements.length - 1;
    }
    if (currentFocusIndex < 0) {
        currentFocusIndex = 0;
    }
    
    console.log(`InitializeFocus: Final currentFocusIndex = ${currentFocusIndex}, Total elements = ${focusableElements.length}`);
    setFocus(currentFocusIndex);
}

function setFocus(index) {
    if (index < 0 || index >= focusableElements.length) {
        console.warn(`setFocus: Index ${index} out of bounds for ${focusableElements.length} elements.`);
        return;
    }

    const oldFocusedElement = focusableElements[currentFocusIndex]; // 이전 인덱스로 요소를 가져와야 함
    if (oldFocusedElement) {
        oldFocusedElement.classList.remove('focused');
    }

    currentFocusIndex = index; // 여기서 현재 인덱스를 업데이트
    const newFocusedElement = focusableElements[currentFocusIndex];

    if (newFocusedElement) {
        newFocusedElement.focus(); 

        if (newFocusedElement.classList.contains('live-card') || newFocusedElement.id === 'search-button') {
            newFocusedElement.classList.add('focused');
        }
        
        newFocusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        console.log("Focused on element: ", newFocusedElement, "at index: ", currentFocusIndex);
    } else {
        console.warn(`setFocus: newFocusedElement is null for index ${currentFocusIndex}`);
    }
}

function handleKeyDown(event) {
    if (focusableElements.length === 0) return;

    var newFocusIndex = currentFocusIndex;
    const currentElement = focusableElements[currentFocusIndex];

    switch (event.keyCode) {
        case 37: // 왼쪽 화살표
            console.log("Left arrow pressed");
            if (currentFocusIndex === SEARCH_BUTTON_INDEX) {
                newFocusIndex = SEARCH_INPUT_INDEX;
            } else if (currentFocusIndex >= CARDS_START_INDEX) {
                const cardIndexInList = currentFocusIndex - CARDS_START_INDEX;
                if (cardIndexInList % elementsPerRow !== 0) {
                    newFocusIndex = currentFocusIndex - 1;
                }
            }
            break;
        case 39: // 오른쪽 화살표
            console.log("Right arrow pressed");
            if (currentFocusIndex === SEARCH_INPUT_INDEX) {
                newFocusIndex = SEARCH_BUTTON_INDEX;
            } else if (currentFocusIndex >= CARDS_START_INDEX) {
                const cardIndexInList = currentFocusIndex - CARDS_START_INDEX;
                if ((cardIndexInList + 1) % elementsPerRow !== 0 && (currentFocusIndex + 1) < focusableElements.length) {
                    newFocusIndex = currentFocusIndex + 1;
                }
            }
            break;
        case 38: // 위쪽 화살표
            console.log("Up arrow pressed");
            if (currentFocusIndex >= CARDS_START_INDEX) {
                const cardIndexInList = currentFocusIndex - CARDS_START_INDEX;
                if (cardIndexInList - elementsPerRow >= 0) {
                    newFocusIndex = currentFocusIndex - elementsPerRow;
                } else { // 첫번째 줄 카드에서 위로 갈 때
                    newFocusIndex = SEARCH_INPUT_INDEX; // 검색창으로 이동
                }
            }
            break;
        case 40: // 아래쪽 화살표
            console.log("Down arrow pressed");
            if (currentFocusIndex === SEARCH_INPUT_INDEX || currentFocusIndex === SEARCH_BUTTON_INDEX) {
                if (focusableElements.length > CARDS_START_INDEX) {
                    newFocusIndex = CARDS_START_INDEX; // 첫번째 카드로 이동
                }
            } else if (currentFocusIndex >= CARDS_START_INDEX) {
                if (currentFocusIndex + elementsPerRow < focusableElements.length) {
                    newFocusIndex = currentFocusIndex + elementsPerRow;
                } else {
                    // 더 아래로 갈 카드가 없을 때 마지막 행의 카드로 이동 시도 (부분적인 행)
                    const cardIndexInList = currentFocusIndex - CARDS_START_INDEX;
                    const currentRow = Math.floor(cardIndexInList / elementsPerRow);
                    const numElementsInList = focusableElements.length - CARDS_START_INDEX;
                    const lastRowFirstIndex = currentRow * elementsPerRow + CARDS_START_INDEX;
                    const lastElementIndexInCurrentCol = Math.min(lastRowFirstIndex + (cardIndexInList % elementsPerRow), focusableElements.length - 1);
                    if(currentFocusIndex + elementsPerRow >= focusableElements.length && currentFocusIndex < focusableElements.length -1 ){
                        // newFocusIndex = focusableElements.length - 1; // 마지막 카드로 이동
                         // 현재 열의 가장 마지막 카드로 이동하거나, 행의 마지막 카드로.
                         // 여기서는 현재 열에 더이상 없으면 이동 안함. (혹은 마지막 요소로)
                    }
                }
            }
            break;
        case 13: // Enter/OK
            console.log("OK pressed on element: ", currentElement);
            if (currentElement && currentElement.id === 'search-button') {
                currentElement.click(); // 검색 버튼 클릭 효과
            } else if (currentElement && currentElement.id === 'search-keyword-input'){
                // 검색창에서 엔터 시 검색 실행 (이미 keypress 이벤트로 구현됨, 필요시 중복 호출 방지)
                const searchButton = document.getElementById('search-button');
                searchButton?.click();
            } else if (currentElement && currentElement.classList.contains('live-card')) {
                currentElement.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    if (focusableElements[currentFocusIndex] === currentElement) { 
                         currentElement.style.transform = 'scale(1)';
                    }
                }, 200);
            }
            break;
        case 461: // WebOS Back key (Decimal 461)
        case 27:  // Escape key (PC 테스트용으로 병행 처리)
            console.log("Back key pressed");
            const searchResultsContainer = document.getElementById('search-results-container');
            const liveStreamListContainer = document.getElementById('live-stream-list-container');
            const searchInput = document.getElementById('search-keyword-input');

            if (searchResultsContainer && searchResultsContainer.style.display === 'grid' && searchResultsContainer.querySelectorAll('.live-card').length > 0) {
                console.log("Back from search results to live list");
                searchResultsContainer.innerHTML = ''; 
                searchResultsContainer.style.display = 'none';
                if(liveStreamListContainer) {
                    // liveStreamListContainer.style.display = 'grid'; // fetchAndDisplayLives에서 처리
                    fetchAndDisplayLives(); // 라이브 목록 다시 로드 및 포커스 처리
                } else {
                     currentFocusIndex = SEARCH_INPUT_INDEX;
                     initializeFocus(); 
                }
            } else if (document.activeElement === searchInput && searchInput.value !== ''){
                console.log("Clear search input");
                searchInput.value = '';
                // 내용만 지우고 포커스는 검색창에 유지
            } else {
                console.log("Exiting app via webOS.platformBack()");
                if (typeof webOS !== 'undefined' && webOS.platformBack) {
                    webOS.platformBack();
                } else {
                    console.warn("webOS.platformBack() is not available.");
                }
            }
            break;
        default:
            return; // 다른 키는 무시
    }

    if (newFocusIndex !== currentFocusIndex) {
        setFocus(newFocusIndex);
    }
    
    event.preventDefault(); // 기본 브라우저 동작 (예: 스크롤) 방지
}

// fetchAndDisplayLives 함수가 완료된 후 (또는 검색 완료 후) 포커스 초기화
// 기존 fetchAndDisplayLives 와 fetchAndDisplaySearchResults 함수 내부에
// 데이터 로드 및 HTML 생성이 완료되는 시점에 initializeFocus(); 호출을 추가해야 합니다.

// 전역 이벤트 리스너 등록
document.addEventListener('keydown', handleKeyDown);

// live-card 요소들이 포커스를 받으려면 tabindex="-1" (또는 0 이상) 설정이 필요할 수 있습니다.
// CSS로 .focused 클래스에 대한 스타일을 정의해야 합니다.
// 예: .live-card.focused { border: 3px solid var(--highlight-green); transform: scale(1.05); } 