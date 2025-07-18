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
        
        // TV 환경 감지
        this.detectTVEnvironment();
        
        // 1. 모든 필수 모듈이 로드되었는지 확인
        if (!this.checkRequiredModules()) {
            console.error('Critical: Required modules are not loaded!');
            return;
        }
        
        // 2. AppState 초기화
        this.initializeAppState();
        
        // 3. 모든 이벤트 바인딩 설정
        this.bindEvents();
        
        // 4. 코어 매니저들 초기화 (시청 화면 관련)
        this.initializeCoreManagers();
        
        // 5. UI 모듈들 초기화
        this.initializeUIModules();
        
        // 6. TV 환경인 경우 추가 대기 시간
        var self = this;
        if (window.isWebOSTV) {
            console.log("[TV] Delaying initial view for TV rendering...");
            setTimeout(function() {
                self.showInitialView();
                // 강제 리플로우
                self.forceReflow();
            }, 300);
        } else {
            this.showInitialView();
        }
        
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
     * 모든 이벤트 바인딩을 중앙에서 관리
     */
    bindEvents: function() {
        console.log("Binding all event handlers...");
        
        // Navigation 이벤트
        AppMediator.subscribe('navigation:initializeFocus', function() {
            if (window.Navigation && window.Navigation.initializeFocus) {
                window.Navigation.initializeFocus();
            }
        });
        
        AppMediator.subscribe('navigation:setFocus', function(data) {
            if (window.Navigation && window.Navigation.setFocus && data && typeof data.index === 'number') {
                window.Navigation.setFocus(data.index);
            }
        });
        
        AppMediator.subscribe('navigation:selectCard', function(data) {
            if (window.Navigation && window.Navigation.selectCard && data && data.card) {
                window.Navigation.selectCard(data.card);
            }
        });
        
        // SearchManager 이벤트
        AppMediator.subscribe('search:showLiveList', function() {
            if (window.SearchManager && window.SearchManager.showLiveList) {
                window.SearchManager.showLiveList();
            }
        });
        
        AppMediator.subscribe('search:refreshLiveList', function() {
            if (window.SearchManager && window.SearchManager.refreshLiveList) {
                window.SearchManager.refreshLiveList();
            }
        });
        
        // ChatManager 이벤트
        AppMediator.subscribe('chat:initializeWatch', function() {
            if (window.ChatManager && window.ChatManager.initializeWatchChat) {
                window.ChatManager.initializeWatchChat();
            }
        });
        
        AppMediator.subscribe('chat:startWatch', function(chatDetails) {
            if (window.ChatManager && window.ChatManager.startWatchChat) {
                window.ChatManager.startWatchChat(chatDetails);
            }
        });
        
        AppMediator.subscribe('chat:disconnect', function() {
            if (window.ChatManager && window.ChatManager.disconnectChat) {
                window.ChatManager.disconnectChat();
            }
        });
        
        AppMediator.subscribe('chat:hidePanel', function() {
            if (window.ChatManager && window.ChatManager.hideChatPanel) {
                window.ChatManager.hideChatPanel();
            }
        });
        
        AppMediator.subscribe('chat:showPanel', function() {
            if (window.ChatManager && window.ChatManager.showChatPanel) {
                window.ChatManager.showChatPanel();
            }
        });
        
        AppMediator.subscribe('chat:togglePanel', function() {
            if (window.ChatManager && window.ChatManager.toggleChatPanel) {
                window.ChatManager.toggleChatPanel();
            }
        });
        
        AppMediator.subscribe('chat:setArrowFocus', function(data) {
            if (window.ChatManager && window.ChatManager.setArrowFocus && data && typeof data.focused !== 'undefined') {
                window.ChatManager.setArrowFocus(data.focused);
            }
        });
        
        AppMediator.subscribe('chat:hideToggleArrow', function() {
            if (window.ChatManager && window.ChatManager.hideChatToggleArrow) {
                window.ChatManager.hideChatToggleArrow();
            }
        });
        
        // AppState 이벤트
        AppMediator.subscribe('chat:visibilityChanged', function(data) {
            if (data && typeof data.isVisible !== 'undefined') {
                AppState.ui.isChatPanelVisible = data.isVisible;
                console.log('AppState: 채팅창 표시 상태 업데이트:', data.isVisible);
            }
        });
        
        // PlayerStatusManager 이벤트
        AppMediator.subscribe('player:statusChange', function(data) {
            if (!window.PlayerStatusManager || !data) return;
            
            console.log('[Player Status] Event received:', data);
            
            if (data.hide) {
                window.PlayerStatusManager.hide();
            } else if (data.isError) {
                window.PlayerStatusManager.showError(data.message || '알 수 없는 오류');
            } else if (data.hasOwnProperty('isLoading')) {
                // isLoading이 명시적으로 false일 때도 처리
                window.PlayerStatusManager.showLoading(
                    data.isLoading,
                    data.message || '로딩 중...'
                );
            }
        });
        
        // InfoPopupManager 이벤트
        AppMediator.subscribe('infopopup:show', function() {
            if (window.InfoPopupManager && window.InfoPopupManager.showInfoPopup) {
                window.InfoPopupManager.showInfoPopup();
            }
        });
        
        AppMediator.subscribe('infopopup:hide', function() {
            if (window.InfoPopupManager && window.InfoPopupManager.hideInfoPopup) {
                window.InfoPopupManager.hideInfoPopup();
            }
        });
        
        // WatchUIManager 이벤트
        AppMediator.subscribe('watchui:show', function() {
            if (window.WatchUIManager && window.WatchUIManager.showWatchScreen) {
                window.WatchUIManager.showWatchScreen();
            }
        });
        
        AppMediator.subscribe('watchui:populate', function(broadcastData) {
            if (window.WatchUIManager && window.WatchUIManager.populateWatchInfo) {
                window.WatchUIManager.populateWatchInfo(broadcastData);
            }
        });
        
        AppMediator.subscribe('watchui:hide', function() {
            if (window.WatchUIManager && window.WatchUIManager.hideWatchScreen) {
                window.WatchUIManager.hideWatchScreen();
            }
        });
        
        console.log("✓ All events bound successfully");
    },
    
    /**
     * TV 환경 감지 및 설정
     */
    detectTVEnvironment: function() {
        window.isWebOSTV = typeof webOS !== 'undefined';
        
        if (window.isWebOSTV) {
            // body에 클래스 추가 (CSS 선택자용)
            document.body.classList.add('webos-tv');
            
            console.log("[TV Debug] WebOS TV detected");
            console.log("[TV Debug] Screen size:", screen.width, "x", screen.height);
            console.log("[TV Debug] Window size:", window.innerWidth, "x", window.innerHeight);
            console.log("[TV Debug] Device pixel ratio:", window.devicePixelRatio || 1);
            
            // WebOS 디바이스 정보 가져오기
            if (webOS.deviceInfo) {
                webOS.deviceInfo(function(device) {
                    console.log("[TV Debug] Device info:", device);
                });
            }
        }
    },
    
    /**
     * 강제 리플로우 - TV 렌더링 문제 해결
     */
    forceReflow: function() {
        var containers = [
            document.getElementById('live-stream-list-container'),
            document.getElementById('search-results-container')
        ];
        
        for (var i = 0; i < containers.length; i++) {
            if (containers[i]) {
                // 강제 리플로우 트리거
                containers[i].style.display = 'none';
                containers[i].offsetHeight; // 리플로우 강제
                containers[i].style.display = '';
                
                console.log("[TV Debug] Forced reflow for:", containers[i].id);
            }
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