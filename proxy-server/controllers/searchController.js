const chzzkApiService = require('../services/chzzkApiService');

// 스트리머 (채널) 검색 컨트롤러
const searchStreamers = async (req, res, next) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword) {
      return res.status(400).json({ message: '검색어(keyword)가 필요합니다.' });
    }

    const rawResults = await chzzkApiService.fetchStreamerSearchResults(keyword, req.query); // req.query를 넘겨서 size, offset 등도 전달 가능하게
    // 데이터 가공 시작
    let processedData = [];
    if (rawResults && rawResults.content && rawResults.content.data) {
      processedData = rawResults.content.data.map(item => {
        if (item.channel) { // API 응답에 channel 객체가 있는 경우
          let currentLiveImageUrl = null;
          // 라이브 중이고, API 응답에 liveImageUrl이 있다면 해당 값을 사용
          if (item.channel.openLive && typeof item.channel.liveImageUrl === 'string' && item.channel.liveImageUrl.length > 0) {
            currentLiveImageUrl = item.channel.liveImageUrl;
          }

          return {
            channelId: item.channel.channelId,
            channelName: item.channel.channelName,
            channelImageUrl: item.channel.channelImageUrl, // 채널 대표 이미지
            liveImageUrl: currentLiveImageUrl, // 실제 라이브 썸네일 (라이브 중일 때만 유효값)
            followerCount: item.channel.followerCount,
            isLive: item.channel.openLive || false, // openLive 값을 boolean으로, 없으면 false
            description: item.channel.channelDescription || '',
            verifiedMark: item.channel.verifiedMark || false,
          };
        }
        return null; // channel 객체가 없는 아이템은 null로 처리 (이후 필터링)
      }).filter(channel => channel !== null); // null이 아닌 유효한 채널 정보만 필터링
    }

    // 가공된 데이터를 포함하여 전체 응답 구조를 유지하거나, 필요한 부분만 선택하여 새로운 응답 구조 생성 가능
    // 여기서는 content.data 부분만 가공된 데이터로 교체하고, 나머지 page 정보 등은 유지
    const response = {
      code: rawResults.code || 200,
      message: rawResults.message || null,
      content: {
        size: processedData.length, // 실제 가공된 데이터의 수
        page: rawResults.content && rawResults.content.page ? rawResults.content.page : null, // 페이지 정보 유지
        data: processedData, // 가공된 채널 목록
      },
    };
    
    res.status(200).json(response);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in searchStreamers controller: ${error.message}\nStack: ${error.stack}\nRequest: ${req.method} ${req.originalUrl}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: error.message || '스트리머 검색 중 오류가 발생했습니다.',
    });
  }
};

module.exports = {
  searchStreamers,
}; 