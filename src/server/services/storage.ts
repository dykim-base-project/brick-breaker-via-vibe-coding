/**
 * 파일 기반 저장소 서비스
 *
 * JSON 파일을 사용한 간단한 데이터 영속성 레이어입니다.
 * - 하이스코어 저장/조회
 * - 게임 설정 저장/조회
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// ES Module에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** 스코어 항목 타입 */
export interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

/** 스코어 데이터 타입 */
export interface ScoresData {
  scores: ScoreEntry[];
}

/**
 * 파일 기반 저장소 서비스 클래스
 */
export class StorageService {
  private readonly dataDir: string;
  private readonly scoresFile: string;

  constructor() {
    // 프로덕션: /app/data, 개발: ./data
    this.dataDir = process.env.NODE_ENV === 'production'
      ? '/app/data'
      : join(__dirname, '../../../data');
    this.scoresFile = join(this.dataDir, 'highscores.json');
  }

  /**
   * 데이터 디렉토리 초기화
   */
  private async ensureDataDir(): Promise<void> {
    if (!existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
    }
  }

  /**
   * 하이스코어 목록 조회
   */
  async getScores(): Promise<ScoreEntry[]> {
    await this.ensureDataDir();

    if (!existsSync(this.scoresFile)) {
      return [];
    }

    const content = await readFile(this.scoresFile, 'utf-8');
    const data: ScoresData = JSON.parse(content);
    return data.scores;
  }

  /**
   * 하이스코어 추가
   * 상위 10개만 유지
   */
  async addScore(name: string, score: number): Promise<ScoreEntry> {
    await this.ensureDataDir();

    const scores = await this.getScores();
    const newEntry: ScoreEntry = {
      name,
      score,
      date: new Date().toISOString(),
    };

    scores.push(newEntry);

    // 점수 내림차순 정렬 후 상위 10개만 유지
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 10);

    const data: ScoresData = { scores: topScores };
    await writeFile(this.scoresFile, JSON.stringify(data, null, 2), 'utf-8');

    return newEntry;
  }
}
