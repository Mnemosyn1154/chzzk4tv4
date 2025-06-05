require('dotenv').config(); // .env 파일의 환경 변수를 로드합니다.

const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
// PORT 환경 변수를 사용하고, 없다면 기본값 3000을 사용합니다.
const PORT = process.env.PORT || 3000;

// CORS 미들웨어 설정
app.use(cors({
  origin: '*', // 모든 출처 허용 (개발 중에는 편의상 이렇게 설정하고, 프로덕션에서는 특정 도메인으로 제한하는 것이 좋습니다)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// JSON 요청 본문 파싱 미들웨어
app.use(express.json());

// 라우터 설정
app.use('/api', routes);

// 간단한 루트 응답
app.get('/', (req, res) => {
  res.send('Chzzk API Proxy Server is running!');
});

// 에러 처리 미들웨어 (예시)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Proxy server listening at http://localhost:${PORT}`);
});

module.exports = app; 