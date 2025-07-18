// 카드 생성 및 관리 모듈 (ES5 호환)

/**
 * 즐겨찾기 별표 요소 생성
 * @param {Object} data - 방송/채널 데이터
 * @returns {HTMLElement} 별표 요소
 */
function createFavoriteStar(data) {
    var star = document.createElement('span');
    star.className = 'favorite-star';
    star.innerHTML = '★'; // 채워진 별 아이콘
    
    // 채널 ID 추출
    var channelId = null;
    if (data.channel && data.channel.channelId) {
        channelId = data.channel.channelId;
    } else if (data.channelId) {
        channelId = data.channelId;
    }
    
    // 즐겨찾기 상태에 따른 스타일 설정
    if (channelId && window.FavoriteManager && window.FavoriteManager.isFavorite(channelId)) {
        star.classList.add('active');
    } else {
        star.classList.add('inactive');
    }
    
    // 별표 클릭 이벤트
    star.addEventListener('click', function(event) {
        event.stopPropagation(); // 카드 클릭 이벤트 방지
        
        if (!channelId) {
            console.error('채널 ID를 찾을 수 없습니다:', data);
            return;
        }
        
        // 채널 데이터 준비
        var channelData = {
            channelId: channelId,
            channelName: data.channel ? data.channel.channelName : (data.channelName || '알 수 없는 채널'),
            channelImageUrl: data.channel ? data.channel.channelImageUrl : (data.channelImageUrl || null)
        };
        
        // 즐겨찾기 토글
        if (window.FavoriteManager) {
            var isNowFavorite = window.FavoriteManager.toggleFavorite(channelData);
            updateStarAppearance(star, isNowFavorite);
            
            // 성공 메시지 표시
            console.log(isNowFavorite ? '즐겨찾기에 추가됨:' : '즐겨찾기에서 제거됨:', channelData.channelName);
            
            // 라이브 목록 자동 새로고침 (즐겨찾기 순서 반영)
            setTimeout(function() {
                AppMediator.publish('search:refreshLiveList');
            }, 100); // 100ms 지연으로 부드러운 전환
        }
    });
    
    return star;
}

/**
 * 별표 외관 업데이트
 * @param {HTMLElement} star - 별표 요소
 * @param {boolean} isFavorite - 즐겨찾기 상태
 */
function updateStarAppearance(star, isFavorite) {
    if (isFavorite) {
        star.classList.remove('inactive');
        star.classList.add('active');
    } else {
        star.classList.remove('active');
        star.classList.add('inactive');
    }
}

/**
 * 통합 카드 생성 함수
 * @param {Object} data - 카드 데이터
 * @param {string} data.type - 카드 타입 ('live' 또는 'search')
 * @param {string} data.line1 - 첫 번째 줄 텍스트
 * @param {string} data.line2 - 두 번째 줄 텍스트
 * @param {string} data.line3 - 세 번째 줄 텍스트
 * @param {string} data.thumbnailUrl - 썸네일 URL
 * @param {boolean} data.isLive - 라이브 상태
 * @param {Object} data.originalData - 원본 데이터 (클릭 이벤트용)
 * @param {HTMLElement} container - 카드를 추가할 컨테이너
 */
function createUnifiedCard(data, container) {
    var card = document.createElement('div');
    card.className = 'chzzk-card';
    
    if (data.isLive) {
        card.classList.add('live-now');
    }
    
    // 썸네일 컨테이너 생성
    var thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'chzzk-card-thumbnail-container';
    
    var imageElement = document.createElement('img');
    imageElement.className = 'chzzk-card-thumbnail';
    imageElement.alt = data.line1 + ' 썸네일';
    imageElement.onerror = function() {
        var placeholder = Utils.createPlaceholderThumbnail('이미지 로드 실패');
        if (this.parentNode) {
            this.parentNode.replaceChild(placeholder, this);
        }
    };
    
    if (data.thumbnailUrl) {
        imageElement.src = data.thumbnailUrl;
        thumbnailContainer.appendChild(imageElement);
    } else {
        var placeholder = Utils.createPlaceholderThumbnail('No Image');
        thumbnailContainer.appendChild(placeholder);
    }
    
    // 라이브 배지 오버레이
    if (data.isLive) {
        var liveBadge = document.createElement('div');
        liveBadge.className = 'live-badge';
        liveBadge.textContent = 'LIVE';
        thumbnailContainer.appendChild(liveBadge);
    }
    
    card.appendChild(thumbnailContainer);
    
    // 카드 정보 영역
    var info = document.createElement('div');
    info.className = 'chzzk-card-info';
    
    // Line 1 (제목/채널명)
    var line1 = document.createElement('div');
    line1.className = 'chzzk-card-line1';
    line1.textContent = Utils.escapeHTML(data.line1);
    info.appendChild(line1);
    
    // Line 2 (채널명/팔로워)
    var line2 = document.createElement('div');
    line2.className = 'chzzk-card-line2';
    line2.textContent = data.line2;
    info.appendChild(line2);
    
    // Line 3 (시청자/설명)
    if (data.line3) {
        var line3 = document.createElement('div');
        line3.className = 'chzzk-card-line3';
        line3.textContent = data.line3;
        info.appendChild(line3);
    }
    
    // 즐겨찾기 별표
    var favoriteStarElement = createFavoriteStar(data.originalData);
    info.appendChild(favoriteStarElement);
    
    card.appendChild(info);
    
    // 카드 속성 및 이벤트
    card.setAttribute('tabindex', '-1');
    card.chzzkData = data.originalData;
    
    // 채널 ID 저장
    var channelId = null;
    if (data.originalData.channel && data.originalData.channel.channelId) {
        channelId = data.originalData.channel.channelId;
    } else if (data.originalData.channelId) {
        channelId = data.originalData.channelId;
    }
    if (channelId) {
        card.setAttribute('data-channel-id', channelId);
    }
    
    // 클릭/터치 이벤트
    card.addEventListener('click', function() {
        if (window.AppMediator) {
            AppMediator.publish('navigation:selectCard', { card: card });
        }
    });
    
    container.appendChild(card);
}

