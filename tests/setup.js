/**
 * Test setup file for Vitest
 * Configures the testing environment for Svelte components
 */

// Fix TextEncoder/TextDecoder issues in test environment
import { vi } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';

// Ensure TextEncoder/TextDecoder are available globally
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

// Mock DOM APIs that might not be available in jsdom
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia which is often used by CSS frameworks
global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: function () {},
    removeListener: function () {},
    addEventListener: function () {},
    removeEventListener: function () {},
    dispatchEvent: function () {},
  };
};

// Mock localStorage for tests
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = value.toString();
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;

// Mock window.requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// Mock window.performance
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => [])
};

// Mock crypto for ID generation if not available
if (!global.crypto) {
  global.crypto = {
    randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  };
} else {
  // Just add missing methods to existing crypto
  if (!global.crypto.randomUUID) {
    global.crypto.randomUUID = vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9));
  }
}

// Mock URL for Svelte
global.URL = global.URL || class URL {
  constructor(url, base) {
    this.href = url;
    this.origin = base || 'http://localhost';
  }
};

// Force Svelte to think we're in browser mode
global.window = global.window || global;
global.document = global.document || {};

// Set environment variable to indicate we're not on server
if (typeof process !== 'undefined' && process.env) {
  process.env.NODE_ENV = 'test';
  process.env.VITEST = 'true';
}