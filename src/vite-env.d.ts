/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_MARKET?: string;
}

interface FbqFunction {
  (action: 'init', pixelId: string): void;
  (
    action: 'track',
    eventName: string,
    params?: Record<string, unknown>,
    options?: { eventID?: string },
  ): void;
  (
    action: 'trackCustom',
    eventName: string,
    params?: Record<string, unknown>,
    options?: { eventID?: string },
  ): void;
}

interface Window {
  fbq?: FbqFunction;
}
