// 詳細: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Next.js のルーターをモック
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({})),
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// 「スマホかPCか（レスポンシブ）」を判定する機能のモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // （非推奨）
    removeListener: jest.fn(), // （非推奨）
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 「画面に映ったかどうか」を検知する機能のモック
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// fetch が存在しない場合はモックを設定
if (!global.fetch) {
  global.fetch = jest.fn();
}

// geolocation をモック
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

// navigator.geolocation は通常 read-only なので、defineProperty で強制的に上書きする
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});
