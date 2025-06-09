// ui/watchScreen.js (ES5 호환)

// 전역으로 사용할 시청 화면 관련 요소들 (필요시)
var watchSectionElement;
var watchInfoPanelElements;
var watchInfoPanelContainerElement;
var chzzkPlayerElement;
var playerStatusOverlayElement;
var watchFavoriteButton;
var currentWatchData = null; // 현재 시청 중인 방송 데이터
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
        showPlayerError('플레이어 초기화 오류');
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
                maxBufferLength: 30,        // 버퍼 길이 줄임 (더 반응성 있는 스트리밍)
                maxMaxBufferLength: 600,    // 최대 버퍼 길이 줄임
                maxBufferSize: 60 * 1000 * 1000, // 60MB 버퍼 크기 제한
                maxBufferHole: 0.5,         // 버퍼 홀 허용치
                lowLatencyMode: true,       // 저지연 모드 활성화
                backBufferLength: 90,       // 백버퍼 길이
                autoStartLoad: true,
                startPosition: -1,
                debug: false,
                enableWorker: true,         // Web Worker 사용
                enableSoftwareAES: true,    // 소프트웨어 AES 활성화
                fragLoadingTimeOut: 20000,  // 프래그먼트 로딩 타임아웃 20초
                manifestLoadingTimeOut: 10000, // 매니페스트 로딩 타임아웃 10초
                levelLoadingTimeOut: 10000  // 레벨 로딩 타임아웃 10초
            });
            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(chzzkPlayerElement);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
                console.log("HLS.js: Manifest parsed, attempting to play.");
                showPlayerLoading(true, '재생 준비 중...');
                chzzkPlayerElement.play().then(function() {
                    console.log("Video playback started via HLS.js.");
                    showPlayerLoading(false);
                }).catch(function(error) {
                    console.error("Error playing video with HLS.js:", error);
                    showPlayerLoading(false);
                    showPlayerError('스트림 재생을 시작할 수 없습니다');
                });
            });
            
            // 추가 이벤트 리스너들 (필요시에만 로그)
            hlsInstance.on(Hls.Events.FRAG_LOADING, function() {
                // 일반적인 프래그먼트 로딩은 로그 생략
                // console.log("HLS.js: Loading fragment...");
            });
            
            hlsInstance.on(Hls.Events.FRAG_LOADED, function() {
                // 일반적인 프래그먼트 로딩 성공은 로그 생략
                // console.log("HLS.js: Fragment loaded successfully");
            });
            
            hlsInstance.on(Hls.Events.BUFFER_APPENDED, function() {
                // 버퍼가 추가되면 로딩을 숨김
                if (chzzkPlayerElement && !chzzkPlayerElement.paused) {
                    showPlayerLoading(false);
                }
            });
            hlsInstance.on(Hls.Events.ERROR, function(event, data) {
                console.error('HLS.js Error:', data);
                
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log("HLS.js: 네트워크 오류 - 재시도 중...");
                            showPlayerError('네트워크 오류 - 재연결 중...');
                            setTimeout(function() {
                                if(hlsInstance) {
                                    hlsInstance.startLoad();
                                }
                            }, 1000);
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log("HLS.js: 미디어 오류 - 복구 시도 중...");
                            showPlayerError('미디어 오류 - 복구 중...');
                            setTimeout(function() {
                                if(hlsInstance) {
                                    hlsInstance.recoverMediaError();
                                }
                            }, 1000);
                            break;
                        default:
                            console.error("HLS.js: 복구 불가능한 치명적 오류");
                            showPlayerError('재생 불가능 - 나중에 다시 시도해주세요');
                            if (hlsInstance) {
                                hlsInstance.destroy();
                                hlsInstance = null;
                            }
                            break;
                    }
                } else {
                    // 치명적이지 않은 오류는 최소한의 로그만 남김
                    if (data.details !== 'bufferStalledError' && 
                        data.details !== 'bufferNudgeOnStall' && 
                        data.details !== 'bufferSeekOverHole') {
                        console.warn('HLS.js: 복구 가능한 오류:', data.details);
                    }
                    
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        showPlayerLoading(true, '네트워크 재연결 중...');
                        setTimeout(function() {
                            showPlayerLoading(false);
                        }, 2000);
                    }
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
                    showPlayerError('네이티브 HLS 재생 오류');
                });
            });
             chzzkPlayerElement.load(); 
        } else {
            console.error("HLS.js is not supported and native HLS playback also seems unsupported.");
            showPlayerLoading(false);
            showPlayerError('이 기기에서는 HLS 재생이 지원되지 않습니다');
            return; 
        }
    } else {
        console.error("No stream URL found for playback.");
        showPlayerLoading(false);
        showPlayerError('방송 스트림을 찾을 수 없습니다');
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
    if (playerStatusOverlayElement) {
        playerStatusOverlayElement.style.display = 'none';
    }
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

    // 채팅 매니저 초기화
    if (window.ChatManager) {
        window.ChatManager.initialize();
    }

    if (chzzkPlayerElement) {
        chzzkPlayerElement.addEventListener('playing', function() {
            console.log("Player event: playing");
            showPlayerLoading(false);
        });
        chzzkPlayerElement.addEventListener('waiting', function() {
            console.log("Player event: waiting");
            showPlayerLoading(true, '버퍼링 중...');
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
            showPlayerError('비디오 재생 오류가 발생했습니다');
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

        // 카테고리와 설명은 제거됨

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

/**
 * 시청 화면 즐겨찾기 버튼 초기화
 */
function initializeWatchFavoriteButton() {
    // 기존 버튼이 있다면 제거
    var existingBtn = document.getElementById('watch-favorite-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // 제목 요소 찾기
    var titleElement = document.getElementById('watch-title');
    if (!titleElement) {
        console.error('시청 화면 제목 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 새 별표 버튼 생성
    watchFavoriteButton = document.createElement('button');
    watchFavoriteButton.id = 'watch-favorite-btn';
    watchFavoriteButton.className = 'watch-favorite-btn';
    watchFavoriteButton.innerHTML = '★';
    watchFavoriteButton.setAttribute('tabindex', '0');
    
    // 제목 요소에 버튼 추가
    titleElement.appendChild(watchFavoriteButton);
    
    // 클릭 이벤트 등록
    watchFavoriteButton.addEventListener('click', function() {
        toggleWatchFavorite();
    });
    
    console.log('시청 화면 즐겨찾기 버튼 초기화 완료');
}

/**
 * 시청 화면에서 즐겨찾기 토글
 */
function toggleWatchFavorite() {
    if (!currentWatchData || !window.FavoriteManager) {
        console.error('즐겨찾기 토글 실패: 데이터 없음');
        return;
    }
    
    // 채널 ID 추출
    var channelId = null;
    if (currentWatchData.channel && currentWatchData.channel.channelId) {
        channelId = currentWatchData.channel.channelId;
    } else if (currentWatchData.channelId) {
        channelId = currentWatchData.channelId;
    }
    
    if (!channelId) {
        console.error('채널 ID를 찾을 수 없습니다:', currentWatchData);
        return;
    }
    
    // 채널 데이터 준비
    var channelData = {
        channelId: channelId,
        channelName: currentWatchData.channel ? currentWatchData.channel.channelName : currentWatchData.channelName,
        channelImageUrl: currentWatchData.channel ? currentWatchData.channel.channelImageUrl : currentWatchData.channelImageUrl
    };
    
    // 즐겨찾기 토글
    var isNowFavorite = window.FavoriteManager.toggleFavorite(channelData);
    updateWatchFavoriteButton(isNowFavorite);
    
    console.log(isNowFavorite ? '즐겨찾기에 추가됨:' : '즐겨찾기에서 제거됨:', channelData.channelName);
}

/**
 * 시청 화면 즐겨찾기 버튼 외관 업데이트
 * @param {boolean} isFavorite - 즐겨찾기 상태
 */
function updateWatchFavoriteButton(isFavorite) {
    if (!watchFavoriteButton) return;
    
    if (isFavorite) {
        watchFavoriteButton.classList.remove('inactive');
        watchFavoriteButton.classList.add('active');
    } else {
        watchFavoriteButton.classList.remove('active');
        watchFavoriteButton.classList.add('inactive');
    }
}

/**
 * 현재 방송의 즐겨찾기 상태 설정
 * @param {Object} broadcastData - 방송 데이터
 */
function setWatchFavoriteState(broadcastData) {
    if (!broadcastData || !window.FavoriteManager || !watchFavoriteButton) {
        return;
    }
    
    // 채널 ID 추출
    var channelId = null;
    if (broadcastData.channel && broadcastData.channel.channelId) {
        channelId = broadcastData.channel.channelId;
    } else if (broadcastData.channelId) {
        channelId = broadcastData.channelId;
    }
    
    if (channelId) {
        var isFavorite = window.FavoriteManager.isFavorite(channelId);
        updateWatchFavoriteButton(isFavorite);
    }
}

function showWatchScreen(broadcastData) {
    var startTime = Date.now(); // 성능 측정 시작
    console.log("Showing watch screen with data:", broadcastData);
    
    // 현재 방송 데이터 저장
    currentWatchData = broadcastData;
    
    if (!watchSectionElement) {
        console.error("Watch section element not found!");
        return;
    }

    // UI 변경을 먼저 수행 (즉시 반응)
    watchSectionElement.style.display = 'flex';
    
    var searchSection = document.getElementById('search-section');
    if (searchSection) searchSection.style.display = 'none';
    
    // 정보 표시 (빠른 표시)
    populateWatchInfo(broadcastData);
    
    // 즐겨찾기 버튼 항상 초기화 및 상태 설정
    initializeWatchFavoriteButton();
    setWatchFavoriteState(broadcastData);
    
    // 채팅 초기화 및 시작
    if (window.ChatManager) {
        window.ChatManager.initializeWatch();
        window.ChatManager.startWatch(broadcastData);
    }
    
    // 플레이어 로딩 표시
    showPlayerLoading(true, '방송 연결 중...');
    
    // 스트림 초기화 (비동기)
    setTimeout(function() {
        initAndPlayStream(broadcastData);
        var loadTime = Date.now() - startTime;
        console.log("Watch screen loading took: " + loadTime + "ms");
    }, 100); // 100ms 지연으로 UI 응답성 개선
    
    // 정보 팝업 표시
    setTimeout(function() {
        showInfoPopup();
    }, 200); // 더 빠른 표시
}

function hideWatchScreen() {
    console.log("Hiding watch screen");
    
    stopPlayer();
    hideInfoPopup();
    
    // 채팅 연결 해제
    if (window.ChatManager) {
        window.ChatManager.disconnect();
        window.ChatManager.hidePanel();
        window.ChatManager.hideToggleArrow();
    }
    
    // 현재 시청 데이터 초기화
    currentWatchData = null;
    
    if (watchSectionElement) {
        watchSectionElement.style.display = 'none';
    }
    
    var searchSection = document.getElementById('search-section');
    if (searchSection) searchSection.style.display = 'block';
}

function showPlayerLoading(isLoading, message) {
    if (!playerStatusOverlayElement) return;
    
    if (isLoading) {
        var loadingMessage = message || '스트림 연결 중...';
        playerStatusOverlayElement.textContent = loadingMessage;
        playerStatusOverlayElement.style.display = 'block';
    } else {
        playerStatusOverlayElement.style.display = 'none';
    }
}

function showPlayerError(errorMessage) {
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

// WebOS 비디오 플레이어 연동 부분은 여기에 추가될 예정
// function initAndPlayStream(streamUrl) { ... }
// function stopPlayer() { ... } 