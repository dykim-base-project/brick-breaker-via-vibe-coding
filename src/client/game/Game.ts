/**
 * 게임 메인 클래스
 *
 * 게임 전체 로직과 게임 루프를 관리합니다.
 * - 게임 상태 관리 (idle, playing, paused, gameover, clear, scores)
 * - 입력 처리 (키보드, 마우스)
 * - 충돌 감지 및 점수 계산
 * - 렌더링
 */

import { GameState, GameConfig, DEFAULT_CONFIG, COLORS } from './types';
import { Paddle } from './Paddle';
import { Ball } from './Ball';
import { BrickManager } from './Brick';
import { i18n, Translations } from '../i18n';

/** 스코어 엔트리 타입 */
interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

export class Game {
  /** Canvas 요소 */
  private canvas: HTMLCanvasElement;

  /** 2D 렌더링 컨텍스트 */
  private ctx: CanvasRenderingContext2D;

  /** 게임 설정 */
  private readonly config: GameConfig;

  /** 게임 상태 */
  private state: GameState = 'idle';

  /** 이전 상태 (스코어 화면에서 복귀용) */
  private previousState: GameState = 'idle';

  /** 게임 오브젝트 */
  private paddle: Paddle;
  private ball: Ball;
  private brickManager: BrickManager;

  /** 게임 데이터 */
  private score: number = 0;
  private lives: number;
  private stage: number = 1;
  private combo: number = 0;

  /** 하이스코어 캐시 */
  private highScores: ScoreEntry[] = [];

  /** 입력 상태 */
  private keys: { [key: string]: boolean } = {};

  /** 게임 루프 ID */
  private animationFrameId: number | null = null;

  /** 콜백 함수 */
  private onScoreChange?: (score: number) => void;
  private onLivesChange?: (lives: number) => void;
  private onStageChange?: (stage: number) => void;
  private onStateChange?: (state: GameState) => void;
  private onGameOver?: (score: number) => void;

  /** i18n 리스너 해제 함수 */
  private unsubscribeI18n?: () => void;

  constructor(canvas: HTMLCanvasElement, config: GameConfig = DEFAULT_CONFIG) {
    this.canvas = canvas;
    this.config = config;
    this.lives = config.lives;

    // Canvas 크기 설정
    this.canvas.width = config.canvas.width;
    this.canvas.height = config.canvas.height;

    // 렌더링 컨텍스트 획득
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context를 얻을 수 없습니다.');
    }
    this.ctx = ctx;

    // 게임 오브젝트 초기화
    this.paddle = new Paddle(config);
    this.ball = new Ball(config);
    this.brickManager = new BrickManager(
      config.brick.width,
      config.brick.height,
      config.brick.rows,
      config.brick.cols,
      config.brick.gap,
      config.brick.topOffset,
      config.canvas.width
    );

    // 이벤트 리스너 등록
    this.setupEventListeners();

    // i18n 변경 리스너 등록
    this.unsubscribeI18n = i18n.onLocaleChange(() => {
      this.render();
    });

