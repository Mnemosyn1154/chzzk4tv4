const express = require('express');
const router = express.Router();
const liveController = require('../controllers/liveController');

// 라이브 방송 목록 조회
router.get('/', liveController.getLiveBroadcasts);

// 특정 라이브 방송 상세 정보 조회 (예시)
// router.get('/:liveId', liveController.getLiveBroadcastDetails);

module.exports = router; 