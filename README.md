# DX-Ball Vibe Code

DX-Ball 클론 게임 - Vibe Coding 프로젝트

## 프로젝트 개요

클래식 벽돌깨기 게임 DX-Ball의 웹 기반 클론입니다.
Spec-First 개발 방식으로, 코드보다 스펙을 먼저 논의하고 개발자 컨펌 후 구현합니다.

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | >=20.0.0 | 런타임 |
| TypeScript | 5.7.2 | 언어 (서버/클라이언트) |
| Vite | 5.4.11 | 빌드 도구 |
| Express | 5.0.1 | 단일 서버 |
| Tailwind CSS | 3.4.17 | 스타일링 |

## 아키텍처

**단일 서버 구조** - Express 서버 하나로 모든 것을 처리합니다.

```
Express 서버 (포트 3000)
├── 정적 파일 서빙 (dist/client)
│   ├── index.html
│   ├── assets/index-*.js
│   └── assets/index-*.css
└── API 서빙 (/api/*)
    ├── GET  /api/health
    ├── GET  /api/scores
    └── POST /api/scores
```

## 디렉토리 구조

```
./
├── index.html              # Vite 진입점
├── package.json            # 의존성
├── tsconfig.json           # TypeScript 설정 (공통)
├── tsconfig.node.json      # TypeScript 설정 (서버)
├── vite.config.ts          # Vite 빌드 설정
├── tailwind.config.js      # Tailwind 설정
├── postcss.config.js       # PostCSS 설정
├── Dockerfile              # 컨테이너 빌드
├── docker-compose.yml      # 컨테이너 실행
│
├── src/
│   ├── client/             # 프론트엔드
│   │   ├── main.ts         # 클라이언트 진입점
│   │   ├── game/           # 게임 로직
│   │   ├── ui/             # UI 컴포넌트
│   │   └── styles/
│   │       └── main.css    # Tailwind 진입점
│   │
│   └── server/             # 백엔드
│       ├── index.ts        # Express 단일 서버
│       ├── routes/
│       │   └── api.ts      # API 라우트
│       └── services/
│           └── storage.ts  # 파일 DB 서비스
│
├── public/                 # 정적 자산
├── data/                   # 런타임 데이터 (gitignore)
└── dist/                   # 빌드 결과 (gitignore)
    └── client/             # Vite 번들 결과
```

## 시작하기

### 사전 요구사항

- Node.js 20.x 이상
- npm

### 개발 모드

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (빌드 후 단일 서버 시작)
npm run dev
```

**접속**: http://localhost:3000

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 실행
npm start
```

### Docker 실행

```bash
# 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d
```

**접속**: http://localhost:3000

## npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 클라이언트 빌드 후 서버 실행 (watch 모드) |
| `npm run build` | 프로덕션 빌드 (클라이언트 + 서버) |
| `npm run build:client` | 클라이언트만 빌드 |
| `npm run build:server` | 서버만 빌드 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run preview` | 빌드 후 미리보기 |

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/health` | 헬스체크 |
| GET | `/api/scores` | 하이스코어 조회 |
| POST | `/api/scores` | 하이스코어 저장 |

## 게임 스펙

| 항목 | 값 |
|------|-----|
| 해상도 | 800x600 |
| FPS | 60 |
| 조작 | 마우스 + 키보드(방향키) |

## 실행 확인

```bash
# 프론트엔드 확인
curl http://localhost:3000/

# API 헬스체크
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"..."}
```

## 문서

- [PRD.md](./.docs/PRD.md) - 상세 요구사항 문서
- [GAME_SPEC.md](./.docs/GAME_SPEC.md) - 게임 스펙 (메카닉, 점수, 스테이지)
- [UI_SPEC.md](./.docs/UI_SPEC.md) - UI/UX 설계

## 라이선스

Private Project
