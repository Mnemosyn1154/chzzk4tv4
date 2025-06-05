const chzzkApiService = require('../services/chzzkApiService');

// 라이브 방송 목록 조회 컨트롤러
const getLiveBroadcasts = async (req, res, next) => {
  try {
    // 클라이언트로부터 전달된 query 파라미터를 chzzkApiService로 전달합니다.
    const liveBroadcasts = await chzzkApiService.fetchLiveBroadcasts(req.query);
    
    // API 응답 구조에 따라 content.data 또는 다른 경로를 사용해야 할 수 있습니다.
    // 현재는 API 응답 전체를 그대로 전달합니다.
    res.status(200).json(liveBroadcasts);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in getLiveBroadcasts controller: ${error.message}\nStack: ${error.stack}\nRequest: ${req.method} ${req.originalUrl}`);
    // 에러 응답을 클라이언트에게 전달
    // error 객체에 status 코드가 있다면 사용하고, 없다면 500을 기본으로 사용합니다.
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: error.message || '라이브 방송 목록을 가져오는 중 오류가 발생했습니다.',
      // error: error // 개발 중에는 전체 에러 객체를 포함할 수 있으나, 프로덕션에서는 민감한 정보를 제외하는 것이 좋습니다.
    });
  }
};

// 특정 라이브 방송 상세 정보 조회 컨트롤러 (예시)
// const getLiveBroadcastDetails = async (req, res, next) => {
//   try {
//     const { liveId } = req.params;
//     const liveDetails = await chzzkApiService.fetchLiveBroadcastDetails(liveId);
//     res.status(200).json(liveDetails);
//   } catch (error) {
//     console.error('Error in getLiveBroadcastDetails controller:', error.message);
//     const statusCode = error.statusCode || 500;
//     res.status(statusCode).json({ 
//       message: error.message || `라이브 방송 상세 정보(ID: ${liveId})를 가져오는 중 오류가 발생했습니다.`,
//     });
//   }
// };

module.exports = {
  getLiveBroadcasts,
  // getLiveBroadcastDetails,
}; 