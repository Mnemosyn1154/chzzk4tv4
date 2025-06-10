// managers/InfoPopupManager.js (ES5 호환)

var InfoPopupManager = (function() {
    var watchInfoPanelContainerElement = null;
    var infoPopupTimer = null;
    var isInfoPopupCurrentlyVisible = false;
    
    function initialize() {
        watchInfoPanelContainerElement = document.getElementById('watch-info-panel');
        if (!watchInfoPanelContainerElement) {
            console.warn("InfoPopupManager: watch-info-panel element not found");
        }
        console.log("InfoPopupManager initialized");
    }
    
    function showInfoPopup() {
        if (!watchInfoPanelContainerElement) return;
        
        // 이미 표시되어 있으면 타이머만 리셋
        if (isInfoPopupCurrentlyVisible) {
            console.log('팝업 이미 표시됨 - 타이머만 리셋');
            if (infoPopupTimer) {
                clearTimeout(infoPopupTimer);
            }
            infoPopupTimer = setTimeout(function() {
                hideInfoPopup();
            }, 4000);
            return;
        }
        
        watchInfoPanelContainerElement.classList.add('visible');
        isInfoPopupCurrentlyVisible = true;
        
        if (infoPopupTimer) {
            clearTimeout(infoPopupTimer);
        }
        
        infoPopupTimer = setTimeout(function() {
            hideInfoPopup();
        }, 4000);
        
        console.log('팝업 표시됨');
    }
    
    function hideInfoPopup() {
        if (!watchInfoPanelContainerElement) return;
        
        // 이미 숨겨져 있으면 중복 처리 방지
        if (!isInfoPopupCurrentlyVisible) {
            console.log('팝업 이미 숨김 상태');
            return;
        }
        
        watchInfoPanelContainerElement.classList.remove('visible');
        isInfoPopupCurrentlyVisible = false;
        
        if (infoPopupTimer) {
            clearTimeout(infoPopupTimer);
            infoPopupTimer = null;
        }
        
        console.log('팝업 숨김');
    }
    
    function isPopupVisible() {
        return isInfoPopupCurrentlyVisible;
    }
    
    function cleanup() {
        hideInfoPopup();
        if (infoPopupTimer) {
            clearTimeout(infoPopupTimer);
            infoPopupTimer = null;
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