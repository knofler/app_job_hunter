import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE || 'https://ai-job-hunter-api',
      scope: 'openid profile email',
    },
    returnTo: '/dashboard',
  }),
  signup: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE || 'https://ai-job-hunter-api',
      scope: 'openid profile email',
      screen_hint: 'signup',
    },
    returnTo: '/dashboard',
  }),
});
