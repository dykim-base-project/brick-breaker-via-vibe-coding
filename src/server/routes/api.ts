/**
 * API 라우트 정의
 *
 * 모든 API 엔드포인트를 이 파일에서 정의합니다.
 * - GET /api/health: 헬스체크
 * - GET /api/scores: 하이스코어 조회
 * - POST /api/scores: 하이스코어 저장
 */

import { Router, Request, Response } from 'express';
import { StorageService } from '../services/storage.js';

export const apiRouter: Router = Router();
const storage = new StorageService();

/**
 * 헬스체크 엔드포인트
 * Docker 헬스체크에서 사용
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 하이스코어 조회
 */
apiRouter.get('/scores', async (_req: Request, res: Response) => {
  try {
    const scores = await storage.getScores();
    res.json(scores);
  } catch (error) {
    console.error('[API] Failed to get scores:', error);
    res.status(500).json({ error: 'Failed to get scores' });
  }
});

/**
 * 하이스코어 저장
 */
apiRouter.post('/scores', async (req: Request, res: Response) => {
  try {
    const { name, score } = req.body;

    // 입력 검증
    if (!name || typeof score !== 'number') {
      res.status(400).json({ error: 'Invalid input: name and score required' });
      return;
    }

    const result = await storage.addScore(name, score);
    res.json(result);
  } catch (error) {
    console.error('[API] Failed to save score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});
