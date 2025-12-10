/**
 * DX-Ball Vibe Code - Express 단일 서버
 *
 * 단일 서버로 정적 파일과 API를 함께 서빙합니다.
 * - 정적 파일: dist/client (Vite 빌드 결과)
 * - API: /api/* 엔드포인트
 *
 * 개발/프로덕션 동일 구조로 동작합니다.
 */

import express, { Application, Request, Response } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { apiRouter } from './routes/api.js';

// ES Module에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express 앱 생성
const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// JSON 파싱 미들웨어
app.use(express.json());

// API 라우트
app.use('/api', apiRouter);

// 정적 파일 서빙 (개발/프로덕션 동일)
// tsx 실행 시: src/server/ 기준 → ../../dist/client
// node 실행 시: dist/server/ 기준 → ../client
const clientPath = process.env.NODE_ENV === 'production'
  ? join(__dirname, '../client')
  : join(__dirname, '../../dist/client');

app.use(express.static(clientPath));

// SPA 폴백: 모든 경로를 index.html로 (Express 5 문법)
app.get('/{*path}', (_req: Request, res: Response) => {
  res.sendFile(join(clientPath, 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`[Server] DX-Ball Vibe Code running at http://localhost:${PORT}`);
  console.log(`[Server] Static files: ${clientPath}`);
});
