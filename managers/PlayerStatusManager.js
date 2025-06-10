// managers/PlayerStatusManager.js (ES5 호환)

var PlayerStatusManager = (function() {
    var playerStatusOverlayElement = null;
    
    function initialize() {
        playerStatusOverlayElement = document.getElementById('player-status-overlay');
        if (!playerStatusOverlayElement) {
            console.warn("PlayerStatusManager: player-status-overlay element not found");
        }
        console.log("PlayerStatusManager initialized");
    }
    
    function showLoading(isLoading, message) {
        if (!playerStatusOverlayElement) return;
        
        if (isLoading) {
            var loadingMessage = message || '스트림 연결 중...';
            playerStatusOverlayElement.textContent = loadingMessage;
            playerStatusOverlayElement.style.display = 'block';
        } else {
            playerStatusOverlayElement.style.display = 'none';
        }
    }
    
    function showError(errorMessage) {
        if (!playerStatusOverlayElement) return;
        
        playerStatusOverlayElement.textContent = errorMessage || '재생 오류';
        playerStatusOverlayElement.style.display = 'block';
        
        // 5초 후 자동으로 숨김
        setTimeout(function() {
            if (playerStatusOverlayElement.style.display === 'block') {
                playerStatusOverlayElement.style.display = 'none';
            }
        }, 5000);
    }
    
    function hide() {
        if (playerStatusOverlayElement) {
            playerStatusOverlayElement.style.display = 'none';
        }
    }
    
    return {
        initialize: initialize,
        showLoading: showLoading,
        showError: showError,
        hide: hide
    };
})();

// 전역으로 노출
window.PlayerStatusManager = PlayerStatusManager; 