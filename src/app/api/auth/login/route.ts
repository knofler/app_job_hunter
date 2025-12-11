import { handleLogin } from '@auth0/nextjs-auth0';

export const GET = handleLogin({
  authorizationParams: {
    audience: process.env.AUTH0_AUDIENCE || 'https://ai-job-hunter-api',
    scope: 'openid profile email',
  },
  returnTo: '/dashboard',
});