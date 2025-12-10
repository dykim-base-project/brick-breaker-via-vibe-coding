/**
 * 벽돌 클래스
 *
 * 게임에서 파괴해야 하는 벽돌을 담당합니다.
 * - 타입별 내구도와 점수
 * - 충돌 시 내구도 감소
 */

import { Position, BrickType, BrickConfig, BRICK_CONFIGS } from './types';

export class Brick {
  /** 벽돌 위치 */
  private readonly position: Position;

  /** 벽돌 크기 */
  private readonly width: number;
  private readonly height: number;

  /** 벽돌 설정 */
  private readonly config: BrickConfig;

  /** 현재 내구도 */
  private durability: number;

  /** 파괴 여부 */
  private destroyed: boolean = false;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    type: BrickType = 'normal'
  ) {
    this.position = { x, y };
    this.width = width;
    this.height = height;
    this.config = BRICK_CONFIGS[type];
    this.durability = this.config.durability;
  }

  /**
   * 벽돌에 데미지 (충돌 시 호출)
   * @returns 파괴되었으면 true
   */
  public hit(): boolean {
    this.durability -= 1;

    if (this.durability <= 0) {
      this.destroyed = true;
      return true;
    }

    return false;
  }

  /**
   * 벽돌 렌더링
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (this.destroyed) return;

    // 내구도에 따른 색상 조정 (강화 벽돌)
    let color = this.config.color;
    if (this.config.type === 'hard' && this.durability === 1) {
      // 강화 벽돌이 1번 맞으면 색상 변경
      color = '#D97706'; // amber-600
    }

    ctx.fillStyle = color;
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

    // 테두리
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
  }

  /** 파괴 여부 */
  public isDestroyed(): boolean {
    return this.destroyed;
  }

  /** 점수 */
  public getScore(): number {
    return this.config.score;
  }

  /** 위치 및 크기 getter */
  public getX(): number {
    return this.position.x;
  }

  public getY(): number {
    return this.position.y;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }
}

/**
 * 벽돌 매니저 클래스
 *
 * 전체 벽돌 배치 및 관리를 담당합니다.
 */
export class BrickManager {
  /** 벽돌 배열 */
  private bricks: Brick[] = [];

  /** 벽돌 설정 */
  private readonly brickWidth: number;
  private readonly brickHeight: number;
  private readonly rows: number;
  private readonly cols: number;
  private readonly gap: number;
  private readonly topOffset: number;
  private readonly canvasWidth: number;

  constructor(
    brickWidth: number,
    brickHeight: number,
    rows: number,
    cols: number,
    gap: number,
    topOffset: number,
    canvasWidth: number
  ) {
    this.brickWidth = brickWidth;
    this.brickHeight = brickHeight;
    this.rows = rows;
    this.cols = cols;
    this.gap = gap;
    this.topOffset = topOffset;
    this.canvasWidth = canvasWidth;
  }

  /**
   * 스테이지별 벽돌 생성
   */
  public createBricks(stage: number): void {
    this.bricks = [];

    // 전체 벽돌 영역 너비
    const totalWidth = this.cols * (this.brickWidth + this.gap) - this.gap;
    const startX = (this.canvasWidth - totalWidth) / 2;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = startX + col * (this.brickWidth + this.gap);
        const y = this.topOffset + row * (this.brickHeight + this.gap);

        // 스테이지별 벽돌 타입 결정
        const type = this.getBrickType(stage, row, col);

        this.bricks.push(new Brick(x, y, this.brickWidth, this.brickHeight, type));
      }
    }
  }

  /**
   * 스테이지와 위치에 따른 벽돌 타입 결정
   */
  private getBrickType(stage: number, row: number, _col: number): BrickType {
    // 스테이지 1: 일반 벽돌만
    if (stage === 1) {
      return 'normal';
    }

    // 스테이지 2: 일반 + 강화
    if (stage === 2) {
      if (row < 2) return 'hard';
      return 'normal';
    }

    // 스테이지 3+: 일반 + 강화 + 특수
    if (row === 0) return 'special';
    if (row < 2) return 'hard';
    return 'normal';
  }

  /**
   * 모든 벽돌 렌더링
   */
  public render(ctx: CanvasRenderingContext2D): void {
    for (const brick of this.bricks) {
      brick.render(ctx);
    }
  }

  /**
   * 활성화된 벽돌 배열 반환 (충돌 체크용)
   */
  public getActiveBricks(): Brick[] {
    return this.bricks.filter((brick) => !brick.isDestroyed());
  }

  /**
   * 남은 벽돌 수
   */
  public getRemainingCount(): number {
    return this.getActiveBricks().length;
  }
}
