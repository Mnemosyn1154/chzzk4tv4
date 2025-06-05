// ui/watchScreen.js

// 전역으로 사용할 시청 화면 관련 요소들 (필요시)
let watchSectionElement;
let watchInfoPanelElements;
let watchInfoPanelContainerElement;
let chzzkPlayerElement;
let playerStatusOverlayElement;
let infoPopupTimer = null;
let hlsInstance = null; // HLS.js 인스턴스를 저장할 변수

// Helper function to get HLS stream URL from livePlaybackJson
function getStreamUrlFromJson(jsonString) {
    if (!jsonString) return null;
    try {
        const playbackData = JSON.parse(jsonString);
        if (playbackData && playbackData.media && Array.isArray(playbackData.media)) {
            const hlsStream = playbackData.media.find(
                m => m.protocol === 'HLS' || m.mediaFormat === 'HLS'
            );
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

    let streamUrl = null;
    const playbackJson = broadcastData.livePlaybackJson ||
                         (broadcastData.channel && broadcastData.channel.livePlayback?.livePlaybackJson) ||
                         broadcastData.livePlayback; 

    if (typeof playbackJson === 'string') {
        streamUrl = getStreamUrlFromJson(playbackJson);
    } else if (typeof playbackJson === 'object' && playbackJson !== null) { 
         if (playbackJson.media && Array.isArray(playbackJson.media)) {
            const hlsStream = playbackJson.media.find(
                m => m.protocol === 'HLS' || m.mediaFormat === 'HLS'
            );
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
                debug: false, // 디버그 로그 비활성화
            });
            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(chzzkPlayerElement);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
                console.log("HLS.js: Manifest parsed, attempting to play.");
                chzzkPlayerElement.play().then(() => {
                    console.log("Video playback started via HLS.js.");
                    showPlayerLoading(false);
                }).catch(error => {
                    console.error("Error playing video with HLS.js:", error);
                    showPlayerLoading(false);
                    if(playerStatusOverlayElement) {
                        playerStatusOverlayElement.textContent = 'HLS.js 재생 오류';
                        playerStatusOverlayElement.style.display = 'block';
                    }
                });
            });
            hlsInstance.on(Hls.Events.ERROR, function(event, data) {
                // debug:false 일 때는 hlsError는 계속 로깅되지만, 내부 상세 로그는 줄어듦
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
                    // 사용자에게 보여줄 오류 메시지는 type이나 details 중 간결한 것으로 선택
                    let errorMsg = 'HLS 재생 중 오류 발생';
                    if (data.details) {
                        errorMsg = `HLS 오류: ${data.details}`;
                    } else if (data.type) {
                        errorMsg = `HLS 오류 타입: ${data.type}`;
                    }
                    playerStatusOverlayElement.textContent = errorMsg;
                    playerStatusOverlayElement.style.display = 'block';
                }
            });
        } else if (chzzkPlayerElement.canPlayType('application/vnd.apple.mpegurl') || chzzkPlayerElement.canPlayType('application/x-mpegURL')) {
            console.log("HLS.js not supported, but native HLS might be. Using native playback.");
            chzzkPlayerElement.src = streamUrl;
            chzzkPlayerElement.addEventListener('loadedmetadata', function() {
                 chzzkPlayerElement.play().then(() => {
                    console.log("Video playback started (native HLS).");
                    showPlayerLoading(false);
                }).catch(error => {
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
document.addEventListener('DOMContentLoaded', () => {
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
        chzzkPlayerElement.addEventListener('playing', () => {
            console.log("Player event: playing");
            showPlayerLoading(false);
        });
        chzzkPlayerElement.addEventListener('waiting', () => {
            console.log("Player event: waiting (buffering)");
            showPlayerLoading(true);
            if(playerStatusOverlayElement) playerStatusOverlayElement.textContent = '버퍼링 중...';
        });
        chzzkPlayerElement.addEventListener('error', (e) => {
            console.error("Player event: error", chzzkPlayerElement.error, e);
            showPlayerLoading(false);
            if(playerStatusOverlayElement) {
                playerStatusOverlayElement.textContent = `재생 오류 발생 (코드: ${chzzkPlayerElement.error?.code || 'N/A'})`;
                playerStatusOverlayElement.style.display = 'block';
            }
        });
        chzzkPlayerElement.addEventListener('ended', () => {
            console.log("Player event: ended");
            showPlayerLoading(false);
            if(playerStatusOverlayElement) {
                playerStatusOverlayElement.textContent = '방송 종료';
                playerStatusOverlayElement.style.display = 'block';
            }
        });
        chzzkPlayerElement.addEventListener('loadeddata', () => {
            console.log("Player event: loadeddata");
        });
        chzzkPlayerElement.addEventListener('canplay', () => {
            console.log("Player event: canplay");
        });
         chzzkPlayerElement.addEventListener('loadstart', () => {
            console.log("Player event: loadstart");
            showPlayerLoading(true); 
        });
    } else {
        console.error("chzzk-player element not found during event listener setup.");
    }
});

function formatStartTime(isoString) {
    if (!isoString) return '정보 없음';
    try {
        const date = new Date(isoString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        console.error("Error formatting start time:", e);
        return '시간 정보 오류';
    }
}

function populateWatchInfo(data) {
    if (!watchInfoPanelElements || !data || !watchInfoPanelContainerElement) {
        console.error("Cannot populate watch info: elements or data missing.", watchInfoPanelElements, data);
        return;
    }

    // API 응답 구조에 따라 data 객체의 필드명을 정확히 사용해야 합니다.
    // 예시: data.channel.channelImageUrl, data.liveTitle, data.channel.channelName 등

    watchInfoPanelElements.thumbnail.src = data.channel?.channelImageUrl || data.liveImageUrl?.replace('{type}', '480') || ''; // placeholder 제거 또는 CSS로 처리
    watchInfoPanelElements.thumbnail.alt = data.channel?.channelName || '스트리머 썸네일';
    
    watchInfoPanelElements.title.textContent = data.liveTitle || '제목 없음';
    watchInfoPanelElements.streamerName.textContent = data.channel?.channelName || '스트리머 정보 없음';
    
    // 카테고리 정보가 API 응답의 어디에 있는지 확인 필요
    // 예시: data.liveCategoryValue 또는 data.categoryType 등
    watchInfoPanelElements.category.textContent = data.liveCategoryValue || '카테고리 정보 없음'; 
    
    // 시청자 수와 시작 시간을 같은 줄에 표시
    let startTimeString = null;
    if (data.liveDetail && data.liveDetail.livePollingStatus && data.liveDetail.livePollingStatus.liveStartDate) {
        startTimeString = data.liveDetail.livePollingStatus.liveStartDate;
    } else if (data.openDate) {
        startTimeString = data.openDate;
    } else if (data.liveStartDate) {
        startTimeString = data.liveStartDate;
    } else if (data.liveBeginDate) {
        startTimeString = data.liveBeginDate;
    } else if (data.createdDate) {
        startTimeString = data.createdDate;
    }

    const viewerCount = data.concurrentUserCount?.toLocaleString() || '0';
    const startTimeText = startTimeString ? formatStartTime(startTimeString) : null;
    
    if (startTimeText) {
        watchInfoPanelElements.viewerCount.innerHTML = `<span class="viewer-count-main">시청자 ${viewerCount}명</span> <span class="start-time-sub">${startTimeText} 시작</span>`;
    } else {
        watchInfoPanelElements.viewerCount.innerHTML = `<span class="viewer-count-main">시청자 ${viewerCount}명</span>`;
    }

    // 방송 설명 (API에 따라 필드명이 다를 수 있음, 예: data.channel.channelDescription 또는 data.liveDescription)
    watchInfoPanelElements.description.textContent = data.channel?.channelDescription || data.liveDescription || '방송 설명이 없습니다.';

    console.log("Watch info populated for popup (with start time if available):", data);
}

function showInfoPopup() {
    if (!watchInfoPanelContainerElement) return;
    
    watchInfoPanelContainerElement.classList.add('visible');

    // 기존 타이머가 있다면 클리어
    if (infoPopupTimer) {
        clearTimeout(infoPopupTimer);
    }

    // 5초 후에 팝업 숨김
    infoPopupTimer = setTimeout(() => {
        hideInfoPopup();
    }, 5000); // 5초
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
    if (!watchSectionElement) return;

    // 다른 뷰 숨기기는 main.js에서 처리하는 것이 더 적절할 수 있음 (상태 관리 측면)
    // 예를 들어, main.js에서 현재 활성 뷰를 관리하고, showWatchScreen 호출 시 이전 뷰를 숨김.
    const searchSection = document.getElementById('search-section');
    const liveListContainer = document.getElementById('live-stream-list-container');
    const searchResultsContainer = document.getElementById('search-results-container');

    if(searchSection) searchSection.style.display = 'none';
    if(liveListContainer) liveListContainer.style.display = 'none';
    if(searchResultsContainer) searchResultsContainer.style.display = 'none';

    populateWatchInfo(broadcastData);
    watchSectionElement.style.display = 'flex';
    showInfoPopup();
    initAndPlayStream(broadcastData);

    console.log("Watch screen shown with info popup for:", broadcastData);
    // TODO: 플레이어 초기화 및 재생 로직 호출
    // TODO: 시청 화면으로 포커스 이동 로직 (main.js의 initializeFocus 와 유사하게)
}

function hideWatchScreen() {
    if (!watchSectionElement) return;

    stopPlayer();
    hideInfoPopup();
    watchSectionElement.style.display = 'none';
    
    // TODO: 플레이어 정지 및 리소스 해제 로직
    console.log("Watch screen hidden");
    // 이전 화면(목록) 표시는 main.js에서 처리 (현재 활성 목록 상태에 따라)
}

function showPlayerLoading(isLoading) {
    if (playerStatusOverlayElement) {
        playerStatusOverlayElement.textContent = isLoading ? '로딩 중...' : '';
        playerStatusOverlayElement.style.display = isLoading ? 'block' : 'none';
    }
}

// WebOS 비디오 플레이어 연동 부분은 여기에 추가될 예정
// function initAndPlayStream(streamUrl) { ... }
// function stopPlayer() { ... } 