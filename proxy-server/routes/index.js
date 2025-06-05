const express = require('express');
const router = express.Router();

const liveRoutes = require('./liveRoutes');
const searchRoutes = require('./searchRoutes');

// 라이브 방송 관련 라우트
router.use('/lives', liveRoutes);

// 검색 관련 라우트
router.use('/search', searchRoutes);

// 추후 다른 기능 라우트 추가 가능 (예: /channels, /users 등)
// router.use('/channels', channelRoutes);

module.exports = router; 