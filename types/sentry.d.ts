declare module '@sentry/nextjs' {
  export interface User {
    id?: string;
    email?: string;
    username?: string;
    ip_address?: string;
  }

  export interface Scope {
    setTag(key: string, value: string): void;
    setTags(tags: Record<string, string>): void;
    setUser(user: User | null): void;
    setContext(key: string, context: any): void;
    setLevel(level: string): void;
    setFingerprint(fingerprint: string[]): void;
    clear(): void;
  }

  export interface Hub {
    getScope(): Scope;
    configureScope(callback: (scope: Scope) => void): void;
  }

  export interface ConfigureOptions {
    dsn?: string;
    environment?: string;
    debug?: boolean;
    tracesSampleRate?: number;
    integrations?: any[];
    beforeSend?: (event: any) => any;
  }

  export function init(options: ConfigureOptions): void;
  export function captureException(error: any): string;
  export function captureMessage(message: string, level?: string): string;
  export function getCurrentHub(): Hub;
  export function configureScope(callback: (scope: Scope) => void): void;
  export function withScope(callback: (scope: Scope) => void): void;
  export function setUser(user: User | null): void;
  export function setTag(key: string, value: string): void;
  export function setContext(key: string, context: any): void;
  export function addBreadcrumb(breadcrumb: any): void;

  export const Severity: {
    Fatal: string;
    Error: string;
    Warning: string;
    Info: string;
    Debug: string;
  };
}