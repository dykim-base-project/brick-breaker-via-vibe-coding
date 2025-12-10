# ============================================
# Brick Breaker Vibe Code - Production Dockerfile
# Node.js 22.12.0 LTS 기반
# ============================================

# --- Build Stage ---
FROM node:22.12.0-alpine AS builder

WORKDIR /app

# 의존성 파일 복사 및 설치
COPY package.json package-lock.json* ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:22.12.0-alpine AS production

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# 빌드 결과물 복사
COPY --from=builder /app/dist ./dist

# 데이터 디렉토리 생성
RUN mkdir -p /app/data

# 비루트 사용자로 실행
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# 환경 변수
ENV NODE_ENV=production
ENV PORT=3000

# 포트 노출
EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 실행
CMD ["node", "dist/server/index.js"]
