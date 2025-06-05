// Main JavaScript for Chzzk4LGTV4 - 리팩토링된 버전
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
    card.chzzkData = stream; // 카드 요소에 stream 데이터 직접 저장
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
    card.chzzkData = item; // 카드 요소에 item (channel 정보 포함) 데이터 직접 저장
    container.appendChild(card);
}

// 전역 변수
let currentSelectedLiveData = null;
let previousView = null; // 'live', 'search' 등으로 이전 뷰 상태 저장

/**
 * 애플리케이션 초기화
 */
function initializeApp() {
    console.log("Initializing Chzzk4LGTV4 App...");
    
    // 검색 기능 초기화
    SearchManager.initializeSearch();
    
    // 초기 라이브 목록 로드
    SearchManager.showLiveList();
    
    // 키보드 네비게이션 초기화
    document.addEventListener('keydown', Navigation.handleKeyDown);
    
    console.log("App initialization complete!");
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', function () {
    // 모든 모듈이 로드되었는지 확인
    if (typeof ChzzkAPI === 'undefined' || 
        typeof Utils === 'undefined' || 
        typeof CardManager === 'undefined' || 
        typeof Navigation === 'undefined' || 
        typeof SearchManager === 'undefined') {
        console.error("Required modules not loaded! Please check script loading order.");
        return;
    }
    
    initializeApp();
});

// 전역 함수들 (기존 호환성 유지)
window.fetchAndDisplayLives = SearchManager.showLiveList;
window.fetchAndDisplaySearchResults = SearchManager.showSearchResults;
window.currentSelectedLiveData = currentSelectedLiveData;
window.previousView = previousView; 