    // 하이스코어 로드 후 초기 렌더링
    this.loadHighScores().then(() => {
      this.render();
    });
  }

  /** 번역 텍스트 가져오기 */
  private get t(): Translations {
    return i18n.t();
  }

  /**
   * 하이스코어 로드
   */
  private async loadHighScores(): Promise<void> {
    try {
      const response = await fetch('/api/scores');
      if (response.ok) {
        const data = await response.json();
        this.highScores = data.scores || [];
      }
    } catch (error) {
      console.error('Failed to load high scores:', error);
      this.highScores = [];
    }
  }

  /**
   * 하이스코어 새로고침 및 렌더링
   */
  public async refreshHighScores(): Promise<void> {
    await this.loadHighScores();
    this.render();
  }

  /**
   * 이벤트 리스너 등록
   */
  private setupEventListeners(): void {
    // 키보드 이벤트
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // 마우스 이벤트
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
  }

  /**
   * 키보드 눌림 처리
   */
  private handleKeyDown(e: KeyboardEvent): void {
    this.keys[e.code] = true;

    // S: 스코어 화면 토글 (idle, gameover, clear 상태에서)
    if (e.code === 'KeyS') {
      if (this.state === 'scores') {
        // 스코어 화면에서 나가기
        this.state = this.previousState;
        this.render();
        return;
      } else if (this.state === 'idle' || this.state === 'gameover' || this.state === 'clear') {
        // 스코어 화면으로 진입
        this.previousState = this.state;
        this.state = 'scores';
        this.loadHighScores().then(() => this.render());
        return;
      }
    }

    // 스코어 화면에서는 다른 입력 무시 (ESC로 나가기 허용)
    if (this.state === 'scores') {
      if (e.code === 'Escape') {
        this.state = this.previousState;
        this.render();
      }
      return;
    }

    // 방향키 이동
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.paddle.setDirection(-1);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.paddle.setDirection(1);
    }

    // 스페이스바: 공 발사 / 게임 시작
    if (e.code === 'Space') {
      e.preventDefault();
      if (this.state === 'idle') {
        this.start();
      } else if (this.state === 'playing' && !this.ball.isLaunched()) {
        this.ball.launch();
      }
    }

    // ESC / P: 일시정지 토글
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.state === 'playing') {
        this.pause();
      } else if (this.state === 'paused') {
        this.resume();
      }
    }

    // Q: 일시정지/게임오버/클리어 상태에서 게임 종료 (대기 화면으로)
    if (e.code === 'KeyQ') {
      if (this.state === 'paused' || this.state === 'gameover' || this.state === 'clear') {
        this.quit();
      }
    }

    // ESC: 게임오버/클리어 상태에서도 종료
    if (e.code === 'Escape') {
      if (this.state === 'gameover' || this.state === 'clear') {
        this.quit();
      }
    }

    // R: 재시작 (게임오버 또는 클리어 시)
    if (e.code === 'KeyR') {
      if (this.state === 'gameover' || this.state === 'clear') {
        this.restart();
      }
    }
  }

  /**
   * 키보드 떼기 처리
   */
  private handleKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false;

    // 이동 정지
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      if (!this.keys['ArrowRight'] && !this.keys['KeyD']) {
        this.paddle.setDirection(0);
      } else {
        this.paddle.setDirection(1);
      }
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      if (!this.keys['ArrowLeft'] && !this.keys['KeyA']) {
        this.paddle.setDirection(0);
      } else {
        this.paddle.setDirection(-1);
      }
    }
  }

  /**
   * 마우스 이동 처리
   */
  private handleMouseMove(e: MouseEvent): void {
    if (this.state !== 'playing') return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    this.paddle.setPositionX(mouseX);
  }

  /**
   * 클릭 처리
   */
  private handleClick(): void {
    if (this.state === 'idle') {
      this.start();
    } else if (this.state === 'playing' && !this.ball.isLaunched()) {
      this.ball.launch();
    }
  }

  /**
   * 게임 시작
   */
  public start(): void {
    if (this.state !== 'idle') return;

    this.state = 'playing';
    this.onStateChange?.(this.state);

    // 스테이지 초기화
    this.initStage(this.stage);

    // 게임 루프 시작
    this.gameLoop();
  }

  /**
   * 스테이지 초기화
   */
  private initStage(stage: number): void {
    this.stage = stage;
    this.onStageChange?.(stage);

    // 벽돌 생성
    this.brickManager.createBricks(stage);

    // 패들 및 공 초기화
    this.paddle.reset();
    this.ball.reset(this.paddle);

    // 콤보 리셋
    this.combo = 0;
  }

  /**
   * 일시정지
   */
  public pause(): void {
    if (this.state !== 'playing') return;

    this.state = 'paused';
    this.onStateChange?.(this.state);

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.render();
  }

  /**
   * 재개
   */
  public resume(): void {
    if (this.state !== 'paused') return;

    this.state = 'playing';
    this.onStateChange?.(this.state);

    this.gameLoop();
  }

  /**
   * 게임 종료 (대기 화면으로)
   */
  public quit(): void {
    if (this.state !== 'paused' && this.state !== 'gameover' && this.state !== 'clear') return;

    // 상태 초기화
    this.state = 'idle';
    this.score = 0;
    this.lives = this.config.lives;
    this.stage = 1;
    this.combo = 0;

    // 콜백 호출
    this.onScoreChange?.(this.score);
    this.onLivesChange?.(this.lives);
    this.onStageChange?.(this.stage);
    this.onStateChange?.(this.state);

    // 게임 오브젝트 초기화
    this.paddle.reset();
    this.ball.reset(this.paddle);

    // 하이스코어 새로고침 후 렌더링
    this.loadHighScores().then(() => {
      this.render();
    });
  }

  /**
   * 재시작
   */
  public restart(): void {
    // 상태 초기화
    this.state = 'idle';
    this.score = 0;
    this.lives = this.config.lives;
    this.stage = 1;
    this.combo = 0;

    // 콜백 호출
    this.onScoreChange?.(this.score);
    this.onLivesChange?.(this.lives);
    this.onStageChange?.(this.stage);
    this.onStateChange?.(this.state);

    // 게임 오브젝트 초기화
    this.paddle.reset();
    this.ball.reset(this.paddle);

    // 하이스코어 새로고침 후 렌더링
    this.loadHighScores().then(() => {
      this.render();
    });
  }

  /**
   * 게임 루프
   */
  private gameLoop(): void {
    if (this.state !== 'playing') return;

    this.update();
    this.render();

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * 게임 업데이트
   */
  private update(): void {
    // 패들 업데이트
    this.paddle.update();

    // 공 업데이트
    const ballResult = this.ball.update(this.paddle);

    // 공을 잃었을 때
    if (ballResult === 'lost') {
      this.handleBallLost();
      return;
    }

    // 벽돌 충돌 체크
    this.checkBrickCollisions();

    // 스테이지 클리어 체크
    if (this.brickManager.getRemainingCount() === 0) {
      this.handleStageClear();
    }
  }

  /**
   * 공 잃음 처리
   */
  private handleBallLost(): void {
    this.lives -= 1;
    this.combo = 0;
    this.onLivesChange?.(this.lives);

    if (this.lives <= 0) {
      // 게임 오버
      this.state = 'gameover';
      this.onStateChange?.(this.state);
      this.onGameOver?.(this.score);

      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // 하이스코어 새로고침 후 렌더링
      this.loadHighScores().then(() => {
        this.render();
      });
    } else {
      // 공 리셋
      this.ball.reset(this.paddle);
    }
  }

  /**
   * 스테이지 클리어 처리
   */
  private handleStageClear(): void {
    if (this.stage >= 3) {
      // 전체 클리어
      this.state = 'clear';
      this.onStateChange?.(this.state);
      this.onGameOver?.(this.score);

      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // 하이스코어 새로고침 후 렌더링
      this.loadHighScores().then(() => {
        this.render();
      });
    } else {
      // 다음 스테이지
      this.initStage(this.stage + 1);
    }
  }

  /**
   * 벽돌 충돌 체크
   */
  private checkBrickCollisions(): void {
    const activeBricks = this.brickManager.getActiveBricks();

    for (const brick of activeBricks) {
      const hit = this.ball.checkBrickCollision(
        brick.getX(),
        brick.getY(),
        brick.getWidth(),
        brick.getHeight()
      );

      if (hit) {
        const destroyed = brick.hit();

        if (destroyed) {
          // 콤보 증가
          this.combo += 1;

          // 콤보 보너스 계산
          let multiplier = 1;
          if (this.combo >= 10) {
            multiplier = 2;
          } else if (this.combo >= 5) {
            multiplier = 1.5;
          }

          // 점수 추가
          const points = Math.floor(brick.getScore() * multiplier);
          this.score += points;
          this.onScoreChange?.(this.score);
        }

        // 하나의 벽돌만 충돌 처리
        break;
      }
    }
  }

  /**
   * 렌더링
   */
  private render(): void {
    // 배경 클리어
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    // 게임 상태에 따른 렌더링
    if (this.state === 'idle') {
      this.renderIdleScreen();
    } else if (this.state === 'scores') {
      this.renderScoresScreen();
    } else if (this.state === 'playing' || this.state === 'paused') {
      this.renderGameScreen();
      if (this.state === 'paused') {
        this.renderPauseOverlay();
      }
    } else if (this.state === 'gameover') {
      this.renderGameScreen();
      this.renderGameOverOverlay();
    } else if (this.state === 'clear') {
      this.renderGameScreen();
      this.renderClearOverlay();
    }
  }

  /**
   * 대기 화면 렌더링
   */
  private renderIdleScreen(): void {
    const centerX = this.config.canvas.width / 2;
    const centerY = this.config.canvas.height / 2;

    // 타이틀
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.t.title, centerX, 100);

    // TOP 3 하이스코어
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillStyle = COLORS.warning;
    this.ctx.fillText(this.t.idle.highScores, centerX, 180);

    this.ctx.font = '18px Arial';
    const top3 = this.highScores.slice(0, 3);
    if (top3.length > 0) {
      top3.forEach((entry, index) => {
        const y = 220 + index * 30;
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
        this.ctx.fillStyle = COLORS.text;
        this.ctx.fillText(`${medal} ${entry.name}: ${entry.score}`, centerX, y);
      });
    } else {
      this.ctx.fillStyle = COLORS.textMuted;
      this.ctx.fillText(this.t.idle.noScores, centerX, 220);
    }

    // 시작 안내
    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = COLORS.primary;
    this.ctx.fillText(this.t.idle.startPrompt, centerX, centerY + 80);

    // 조작 안내
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = COLORS.textMuted;
    this.ctx.fillText(this.t.idle.controls, centerX, centerY + 120);

    // 스코어 화면 진입 안내
    this.ctx.fillStyle = COLORS.success;
    this.ctx.fillText(this.t.idle.scoreboardPrompt, centerX, centerY + 150);
  }

  /**
   * 스코어 조회 화면 렌더링
   */
  private renderScoresScreen(): void {
    const centerX = this.config.canvas.width / 2;

    // 타이틀
    this.ctx.fillStyle = COLORS.warning;
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.t.scores.title, centerX, 60);

    // 스코어 테이블 헤더
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillStyle = COLORS.textMuted;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(this.t.scores.rank, 150, 110);
    this.ctx.fillText(this.t.scores.name, 250, 110);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(this.t.scores.score, 550, 110);
    this.ctx.fillText(this.t.scores.date, 700, 110);

    // 구분선
    this.ctx.strokeStyle = COLORS.textMuted;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(100, 125);
    this.ctx.lineTo(700, 125);
    this.ctx.stroke();

    // 스코어 목록
    this.ctx.font = '16px Arial';
    if (this.highScores.length > 0) {
      this.highScores.slice(0, 10).forEach((entry, index) => {
        const y = 155 + index * 35;
        const rank = index + 1;

        // 순위별 색상
        if (rank === 1) {
          this.ctx.fillStyle = '#FFD700'; // Gold
        } else if (rank === 2) {
          this.ctx.fillStyle = '#C0C0C0'; // Silver
        } else if (rank === 3) {
          this.ctx.fillStyle = '#CD7F32'; // Bronze
        } else {
          this.ctx.fillStyle = COLORS.text;
        }

        this.ctx.textAlign = 'left';
        this.ctx.fillText(`#${rank}`, 150, y);
        this.ctx.fillText(entry.name, 250, y);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(entry.score.toLocaleString(), 550, y);

        // 날짜 포맷팅
        const date = new Date(entry.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        this.ctx.fillStyle = COLORS.textMuted;
        this.ctx.fillText(dateStr, 700, y);
      });
    } else {
      this.ctx.fillStyle = COLORS.textMuted;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.t.scores.noRecords, centerX, 200);
      this.ctx.fillText(this.t.scores.playFirst, centerX, 240);
    }

    // 돌아가기 안내
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = COLORS.primary;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.t.scores.back, centerX, this.config.canvas.height - 40);
  }

  /**
   * 게임 화면 렌더링
   */
  private renderGameScreen(): void {
    // 벽돌
    this.brickManager.render(this.ctx);

    // 패들
    this.paddle.render(this.ctx);

    // 공
    this.ball.render(this.ctx);

    // HUD
    this.renderHUD();
  }

  /**
   * HUD 렌더링
   */
  private renderHUD(): void {
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // 점수
    this.ctx.fillText(`${this.t.game.score}: ${this.score}`, 10, 10);

    // 스테이지
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.t.game.stage} ${this.stage}`, this.config.canvas.width / 2, 10);

    // 생명
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = COLORS.danger;
    const hearts = '♥'.repeat(this.lives);
    this.ctx.fillText(hearts, this.config.canvas.width - 10, 10);

    // 콤보 (5 이상일 때만 표시)
    if (this.combo >= 5) {
      this.ctx.fillStyle = COLORS.warning;
      this.ctx.textAlign = 'left';
      const multiplier = this.combo >= 10 ? 'x2' : 'x1.5';
      this.ctx.fillText(`${this.t.game.combo}: ${this.combo} (${multiplier})`, 10, 30);
    }
  }

  /**
   * 일시정지 오버레이
   */
  private renderPauseOverlay(): void {
    const centerX = this.config.canvas.width / 2;
    const centerY = this.config.canvas.height / 2;

    // 반투명 배경
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    // 타이틀
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.t.pause.title, centerX, centerY - 30);

    // 안내
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = COLORS.textMuted;
    this.ctx.fillText(this.t.pause.resume, centerX, centerY + 30);

    this.ctx.fillStyle = COLORS.danger;
    this.ctx.fillText(this.t.pause.quit, centerX, centerY + 60);
  }

  /**
   * 게임오버 오버레이
   */
  private renderGameOverOverlay(): void {
    const centerX = this.config.canvas.width / 2;
    const centerY = this.config.canvas.height / 2;

    // 반투명 배경
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    // 게임 오버 텍스트
    this.ctx.fillStyle = COLORS.danger;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.t.gameover.title, centerX, centerY - 100);

    // 최종 점수
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`${this.t.gameover.finalScore}: ${this.score}`, centerX, centerY - 40);

    // TOP 3 하이스코어
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillStyle = COLORS.warning;
    this.ctx.fillText(this.t.gameover.top3, centerX, centerY + 20);

    this.ctx.font = '16px Arial';
    const top3 = this.highScores.slice(0, 3);
    if (top3.length > 0) {
      top3.forEach((entry, index) => {
        const y = centerY + 55 + index * 25;
        this.ctx.fillStyle = COLORS.text;
        this.ctx.fillText(`${index + 1}. ${entry.name}: ${entry.score}`, centerX, y);
      });
    } else {
      this.ctx.fillStyle = COLORS.textMuted;
      this.ctx.fillText(this.t.idle.noScores, centerX, centerY + 55);
    }

    // 안내
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = COLORS.textMuted;
    this.ctx.fillText(this.t.gameover.restart, centerX, centerY + 150);
    this.ctx.fillStyle = COLORS.success;
    this.ctx.fillText(this.t.gameover.scoreboard, centerX, centerY + 175);
    this.ctx.fillStyle = COLORS.danger;
    this.ctx.fillText(this.t.gameover.quit, centerX, centerY + 200);
  }

  /**
   * 클리어 오버레이
   */
  private renderClearOverlay(): void {
    const centerX = this.config.canvas.width / 2;
    const centerY = this.config.canvas.height / 2;

    // 반투명 배경
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    // 클리어 텍스트
    this.ctx.fillStyle = COLORS.success;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.t.clear.title, centerX, centerY - 100);

    // 최종 점수
    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = '28px Arial';
    this.ctx.fillText(`${this.t.clear.finalScore}: ${this.score}`, centerX, centerY - 40);

    // TOP 3 하이스코어
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillStyle = COLORS.warning;
    this.ctx.fillText(this.t.clear.top3, centerX, centerY + 20);

    this.ctx.font = '16px Arial';
    const top3 = this.highScores.slice(0, 3);
    if (top3.length > 0) {
      top3.forEach((entry, index) => {
        const y = centerY + 55 + index * 25;
        this.ctx.fillStyle = COLORS.text;
        this.ctx.fillText(`${index + 1}. ${entry.name}: ${entry.score}`, centerX, y);
      });
    } else {
      this.ctx.fillStyle = COLORS.textMuted;
      this.ctx.fillText(this.t.idle.noScores, centerX, centerY + 55);
    }

    // 안내
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = COLORS.textMuted;
    this.ctx.fillText(this.t.clear.playAgain, centerX, centerY + 150);
    this.ctx.fillStyle = COLORS.success;
    this.ctx.fillText(this.t.clear.scoreboard, centerX, centerY + 175);
    this.ctx.fillStyle = COLORS.danger;
    this.ctx.fillText(this.t.clear.quit, centerX, centerY + 200);
  }

  /**
   * 콜백 등록
   */
  public setOnScoreChange(callback: (score: number) => void): void {
    this.onScoreChange = callback;
  }

  public setOnLivesChange(callback: (lives: number) => void): void {
    this.onLivesChange = callback;
  }

  public setOnStageChange(callback: (stage: number) => void): void {
    this.onStageChange = callback;
  }

  public setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  public setOnGameOver(callback: (score: number) => void): void {
    this.onGameOver = callback;
  }

  /** 현재 상태 getter */
  public getState(): GameState {
    return this.state;
  }

  public getScore(): number {
    return this.score;
  }

  /**
   * 리소스 정리
   */
  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.unsubscribeI18n) {
      this.unsubscribeI18n();
    }
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}
