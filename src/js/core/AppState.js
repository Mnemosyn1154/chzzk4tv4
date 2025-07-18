/**
 * 애플리케이션 전역 상태 관리 (ES5)
 * 모든 주요 상태 변수들을 중앙화하여 관리
 */

var AppState = {
    // UI 네비게이션 상태
    ui: {
        // 현재 포커스된 요소의 인덱스
        currentFocusIndex: 0,
        
        // 포커스 가능한 요소들의 배열
        focusableElements: [],
        
        // 한 줄에 표시되는 요소의 개수
        elementsPerRow: 5,
        
        // 시청 화면에서의 포커스 인덱스 (-1: 없음, 0: 즐겨찾기 버튼, 1: 채팅 화살표)
        watchScreenFocusIndex: -1,
        
        // 정보 팝업 표시 여부
        isInfoPopupVisible: false,
        
        // 정보 팝업 타이머 ID
        infoPopupTimer: null,
        
        // 이전 뷰 ('search' 또는 'live')
        previousView: 'live',
        
        // 채팅창 표시 여부
        isChatPanelVisible: false
    },
    
    // 플레이어 상태
    player: {
        // 현재 시청 중인 방송 데이터
        currentWatchData: null,
        
        // HLS 인스턴스 (참조만 저장)
        hlsInstance: null
    },
    
    // 검색 상태
    search: {
        // 현재 검색어
        keyword: '',
        
        // 검색 결과
        results: []
    },
    
    // 즐겨찾기 상태
    favorites: {
        // 즐겨찾기 채널 ID 목록
        channelIds: []
    }
};

// ES5 호환을 위한 초기화 함수
function initializeAppState() {
    // localStorage에서 즐겨찾기 불러오기
    var savedFavorites = localStorage.getItem('chzzk_favorites');
    if (savedFavorites) {
        try {
            AppState.favorites.channelIds = JSON.parse(savedFavorites);
        } catch (e) {
            console.error('Failed to parse favorites:', e);
            AppState.favorites.channelIds = [];
        }
    }
    
    // 초기 UI 상태 설정
    AppState.ui.currentFocusIndex = 0;
    AppState.ui.watchScreenFocusIndex = -1;
    AppState.ui.isInfoPopupVisible = false;
    AppState.ui.previousView = 'live';
    AppState.ui.isChatPanelVisible = false;
    
    
    console.log('AppState initialized');
}

// 상태 리셋 함수
function resetAppState() {
    AppState.ui.currentFocusIndex = 0;
    AppState.ui.focusableElements = [];
    AppState.ui.watchScreenFocusIndex = -1;
    AppState.ui.isInfoPopupVisible = false;
    AppState.ui.infoPopupTimer = null;
    AppState.ui.isChatPanelVisible = false;
    AppState.player.currentWatchData = null;
    AppState.search.keyword = '';
    AppState.search.results = [];
}

// 디버깅을 위한 상태 출력 함수
function logAppState() {
    console.log('Current AppState:', JSON.stringify({
        ui: {
            currentFocusIndex: AppState.ui.currentFocusIndex,
            focusableElementsCount: AppState.ui.focusableElements.length,
            elementsPerRow: AppState.ui.elementsPerRow,
            watchScreenFocusIndex: AppState.ui.watchScreenFocusIndex,
            isInfoPopupVisible: AppState.ui.isInfoPopupVisible,
            previousView: AppState.ui.previousView,
            isChatPanelVisible: AppState.ui.isChatPanelVisible
        },
        player: {
            hasCurrentWatchData: !!AppState.player.currentWatchData,
            hasHlsInstance: !!AppState.player.hlsInstance
        },
        search: {
            keyword: AppState.search.keyword,
            resultsCount: AppState.search.results.length
        },
        favorites: {
            count: AppState.favorites.channelIds.length
        }
    }, null, 2));
}