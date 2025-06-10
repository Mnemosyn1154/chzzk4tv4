// managers/StreamManager.js (ES5 호환)

var StreamManager = (function() {
    var chzzkPlayerElement = null;
    var hlsInstance = null;
    
    function initialize() {
        chzzkPlayerElement = document.getElementById('chzzk-player');
        if (!chzzkPlayerElement) {
            console.error("StreamManager: chzzk-player element not found!");
            return false;
        }
        
        // 플레이어 이벤트 리스너 등록
        setupPlayerEventListeners();
        console.log("StreamManager initialized");
        return true;
    }
    
    function setupPlayerEventListeners() {
        if (!chzzkPlayerElement) return;
        
        chzzkPlayerElement.addEventListener('playing', function() {
            console.log("Player event: playing");
            if (window.PlayerStatusManager) {
                window.PlayerStatusManager.showLoading(false);
            }
        });
        
        chzzkPlayerElement.addEventListener('waiting', function() {
            console.log("Player event: waiting");
            if (window.PlayerStatusManager) {
                window.PlayerStatusManager.showLoading(true, '버퍼링 중...');
            }
        });
        
        chzzkPlayerElement.addEventListener('pause', function() {
            console.log("Player event: pause");
        });
        
        chzzkPlayerElement.addEventListener('ended', function() {
            console.log("Player event: ended");
            if (window.PlayerStatusManager) {
                window.PlayerStatusManager.showLoading(false);
            }
        });
        
        chzzkPlayerElement.addEventListener('error', function(e) {
            console.error("Player event: error", e);
            if (window.PlayerStatusManager) {
                window.PlayerStatusManager.showLoading(false);
                window.PlayerStatusManager.showError('비디오 재생 오류가 발생했습니다');
            }
        });
    }
    
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
            if (window.PlayerStatusManager) {
                window.PlayerStatusManager.showLoading(false);
                window.PlayerStatusManager.showError('플레이어 초기화 오류');
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
                setupHlsPlayback(streamUrl);
            } else if (chzzkPlayerElement.canPlayType('application/vnd.apple.mpegurl') || chzzkPlayerElement.canPlayType('application/x-mpegURL')) {
                console.log("HLS.js not supported, but native HLS might be. Using native playback.");
                setupNativePlayback(streamUrl);
            } else {
                console.error("HLS.js is not supported and native HLS playback also seems unsupported.");
                if (window.PlayerStatusManager) {
                    window.PlayerStatusManager.showLoading(false);
                    window.PlayerStatusManager.showError('이 기기에서는 HLS 재생이 지원되지 않습니다');
                }
                return; 
            }
        } else {
            console.error("No stream URL found for playback.");
            if (window.PlayerStatusManager) {
                window.PlayerStatusManager.showLoading(false);
                window.PlayerStatusManager.showError('방송 스트림을 찾을 수 없습니다');
            }
        }
    }
    
    function setupHlsPlayback(streamUrl) {
        if (hlsInstance) {
            hlsInstance.destroy(); 
        }
        
        hlsInstance = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            lowLatencyMode: true,
            backBufferLength: 90,
            autoStartLoad: true,
            startPosition: -1,
            debug: false,
            enableWorker: true,
            enableSoftwareAES: true,
            fragLoadingTimeOut: 20000,
            manifestLoadingTimeOut: 10000,
            levelLoadingTimeOut: 10000
        });
        
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(chzzkPlayerElement);
        
        setupHlsEventListeners();
    }
    
    function setupHlsEventListeners() {
        if (!hlsInstance) return;
        
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
            console.log("HLS.js: Manifest parsed, attempting to play.");
            if (window.PlayerStatusManager) {
                window.PlayerStatusManager.showLoading(true, '재생 준비 중...');
            }
            chzzkPlayerElement.play().then(function() {
                console.log("Video playback started via HLS.js.");
                if (window.PlayerStatusManager) {
                    window.PlayerStatusManager.showLoading(false);
                }
            }).catch(function(error) {
                console.error("Error playing video with HLS.js:", error);
                if (window.PlayerStatusManager) {
                    window.PlayerStatusManager.showLoading(false);
                    window.PlayerStatusManager.showError('스트림 재생을 시작할 수 없습니다');
                }
            });
        });
        
        hlsInstance.on(Hls.Events.BUFFER_APPENDED, function() {
            if (chzzkPlayerElement && !chzzkPlayerElement.paused) {
                if (window.PlayerStatusManager) {
                    window.PlayerStatusManager.showLoading(false);
                }
            }
        });
        
        hlsInstance.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS.js Error:', data);
            
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log("HLS.js: 네트워크 오류 - 재시도 중...");
                        if (window.PlayerStatusManager) {
                            window.PlayerStatusManager.showError('네트워크 오류 - 재연결 중...');
                        }
                        setTimeout(function() {
                            if(hlsInstance) {
                                hlsInstance.startLoad();
                            }
                        }, 1000);
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log("HLS.js: 미디어 오류 - 복구 시도 중...");
                        if (window.PlayerStatusManager) {
                            window.PlayerStatusManager.showError('미디어 오류 - 복구 중...');
                        }
                        setTimeout(function() {
                            if(hlsInstance) {
                                hlsInstance.recoverMediaError();
                            }
                        }, 1000);
                        break;
                    default:
                        console.error("HLS.js: 복구 불가능한 치명적 오류");
                        if (window.PlayerStatusManager) {
                            window.PlayerStatusManager.showError('재생 불가능 - 나중에 다시 시도해주세요');
                        }
                        if (hlsInstance) {
                            hlsInstance.destroy();
                            hlsInstance = null;
                        }
                        break;
                }
            } else {
                if (data.details !== 'bufferStalledError' && 
                    data.details !== 'bufferNudgeOnStall' && 
                    data.details !== 'bufferSeekOverHole') {
                    console.warn('HLS.js: 복구 가능한 오류:', data.details);
                }
                
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    if (window.PlayerStatusManager) {
                        window.PlayerStatusManager.showLoading(true, '네트워크 재연결 중...');
                    }
                    setTimeout(function() {
                        if (window.PlayerStatusManager) {
                            window.PlayerStatusManager.showLoading(false);
                        }
                    }, 2000);
                }
            }
        });
    }
    
    function setupNativePlayback(streamUrl) {
        chzzkPlayerElement.src = streamUrl;
        chzzkPlayerElement.addEventListener('loadedmetadata', function() {
             chzzkPlayerElement.play().then(function() {
                console.log("Video playback started (native HLS).");
                if (window.PlayerStatusManager) {
                    window.PlayerStatusManager.showLoading(false);
                }
            }).catch(function(error) {
                console.error("Error playing video (native HLS):", error);
                if (window.PlayerStatusManager) {
                    window.PlayerStatusManager.showLoading(false);
                    window.PlayerStatusManager.showError('네이티브 HLS 재생 오류');
                }
            });
        });
         chzzkPlayerElement.load(); 
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
        if (window.PlayerStatusManager) {
            window.PlayerStatusManager.showLoading(false);
            window.PlayerStatusManager.hide();
        }
    }
    
    return {
        initialize: initialize,
        initAndPlayStream: initAndPlayStream,
        stopPlayer: stopPlayer
    };
})();

// 전역으로 노출
window.StreamManager = StreamManager; 