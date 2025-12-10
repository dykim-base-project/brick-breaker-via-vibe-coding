/**
 * Vite 빌드 설정
 *
 * 빌드 전용으로 사용합니다. (개발 서버 미사용)
 * Express 단일 서버에서 빌드 결과물을 서빙합니다.
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 경로 별칭 설정
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@client': resolve(__dirname, 'src/client'),
    },
  },

  // 클라이언트 소스 루트
  root: '.',
  publicDir: 'public',

  // 빌드 설정
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
});
