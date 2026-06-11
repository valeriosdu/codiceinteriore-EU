/// <reference types="vite/client" />

interface FbqFunction {
  (action: 'init', pixelId: string): void;
  (action: 'track', eventName: string, params?: Record<string, unknown>): void;
  (action: 'trackCustom', eventName: string, params?: Record<string, unknown>): void;
}

interface Window {
  fbq?: FbqFunction;
}