/**
 * 라이브 방송 카드 생성
 * @param {Object} stream - 방송 데이터
 * @param {HTMLElement} container - 카드를 추가할 컨테이너
 */
function createLiveCard(stream, container) {
    // 라이브 상태 확인
    var isLive = false;
    
    // 라이브 채널은 liveTitle과 concurrentUserCount를 가짐
    if (stream.liveTitle && stream.concurrentUserCount !== undefined && stream.concurrentUserCount !== null) {
        isLive = true;
    }
    
    // livePlaybackJson이 있는 경우 추가 확인
    if (!isLive && stream.livePlaybackJson) {
        try {
            var livePlayback = JSON.parse(stream.livePlaybackJson);
            if (livePlayback && livePlayback.status === "STARTED") {
                isLive = true;
            }
        } catch (e) {
            console.warn("Error parsing livePlaybackJson for stream: ", stream.liveTitle, e);
        }
    }

    // 썸네일 처리 - 라이브인 경우 방송 화면 썸네일 우선 사용
    var thumbnailUrl = null;
    if (stream.liveImageUrl) {
        // 라이브 방송 화면 썸네일 (고화질로 변경)
        thumbnailUrl = stream.liveImageUrl.replace('{type}', '720');
    }
    if (!thumbnailUrl && stream.channel && stream.channel.channelImageUrl) {
        thumbnailUrl = stream.channel.channelImageUrl;
    }

    // 통합 카드 데이터 준비
    var cardData = {
        type: 'live',
        line1: stream.liveTitle,
        line2: stream.channel.channelName,
        line3: '시청자 ' + stream.concurrentUserCount.toLocaleString() + '명',
        thumbnailUrl: thumbnailUrl,
        isLive: isLive,
        originalData: stream
    };
    
    createUnifiedCard(cardData, container);
}

/**
 * 검색 결과 카드 생성
 * @param {Object} item - 검색 결과 데이터
 * @param {HTMLElement} container - 카드를 추가할 컨테이너
 */
function createSearchResultCard(item, container) {
    var channel = item.channel;
    if (!channel) return;

    var isLive = channel.openLive ? true : false;
    
    // 썸네일 URL 결정
    var thumbnailUrl = channel.channelImageUrl || null;
    
    // 라이브인 경우 실제 방송 썸네일을 가져올 수 있는지 확인
    // 검색 결과에는 liveImageUrl이 없으므로 채널 이미지 사용
    
    // 채널 설명 처리 (최대 2줄)
    var descriptionText = '';
    if (channel.channelDescription) {
        descriptionText = Utils.escapeHTML(channel.channelDescription);
        // 길이 제한 (약 50자)
        if (descriptionText.length > 50) {
            descriptionText = descriptionText.substring(0, 50) + '...';
        }
    }
    
    // 통합 카드 데이터 준비
    var cardData = {
        type: 'search',
        line1: channel.channelName + (channel.verifiedMark ? ' ✔️' : ''),
        line2: '팔로워: ' + (channel.followerCount ? channel.followerCount.toLocaleString() : '정보 없음'),
        line3: descriptionText,
        thumbnailUrl: thumbnailUrl,
        isLive: isLive,
        originalData: item
    };
    
    createUnifiedCard(cardData, container);
}

// 모듈 내보내기
window.CardManager = {
    createLiveCard: createLiveCard,
    createSearchResultCard: createSearchResultCard,
    createUnifiedCard: createUnifiedCard,
    createFavoriteStar: createFavoriteStar,
    updateStarAppearance: updateStarAppearance
};