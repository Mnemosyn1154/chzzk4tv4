// managers/WatchUIManager.js (ES5 호환)

var WatchUIManager = (function() {
    var watchSectionElement = null;
    var watchInfoPanelElements = null;
    
    function initialize() {
        watchSectionElement = document.getElementById('watch-section');
        
        watchInfoPanelElements = {
            thumbnail: document.getElementById('watch-channel-thumbnail'),
            title: document.getElementById('watch-title'),
            streamerName: document.getElementById('watch-streamer-name'),
            category: document.getElementById('watch-category'),
            viewerCount: document.getElementById('watch-viewer-count'),
            description: document.getElementById('watch-description')
        };

        if (!watchSectionElement) {
            console.error("WatchUIManager: watch-section element not found!");
            return false;
        }
        
        console.log("WatchUIManager initialized");
        return true;
    }
    
    function formatStartTime(isoString) {
        if (!isoString) return "시작 시간 정보 없음";
        try {
            var date = new Date(isoString);
            var hours = date.getHours().toString();
            var minutes = date.getMinutes().toString();
            // ES5 호환: padStart 대신 조건문 사용
            if (hours.length === 1) hours = '0' + hours;
            if (minutes.length === 1) minutes = '0' + minutes;
            return hours + ':' + minutes + ' 시작';
        } catch (error) {
            console.error("Error formatting start time:", error);
            return "시작 시간 정보 없음";
        }
    }
    
    function populateWatchInfo(data) {
        if (!data) {
            console.warn("No data provided to populateWatchInfo");
            return;
        }

        try {
            // 방송 제목
            if (watchInfoPanelElements.title) {
                var title = data.liveTitle || (data.channel && data.channel.channelName) || "제목 없음";
                watchInfoPanelElements.title.textContent = title;
            }

            // 스트리머 이름
            if (watchInfoPanelElements.streamerName) {
                var streamerName = (data.channel && data.channel.channelName) || data.channelName || "스트리머 정보 없음";
                watchInfoPanelElements.streamerName.textContent = streamerName;
            }

            // 채널 썸네일
            if (watchInfoPanelElements.thumbnail) {
                var thumbnailUrl = null;
                if (data.channel && data.channel.channelImageUrl) {
                    thumbnailUrl = data.channel.channelImageUrl;
                } else if (data.channelImageUrl) {
                    thumbnailUrl = data.channelImageUrl;
                }
                
                if (thumbnailUrl) {
                    watchInfoPanelElements.thumbnail.src = thumbnailUrl;
                    watchInfoPanelElements.thumbnail.style.display = 'block';
                } else {
                    watchInfoPanelElements.thumbnail.style.display = 'none';
                }
            }

            // 시청자 수와 시작 시간
            if (watchInfoPanelElements.viewerCount) {
                var viewerCount = data.concurrentUserCount || (data.channel && data.channel.followerCount) || 0;
                var startTime = data.openDate || data.liveOpenDate || null;
                var startTimeFormatted = formatStartTime(startTime);
                
                var viewerText = '시청자 ' + viewerCount.toLocaleString() + '명';
                var combinedText = '<span class="viewer-count-main">' + viewerText + '</span> <span class="start-time-sub">' + startTimeFormatted + '</span>';
                watchInfoPanelElements.viewerCount.innerHTML = combinedText;
            }

            console.log("Watch info populated successfully");
        } catch (error) {
            console.error("Error populating watch info:", error);
        }
    }
    
    function showWatchScreen() {
        if (!watchSectionElement) {
            console.error("Watch section element not found!");
            return false;
        }

        // UI 변경을 먼저 수행 (즉시 반응)
        watchSectionElement.style.display = 'flex';
        
        var searchSection = document.getElementById('search-section');
        if (searchSection) searchSection.style.display = 'none';
        
        return true;
    }
    
    function hideWatchScreen() {
        console.log("Hiding watch screen UI");
        
        if (watchSectionElement) {
            watchSectionElement.style.display = 'none';
        }
        
        var searchSection = document.getElementById('search-section');
        if (searchSection) searchSection.style.display = 'block';
    }
    
    return {
        initialize: initialize,
        populateWatchInfo: populateWatchInfo,
        showWatchScreen: showWatchScreen,
        hideWatchScreen: hideWatchScreen
    };
})();

// 전역으로 노출
window.WatchUIManager = WatchUIManager; 