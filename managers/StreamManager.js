// managers/StreamManager.js (ES5 호환)

var StreamManager = (function() {
    var chzzkPlayerElement = null;
    var hlsInstance = null;
    var liveSyncInterval = null;
    var playbackRateInterval = null;
    var bufferHealthInterval = null;
    var networkQuality = 'good'; // 'good', 'medium', 'poor'
    var bufferStallCount = 0;
    var lastStallTime = 0;
    
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
        
        // WebOS TV 감지 및 전용 설정
        var isWebOS = window.isWebOSTV;
        
        // 버퍼링 문제 해결을 위한 안정성 우선 HLS 설정
        var hlsConfig = {
            // 버퍼 설정 - 안정성 최우선
            maxBufferLength: 60,              // 기본 버퍼 길이 대폭 증가 (60초) - 충분한 버퍼 확보
            maxMaxBufferLength: 90,           // 최대 버퍼 길이 증가 (90초)
            maxBufferSize: 120 * 1000 * 1000, // 최대 버퍼 크기 증가 (120MB)
            maxBufferHole: 2.0,              // 버퍼 홀 허용치 증가 (2초) - 더 관대하게
            
            // 버퍼 안정성 개선 설정
            maxFragLookUpTolerance: 0.5,    // 프래그먼트 검색 허용 오차 증가
            nudgeOffset: 0.2,                // 버퍼 조정 오프셋 증가
            nudgeMaxRetry: 10,               // 버퍼 조정 최대 재시도 증가
            maxLoadingDelay: 6,              // 최대 로딩 지연 증가
            highBufferWatchdogPeriod: 5,     // 버퍼 감시 주기 완화 (5초)
            
            // 라이브 스트리밍 설정 - 안정성 강화
            lowLatencyMode: false,           // 저지연 모드 완전 비활성화
            backBufferLength: 30,            // 백버퍼 크게 증가
            liveSyncDurationCount: 10,       // 라이브 동기화 세그먼트 수 대폭 증가
            liveMaxLatencyDurationCount: 15, // 최대 허용 지연 대폭 증가
            targetLatency: 20,               // 목표 지연 시간 증가 (20초) - 안정성 확보
            liveBackBufferLength: 10,        // 라이브 백버퍼 활성화
            
            // 성능 및 네트워크 설정
            startPosition: -1,               // 라이브 엣지에서 시작
            liveDurationInfinity: true,      // 무한 라이브 스트림
            autoStartLoad: true,             // 자동 로드 시작
            enableWorker: !isWebOS,          // WebOS TV에서는 워커 비활성화
            progressive: !isWebOS,           // WebOS TV에서는 프로그레시브 로딩 비활성화
            testBandwidth: true,             // 대역폭 테스트
            enableSoftwareAES: true,         // 소프트웨어 AES
            
            // 타임아웃 설정 - 극도의 안정성 확보
            fragLoadingTimeOut: 60000,       // 프래그먼트 로드 타임아웃 대폭 증가 (60초)
            manifestLoadingTimeOut: 30000,   // 매니페스트 로드 타임아웃 증가 (30초)
            levelLoadingTimeOut: 30000,      // 레벨 로드 타임아웃 증가 (30초)
            fragLoadingMaxRetry: 10,         // 프래그먼트 로드 최대 재시도 증가
            manifestLoadingMaxRetry: 6,      // 매니페스트 로드 최대 재시도 증가
            levelLoadingMaxRetry: 6,         // 레벨 로드 최대 재시도 증가
            
            // ABR 설정 - 보수적 화질 조절 (안정성 우선)
            abrEwmaFastLive: 6.0,           // 빠른 EWMA 가중치 조정 (덜 민감하게)
            abrEwmaSlowLive: 15.0,          // 느린 EWMA 가중치 조정 (더 보수적으로)
            abrBandWidthFactor: 0.7,        // 대역폭 사용 비율 대폭 감소 (70%만 사용)
            abrBandWidthUpFactor: 0.5,      // 대역폭 상향 조정 비율 감소 (매우 보수적)
            abrMaxWithRealBitrate: true,    // 실제 비트레이트 기반 ABR
            
            // 시작 품질 전략 - 중간 화질로 시작
            startLevel: -1,                  // -1 = 자동, 특정 레벨 지정 가능
            autoStartLoad: true,             // 자동 로드 시작
            
            debug: false
        };
        
        console.log('[StreamManager] HLS configuration applied - Stability first mode');
        console.log('[StreamManager] WebOS TV:', isWebOS);
        console.log('[StreamManager] Target latency: 20 seconds, Buffer: 60-90 seconds');
        console.log('[StreamManager] Buffer hole tolerance: 2.0 seconds');
        console.log('[StreamManager] Conservative ABR: 70% bandwidth usage, slow quality switching');
        
        hlsInstance = new Hls(hlsConfig);
        
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(chzzkPlayerElement);
        
        setupHlsEventListeners();
        
        // 버퍼 건강 모니터링 시작
        startBufferHealthMonitoring();
    }
    
    function setupHlsEventListeners() {
        if (!hlsInstance) return;
        
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
            console.log("HLS.js: Manifest parsed, attempting to play.");
            AppMediator.publish('player:statusChange', { isLoading: true, message: '재생 준비 중...' });
            
            // 시작 품질 전략 - 중간 화질로 시작
            if (data.levels && data.levels.length > 1) {
                var levels = data.levels;
                var middleLevel = Math.floor(levels.length / 2);
                
                // WebOS TV에서는 480p 정도의 낮은 화질로 시작 (안정성 우선)
                var targetBitrate = 1500000; // 1.5Mbps (대략 480p)
                var bestLevel = -1;
                var minDiff = Infinity;
                
                for (var i = 0; i < levels.length; i++) {
                    var diff = Math.abs(levels[i].bitrate - targetBitrate);
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestLevel = i;
                    }
                }
                
                if (bestLevel !== -1) {
                    hlsInstance.startLevel = bestLevel;
                    console.log('[StreamManager] Starting with level', bestLevel, 'bitrate:', levels[bestLevel].bitrate);
                } else {
                    hlsInstance.startLevel = middleLevel;
                    console.log('[StreamManager] Starting with middle level:', middleLevel);
                }
                
                // 10초 후 자동 품질 조절 활성화 (충분한 버퍼 확보 후)
                setTimeout(function() {
                    hlsInstance.currentLevel = -1; // 자동 모드로 전환
                    console.log('[StreamManager] Switched to automatic quality selection');
                }, 10000);
            }
            
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
                // 비치명적 오류에 대한 향상된 처리
                handleNonFatalError(data);
            }
        });
        
        // 라이브 엣지 동기화 시작
        startLiveSyncMonitoring();
        
        // 플레이백 속도 조절 시작
        startPlaybackRateAdjustment();
    }
    
    /**
     * 비치명적 오류 처리
     */
    function handleNonFatalError(data) {
        switch (data.details) {
            case 'bufferStalledError':
                console.log('[ErrorHandler] Buffer stalled, attempting recovery...');
                bufferStallCount++;
                
                // 버퍼 스톨 회수가 많으면 품질 낮추기
                if (bufferStallCount > 2 && hlsInstance) {
                    if (hlsInstance.autoLevelEnabled) {
                        // 자동 품질 조절이 켜져 있다면 최대 품질 제한
                        var currentMaxLevel = hlsInstance.autoLevelCapping;
                        if (currentMaxLevel > 0) {
                            hlsInstance.autoLevelCapping = currentMaxLevel - 1;
                            console.log('[ErrorHandler] Lowered max quality level to:', hlsInstance.autoLevelCapping);
                        }
                    }
                }
                
                // 진행 표시기 업데이트
                AppMediator.publish('player:statusChange', { 
                    isLoading: true, 
                    message: '버퍼링 중... (네트워크 상태 확인)' 
                });
                
                // 2초 후 상태 확인
                setTimeout(function() {
                    if (chzzkPlayerElement && !chzzkPlayerElement.paused && 
                        chzzkPlayerElement.readyState >= 3) {
                        AppMediator.publish('player:statusChange', { isLoading: false });
                    }
                }, 2000);
                break;
                
            case 'bufferSeekOverHole':
                console.log('[ErrorHandler] Buffer hole detected, skipping...');
                // 버퍼 홀은 HLS.js가 자동으로 처리하므로 로그만 출력
                break;
                
            case 'bufferNudgeOnStall':
                console.log('[ErrorHandler] Buffer nudge on stall');
                break;
                
            case 'fragLoadError':
            case 'fragLoadTimeOut':
                console.log('[ErrorHandler] Fragment load issue:', data.details);
                // 프래그먼트 로드 오류는 HLS.js가 자동 재시도
                break;
                
            default:
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    console.log('[ErrorHandler] Network error:', data.details);
                    AppMediator.publish('player:statusChange', { 
                        isLoading: true, 
                        message: '네트워크 재연결 중...' 
                    });
                    
                    // 네트워크 오류 후 자동 복구
                    setTimeout(function() {
                        AppMediator.publish('player:statusChange', { isLoading: false });
                    }, 3000);
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    console.warn('[ErrorHandler] Media error:', data.details);
                } else {
                    console.warn('[ErrorHandler] Other error:', data.details);
                }
        }
    }
    
    /**
     * 버퍼 건강 모니터링 - 네트워크 상태에 따라 버퍼 동적 조정
     */
    function startBufferHealthMonitoring() {
        if (bufferHealthInterval) {
            clearInterval(bufferHealthInterval);
        }
        
        bufferHealthInterval = setInterval(function() {
            if (!hlsInstance || !hlsInstance.media) return;
            
            var media = hlsInstance.media;
            var buffered = media.buffered;
            
            if (buffered.length > 0) {
                var currentTime = media.currentTime;
                var bufferEnd = buffered.end(buffered.length - 1);
                var bufferLength = bufferEnd - currentTime;
                
                // 버퍼 상태에 따른 네트워크 품질 평가 (동적 targetLatency 제거)
                var now = Date.now();
                if (bufferLength < 2) {
                    // 버퍼가 2초 미만이면 네트워크 품질 저하
                    if (now - lastStallTime > 30000) { // 30초 이내 재발생
                        bufferStallCount++;
                        lastStallTime = now;
                    }
                    
                    if (bufferStallCount >= 3) {
                        networkQuality = 'poor';
                        console.log('[BufferHealth] Network quality: POOR');
                        adjustBufferForPoorNetwork();
                    } else if (bufferStallCount >= 1) {
                        networkQuality = 'medium';
                        console.log('[BufferHealth] Network quality: MEDIUM');
                    }
                } else if (bufferLength > 10) {
                    // 버퍼가 충분하면 카운트 리셋
                    if (bufferStallCount > 0) {
                        bufferStallCount--;
                    }
                    if (bufferLength > 15 && networkQuality !== 'good') {
                        networkQuality = 'good';
                        console.log('[BufferHealth] Network quality: GOOD');
                    }
                }
                
                // 디버그 로그
                if (bufferLength < 5) {
                    console.log('[BufferHealth] Low buffer:', bufferLength.toFixed(2) + 's');
                }
            }
        }, 3000); // 3초마다 체크 - 안정성 우선
    }
    
    /**
     * 네트워크 품질이 낮을 때 버퍼 설정 조정
     */
    function adjustBufferForPoorNetwork() {
        if (!hlsInstance) return;
        
        console.log('[BufferHealth] Adjusting settings for poor network...');
        
        // 네트워크가 불안정할 때 더 큰 버퍼 확보
        hlsInstance.config.maxBufferLength = 90;
        hlsInstance.config.maxMaxBufferLength = 120;
        hlsInstance.config.maxBufferHole = 3.0;
        hlsInstance.config.nudgeMaxRetry = 20;
        
        // 화질을 낮춰서 안정성 확보
        if (hlsInstance.currentLevel !== -1) {
            var levels = hlsInstance.levels;
            if (levels && levels.length > 1) {
                // 현재 레벨보다 낮은 품질로 변경
                var currentLevel = hlsInstance.currentLevel;
                if (currentLevel > 0) {
                    hlsInstance.currentLevel = Math.max(0, currentLevel - 1);
                    console.log('[BufferHealth] Lowered quality level to:', hlsInstance.currentLevel);
                }
            }
        }
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
                var targetLatency = hlsInstance.targetLatency || 20;
                
                // 목표 지연보다 20초 이상 늦을 때만 동기화 (매우 보수적)
                if (latency > targetLatency + 20) {
                    console.log('[LiveSync] Very high latency detected:', latency + 's, syncing to live edge');
                    var livePosition = hlsInstance.liveSyncPosition;
                    if (livePosition && isFinite(livePosition)) {
                        hlsInstance.media.currentTime = livePosition;
                    }
                }
            }
        }, 15000); // 15초마다 체크 - 안정성 우선
    }
    
    /**
     * 플레이백 속도 조절 - 지연이 있을 때 속도를 조절하여 따라잡기
     */
    function startPlaybackRateAdjustment() {
        // 기존 인터벌 정리
        if (playbackRateInterval) {
            clearInterval(playbackRateInterval);
        }
        
        // 안정성 우선 재생 속도 조절 - 버퍼 기반 감속/가속
        playbackRateInterval = setInterval(function() {
            if (chzzkPlayerElement && hlsInstance && !chzzkPlayerElement.paused) {
                var media = hlsInstance.media;
                var buffered = media.buffered;
                var currentRate = chzzkPlayerElement.playbackRate;
                var newRate = 1.0;
                
                // 버퍼 길이 계산
                var bufferLength = 0;
                if (buffered.length > 0) {
                    var currentTime = media.currentTime;
                    var bufferEnd = buffered.end(buffered.length - 1);
                    bufferLength = bufferEnd - currentTime;
                }
                
                var latency = hlsInstance.latency;
                var targetLatency = hlsInstance.targetLatency || 20;
                
                // 버퍼 기반 속도 조정 (안정성 최우선)
                if (bufferLength < 8) {
                    // 버퍼 부족 시 재생 속도 감소
                    newRate = 0.97;
                    console.log('[PlaybackRate] Low buffer (' + bufferLength.toFixed(1) + 's), slowing down to 0.97x');
                } else if (bufferLength < 10) {
                    // 버퍼 약간 부족
                    newRate = 0.99;
                    console.log('[PlaybackRate] Moderate buffer (' + bufferLength.toFixed(1) + 's), slowing down to 0.99x');
                } else if (bufferLength > 50 && latency > targetLatency + 10) {
                    // 버퍼 충분하고 지연이 크면 최대 가속
                    newRate = 1.10;
                    console.log('[PlaybackRate] High buffer & latency, speeding up to 1.10x');
                } else if (bufferLength > 40 && latency > targetLatency + 5) {
                    // 버퍼 충분하고 지연이 있으면 가속
                    newRate = 1.05;
                    console.log('[PlaybackRate] Good buffer & some latency, speeding up to 1.05x');
                } else if (bufferLength > 30 && latency > targetLatency) {
                    // 버퍼 안정적이고 약간의 지연
                    newRate = 1.02;
                    console.log('[PlaybackRate] Stable buffer, minor adjustment to 1.02x');
                }
                
                // 속도 변경은 부드럽게
                if (Math.abs(currentRate - newRate) > 0.001) {
                    chzzkPlayerElement.playbackRate = newRate;
                }
            }
        }, 10000); // 10초마다 체크 - 안정성 우선
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
        clearInterval(bufferHealthInterval);
        
        // 상태 초기화
        bufferStallCount = 0;
        networkQuality = 'good';
        
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