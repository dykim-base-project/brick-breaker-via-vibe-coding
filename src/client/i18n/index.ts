/**
 * 다국어 처리 모듈 (i18n)
 *
 * 기본 원칙:
 * - 영어(en)가 기본 언어
 * - 브라우저 언어 설정 감지하여 자동 선택
 * - localStorage에 사용자 선택 저장
 */

/** 지원 언어 코드 */
export type Locale = 'en' | 'ko';

/** 번역 키 타입 */
export interface Translations {
  // 게임 타이틀
  title: string;

  // 대기 화면
  idle: {
    highScores: string;
    noScores: string;
    startPrompt: string;
    controls: string;
    scoreboardPrompt: string;
  };

  // 게임 플레이
  game: {
    score: string;
    stage: string;
    combo: string;
  };

  // 일시정지
  pause: {
    title: string;
    resume: string;
    quit: string;
  };

  // 게임오버
  gameover: {
    title: string;
    finalScore: string;
    top3: string;
    restart: string;
    scoreboard: string;
    quit: string;
  };

  // 클리어
  clear: {
    title: string;
    finalScore: string;
    top3: string;
    playAgain: string;
    scoreboard: string;
    quit: string;
  };

  // 스코어보드
  scores: {
    title: string;
    rank: string;
    name: string;
    score: string;
    date: string;
    noRecords: string;
    playFirst: string;
    back: string;
  };

  // 언어 선택
  language: {
    label: string;
  };

  // 게임오버 프롬프트
  prompt: {
    enterName: string;
  };

  // 푸터
  footer: {
    copyright: string;
    madeWith: string;
  };
}

/** 영어 번역 */
const en: Translations = {
  title: 'Brick Breaker',

  idle: {
    highScores: 'HIGH SCORES',
    noScores: 'No scores yet',
    startPrompt: 'Click or Press SPACE to Start',
    controls: 'Arrow Keys / Mouse to Move | SPACE to Launch | P to Pause',
    scoreboardPrompt: 'Press S for Full Scoreboard',
  },

  game: {
    score: 'Score',
    stage: 'Stage',
    combo: 'Combo',
  },

  pause: {
    title: 'PAUSED',
    resume: 'Press P or ESC to Resume',
    quit: 'Press Q to Quit',
  },

  gameover: {
    title: 'GAME OVER',
    finalScore: 'Final Score',
    top3: 'TOP 3',
    restart: 'Press R to Restart',
    scoreboard: 'Press S for Full Scoreboard',
    quit: 'Press ESC or Q to Quit',
  },

  clear: {
    title: 'CONGRATULATIONS!',
    finalScore: 'Final Score',
    top3: 'TOP 3',
    playAgain: 'Press R to Play Again',
    scoreboard: 'Press S for Full Scoreboard',
    quit: 'Press ESC or Q to Quit',
  },

  scores: {
    title: 'HIGH SCORES',
    rank: 'RANK',
    name: 'NAME',
    score: 'SCORE',
    date: 'DATE',
    noRecords: 'No scores recorded yet',
    playFirst: 'Play a game to set the first record!',
    back: 'Press S or ESC to go back',
  },

  language: {
    label: 'Language',
  },

  prompt: {
    enterName: 'Enter your name for high score:',
  },

  footer: {
    copyright: '2025 Brick Breaker',
    madeWith: 'via Vibe Coding',
  },
};

/** 한국어 번역 */
const ko: Translations = {
  title: 'Brick Breaker',

  idle: {
    highScores: '최고 점수',
    noScores: '기록 없음',
    startPrompt: '클릭 또는 스페이스바로 시작',
    controls: '방향키 / 마우스: 이동 | 스페이스: 발사 | P: 일시정지',
    scoreboardPrompt: 'S키로 전체 기록 보기',
  },

  game: {
    score: '점수',
    stage: '스테이지',
    combo: '콤보',
  },

  pause: {
    title: '일시정지',
    resume: 'P 또는 ESC로 계속하기',
    quit: 'Q로 종료하기',
  },

  gameover: {
    title: '게임 오버',
    finalScore: '최종 점수',
    top3: 'TOP 3',
    restart: 'R로 재시작',
    scoreboard: 'S로 전체 기록 보기',
    quit: 'ESC 또는 Q로 나가기',
  },

  clear: {
    title: '축하합니다!',
    finalScore: '최종 점수',
    top3: 'TOP 3',
    playAgain: 'R로 다시 플레이',
    scoreboard: 'S로 전체 기록 보기',
    quit: 'ESC 또는 Q로 나가기',
  },

  scores: {
    title: '최고 점수',
    rank: '순위',
    name: '이름',
    score: '점수',
    date: '날짜',
    noRecords: '기록이 없습니다',
    playFirst: '게임을 플레이하여 첫 기록을 세우세요!',
    back: 'S 또는 ESC로 돌아가기',
  },

  language: {
    label: '언어',
  },

  prompt: {
    enterName: '이름을 입력하세요:',
  },

  footer: {
    copyright: '2025 Brick Breaker',
    madeWith: 'via Vibe Coding',
  },
};

/** 번역 데이터 */
const translations: Record<Locale, Translations> = { en, ko };

/** 지원 언어 목록 */
export const SUPPORTED_LOCALES: { code: Locale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
];

/** localStorage 키 */
const STORAGE_KEY = 'dx-ball-locale';

/**
 * i18n 클래스
 */
class I18n {
  private locale: Locale = 'en';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.locale = this.detectLocale();
  }

  /**
   * 언어 감지 (우선순위: localStorage > 브라우저 > 기본값)
   */
  private detectLocale(): Locale {
    // 1. localStorage 확인
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && this.isValidLocale(saved)) {
      return saved as Locale;
    }

    // 2. 브라우저 언어 확인
    const browserLang = navigator.language.split('-')[0];
    if (this.isValidLocale(browserLang)) {
      return browserLang as Locale;
    }

    // 3. 기본값
    return 'en';
  }

  /**
   * 유효한 로케일인지 확인
   */
  private isValidLocale(locale: string): boolean {
    return SUPPORTED_LOCALES.some((l) => l.code === locale);
  }

  /**
   * 현재 로케일 반환
   */
  public getLocale(): Locale {
    return this.locale;
  }

  /**
   * 로케일 변경
   */
  public setLocale(locale: Locale): void {
    if (!this.isValidLocale(locale)) return;

    this.locale = locale;
    localStorage.setItem(STORAGE_KEY, locale);

    // 리스너 호출
    this.listeners.forEach((listener) => listener());
  }

  /**
   * 번역 텍스트 반환
   */
  public t(): Translations {
    return translations[this.locale];
  }

  /**
   * 언어 변경 리스너 등록
   */
  public onLocaleChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

/** 싱글톤 인스턴스 */
export const i18n = new I18n();
