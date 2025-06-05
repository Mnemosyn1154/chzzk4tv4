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
            console.log("Full live details for channel fetched:", data);
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

// 모듈 내보내기
window.ChzzkAPI = {
    fetchLives: fetchLives,
    fetchSearchResults: fetchSearchResults,
    fetchFullLiveDetails: fetchFullLiveDetails
}; 