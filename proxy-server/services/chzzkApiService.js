const axios = require('axios');

// .env 파일에 정의된 CHZZK_API_BASE_URL 환경 변수를 사용합니다.
// 없다면 기본 URL을 사용하거나, 오류를 발생시킬 수 있습니다. (여기서는 기본값 없이 환경 변수 의존)
const CHZZK_API_BASE_URL = process.env.CHZZK_API_BASE_URL;

if (!CHZZK_API_BASE_URL) {
  console.error('Error: CHZZK_API_BASE_URL is not defined in the environment variables. Please check your .env file.');
  // process.exit(1); // 환경 변수가 없으면 서버 시작을 중단할 수 있습니다.
}

/**
 * 치지직 API를 호출하여 라이브 방송 목록을 가져옵니다.
 * @param {object} queryParams - API 요청 파라미터 (예: { concurrentUserCount, sortType, page, size })
 * @returns {Promise<object>} - API 응답 데이터
 */
const fetchLiveBroadcasts = async (queryParams) => {
  try {
    if (!CHZZK_API_BASE_URL) { // 한번 더 체크 또는 다른 방식의 오류 처리
      throw new Error('CHZZK_API_BASE_URL is not configured.');
    }
    console.log('Fetching live broadcasts with params:', queryParams);
    
    const response = await axios.get(`${CHZZK_API_BASE_URL}/service/v1/lives`, { 
      params: queryParams,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    return response.data; 

  } catch (error) {
    console.error('Error calling Chzzk API (fetchLiveBroadcasts):', error.response ? error.response.data : error.message);
    if (error.response) {
      throw new Error(`Chzzk API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    const errorMessage = error.message || 'Unknown error occurred while fetching live broadcasts';
    const errorCode = error.code || 'UNKNOWN_ERROR';
    throw new Error(`Chzzk API Network Error: ${errorCode} - ${errorMessage}`);
  }
};

/**
 * 치지직 API를 호출하여 스트리머(채널)를 검색합니다.
 * @param {string} keyword - 검색할 키워드
 * @param {object} options - 추가 검색 옵션 (예: { size: 10, offset: 0 })
 * @returns {Promise<object>} - API 응답 데이터 (검색 결과)
 */
const fetchStreamerSearchResults = async (keyword, options = {}) => {
  try {
    if (!CHZZK_API_BASE_URL) {
      throw new Error('CHZZK_API_BASE_URL is not configured.');
    }
    console.log(`Searching for streamers with keyword: "${keyword}", options:`, options);

    // 실제 치지직 검색 API 엔드포인트와 파라미터는 공식 문서를 참고하여 수정해야 합니다.
    // 예시: /service/v1/search/channels 또는 /service/v1/search/users 등
    const SEARCH_API_ENDPOINT = '/service/v1/search/channels'; // 임시 엔드포인트
    
    const params = {
      keyword: keyword,
      size: options.size || 10, // 기본 10개
      offset: options.offset || 0, // 기본 offset 0
      // ... 기타 필요한 검색 관련 파라미터 추가
    };

    const response = await axios.get(`${CHZZK_API_BASE_URL}${SEARCH_API_ENDPOINT}`, {
      params: params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        // 필요한 경우 인증 헤더 등 추가
      }
    });

    return response.data;

  } catch (error) {
    console.error('Error calling Chzzk API (fetchStreamerSearchResults):', error.response ? error.response.data : error.message);
    if (error.response) {
      throw new Error(`Chzzk API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    const errorMessage = error.message || 'Unknown error occurred while searching streamers';
    const errorCode = error.code || 'UNKNOWN_ERROR';
    throw new Error(`Chzzk API Network Error: ${errorCode} - ${errorMessage}`);
  }
};

/**
 * 치지직 API를 호출하여 특정 라이브 방송의 상세 정보를 가져옵니다. (예시 함수)
 * @param {string} liveId - 조회할 라이브 방송 ID
 * @returns {Promise<object>} - API 응답 데이터
 */
// const fetchLiveBroadcastDetails = async (liveId) => {
//   try {
//     console.log(`Fetching live broadcast details for liveId: ${liveId}`);
//     // const response = await axios.get(`${CHZZK_API_BASE_URL}/service/v1/lives/${liveId}`);
//     // return response.data;
//     return Promise.resolve({ id: liveId, title: '상세 정보 테스트', description: '어쩌구 저쩌구...' });
//   } catch (error) {
//     console.error('Error calling Chzzk API (fetchLiveBroadcastDetails):', error.response ? error.response.data : error.message);
//     if (error.response) {
//       throw new Error(`Chzzk API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
//     }
//     throw error;
//   }
// };

module.exports = {
  fetchLiveBroadcasts,
  fetchStreamerSearchResults,
  // fetchLiveBroadcastDetails,
}; 