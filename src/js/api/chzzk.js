// Chzzk API 관련 함수들 (ES5 호환)
var CHZZK_API_LIVES = 'https://api.chzzk.naver.com/service/v1/lives';
var CHZZK_API_SEARCH_CHANNELS = 'https://api.chzzk.naver.com/service/v1/search/channels';

/**
 * API 호출 기본 함수
 * @param {string} url - 호출할 API URL
 * @returns {Promise<any>} API 응답 데이터
 */
function fetchData(url) {
    return fetch(url).then(function(response) {
        if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
        }
        return response.json();
    }).then(function(data) {
        // 치지직 API는 보통 content 객체 안에 실제 데이터가 있음
        return data.content || data;
    });
}

/**
 * 실시간 방송 목록 가져오기
 * @returns {Promise<Array>} 방송 목록 배열
 */
function fetchLives() {
    return fetchData(CHZZK_API_LIVES).then(function(data) {
        return data.data || []; // 실제 방송 목록은 data.data 에 있을 수 있음
    });
}

/**
 * 채널 검색 결과 가져오기
 * @param {string} keyword - 검색 키워드
 * @returns {Promise<Array>} 검색 결과 배열
 */
function fetchSearchResults(keyword) {
    var url = CHZZK_API_SEARCH_CHANNELS + '?keyword=' + encodeURIComponent(keyword);
    return fetchData(url).then(function(data) {
        return data.data || []; // 실제 채널 목록은 data.data 에 있을 수 있음
    });
}

/**
 * 개별 채널의 현재 라이브 상태 확인
 * @param {string} channelId - 채널 ID
 * @returns {Promise<Object|null>} 라이브 중이면 라이브 데이터, 아니면 null
 */
function fetchChannelLiveStatus(channelId) {
    if (!channelId) {
        console.error("fetchChannelLiveStatus: channelId is missing");
        return Promise.resolve(null);
    }

    var apiUrl = 'https://api.chzzk.naver.com/service/v2/channels/' + channelId + '/live-detail';
    
    return fetch(apiUrl).then(function(response) {
        if (!response.ok) {
            if (response.status === 404) {
                // 404는 라이브 중이 아님을 의미
                return null;
            } else {
                throw new Error('API call failed with status: ' + response.status);
            }
        }
        return response.json();
    }).then(function(data) {
        if (data && data.content) {
            var content = data.content;
            
            // 치지직 라이브 상태 체크 - 'OPEN' 상태가 라이브 중을 의미
            if (content.status === 'OPEN' || content.status === 'STARTED' || 
                content.liveStatus === 'OPEN' || content.liveStatus === 'STARTED') {
                return content;
            }
        }
        return null;
    }).catch(function(error) {
        console.error('Error fetching channel live status for channelId ' + channelId + ':', error);
        return null;
    });
}

/**
 * 즐겨찾기 채널들의 현재 라이브 상태 확인
 * @returns {Promise<Array>} 현재 라이브 중인 즐겨찾기 채널 목록
 */
function fetchFavoriteLiveChannels() {
    if (!window.FavoriteManager) {
        return Promise.resolve([]);
    }
    
    var favorites = window.FavoriteManager.getFavorites();
    if (!favorites || favorites.length === 0) {
        return Promise.resolve([]);
    }
    
    // 모든 즐겨찾기 채널의 라이브 상태를 병렬로 확인
    var promises = favorites.map(function(favorite) {
        return fetchChannelLiveStatus(favorite.channelId).then(function(liveData) {
            if (liveData) {
                // 라이브 중인 경우 채널 정보와 라이브 정보 합치기
                return {
                    liveTitle: liveData.liveTitle,
                    liveImageUrl: liveData.liveImageUrl,
                    concurrentUserCount: liveData.concurrentUserCount || 0,
                    livePlaybackJson: liveData.livePlaybackJson,
                    status: liveData.status,
                    channel: {
                        channelId: favorite.channelId,
                        channelName: favorite.channelName,
                        channelImageUrl: favorite.channelImageUrl
                    }
                };
            }
            return null;
        });
    });
    
    return Promise.all(promises).then(function(results) {
        // null이 아닌 라이브 중인 채널들만 필터링
        return results.filter(function(result) {
            return result !== null;
        });
    });
}

