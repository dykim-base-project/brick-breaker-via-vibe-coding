/**
 * DX-Ball Vibe Code - 클라이언트 진입점
 *
 * 이 파일은 애플리케이션의 메인 엔트리 포인트입니다.
 * Vite가 이 파일을 기준으로 번들링을 시작합니다.
 */

import './styles/main.css';
import { Game } from './game/Game';
import { DEFAULT_CONFIG } from './game/types';
import { i18n, SUPPORTED_LOCALES, Locale } from './i18n';

// 게임 인스턴스
let game: Game | null = null;

/**
 * 헤더 바 생성 (고정)
 */
function createHeader(): string {
  const currentLocale = i18n.getLocale();

  const options = SUPPORTED_LOCALES.map(
    (locale) =>
      `<option value="${locale.code}" ${locale.code === currentLocale ? 'selected' : ''}>${locale.name}</option>`
  ).join('');

  return `
    <header id="site-header" class="fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700">
      <div class="max-w-[800px] mx-auto px-4 py-3 flex items-center justify-between">
        <h1 id="header-title" class="text-xl font-bold text-white">${i18n.t().title}</h1>
        <div class="flex items-center">
          <label class="text-gray-400 text-sm mr-2">${i18n.t().language.label}:</label>
          <select
            id="language-select"
            class="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            ${options}
          </select>
        </div>
      </div>
    </header>
  `;
}

/**
 * 푸터 바 생성 (고정)
 */
function createFooter(): string {
  const t = i18n.t();
  return `
    <footer id="site-footer" class="fixed bottom-0 left-0 right-0 z-50 bg-gray-800 border-t border-gray-700">
      <div class="max-w-[800px] mx-auto px-4 py-2 flex items-center justify-between">
        <span id="footer-copyright" class="text-gray-500 text-xs">${t.footer.copyright}</span>
        <span id="footer-made" class="text-gray-500 text-xs">${t.footer.madeWith}</span>
      </div>
    </footer>
  `;
}

/**
 * 헤더 업데이트 (언어 변경 시)
 */
function updateHeader(): void {
  const title = document.getElementById('header-title');
  if (title) {
    title.textContent = i18n.t().title;
  }
  const label = document.querySelector('#site-header label');
  if (label) {
    label.textContent = `${i18n.t().language.label}:`;
  }
}

/**
 * 푸터 업데이트 (언어 변경 시)
 */
function updateFooter(): void {
  const t = i18n.t();
  const copyright = document.getElementById('footer-copyright');
  if (copyright) {
    copyright.textContent = t.footer.copyright;
  }
  const made = document.getElementById('footer-made');
  if (made) {
    made.textContent = t.footer.madeWith;
  }
}

/**
 * 앱 초기화
 */
function initApp(): void {
  const app = document.getElementById('app');

  if (!app) {
    console.error('App container not found');
    return;
  }

  // 레이아웃 생성: 고정 Header + 메인 콘텐츠 + 고정 Footer
  app.innerHTML = `
    ${createHeader()}

    <main class="min-h-screen bg-gray-900 pt-[52px] pb-[40px] flex items-center justify-center">
      <div class="flex flex-col" style="width: ${DEFAULT_CONFIG.canvas.width}px;">
        <!-- Canvas 영역 -->
        <div class="relative">
          <canvas
            id="game-canvas"
            class="bg-black block cursor-none"
            width="${DEFAULT_CONFIG.canvas.width}"
            height="${DEFAULT_CONFIG.canvas.height}"
          ></canvas>
        </div>
      </div>
    </main>

    ${createFooter()}
  `;

  // 언어 선택 이벤트 리스너
  const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      i18n.setLocale(target.value as Locale);
    });
  }

  // i18n 변경 시 UI 업데이트
  i18n.onLocaleChange(() => {
    updateHeader();
    updateFooter();
  });

  // Canvas 요소 획득
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // 게임 인스턴스 생성
  game = new Game(canvas, DEFAULT_CONFIG);

  // 게임오버 시 하이스코어 저장 프롬프트
  game.setOnGameOver(async (score: number) => {
    // 간단한 방식: 0.5초 후 이름 입력 받기
    setTimeout(async () => {
      const t = i18n.t();
      const name = prompt(`${t.gameover.title}! ${t.gameover.finalScore}: ${score}\n${t.prompt.enterName}`);

      if (name && name.trim()) {
        try {
          await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), score }),
          });
          console.log('Score saved successfully');
          // 저장 후 하이스코어 새로고침
          game?.refreshHighScores();
        } catch (error) {
          console.error('Failed to save score:', error);
        }
      }
    }, 500);
  });

  console.log('DX-Ball game initialized');
}

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', initApp);

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  if (game) {
    game.destroy();
  }
});
