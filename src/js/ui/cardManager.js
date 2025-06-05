// 카드 생성 및 관리 모듈 (ES5 호환)

/**
 * 라이브 방송 카드 생성
 * @param {Object} stream - 방송 데이터
 * @param {HTMLElement} container - 카드를 추가할 컨테이너
 */
function createLiveCard(stream, container) {
    var card = document.createElement('div');
    card.className = 'live-card';
    
    // 라이브 상태 확인
    if (stream.livePlaybackJson) {
        try {
            var livePlayback = JSON.parse(stream.livePlaybackJson);
            if (livePlayback && livePlayback.status === "STARTED") {
                 card.classList.add('live-now');
            }
        } catch (e) {
            console.warn("Error parsing livePlaybackJson for stream: ", stream.liveTitle, e);
        }
    }

    // 썸네일 처리
    var thumbnailUrl = null;
    if (stream.liveImageUrl) {
        thumbnailUrl = stream.liveImageUrl.replace('{type}', '480');
    }
    if (!thumbnailUrl && stream.channel && stream.channel.channelImageUrl) {
        thumbnailUrl = stream.channel.channelImageUrl;
    }

    var imageElement = document.createElement('img');
    imageElement.className = 'live-card-thumbnail';
    imageElement.alt = stream.liveTitle;
    imageElement.onerror = function() {
        var placeholder = Utils.createPlaceholderThumbnail("이미지 로드 실패");
        this.parentNode.replaceChild(placeholder, this);
    };
    imageElement.src = thumbnailUrl || '';

    if (!thumbnailUrl) {
        var placeholder = Utils.createPlaceholderThumbnail("No Image");
        card.appendChild(placeholder);
    } else {
        card.appendChild(imageElement);
    }

    // 카드 정보 생성
    var info = document.createElement('div');
    info.className = 'live-card-info';

    var title = document.createElement('h3');
    title.className = 'live-card-title';
    title.textContent = Utils.escapeHTML(stream.liveTitle);

    var channelName = document.createElement('p');
    channelName.className = 'live-card-channel';
    channelName.textContent = stream.channel.channelName;

    var viewers = document.createElement('p');
    viewers.className = 'live-card-viewers';
    viewers.textContent = '시청자 ' + stream.concurrentUserCount.toLocaleString() + '명';

    info.appendChild(title);
    info.appendChild(channelName);
    info.appendChild(viewers);

    // 라이브 배지 추가
    if (stream.livePlaybackJson) {
        var liveBadge = document.createElement('span');
        liveBadge.className = 'live-status-badge live';
        liveBadge.textContent = 'LIVE';
        info.appendChild(liveBadge);
    }

    card.appendChild(info);
    card.setAttribute('tabindex', '-1');
    card.chzzkData = stream; // 카드 요소에 stream 데이터 직접 저장
    container.appendChild(card);
}

/**
 * 검색 결과 카드 생성
 * @param {Object} item - 검색 결과 데이터
 * @param {HTMLElement} container - 카드를 추가할 컨테이너
 */
function createSearchResultCard(item, container) {
    var channel = item.channel;
    if (!channel) return;

    var card = document.createElement('div');
    card.className = 'live-card search-result-card';
    if (channel.openLive) {
        card.classList.add('live-now');
    }

    // 썸네일 처리
    var imageElement = document.createElement('img');
    imageElement.className = 'live-card-thumbnail';
    imageElement.alt = channel.channelName + ' 썸네일';
    imageElement.onerror = function() {
        var placeholder = Utils.createPlaceholderThumbnail("이미지 로드 실패");
        if (this.parentNode) {
            this.parentNode.replaceChild(placeholder, this);
        }
    };
    imageElement.src = channel.channelImageUrl || '';

    if (!channel.channelImageUrl) {
        var placeholder = Utils.createPlaceholderThumbnail("No Image");
        card.appendChild(placeholder);
    } else {
        card.appendChild(imageElement);
    }

    // 카드 정보 생성
    var info = document.createElement('div');
    info.className = 'live-card-info';

    var title = document.createElement('h3');
    title.className = 'live-card-title';
    title.textContent = channel.channelName;
    
    if (channel.verifiedMark) {
        var verifiedBadge = document.createElement('span');
        verifiedBadge.className = 'verified-badge';
        verifiedBadge.textContent = ' ✔️';
        title.appendChild(verifiedBadge);
    }

    var followers = document.createElement('p');
    followers.className = 'live-card-channel';
    var followerCountText = channel.followerCount ? channel.followerCount.toLocaleString() : '정보 없음';
    followers.textContent = '팔로워: ' + followerCountText;

    info.appendChild(title);
    info.appendChild(followers);

    if (channel.openLive) {
        var liveBadgeHTML = document.createElement('span');
        liveBadgeHTML.className = 'live-status-badge live';
        liveBadgeHTML.textContent = 'LIVE';
        info.appendChild(liveBadgeHTML);
    } else {
        var offlineBadge = document.createElement('span');
        offlineBadge.className = 'live-status-badge offline';
        offlineBadge.textContent = '오프라인';
        info.appendChild(offlineBadge);
    }
    
    // 채널 설명
    if (channel.channelDescription) {
        var description = document.createElement('p');
        description.className = 'channel-description';
        description.textContent = Utils.escapeHTML(channel.channelDescription);
        info.appendChild(description);
    }

    card.appendChild(info);
    card.setAttribute('tabindex', '-1');
    card.chzzkData = item;
    container.appendChild(card);
}

// 모듈 내보내기
window.CardManager = {
    createLiveCard: createLiveCard,
    createSearchResultCard: createSearchResultCard
}; 