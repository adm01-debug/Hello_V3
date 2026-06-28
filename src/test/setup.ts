import "@testing-library/jest-dom";
import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Notification API (avoid vi.fn so vi.clearAllMocks() doesn't wipe impls)
class MockNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = async () => MockNotification.permission;
  onclick: (() => void) | null = null;
  close = () => {};
  constructor(public title: string, public options?: NotificationOptions) {}
}
Object.defineProperty(window, 'Notification', { writable: true, value: MockNotification });

// Mock AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: class MockAudioContext {
    currentTime = 0;
    createOscillator = () => ({
      connect: vi.fn(),
      frequency: { value: 0 },
      type: 'sine',
      start: vi.fn(),
      stop: vi.fn(),
    });
    createGain = () => ({
      connect: vi.fn(),
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    });
    destination = {};
    close = async () => {};
  },
});

// Mock crypto.subtle
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(20)),
      generateKey: vi.fn().mockResolvedValue({}),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
    randomUUID: () => {
      const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    },
  },
});
