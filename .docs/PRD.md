# Brick Breaker - Product Requirements Document

## Overview

**Project Name:** Brick Breaker Vibe Code
**Type:** Classic Brick Breaker Game (Breakout 장르)
**Development Approach:** Vibe Coding (Spec-driven, developer confirmation before implementation)

## Project Philosophy

- **Spec-First Development:** 코드보다 스펙으로 대화하며 개발자 최종 컨펌 후 진행
- **Technology Agnostic:** 언어/프레임워크 제한 없음, 최적의 효율성 추구
- **Self-Contained:** 외부 의존성 최소화, 폐쇄망 실행 가능
- **Lightweight:** 경량화 지향

---

## Technical Constraints

| 항목 | 요구사항 |
|------|----------|
| 네트워크 | 외부 연결 없음 (Offline-first) |
| 데이터 저장 | 로컬 파일 DB (JSON, SQLite 등) |
| 배포 형태 | 단일 프로그램 (Single Binary/Package) |
| 실행 환경 | Docker 컨테이너 기반, 폐쇄망 호환 |
| 배포 환경 | PaaS (AppPaaS 등) 웹 서비스 배포 가능 |
| 파일 접근 | 프로젝트 디렉토리 내부로 제한 |

---

## Tech Stack Versions

> 버전 고정 (토이 프로젝트 안정성 우선, package.json에서 exact version 사용)

| 기술 | 버전 | 비고 |
|------|------|------|
| Node.js | >=20.0.0 | LTS 호환 |
| TypeScript | 5.7.2 | 안정 버전 |
| Vite | 5.4.11 | 안정 버전, Node 20+ 호환 |
| Express | 5.0.1 | 최신 안정, Node 18+ 필요 |
| Tailwind CSS | 3.4.17 | 안정 버전, PostCSS 기반 |

> **주의**: `package.json`에서 `^`, `~` 없이 정확한 버전 명시
> ```json
> "dependencies": {
>   "express": "5.0.1"
> }
> ```

### 코드 품질 기준

- **가독성 우선**: 개발자가 학습할 수 있는 명확한 코드
- **명시적 타입**: 타입 추론보다 명시적 타입 선언 선호
- **주석**: 복잡한 로직에 한글 주석 허용
- **네이밍**: 의미 있는 변수/함수명 사용
- **단일 책임**: 파일당 하나의 명확한 역할

---

## Core Features

### 1. Game Mechanics
- [x] 패들(Paddle) 조작
- [x] 공(Ball) 물리 엔진
- [x] 벽돌(Brick) 파괴 시스템
- [x] 벽면 충돌 처리

### 2. Game Flow
- [x] 시작 화면
- [x] 게임 플레이
- [x] 일시 정지
- [x] 게임 오버
- [x] 스테이지 클리어

### 3. Scoring System
- [x] 점수 계산
- [x] 하이스코어 저장 (로컬 파일)
- [x] 랭킹 표시

### 4. Stage System
- [x] 다양한 스테이지 레이아웃 (3개 스테이지)
- [x] 난이도 조절

### 5. i18n (Internationalization)
- [x] 다국어 지원 (영어/한국어)
- [x] 브라우저 언어 자동 감지
- [x] localStorage 저장

---

## Data Storage

> 모든 파일은 프로젝트 루트 디렉토리 기준 상대 경로로 관리

```
./
├── Dockerfile              # 컨테이너 빌드 정의
├── docker-compose.yml      # (선택) 실행 편의
├── package.json            # Node.js 의존성
├── tsconfig.json           # TypeScript 설정 (공통)
├── tsconfig.node.json      # TypeScript 설정 (서버)
├── vite.config.ts          # Vite 빌드 설정
├── tailwind.config.js      # Tailwind 설정
├── postcss.config.js       # PostCSS 설정
│
├── src/                    # 소스 코드 (TypeScript)
│   ├── client/             # 프론트엔드
│   │   ├── main.ts         # 진입점
│   │   ├── game/           # 게임 로직
│   │   │   ├── Game.ts
│   │   │   ├── Paddle.ts
│   │   │   ├── Ball.ts
│   │   │   ├── Brick.ts
│   │   │   └── types.ts
│   │   ├── i18n/           # 다국어 처리
│   │   │   └── index.ts
│   │   ├── ui/             # UI 컴포넌트
│   │   └── styles/
│   │       └── main.css    # Tailwind 입력
│   │
│   └── server/             # 백엔드
│       ├── index.ts        # Express 서버
│       ├── routes/
│       │   └── api.ts      # API 라우트
│       └── services/
│           └── storage.ts  # 파일 DB 서비스
│
├── public/                 # 정적 자산 (이미지 등)
│   └── favicon.ico
│
├── dist/                   # 빌드 결과 (gitignore)
│   ├── client/             # Vite 번들 결과
│   └── server/             # tsc 컴파일 결과
│
└── data/                   # 런타임 데이터 (파일 DB)
    ├── highscores.json
    ├── settings.json
    └── stages/
        ├── stage_01.json
        └── ...
```

