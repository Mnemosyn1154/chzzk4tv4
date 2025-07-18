// managers/StreamManager.js (ES5 호환)

var StreamManager = (function() {
    var chzzkPlayerElement = null;
    var hlsInstance = null;
    var liveSyncInterval = null;
    var playbackRateInterval = null;
    
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
            AppMediator.publish('player:statusChange', { isLoading: false });
            // 추가 확인을 위해 지연 후 다시 한번 발송
            setTimeout(function() {
                if (!chzzkPlayerElement.paused && !chzzkPlayerElement.seeking) {
                    console.log("Player confirmed playing");
                    AppMediator.publish('player:statusChange', { isLoading: false });
                }
            }, 500);
        });
        
        chzzkPlayerElement.addEventListener('waiting', function() {
            console.log("Player event: waiting");
            AppMediator.publish('player:statusChange', { isLoading: true, message: '버퍼링 중...' });
        });
        
        chzzkPlayerElement.addEventListener('pause', function() {
            console.log("Player event: pause");
        });
        
        chzzkPlayerElement.addEventListener('ended', function() {
            console.log("Player event: ended");
            AppMediator.publish('player:statusChange', { isLoading: false });
        });
        
        chzzkPlayerElement.addEventListener('error', function(e) {
            console.error("Player event: error", e);
            AppMediator.publish('player:statusChange', { isLoading: false });
            AppMediator.publish('player:statusChange', { isError: true, message: '비디오 재생 오류가 발생했습니다' });
        });
    }
    
    
    // Helper function to get HLS stream URL from livePlaybackJson
    function getStreamUrlFromJson(jsonString) {
        if (!jsonString) return null;
        try {
            var playbackData = JSON.parse(jsonString);
            if (playbackData && playbackData.media && Array.isArray(playbackData.media)) {
                // ES5 호환: .find() 대신 for loop 사용
                var hlsStream = null;
                for (var i = 0; i < playbackData.media.length; i++) {
                    var m = playbackData.media[i];
                    if (m.protocol === 'HLS' || m.mediaFormat === 'HLS') {
                        hlsStream = m;
                        break;
                    }
                }
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
            AppMediator.publish('player:statusChange', { isLoading: false });
            AppMediator.publish('player:statusChange', { isError: true, message: '플레이어 초기화 오류' });
            return;
        }
        
        // WebOS TV 특화 최적화
        if (window.isWebOSTV) {
            console.log('[WebOS TV] Applying TV-specific optimizations');
            
            // 프리로드 비활성화로 메모리 절약
            chzzkPlayerElement.preload = 'none';
            
            // 비디오 디코더 최적화
            chzzkPlayerElement.setAttribute('x-webkit-airplay', 'allow');
            
            // TV에서 자동재생 활성화
            chzzkPlayerElement.setAttribute('autoplay', '');
            chzzkPlayerElement.setAttribute('playsinline', '');
            
            // 메모리 관리를 위한 속성
            chzzkPlayerElement.setAttribute('disableRemotePlayback', '');
        }

        var streamUrl = null;
        var playbackJson = broadcastData.livePlaybackJson ||
                           (broadcastData.channel && broadcastData.channel.livePlayback && broadcastData.channel.livePlayback.livePlaybackJson) ||
                           broadcastData.livePlayback; 

        if (typeof playbackJson === 'string') {
            streamUrl = getStreamUrlFromJson(playbackJson);
        } else if (typeof playbackJson === 'object' && playbackJson !== null) { 
             if (playbackJson.media && Array.isArray(playbackJson.media)) {
                // ES5 호환: .find() 대신 for loop 사용
                var hlsStream = null;
                for (var j = 0; j < playbackJson.media.length; j++) {
                    var m = playbackJson.media[j];
                    if (m.protocol === 'HLS' || m.mediaFormat === 'HLS') {
                        hlsStream = m;
                        break;
                    }
                }
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
                AppMediator.publish('player:statusChange', { isLoading: false });
                AppMediator.publish('player:statusChange', { isError: true, message: '이 기기에서는 HLS 재생이 지원되지 않습니다' });
                return; 
            }
        } else {
            console.error("No stream URL found for playback.");
            AppMediator.publish('player:statusChange', { isLoading: false });
            AppMediator.publish('player:statusChange', { isError: true, message: '방송 스트림을 찾을 수 없습니다' });
        }
    }
    
    var bufferingTimeout = null;
    
    function setupHlsPlayback(streamUrl) {
        if (hlsInstance) {
            hlsInstance.destroy(); 
        }
        
        // 최적화된 고정 HLS 설정 - 안정성과 지연 시간의 균형
        var hlsConfig = {
            // 버퍼 설정 - 안정성을 위해 더 크게 설정
            maxBufferLength: 8,              // 기본 버퍼 길이 (8초)
            maxMaxBufferLength: 20,          // 최대 버퍼 길이 (20초)
            maxBufferSize: 35 * 1000 * 1000, // 최대 버퍼 크기 (35MB)
            maxBufferHole: 0.5,              // 버퍼 홀 허용치
            
            // 라이브 스트리밍 설정
            lowLatencyMode: true,            // 저지연 모드 활성화
            backBufferLength: 15,            // 이전 버퍼 보존 (15초)
            liveSyncDurationCount: 2,        // 라이브 동기화 세그먼트 수
            liveMaxLatencyDurationCount: 6,  // 최대 허용 지연
            targetLatency: 8,                // 목표 지연 시간 (8초)
            
            // 성능 및 네트워크 설정
            startPosition: -1,               // 라이브 엣지에서 시작
            liveDurationInfinity: true,      // 무한 라이브 스트림
            autoStartLoad: true,             // 자동 로드 시작
            enableWorker: true,              // 워커 사용 (성능 향상)
            progressive: true,               // 프로그레시브 로딩
            testBandwidth: true,             // 대역폭 테스트
            enableSoftwareAES: true,         // 소프트웨어 AES
            
            // 타임아웃 설정 - 네트워크 불안정성 고려
            fragLoadingTimeOut: 20000,       // 프래그먼트 로드 타임아웃 (20초)
            manifestLoadingTimeOut: 10000,   // 매니페스트 로드 타임아웃 (10초)
            levelLoadingTimeOut: 10000,      // 레벨 로드 타임아웃 (10초)
            
            // ABR 설정 - 자동 화질 조절
            abrEwmaFastLive: 3.0,           // 빠른 EWMA 가중치
            abrEwmaSlowLive: 9.0,           // 느린 EWMA 가중치
            abrBandWidthFactor: 0.9,        // 대역폭 사용 비율
            abrBandWidthUpFactor: 0.7,      // 대역폭 상향 조정 비율
            
            debug: false
        };
        
        console.log('[StreamManager] Optimized HLS configuration applied');
        console.log('[StreamManager] Target latency: 8 seconds, Buffer: 8-20 seconds');
        
        hlsInstance = new Hls(hlsConfig);
        
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(chzzkPlayerElement);
        
        setupHlsEventListeners();
    }
    
    function setupHlsEventListeners() {
        if (!hlsInstance) return;
        
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
            console.log("HLS.js: Manifest parsed, attempting to play.");
            AppMediator.publish('player:statusChange', { isLoading: true, message: '재생 준비 중...' });
            
            // 버퍼링 타임아웃 설정
            clearTimeout(bufferingTimeout);
            bufferingTimeout = setTimeout(function() {
                console.warn("Buffering timeout - forcing status update");
                if (chzzkPlayerElement && !chzzkPlayerElement.paused) {
                    AppMediator.publish('player:statusChange', { isLoading: false });
                }
            }, 30000);
            chzzkPlayerElement.play().then(function() {
                console.log("Video playback started via HLS.js.");
                // play() 호출 성공은 아직 재생이 시작된 것이 아니므로 이벤트 대기
            }).catch(function(error) {
                console.error("Error playing video with HLS.js:", error);
                AppMediator.publish('player:statusChange', { isLoading: false });
                AppMediator.publish('player:statusChange', { isError: true, message: '스트림 재생을 시작할 수 없습니다' });
            });
        });
        
        hlsInstance.on(Hls.Events.BUFFER_APPENDED, function() {
            console.log("HLS.js: Buffer appended");
            if (chzzkPlayerElement && !chzzkPlayerElement.paused && chzzkPlayerElement.readyState >= 3) {
                console.log("HLS.js: Playback should be smooth now");
                AppMediator.publish('player:statusChange', { isLoading: false });
            }
        });
        
        // 추가 이벤트: 버퍼가 충분히 채워졌을 때
        hlsInstance.on(Hls.Events.BUFFER_EOS, function() {
            console.log("HLS.js: Buffer End of Stream");
            if (chzzkPlayerElement && !chzzkPlayerElement.paused) {
                AppMediator.publish('player:statusChange', { isLoading: false });
            }
        });
        
        hlsInstance.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS.js Error:', data);
            
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log("HLS.js: 네트워크 오류 - 재시도 중...");
                        AppMediator.publish('player:statusChange', { isError: true, message: '네트워크 오류 - 재연결 중...' });
                        setTimeout(function() {
                            if(hlsInstance) {
                                hlsInstance.startLoad();
                            }
                        }, 1000);
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log("HLS.js: 미디어 오류 - 복구 시도 중...");
                        AppMediator.publish('player:statusChange', { isError: true, message: '미디어 오류 - 복구 중...' });
                        setTimeout(function() {
                            if(hlsInstance) {
                                hlsInstance.recoverMediaError();
                            }
                        }, 1000);
                        break;
                    default:
                        console.error("HLS.js: 복구 불가능한 치명적 오류");
                        AppMediator.publish('player:statusChange', { isError: true, message: '재생 불가능 - 나중에 다시 시도해주세요' });
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
                    AppMediator.publish('player:statusChange', { isLoading: true, message: '네트워크 재연결 중...' });
                    setTimeout(function() {
                        AppMediator.publish('player:statusChange', { isLoading: false });
                    }, 2000);
                }
            }
        });
        
        // 라이브 엣지 동기화 시작
        startLiveSyncMonitoring();
        
        // 플레이백 속도 조절 시작
        startPlaybackRateAdjustment();
    }
    
    /**
     * 라이브 엣지 동기화 - 주기적으로 지연을 체크하고 동기화
     */
    function startLiveSyncMonitoring() {
        // 기존 인터벌 정리
        if (liveSyncInterval) {
            clearInterval(liveSyncInterval);
        }
        
        liveSyncInterval = setInterval(function() {
            if (hlsInstance && hlsInstance.media && !hlsInstance.media.paused) {
                var latency = hlsInstance.latency;
                var targetLatency = hlsInstance.targetLatency || 5;
                
                // 목표 지연보다 10초 이상 늦을 때만 동기화 (더 보수적)
                if (latency > targetLatency + 10) {
                    console.log('[LiveSync] High latency detected:', latency + 's, syncing to live edge');
                    var livePosition = hlsInstance.liveSyncPosition;
                    if (livePosition && isFinite(livePosition)) {
                        hlsInstance.media.currentTime = livePosition;
                    }
                }
            }
        }, 10000); // 10초마다 체크
    }
    
    /**
     * 플레이백 속도 조절 - 지연이 있을 때 속도를 조절하여 따라잡기
     */
    function startPlaybackRateAdjustment() {
        // 기존 인터벌 정리
        if (playbackRateInterval) {
            clearInterval(playbackRateInterval);
        }
        
        // 더 보수적인 재생 속도 조절 - 안정성 우선
        playbackRateInterval = setInterval(function() {
            if (chzzkPlayerElement && hlsInstance && !chzzkPlayerElement.paused) {
                var latency = hlsInstance.latency;
                var targetLatency = hlsInstance.targetLatency || 8;
                var currentRate = chzzkPlayerElement.playbackRate;
                var newRate = 1.0;
                
                // 보수적인 임계값으로 안정성 확보
                if (latency > targetLatency + 10) {
                    // 18초 이상 지연 시만 아주 약간 빠르게
                    newRate = 1.03;
                    console.log('[PlaybackRate] High latency detected (' + latency + 's), adjusting to 1.03x');
                } else if (latency > targetLatency + 5) {
                    // 13초 이상 지연 시 미세 조정
                    newRate = 1.01;
                    console.log('[PlaybackRate] Moderate latency detected (' + latency + 's), adjusting to 1.01x');
                }
                
                // 속도 변경은 부드럽게
                if (currentRate !== newRate) {
                    chzzkPlayerElement.playbackRate = newRate;
                } else if (currentRate > 1.0 && latency <= targetLatency + 2) {
                    // 지연이 목표에 가까워지면 원래 속도로
                    chzzkPlayerElement.playbackRate = 1.0;
                    console.log('[PlaybackRate] Latency normalized, resetting to 1.0x');
                }
            }
        }, 10000); // 10초마다 체크 (너무 자주 변경하지 않음)
    }
    
    function setupNativePlayback(streamUrl) {
        chzzkPlayerElement.src = streamUrl;
        chzzkPlayerElement.addEventListener('loadedmetadata', function() {
             chzzkPlayerElement.play().then(function() {
                console.log("Video playback started (native HLS).");
                AppMediator.publish('player:statusChange', { isLoading: false });
            }).catch(function(error) {
                console.error("Error playing video (native HLS):", error);
                AppMediator.publish('player:statusChange', { isLoading: false });
                AppMediator.publish('player:statusChange', { isError: true, message: '네이티브 HLS 재생 오류' });
            });
        });
         chzzkPlayerElement.load(); 
    }
    
    function stopPlayer() {
        // 모든 타이머와 인터벌 클리어
        clearTimeout(bufferingTimeout);
        clearInterval(liveSyncInterval);
        clearInterval(playbackRateInterval);
        
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
            console.log("HLS.js instance destroyed.");
        }
        if (chzzkPlayerElement) {
            // 재생 속도 원래대로
            chzzkPlayerElement.playbackRate = 1.0;
            chzzkPlayerElement.pause();
            chzzkPlayerElement.removeAttribute('src'); 
            chzzkPlayerElement.load(); 
            console.log("Video playback stopped and player reset.");
        }
        AppMediator.publish('player:statusChange', { isLoading: false });
        AppMediator.publish('player:statusChange', { hide: true });
    }
    
    return {
        initialize: initialize,
        initAndPlayStream: initAndPlayStream,
        stopPlayer: stopPlayer
    };
})();

// 전역으로 노출
window.StreamManager = StreamManager; 