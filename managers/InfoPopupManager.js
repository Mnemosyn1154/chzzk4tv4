// managers/InfoPopupManager.js (ES5 호환)

var InfoPopupManager = (function() {
    var watchInfoPanelContainerElement = null;
    // infoPopupTimer와 isInfoPopupCurrentlyVisible는 이제 AppState에서 관리
    
    function initialize() {
        watchInfoPanelContainerElement = document.getElementById('watch-info-panel');
        if (!watchInfoPanelContainerElement) {
            console.warn("InfoPopupManager: watch-info-panel element not found");
        }
        
        // AppMediator 이벤트 구독
        AppMediator.subscribe('infopopup:show', function() {
            showInfoPopup();
        });
        
        AppMediator.subscribe('infopopup:hide', function() {
            hideInfoPopup();
        });
        
        console.log("InfoPopupManager initialized");
    }
    
    function showInfoPopup() {
        if (!watchInfoPanelContainerElement) return;
        
        // 이미 표시되어 있으면 타이머만 리셋
        if (AppState.ui.isInfoPopupVisible) {
            console.log('팝업 이미 표시됨 - 타이머만 리셋');
            if (AppState.ui.infoPopupTimer) {
                clearTimeout(AppState.ui.infoPopupTimer);
            }
            AppState.ui.infoPopupTimer = setTimeout(function() {
                hideInfoPopup();
            }, 4000);
            return;
        }
        
        watchInfoPanelContainerElement.classList.add('visible');
        AppState.ui.isInfoPopupVisible = true;
        
        // 가시성 변경 이벤트 발행
        AppMediator.publish('infopopup:visibilityChanged', { visible: true });
        
        if (AppState.ui.infoPopupTimer) {
            clearTimeout(AppState.ui.infoPopupTimer);
        }
        
        AppState.ui.infoPopupTimer = setTimeout(function() {
            hideInfoPopup();
        }, 4000);
        
        console.log('팝업 표시됨');
    }
    
    function hideInfoPopup() {
        if (!watchInfoPanelContainerElement) return;
        
        // 이미 숨겨져 있으면 중복 처리 방지
        if (!AppState.ui.isInfoPopupVisible) {
            console.log('팝업 이미 숨김 상태');
            return;
        }
        
        watchInfoPanelContainerElement.classList.remove('visible');
        AppState.ui.isInfoPopupVisible = false;
        
        // 가시성 변경 이벤트 발행
        AppMediator.publish('infopopup:visibilityChanged', { visible: false });
        
        if (AppState.ui.infoPopupTimer) {
            clearTimeout(AppState.ui.infoPopupTimer);
            AppState.ui.infoPopupTimer = null;
        }
        
        console.log('팝업 숨김');
    }
    
    function isPopupVisible() {
        return AppState.ui.isInfoPopupVisible;
    }
    
    function cleanup() {
        hideInfoPopup();
        if (AppState.ui.infoPopupTimer) {
            clearTimeout(AppState.ui.infoPopupTimer);
            AppState.ui.infoPopupTimer = null;
        }
    }
    
    return {
        initialize: initialize,
        showInfoPopup: showInfoPopup,
        hideInfoPopup: hideInfoPopup,
        isPopupVisible: isPopupVisible,
        cleanup: cleanup
    };
})();

// 전역으로 노출
window.InfoPopupManager = InfoPopupManager; 