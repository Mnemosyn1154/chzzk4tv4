const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// 스트리머 (채널) 검색 라우트
// GET /api/search/streamers?keyword=검색어
router.get('/streamers', searchController.searchStreamers);

module.exports = router; 