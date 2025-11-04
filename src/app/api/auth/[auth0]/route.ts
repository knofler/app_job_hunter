import { handleAuth, handleLogin, handleCallback } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard',
  }),
  callback: handleCallback({
    afterCallback: async (req, session) => {
      // Optional: enrich session with custom claims or org info
      return session;
    },
  }),
});
