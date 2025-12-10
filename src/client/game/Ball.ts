/**
 * 공 클래스
 *
 * 게임에서 움직이는 공을 담당합니다.
 * - 벽, 패들, 벽돌과의 충돌 처리
 * - 속도 및 방향 관리
 */

import { Position, Velocity, GameConfig } from './types';
import { Paddle } from './Paddle';

export class Ball {
  /** 공 위치 (중심 기준) */
  private position: Position;

  /** 공 속도 벡터 */
  private velocity: Velocity;

  /** 공 반지름 */
  private readonly radius: number;

  /** 초기 속도 */
  private readonly initialSpeed: number;

  /** 최대 속도 */
  private readonly maxSpeed: number;

  /** 색상 */
  private readonly color: string;

  /** 캔버스 크기 */
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;

  /** 공이 발사되었는지 여부 */
  private launched: boolean = false;

  constructor(config: GameConfig) {
    this.radius = config.ball.radius;
    this.initialSpeed = config.ball.initialSpeed;
    this.maxSpeed = config.ball.maxSpeed;
    this.color = config.ball.color;
    this.canvasWidth = config.canvas.width;
    this.canvasHeight = config.canvas.height;

    // 초기 위치와 속도
    this.position = { x: 0, y: 0 };
    this.velocity = { dx: 0, dy: 0 };
  }

  /**
   * 공 초기화 (패들 위에 위치)
   */
  public reset(paddle: Paddle): void {
    this.position = {
      x: paddle.getCenterX(),
      y: paddle.getY() - this.radius - 1,
    };
    this.velocity = { dx: 0, dy: 0 };
    this.launched = false;
  }

  /**
   * 공 발사
   */
  public launch(): void {
    if (this.launched) return;

    // 랜덤 각도로 발사 (-60도 ~ -120도, 위쪽 방향)
    const angle = (Math.random() * 60 + 60) * (Math.PI / 180);
    this.velocity = {
      dx: this.initialSpeed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1),
      dy: -this.initialSpeed * Math.sin(angle),
    };
    this.launched = true;
  }

  /**
   * 프레임 업데이트
   */
  public update(paddle: Paddle): 'playing' | 'lost' {
    if (!this.launched) {
      // 발사 전: 패들 따라다님
      this.position.x = paddle.getCenterX();
      this.position.y = paddle.getY() - this.radius - 1;
      return 'playing';
    }

    // 위치 업데이트
    this.position.x += this.velocity.dx;
    this.position.y += this.velocity.dy;

    // 좌우 벽 충돌
    if (this.position.x - this.radius <= 0) {
      this.position.x = this.radius;
      this.velocity.dx = Math.abs(this.velocity.dx);
    } else if (this.position.x + this.radius >= this.canvasWidth) {
      this.position.x = this.canvasWidth - this.radius;
      this.velocity.dx = -Math.abs(this.velocity.dx);
    }

    // 상단 벽 충돌
    if (this.position.y - this.radius <= 0) {
      this.position.y = this.radius;
      this.velocity.dy = Math.abs(this.velocity.dy);
    }

    // 하단 (공 잃음)
    if (this.position.y - this.radius > this.canvasHeight) {
      return 'lost';
    }

    // 패들 충돌
    this.checkPaddleCollision(paddle);

    return 'playing';
  }

  /**
   * 패들 충돌 체크
   */
  private checkPaddleCollision(paddle: Paddle): void {
    const paddleX = paddle.getX();
    const paddleY = paddle.getY();
    const paddleWidth = paddle.getWidth();
    const paddleHeight = paddle.getHeight();

    // 공이 아래로 이동 중이고 패들 영역에 있는지 체크
    if (
      this.velocity.dy > 0 &&
      this.position.y + this.radius >= paddleY &&
      this.position.y + this.radius <= paddleY + paddleHeight &&
      this.position.x >= paddleX &&
      this.position.x <= paddleX + paddleWidth
    ) {
      // 충돌 위치에 따른 반사각 계산
      const hitPosition = (this.position.x - paddleX) / paddleWidth; // 0~1
      const angle = (hitPosition - 0.5) * Math.PI * 0.7; // -63도 ~ 63도

      const speed = Math.sqrt(
        this.velocity.dx * this.velocity.dx + this.velocity.dy * this.velocity.dy
      );
      const newSpeed = Math.min(speed * 1.02, this.maxSpeed); // 약간 가속

      this.velocity.dx = newSpeed * Math.sin(angle);
      this.velocity.dy = -newSpeed * Math.cos(angle);

      // 패들 위로 위치 보정
      this.position.y = paddleY - this.radius;
    }
  }

  /**
   * 벽돌 충돌 체크 (외부에서 호출)
   */
  public checkBrickCollision(
    brickX: number,
    brickY: number,
    brickWidth: number,
    brickHeight: number
  ): boolean {
    // AABB 충돌 체크
    const closestX = Math.max(brickX, Math.min(this.position.x, brickX + brickWidth));
    const closestY = Math.max(brickY, Math.min(this.position.y, brickY + brickHeight));

    const distanceX = this.position.x - closestX;
    const distanceY = this.position.y - closestY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (distance < this.radius) {
      // 충돌 방향 결정
      const overlapX = this.radius - Math.abs(distanceX);
      const overlapY = this.radius - Math.abs(distanceY);

      if (overlapX < overlapY) {
        // 좌우 충돌
        this.velocity.dx = -this.velocity.dx;
        this.position.x += distanceX > 0 ? overlapX : -overlapX;
      } else {
        // 상하 충돌
        this.velocity.dy = -this.velocity.dy;
        this.position.y += distanceY > 0 ? overlapY : -overlapY;
      }

      return true;
    }

    return false;
  }

  /**
   * 공 렌더링
   */
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  /** 발사 여부 */
  public isLaunched(): boolean {
    return this.launched;
  }
}
