import { NextAuthOptions } from 'next-auth';
import { logger } from './logger';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './database';
import { User } from '@prisma/client';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import crypto from 'crypto';
import { env, isProduction } from './env';

// Authenticated user interface
export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: string;
  name?: string;
}

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: AuthenticatedUser;
  }

  interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    name?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    role: string;
  }
}

// NextAuth configuration with enhanced security
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'admin@autosalonani.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email.toLowerCase();

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });

          if (!user) {
            // Use constant time operation even when user doesn't exist to prevent user enumeration
            await bcrypt.compare(credentials.password, '$2a$12$invalidhashtopreventtimingattack000000000000000000000000');
            throw new Error('Authentication failed. Please check your credentials.');
          }

          // Check if account is locked
          if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 1000 / 60);
            logger.securityEvent('Login attempt on locked account', {
              attemptedAction: `Login attempt for ${email} with ${remainingTime} minutes remaining`
            });
            throw new Error(`Account is temporarily locked. Try again in ${remainingTime} minutes.`);
          }

          if (!user.isActive) {
            throw new Error('Account is disabled');
          }

          // Verify password (bcrypt.compare is constant-time)
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            // Increment failed login attempts
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
            const maxAttempts = 5;

            const updateData: any = {
              failedLoginAttempts: newFailedAttempts,
            };

            // Lock account after max attempts
            if (newFailedAttempts >= maxAttempts) {
              const lockDuration = 15 * 60 * 1000; // 15 minutes
              updateData.accountLockedUntil = new Date(Date.now() + lockDuration);

              logger.securityEvent('Account locked due to failed login attempts', {
                attemptedAction: `Account ${email} locked after ${newFailedAttempts} attempts for 15 minutes`
              });
            }

            await prisma.user.update({
              where: { id: user.id },
              data: updateData,
            });

            logger.authError('Invalid password attempt', {
              email,
              ip: undefined,
            });

            throw new Error('Authentication failed. Please check your credentials.');
          }

          // Successful login - reset failed attempts and clear lock
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLogin: new Date(),
              failedLoginAttempts: 0,
              accountLockedUntil: null,
            },
          });

          logger.info('User authenticated successfully', {
            userId: user.id,
            email: user.email,
          });

          // Return user object for the session
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            name: user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.username,
          };
        } catch (error) {
          logger.authError('Authentication failed', {
            email,
          });
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Required for credentials provider
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Update session every hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
    secret: env.JWT_SECRET,
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.iat = Math.floor(Date.now() / 1000);
        token.exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
      }

      // Rotate refresh token periodically
      if (account) {
        token.accessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token, user }) {
      // For database sessions
      if (user) {
        session.user.id = user.id;
        session.user.email = user.email;
        session.user.role = (user as any).role;
        session.user.username = (user as any).username;
      }
      // For JWT sessions (fallback)
      else if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Additional security checks on sign in
      if (!user.email) {
        return false;
      }

      // Log successful sign in
      logger.info('User signed in', {
        userId: user.id,
        email: user.email,
        provider: account?.provider || 'credentials'
      });

      return true;
    },
    async redirect({ url, baseUrl }) {
      // Only allow redirects to same origin
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      logger.info('Sign in event', {
        userId: user?.id,
        isNewUser,
        provider: account?.provider
      });
    },
    async signOut({ session, token }) {
      logger.info('Sign out event', {
        sessionId: (session as any)?.id,
        tokenId: token?.sub
      });
    },
    async session({ session, token }) {
      // Track active sessions
      logger.debug('Session accessed', {
        userId: session?.user?.id
      });
    },
  },
  debug: !isProduction,
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  secret: env.NEXTAUTH_SECRET,
  useSecureCookies: isProduction,
  // trustHost: true, // Removed - not a valid NextAuth option
};

// Authentication middleware helpers for API routes
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return null;
    }

    return session.user;
  } catch (error) {
    logger.error('Error getting authenticated user', {}, error instanceof Error ? error : undefined);
    return null;
  }
}

export async function requireAuth(request: NextRequest, requiredRole: string = 'ADMIN') {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return { user };
}

export async function withAuth<T = any>(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<T>>,
  requiredRole: string = 'ADMIN'
): Promise<NextResponse<T>> {
  const authResult = await requireAuth(request, requiredRole);

  if (authResult instanceof NextResponse) {
    return authResult as NextResponse<T>;
  }

  return handler(request, authResult.user);
}