### 빌드 파이프라인

```
개발 모드 (npm run dev) - 단일 서버 구조
├── vite build           → dist/client/ (1회 빌드)
└── tsx watch            → Express 서버 :3000
    └── express.static('../../dist/client')

프로덕션 빌드 (npm run build)
├── vite build           → dist/client/ (번들링 + 최적화)
└── tsc                  → dist/server/ (JS 변환)

프로덕션 실행 (npm start)
└── node dist/server/index.js
    └── express.static('../client')
```

> **참고**: 개발/프로덕션 모두 Express 단일 서버(:3000)로 통일됨
> HMR 미지원 - 클라이언트 변경 시 `npm run build:client` 재실행 필요

### 서버 구조

```
Express 서버 (단일 포트)
├── GET /              → dist/client/index.html
├── GET /assets/*      → Vite 번들 자산
├── GET /api/scores    → 하이스코어 조회
└── POST /api/scores   → 하이스코어 저장
```

---

## Development Workflow

```
1. 스펙 논의 (Specification Discussion)
   ↓
2. 개발자 컨펌 (Developer Confirmation)
   ↓
3. 구현 (Implementation)
   ↓
4. 검증 (Verification)
```

---

## Out of Scope

- 온라인 멀티플레이어
- 외부 API 연동
- 클라우드 저장
- 계정 시스템

---

## Open Decisions

> 개발 진행 전 결정 필요 사항

1. ~~**기술 스택 선정**~~ ✅ 결정됨
   - 언어: TypeScript (전체 적용 - 서버/클라이언트)
   - 서버: Node.js 20+ LTS + Express 5.x
   - 빌드: Vite 5.x (번들링 + 최적화)
   - 스타일링: Tailwind CSS 3.x (빌드 포함, CDN 미사용)
   - 렌더링: Canvas API
   - 코드 품질: 가독성 우선, 학습 친화적

2. ~~**타겟 플랫폼**~~ ✅ 결정됨
   - Docker 컨테이너 실행
   - UI 접근: Web (Browser)
   - 배포: PaaS (AppPaaS 등) 호환

3. ~~**게임 상세 스펙**~~ ✅ 결정됨
   - 화면 해상도: 800x600
   - 프레임 레이트: 60 FPS (requestAnimationFrame)
   - 조작 방식: 마우스 + 키보드(방향키)

---

## Version History

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 0.1.0 | 2025-12-10 | 초기 PRD 작성 |
| 0.1.1 | 2025-12-10 | Docker 실행 환경, 디렉토리 접근 제한 추가 |
| 0.1.2 | 2025-12-10 | UI 접근 방식 Web으로 확정 |
| 0.1.3 | 2025-12-10 | 기술 스택 확정 (HTML/Canvas/JS), PaaS 배포 환경 추가 |
| 0.2.0 | 2025-12-10 | Node.js+Express 단일 서버 구조, Tailwind CSS 빌드 방식 확정 |
| 0.2.1 | 2025-12-10 | 게임 상세 스펙 확정 (800x600, 60FPS, 마우스+키보드) |
| 0.3.0 | 2025-12-10 | TypeScript 전체 적용, Vite 빌드, 버전 명시 |
| 0.3.1 | 2025-12-10 | 패키지 버전 마이너까지 고정 (exact version) |
| 0.3.2 | 2025-12-10 | Vite 5.4.11, Tailwind 3.4.17로 안정화 (Node 20 호환) |
| 0.4.0 | 2025-12-10 | 게임 구현 완료, i18n 다국어 지원, 단일 서버 구조 확정 |
| 0.4.1 | 2025-12-10 | 이름 변경: DX-Ball → Brick Breaker (저작권 안전) |
| 0.4.2 | 2025-12-10 | Docker 빌드 수정: darwin-arm64 의존성 optionalDependencies로 이동 |
