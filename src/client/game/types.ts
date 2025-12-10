/**
 * 게임 관련 타입 정의
 */

/** 2D 좌표 */
export interface Position {
  x: number;
  y: number;
}

/** 2D 크기 */
export interface Size {
  width: number;
  height: number;
}

/** 2D 속도 벡터 */
export interface Velocity {
  dx: number;
  dy: number;
}

/** 게임 상태 */
export type GameState = 'idle' | 'playing' | 'paused' | 'gameover' | 'clear' | 'scores';

/** 벽돌 타입 */
export type BrickType = 'normal' | 'hard' | 'special';

/** 벽돌 설정 */
export interface BrickConfig {
  type: BrickType;
  color: string;
  durability: number;
  score: number;
}

/** 게임 설정 */
export interface GameConfig {
  canvas: Size;
  paddle: {
    width: number;
    height: number;
    speed: number;
    color: string;
  };
  ball: {
    radius: number;
    initialSpeed: number;
    maxSpeed: number;
    color: string;
  };
  brick: {
    width: number;
    height: number;
    rows: number;
    cols: number;
    gap: number;
    topOffset: number;
  };
  lives: number;
  maxLives: number;
}

/** 기본 게임 설정 */
export const DEFAULT_CONFIG: GameConfig = {
  canvas: {
    width: 800,
    height: 600,
  },
  paddle: {
    width: 100,
    height: 15,
    speed: 8,
    color: '#3B82F6', // blue-500
  },
  ball: {
    radius: 8,
    initialSpeed: 5,
    maxSpeed: 10,
    color: '#FFFFFF',
  },
  brick: {
    width: 75,
    height: 20,
    rows: 5,
    cols: 10,
    gap: 2,
    topOffset: 50,
  },
  lives: 3,
  maxLives: 5,
};

/** 벽돌 타입별 설정 */
export const BRICK_CONFIGS: Record<BrickType, BrickConfig> = {
  normal: {
    type: 'normal',
    color: '#22C55E', // green-500
    durability: 1,
    score: 10,
  },
  hard: {
    type: 'hard',
    color: '#F59E0B', // amber-500
    durability: 2,
    score: 25,
  },
  special: {
    type: 'special',
    color: '#EF4444', // red-500
    durability: 1,
    score: 50,
  },
};

/** 색상 상수 */
export const COLORS = {
  background: '#000000',
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};
