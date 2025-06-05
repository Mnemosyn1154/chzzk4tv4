// ui/watchScreen.js (ES5 호환)

// 전역으로 사용할 시청 화면 관련 요소들 (필요시)
var watchSectionElement;
var watchInfoPanelElements;
var watchInfoPanelContainerElement;
var chzzkPlayerElement;
var playerStatusOverlayElement;
var infoPopupTimer = null;
var hlsInstance = null; // HLS.js 인스턴스를 저장할 변수

// Helper function to get HLS stream URL from livePlaybackJson
function getStreamUrlFromJson(jsonString) {
    if (!jsonString) return null;
    try {
        var playbackData = JSON.parse(jsonString);
        if (playbackData && playbackData.media && Array.isArray(playbackData.media)) {
            var hlsStream = playbackData.media.find(function(m) {
                return m.protocol === 'HLS' || m.mediaFormat === 'HLS';
            });
            if (hlsStream && hlsStream.path) {
                console.log("Extracted HLS URL:", hlsStream.path);
                return hlsStream.path;
            }
        }
        console.warn("Could not find HLS stream URL in playback JSON:", playbackData);
        return null;
    } catch (error) {
        console.error("Error parsing livePlaybackJson:", error, jsonString);
        return null;
    }
}

function initAndPlayStream(broadcastData) {
    if (!chzzkPlayerElement || !broadcastData) {
        console.error("Player element or broadcast data missing.");
        showPlayerLoading(false);
        if(playerStatusOverlayElement) {
            playerStatusOverlayElement.textContent = '플레이어 오류';
            playerStatusOverlayElement.style.display = 'block';
        }
        return;
    }

    var streamUrl = null;
    var playbackJson = broadcastData.livePlaybackJson ||
                       (broadcastData.channel && broadcastData.channel.livePlayback && broadcastData.channel.livePlayback.livePlaybackJson) ||
                       broadcastData.livePlayback; 

    if (typeof playbackJson === 'string') {
        streamUrl = getStreamUrlFromJson(playbackJson);
    } else if (typeof playbackJson === 'object' && playbackJson !== null) { 
         if (playbackJson.media && Array.isArray(playbackJson.media)) {
            var hlsStream = playbackJson.media.find(function(m) {
                return m.protocol === 'HLS' || m.mediaFormat === 'HLS';
            });
             if (hlsStream && hlsStream.path) streamUrl = hlsStream.path;
         }
    }

    if (streamUrl) {
        if (Hls.isSupported()) {
            console.log("HLS.js is supported. Using HLS.js to play the stream.");
            if (hlsInstance) {
                hlsInstance.destroy(); 
            }
            hlsInstance = new Hls({
                maxBufferLength: 45,    
                maxMaxBufferLength: 900, 
                autoStartLoad: true,    
                startPosition: -1,      
                debug: false // 디버그 로그 비활성화
            });
            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(chzzkPlayerElement);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
                console.log("HLS.js: Manifest parsed, attempting to play.");
                chzzkPlayerElement.play().then(function() {
                    console.log("Video playback started via HLS.js.");
                    showPlayerLoading(false);
                }).catch(function(error) {
                    console.error("Error playing video with HLS.js:", error);
                    showPlayerLoading(false);
                    if(playerStatusOverlayElement) {
                        playerStatusOverlayElement.textContent = 'HLS.js 재생 오류';
                        playerStatusOverlayElement.style.display = 'block';
                    }
                });
            });
            hlsInstance.on(Hls.Events.ERROR, function(event, data) {
                console.error('HLS.js Error:', event, data); 
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error("HLS.js: fatal network error encountered, trying to recover");
                            if(hlsInstance) hlsInstance.startLoad(); 
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error("HLS.js: fatal media error encountered, trying to recover");
                            if(hlsInstance) hlsInstance.recoverMediaError();
                            break;
                        default:
                            console.error("HLS.js: an fatal error occurred, unrecoverable");
                            if (hlsInstance) hlsInstance.destroy();
                            hlsInstance = null;
                            break;
                    }
                }
                if(playerStatusOverlayElement) {
                    var errorMsg = 'HLS 재생 중 오류 발생';
                    if (data.details) {
                        errorMsg = 'HLS 오류: ' + data.details;
                    } else if (data.type) {
                        errorMsg = 'HLS 오류 타입: ' + data.type;
                    }
                    playerStatusOverlayElement.textContent = errorMsg;
                    playerStatusOverlayElement.style.display = 'block';
                }
            });
        } else if (chzzkPlayerElement.canPlayType('application/vnd.apple.mpegurl') || chzzkPlayerElement.canPlayType('application/x-mpegURL')) {
            console.log("HLS.js not supported, but native HLS might be. Using native playback.");
            chzzkPlayerElement.src = streamUrl;
            chzzkPlayerElement.addEventListener('loadedmetadata', function() {
                 chzzkPlayerElement.play().then(function() {
                    console.log("Video playback started (native HLS).");
                    showPlayerLoading(false);
                }).catch(function(error) {
                    console.error("Error playing video (native HLS):", error);
                     showPlayerLoading(false);
                    if(playerStatusOverlayElement) {
                        playerStatusOverlayElement.textContent = '네이티브 HLS 재생 오류';
                        playerStatusOverlayElement.style.display = 'block';
                    }
                });
            });
             chzzkPlayerElement.load(); 
        } else {
            console.error("HLS.js is not supported and native HLS playback also seems unsupported.");
            showPlayerLoading(false);
            if(playerStatusOverlayElement) {
                playerStatusOverlayElement.textContent = 'HLS 재생 불가';
                playerStatusOverlayElement.style.display = 'block';
            }
            return; 
        }
    } else {
        console.error("No stream URL found for playback.");
        showPlayerLoading(false);
        if(playerStatusOverlayElement) {
            playerStatusOverlayElement.textContent = '방송 URL 없음';
            playerStatusOverlayElement.style.display = 'block';
        }
    }
}

