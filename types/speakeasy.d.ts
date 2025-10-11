declare module 'speakeasy' {
  export interface GenerateSecretOptions {
    name?: string;
    length?: number;
    symbols?: boolean;
  }

  export interface GeneratedSecret {
    ascii: string;
    hex: string;
    base32: string;
    otpauth_url?: string;
  }

  export interface TOTPVerifyOptions {
    secret?: string;
    encoding?: string;
    token?: string;
    window?: number;
    time?: number;
    step?: number;
  }

  export interface TOTPOptions {
    secret?: string;
    encoding?: string;
    time?: number;
    step?: number;
  }

  export const totp: {
    verify(options?: any): boolean;
    generate(options?: any): string;
  };

  export function generateSecret(options?: GenerateSecretOptions): GeneratedSecret;
}