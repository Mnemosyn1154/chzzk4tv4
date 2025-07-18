/**
 * 애플리케이션 중앙 컨트롤러 (ES5)
 * 전체 앱의 초기화와 라이프사이클을 관리
 */

var App = {
    /**
     * 애플리케이션 초기화
     */
    initialize: function() {
        console.log("======================================");
        console.log("Chzzk4LGTV4 App Starting...");
        console.log("======================================");
        
        // 1. 모든 필수 모듈이 로드되었는지 확인
        if (!this.checkRequiredModules()) {
            console.error('Critical: Required modules are not loaded!');
            return;
        }
        
        // 2. AppState 초기화
        this.initializeAppState();
        
        // 3. 코어 매니저들 초기화 (시청 화면 관련)
        this.initializeCoreManagers();
        
        // 4. UI 모듈들 초기화
        this.initializeUIModules();
        
        // 5. 초기 화면 표시
        this.showInitialView();
        
        console.log("======================================");
        console.log("App initialization complete!");
        console.log("======================================");
    },
    
    /**
     * 필수 모듈 체크
     */
    checkRequiredModules: function() {
        var requiredModules = [
            'ChzzkAPI',
            'Utils',
            'CardManager',
            'Navigation',
            'SearchManager',
            'RemoteControl',
            'AppMediator',
            'AppState'
        ];
        
        var allLoaded = true;
        for (var i = 0; i < requiredModules.length; i++) {
            var moduleName = requiredModules[i];
            if (typeof window[moduleName] === 'undefined') {
                console.error('Module not loaded:', moduleName);
                allLoaded = false;
            }
        }
        
        if (allLoaded) {
            console.log('All required modules loaded successfully');
        }
        
        return allLoaded;
    },
    
    /**
     * AppState 초기화
     */
    initializeAppState: function() {
        console.log("Initializing AppState...");
        
        if (typeof initializeAppState === 'function') {
            initializeAppState();
        }
    },
    
    /**
     * 코어 매니저들 초기화 (시청 화면 관련)
     */
    initializeCoreManagers: function() {
        console.log("Initializing Core Managers...");
        
        var initResults = {
            playerStatus: false,
            stream: false,
            infoPopup: false,
            watchUI: false,
            watchFavorite: false,
            chat: false
        };
        
        // 1. PlayerStatusManager 초기화
        if (window.PlayerStatusManager) {
            window.PlayerStatusManager.initialize();
            initResults.playerStatus = true;
            console.log("✓ PlayerStatusManager initialized");
        }
        
        // 2. StreamManager 초기화 (PlayerStatusManager에 의존)
        if (window.StreamManager) {
            initResults.stream = window.StreamManager.initialize();
            console.log(initResults.stream ? "✓ StreamManager initialized" : "✗ StreamManager failed");
        }
        
        // 3. InfoPopupManager 초기화
        if (window.InfoPopupManager) {
            window.InfoPopupManager.initialize();
            initResults.infoPopup = true;
            console.log("✓ InfoPopupManager initialized");
        }
        
        // 4. WatchUIManager 초기화
        if (window.WatchUIManager) {
            initResults.watchUI = window.WatchUIManager.initialize();
            console.log(initResults.watchUI ? "✓ WatchUIManager initialized" : "✗ WatchUIManager failed");
        }
        
        // 5. WatchFavoriteManager 초기화
        if (window.WatchFavoriteManager) {
            window.WatchFavoriteManager.initialize();
            initResults.watchFavorite = true;
            console.log("✓ WatchFavoriteManager initialized");
        }
        
        // 6. ChatManager 초기화
        if (window.ChatManager) {
            window.ChatManager.initialize();
            initResults.chat = true;
            console.log("✓ ChatManager initialized");
        }
        
        // 핵심 매니저들이 초기화되지 않으면 경고
        if (!initResults.stream || !initResults.watchUI) {
            console.error("Critical managers failed to initialize:", initResults);
        }
        
        return initResults;
    },
    
    /**
     * UI 모듈들 초기화
     */
    initializeUIModules: function() {
        console.log("Initializing UI Modules...");
        
        // 1. 리모컨 이벤트 리스너 초기화
        if (window.RemoteControl && window.RemoteControl.initialize) {
            RemoteControl.initialize();
            console.log("✓ RemoteControl initialized");
        }
        
        // 2. 검색 기능 초기화
        if (window.SearchManager && window.SearchManager.initializeSearch) {
            SearchManager.initializeSearch();
            console.log("✓ SearchManager initialized");
        }
    },
    
    /**
     * 초기 화면 표시
     */
    showInitialView: function() {
        console.log("Showing initial view...");
        
        // 초기 라이브 목록 로드
        if (window.SearchManager && window.SearchManager.showLiveList) {
            SearchManager.showLiveList();
            console.log("✓ Initial live list loaded");
        }
    },
    
    /**
     * 애플리케이션 종료 처리
     */
    cleanup: function() {
        console.log("Cleaning up application...");
        
        // 모든 매니저들의 cleanup 메서드 호출
        var managers = [
            'StreamManager',
            'InfoPopupManager',
            'WatchUIManager',
            'WatchFavoriteManager',
            'ChatManager'
        ];
        
        for (var i = 0; i < managers.length; i++) {
            var managerName = managers[i];
            var manager = window[managerName];
            if (manager && typeof manager.cleanup === 'function') {
                manager.cleanup();
                console.log("✓ " + managerName + " cleaned up");
            }
        }
    }
};

// 전역으로 노출
window.App = App;

// 기존 호환성을 위한 전역 함수 매핑
window.initializeApp = function() {
    App.initialize();
};

// 전역 변수 (레거시 호환성)
window.currentSelectedLiveData = null;

// 기존 호환성을 위한 전역 함수 매핑
window.fetchLives = function() {
    return window.ChzzkAPI ? window.ChzzkAPI.fetchLives.apply(window.ChzzkAPI, arguments) : null;
};

window.fetchSearchResults = function() {
    return window.ChzzkAPI ? window.ChzzkAPI.fetchSearchResults.apply(window.ChzzkAPI, arguments) : null;
};

window.fetchFullLiveDetails = function() {
    return window.ChzzkAPI ? window.ChzzkAPI.fetchFullLiveDetails.apply(window.ChzzkAPI, arguments) : null;
};

window.createLiveCard = function() {
    return window.CardManager ? window.CardManager.createLiveCard.apply(window.CardManager, arguments) : null;
};

window.createSearchResultCard = function() {
    return window.CardManager ? window.CardManager.createSearchResultCard.apply(window.CardManager, arguments) : null;
};

// 전역 함수들 (기존 호환성 유지)
window.fetchAndDisplayLives = function() {
    return window.SearchManager ? window.SearchManager.showLiveList.apply(window.SearchManager, arguments) : null;
};

window.fetchAndDisplaySearchResults = function() {
    return window.SearchManager ? window.SearchManager.showSearchResults.apply(window.SearchManager, arguments) : null;
};