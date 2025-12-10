/**
 * 패들 클래스
 *
 * 플레이어가 조작하는 패들을 담당합니다.
 * - 마우스/키보드 입력에 따라 좌우 이동
 * - 화면 경계를 벗어나지 않도록 제한
 */

import { Position, GameConfig } from './types';

export class Paddle {
  /** 패들 위치 (좌상단 기준) */
  private position: Position;

  /** 패들 크기 */
  private readonly width: number;
  private readonly height: number;

  /** 이동 속도 */
  private readonly speed: number;

  /** 색상 */
  private readonly color: string;

  /** 캔버스 크기 (경계 체크용) */
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;

  /** 이동 방향 (-1: 왼쪽, 0: 정지, 1: 오른쪽) */
  private direction: number = 0;

  constructor(config: GameConfig) {
    this.width = config.paddle.width;
    this.height = config.paddle.height;
    this.speed = config.paddle.speed;
    this.color = config.paddle.color;
    this.canvasWidth = config.canvas.width;
    this.canvasHeight = config.canvas.height;

    // 초기 위치: 화면 하단 중앙
    this.position = {
      x: (this.canvasWidth - this.width) / 2,
      y: this.canvasHeight - 50,
    };
  }

  /**
   * 패들 위치 초기화
   */
  public reset(): void {
    this.position = {
      x: (this.canvasWidth - this.width) / 2,
      y: this.canvasHeight - 50,
    };
    this.direction = 0;
  }

  /**
   * 키보드 이동 방향 설정
   */
  public setDirection(dir: number): void {
    this.direction = dir;
  }

  /**
   * 마우스 X 좌표로 패들 이동
   */
  public setPositionX(mouseX: number): void {
    // 패들 중심이 마우스를 따라가도록
    let newX = mouseX - this.width / 2;

    // 경계 체크
    newX = Math.max(0, Math.min(newX, this.canvasWidth - this.width));

    this.position.x = newX;
  }

  /**
   * 프레임 업데이트 (키보드 이동 처리)
   */
  public update(): void {
    if (this.direction === 0) return;

    let newX = this.position.x + this.direction * this.speed;

    // 경계 체크
    newX = Math.max(0, Math.min(newX, this.canvasWidth - this.width));

    this.position.x = newX;
  }

  /**
   * 패들 렌더링
   */
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }

  /** 위치 getter */
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

  /** 중심 X 좌표 */
  public getCenterX(): number {
    return this.position.x + this.width / 2;
  }
}