// Advanced wrapper function for admin route handlers
// This provides a cleaner API for securing admin endpoints
export function createAdminHandler<T = any>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<T>>,
  options?: {
    requireAdmin?: boolean;
    logAction?: string;
    auditSensitive?: boolean;
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
    const opts = {
      requireAdmin: true,
      logAction: undefined,
      auditSensitive: false,
      ...options,
    };

    try {
      // Check authentication
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
        logger.securityEvent('Unauthorized admin endpoint access attempt', {
          attemptedAction: `Attempted access to ${request.nextUrl.pathname} (${request.method})`,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        });

        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        ) as NextResponse<T>;
      }

      // Check admin role
      if (opts.requireAdmin && session.user.role !== 'ADMIN') {
        logger.securityEvent('Unauthorized admin access attempt', {
          attemptedAction: `User ${session.user.email} (role: ${session.user.role}) attempted to access admin endpoint: ${request.nextUrl.pathname} (${request.method})`,
        });

        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        ) as NextResponse<T>;
      }

      // Log action if specified
      if (opts.logAction) {
        logger.info(`Admin action: ${opts.logAction}`, {
          userId: session.user.id,
          email: session.user.email,
          action: opts.logAction,
          endpoint: request.nextUrl.pathname,
          method: request.method,
        });
      }

      // Log sensitive actions for audit trail
      if (opts.auditSensitive) {
        logger.securityEvent('Sensitive admin action', {
          attemptedAction: `${opts.logAction || `${request.method} ${request.nextUrl.pathname}`} by ${session.user.email} at ${new Date().toISOString()}`,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        });
      }

      // Execute handler with context support
      if (context) {
        return await handler(request, session.user);
      }
      return await handler(request, session.user);
    } catch (error) {
      logger.error('Error in admin handler', {
        endpoint: request.nextUrl.pathname,
        method: request.method,
      }, error instanceof Error ? error : undefined);

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ) as NextResponse<T>;
    }
  };
}

// Password strength validation
function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, message: 'Password must not exceed 128 characters' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '123456', '12345678', 'qwerty',
    'abc123', 'password1', 'admin', 'letmein', 'welcome',
    'monkey', '1234567890', 'dragon', 'sunshine', 'princess'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, message: 'Password is too common, please choose a stronger password' };
  }

  // Check for repeated characters (more than 3 in a row)
  if (/(.)\1{3,}/.test(password)) {
    return { isValid: false, message: 'Password cannot contain more than 3 repeated characters in a row' };
  }

  return { isValid: true };
}

// Helper functions for authentication
export const AuthHelpers = {
  // Hash password for storage
  async hashPassword(password: string): Promise<string> {
    // Validate password strength before hashing
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    return bcrypt.hash(password, 12);
  },

  // Verify password against hash
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  },

  // Create new admin user
  async createAdminUser(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    try {
      // Validate password strength
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email.toLowerCase() },
            { username: data.username.toLowerCase() },
          ],
        },
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password (validation happens inside hashPassword)
      const passwordHash = await this.hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          username: data.username.toLowerCase(),
          passwordHash,
          role: 'ADMIN',
          firstName: data.firstName,
          lastName: data.lastName,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
        },
      });

      return user;
    } catch (error) {
      logger.error('Error creating admin user', { email: data.email }, error instanceof Error ? error : undefined);
      throw error;
    }
  },

  // Update user password
  async updatePassword(userId: string, newPassword: string) {
    try {
      // Validate password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
      }

      // Hash password (validation happens inside hashPassword too)
      const passwordHash = await this.hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      logger.info('Password updated successfully', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Error updating password', { userId }, error instanceof Error ? error : undefined);

      // Return specific error message for password validation
      if (error instanceof Error && error.message.includes('Password')) {
        throw error; // Re-throw password validation errors as-is
      }

      throw new Error('Failed to update password');
    }
  },

  // Get user by ID
  async getUserById(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      });
    } catch (error) {
      logger.error('Error fetching user', { userId }, error instanceof Error ? error : undefined);
      return null;
    }
  },

  // Check if user has required role
  hasRole(userRole: string, requiredRole: string): boolean {
    const roles = ['VIEWER', 'MODERATOR', 'ADMIN'];
    const userRoleIndex = roles.indexOf(userRole);
    const requiredRoleIndex = roles.indexOf(requiredRole);

    return userRoleIndex >= requiredRoleIndex;
  },

  // Generate secure session token using crypto API
  generateSessionToken(): string {
    const array = new Uint8Array(48);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString('base64url');
  },

  // Create user session
  async createUserSession(userId: string, clientIP?: string, userAgent?: string) {
    try {
      const token = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const session = await prisma.userSession.create({
        data: {
          userId,
          token,
          expiresAt,
          clientIP,
          userAgent,
        },
      });

      return session;
    } catch (error) {
      logger.error('Error creating user session', { userId }, error instanceof Error ? error : undefined);
      throw new Error('Failed to create user session');
    }
  },

  // Cleanup expired sessions
  async cleanupExpiredSessions() {
    try {
      const result = await prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Cleaned up expired sessions', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up expired sessions', {}, error instanceof Error ? error : undefined);
      return 0;
    }
  },
};

// Export for use in API routes
export { getServerSession } from 'next-auth';

// Default export
export default authOptions;