function stopPlayer() {
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
        console.log("HLS.js instance destroyed.");
    }
    if (chzzkPlayerElement) {
        chzzkPlayerElement.pause();
        chzzkPlayerElement.removeAttribute('src'); 
        chzzkPlayerElement.load(); 
        console.log("Video playback stopped and player reset.");
    }
    showPlayerLoading(false); 
    if (playerStatusOverlayElement) playerStatusOverlayElement.style.display = 'none';
}

// DOMContentLoaded 시점에 주요 요소들 초기화
document.addEventListener('DOMContentLoaded', function() {
    watchSectionElement = document.getElementById('watch-section');
    watchInfoPanelContainerElement = document.getElementById('watch-info-panel');

    watchInfoPanelElements = {
        thumbnail: document.getElementById('watch-channel-thumbnail'),
        title: document.getElementById('watch-title'),
        streamerName: document.getElementById('watch-streamer-name'),
        category: document.getElementById('watch-category'),
        viewerCount: document.getElementById('watch-viewer-count'),
        description: document.getElementById('watch-description')
    };

    chzzkPlayerElement = document.getElementById('chzzk-player');
    playerStatusOverlayElement = document.getElementById('player-status-overlay');

    if (!watchSectionElement || !chzzkPlayerElement || !watchInfoPanelContainerElement) {
        console.error("Watch screen critical elements not found!");
    }

    if (chzzkPlayerElement) {
        chzzkPlayerElement.addEventListener('playing', function() {
            console.log("Player event: playing");
            showPlayerLoading(false);
        });
        chzzkPlayerElement.addEventListener('waiting', function() {
            console.log("Player event: waiting");
            showPlayerLoading(true);
        });
        chzzkPlayerElement.addEventListener('pause', function() {
            console.log("Player event: pause");
        });
        chzzkPlayerElement.addEventListener('ended', function() {
            console.log("Player event: ended");
            showPlayerLoading(false);
        });
        chzzkPlayerElement.addEventListener('error', function(e) {
            console.error("Player event: error", e);
            showPlayerLoading(false);
            if (playerStatusOverlayElement) {
                playerStatusOverlayElement.textContent = '비디오 재생 오류';
                playerStatusOverlayElement.style.display = 'block';
            }
        });
    }
});

function formatStartTime(isoString) {
    if (!isoString) return "시작 시간 정보 없음";
    try {
        var date = new Date(isoString);
        var hours = date.getHours().toString().padStart(2, '0');
        var minutes = date.getMinutes().toString().padStart(2, '0');
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
        if (watchInfoPanelElements.title) {
            var title = data.liveTitle || (data.channel && data.channel.channelName) || "제목 없음";
            watchInfoPanelElements.title.textContent = title;
        }

        if (watchInfoPanelElements.streamerName) {
            var streamerName = (data.channel && data.channel.channelName) || data.channelName || "스트리머 정보 없음";
            watchInfoPanelElements.streamerName.textContent = streamerName;
        }

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

function showInfoPopup() {
    if (!watchInfoPanelContainerElement) return;
    
    watchInfoPanelContainerElement.classList.add('visible');
    
    if (infoPopupTimer) {
        clearTimeout(infoPopupTimer);
    }
    
    infoPopupTimer = setTimeout(function() {
        hideInfoPopup();
    }, 4000);
}

function hideInfoPopup() {
    if (!watchInfoPanelContainerElement) return;
    
    watchInfoPanelContainerElement.classList.remove('visible');
    
    if (infoPopupTimer) {
        clearTimeout(infoPopupTimer);
        infoPopupTimer = null;
    }
}

function showWatchScreen(broadcastData) {
    console.log("Showing watch screen with data:", broadcastData);
    
    if (!watchSectionElement) {
        console.error("Watch section element not found!");
        return;
    }

    watchSectionElement.style.display = 'flex';
    
    var searchSection = document.getElementById('search-section');
    if (searchSection) searchSection.style.display = 'none';
    
    populateWatchInfo(broadcastData);
    
    showPlayerLoading(true);
    initAndPlayStream(broadcastData);
    
    setTimeout(function() {
        showInfoPopup();
    }, 500);
}

function hideWatchScreen() {
    console.log("Hiding watch screen");
    
    stopPlayer();
    hideInfoPopup();
    
    if (watchSectionElement) {
        watchSectionElement.style.display = 'none';
    }
    
    var searchSection = document.getElementById('search-section');
    if (searchSection) searchSection.style.display = 'block';
}

function showPlayerLoading(isLoading) {
    if (!playerStatusOverlayElement) return;
    
    if (isLoading) {
        playerStatusOverlayElement.textContent = '로딩 중...';
        playerStatusOverlayElement.style.display = 'block';
    } else {
        playerStatusOverlayElement.style.display = 'none';
    }
}

// WebOS 비디오 플레이어 연동 부분은 여기에 추가될 예정
// function initAndPlayStream(streamUrl) { ... }
// function stopPlayer() { ... } 