/**
 * 라이브 상세 정보 가져오기
 * @param {Object} liveDataObject - 기본 라이브 데이터 객체
 * @returns {Promise<Object|null>} 상세 라이브 정보 또는 null
 */
function fetchFullLiveDetails(liveDataObject) {
    if (!liveDataObject) {
        console.error("fetchFullLiveDetails: liveDataObject is missing");
        return Promise.resolve(null);
    }

    var channelId = null;
    if (liveDataObject.channel && liveDataObject.channel.channelId) { 
        channelId = liveDataObject.channel.channelId;
    } else if (liveDataObject.channelId) { 
        channelId = liveDataObject.channelId;
    }

    if (!channelId) {
        console.error("fetchFullLiveDetails: channelId could not be extracted from liveDataObject", liveDataObject);
        return Promise.resolve(null);
    }

    var apiUrl = 'https://api.chzzk.naver.com/service/v2/channels/' + channelId + '/live-detail';

    console.log('Fetching full live details for channelId: ' + channelId + ' from ' + apiUrl);
    
    return fetch(apiUrl).then(function(response) {
        if (!response.ok) {
            return response.text().then(function(errorText) {
                if (response.status === 404) {
                    console.error('API call failed: 404 Not Found for channelId ' + channelId + ' at ' + apiUrl + '. Response: ' + errorText);
                } else {
                    throw new Error('API call failed with status: ' + response.status + '. Response: ' + errorText);
                }
                return null;
            }).catch(function() {
                console.error('Failed to get error text for status: ' + response.status);
                return null;
            });
        }
        return response.json();
    }).then(function(data) {
        if (data && data.content) {
            console.log("Full live details for channel fetched:", data.content);
            return data.content;
        } else {
            console.error("No content in API response for full live details (channel)", data);
            return null;
        }
    }).catch(function(error) {
        console.error('Error fetching full live details for channelId ' + channelId + ':', error);
        return null;
    });
}

/**
 * 채팅 액세스 토큰 가져오기
 * @param {string} chatChannelId - 채팅 채널 ID (live-detail API에서 얻어온 값)
 * @returns {Promise<string|null>} 액세스 토큰 또는 null
 */
function fetchChatAccessToken(chatChannelId) {
    console.log("Fetching chat access token for chatChannelId: " + chatChannelId);
    if (!chatChannelId) {
        console.error("fetchChatAccessToken: chatChannelId is missing");
        return Promise.resolve(null);
    }
    
    // 실제 웹에서 사용하는 공식 API 주소
    var apiUrl = 'https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId=' + chatChannelId + '&chatType=STREAMING';
    
    console.log("Requesting chat access token from: " + apiUrl);

    // 이 API는 응답 형식이 다를 수 있으므로 별도 fetch 사용
    return fetch(apiUrl)
        .then(function(response) {
            if (!response.ok) {
                // 에러 응답의 본문을 텍스트로 읽어 로깅
                return response.text().then(function(text) {
                    throw new Error('Failed to fetch chat access token. Status: ' + response.status + ', Body: ' + text);
                });
            }
            return response.json();
        })
        .then(function(data) {
            if (data && data.content && data.content.accessToken) {
                console.log("Successfully fetched chat access token.");
                return data.content.accessToken;
            } else {
                console.error("Failed to get chat access token from response:", data);
                return null;
            }
        })
        .catch(function(error) {
            console.error('Error during fetchChatAccessToken for chatChannelId ' + chatChannelId + ':', error);
            return null;
        });
}

// 모듈 내보내기
window.ChzzkAPI = {
    fetchLives: fetchLives,
    fetchSearchResults: fetchSearchResults,
    fetchFullLiveDetails: fetchFullLiveDetails,
    fetchChannelLiveStatus: fetchChannelLiveStatus,
    fetchFavoriteLiveChannels: fetchFavoriteLiveChannels,
    fetchChatAccessToken: fetchChatAccessToken
}; 