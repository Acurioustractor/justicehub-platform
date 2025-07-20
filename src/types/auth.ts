export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  nickname: string;
  picture?: string;
  sub: string;
  updatedAt: string;
}

export interface UserSession {
  user: AuthUser;
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken?: string;
  idToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: UserRole;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId: string;
  iat: number;
  exp: number;
}

export type UserRole = 'youth' | 'mentor' | 'organization_staff' | 'admin' | 'apprentice';

export interface PermissionCheck {
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export interface AuthContext {
  user: AuthUser | null;
  session: UserSession | null;
  loading: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (data: PasswordResetConfirm) => Promise<void>;
  refreshToken: () => Promise<void>;
  hasPermission: (check: PermissionCheck) => boolean;
}

export interface AuthConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  audience: string;
}