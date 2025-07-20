import { initAuth0 } from '@auth0/nextjs-auth0';

if (!process.env.AUTH0_SECRET) {
  throw new Error('AUTH0_SECRET is not defined');
}

if (!process.env.AUTH0_BASE_URL) {
  throw new Error('AUTH0_BASE_URL is not defined');
}

if (!process.env.AUTH0_ISSUER_BASE_URL) {
  throw new Error('AUTH0_ISSUER_BASE_URL is not defined');
}

if (!process.env.AUTH0_CLIENT_ID) {
  throw new Error('AUTH0_CLIENT_ID is not defined');
}

if (!process.env.AUTH0_CLIENT_SECRET) {
  throw new Error('AUTH0_CLIENT_SECRET is not defined');
}

export const auth0 = initAuth0({
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  authorizationParams: {
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
    audience: process.env.AUTH0_AUDIENCE,
  },
  routes: {
    callback: '/api/auth/callback',
    postLogoutRedirect: '/',
  },
  session: {
    rollingDuration: 60 * 60 * 8, // 8 hours
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days
  },
});

export const {
  handleAuth,
  handleLogin,
  handleLogout,
  handleCallback,
  handleProfile,
  withApiAuthRequired,
  withPageAuthRequired,
  getSession,
  getAccessToken,
  updateSession,
} = auth0;