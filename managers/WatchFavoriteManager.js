// managers/WatchFavoriteManager.js (ES5 호환)

var WatchFavoriteManager = (function() {
    var watchFavoriteButton = null;
    // currentWatchData는 이제 AppState.player.currentWatchData를 사용
    
    function initialize() {
        console.log("WatchFavoriteManager initialized");
    }
    
    function setCurrentWatchData(data) {
        AppState.player.currentWatchData = data;
    }
    
    /**
     * 시청 화면 즐겨찾기 버튼 초기화
     */
    function initializeButton() {
        // 기존 버튼이 있다면 제거
        var existingBtn = document.getElementById('watch-favorite-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // 제목 요소 찾기
        var titleElement = document.getElementById('watch-title');
        if (!titleElement) {
            console.error('시청 화면 제목 요소를 찾을 수 없습니다.');
            return false;
        }
        
        // 새 별표 버튼 생성
        watchFavoriteButton = document.createElement('button');
        watchFavoriteButton.id = 'watch-favorite-btn';
        watchFavoriteButton.className = 'watch-favorite-btn';
        watchFavoriteButton.innerHTML = '★';
        watchFavoriteButton.setAttribute('tabindex', '0');
        
        // 제목 요소에 버튼 추가
        titleElement.appendChild(watchFavoriteButton);
        
        // 클릭 이벤트 등록
        watchFavoriteButton.addEventListener('click', function() {
            toggleFavorite();
        });
        
        console.log('시청 화면 즐겨찾기 버튼 초기화 완료');
        return true;
    }
    
    /**
     * 시청 화면에서 즐겨찾기 토글
     */
    function toggleFavorite() {
        if (!AppState.player.currentWatchData || !window.FavoriteManager) {
            console.error('즐겨찾기 토글 실패: 데이터 없음');
            return;
        }
        
        // 채널 ID 추출
        var channelId = null;
        if (AppState.player.currentWatchData.channel && AppState.player.currentWatchData.channel.channelId) {
            channelId = AppState.player.currentWatchData.channel.channelId;
        } else if (AppState.player.currentWatchData.channelId) {
            channelId = AppState.player.currentWatchData.channelId;
        }
        
        if (!channelId) {
            console.error('채널 ID를 찾을 수 없습니다:', AppState.player.currentWatchData);
            return;
        }
        
        // 채널 데이터 준비
        var channelData = {
            channelId: channelId,
            channelName: AppState.player.currentWatchData.channel ? AppState.player.currentWatchData.channel.channelName : AppState.player.currentWatchData.channelName,
            channelImageUrl: AppState.player.currentWatchData.channel ? AppState.player.currentWatchData.channel.channelImageUrl : AppState.player.currentWatchData.channelImageUrl
        };
        
        // 즐겨찾기 토글
        var isNowFavorite = window.FavoriteManager.toggleFavorite(channelData);
        updateButtonAppearance(isNowFavorite);
        
        console.log(isNowFavorite ? '즐겨찾기에 추가됨:' : '즐겨찾기에서 제거됨:', channelData.channelName);
    }
    
    /**
     * 시청 화면 즐겨찾기 버튼 외관 업데이트
     * @param {boolean} isFavorite - 즐겨찾기 상태
     */
    function updateButtonAppearance(isFavorite) {
        if (!watchFavoriteButton) return;
        
        if (isFavorite) {
            watchFavoriteButton.classList.remove('inactive');
            watchFavoriteButton.classList.add('active');
        } else {
            watchFavoriteButton.classList.remove('active');
            watchFavoriteButton.classList.add('inactive');
        }
    }
    
    /**
     * 현재 방송의 즐겨찾기 상태 설정
     * @param {Object} broadcastData - 방송 데이터
     */
    function setFavoriteState(broadcastData) {
        if (!broadcastData || !window.FavoriteManager || !watchFavoriteButton) {
            return;
        }
        
        // 채널 ID 추출
        var channelId = null;
        if (broadcastData.channel && broadcastData.channel.channelId) {
            channelId = broadcastData.channel.channelId;
        } else if (broadcastData.channelId) {
            channelId = broadcastData.channelId;
        }
        
        if (channelId) {
            var isFavorite = window.FavoriteManager.isFavorite(channelId);
            updateButtonAppearance(isFavorite);
        }
    }
    
    /**
     * 버튼 요소 반환 (포커스 관리용)
     */
    function getButton() {
        return watchFavoriteButton;
    }
    
    function cleanup() {
        AppState.player.currentWatchData = null;
        watchFavoriteButton = null;
    }
    
    return {
        initialize: initialize,
        setCurrentWatchData: setCurrentWatchData,
        initializeButton: initializeButton,
        toggleFavorite: toggleFavorite,
        updateButtonAppearance: updateButtonAppearance,
        setFavoriteState: setFavoriteState,
        getButton: getButton,
        cleanup: cleanup
    };
})();

// 전역으로 노출
window.WatchFavoriteManager = WatchFavoriteManager; 