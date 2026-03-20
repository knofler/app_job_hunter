/**
 * Tests for src/lib/server-backend-url.ts
 */

beforeEach(() => {
  jest.resetModules();
  delete process.env.NEXT_PUBLIC_API_URL_INTERNAL;
  delete process.env.NEXT_PUBLIC_API_URL;
});

describe('SERVER_BACKEND_URL', () => {
  it('defaults to localhost when no env vars set', () => {
    const { SERVER_BACKEND_URL } = require('./server-backend-url');
    expect(SERVER_BACKEND_URL).toBe('http://localhost:8010/api');
  });

  it('prefers INTERNAL url when set', () => {
    process.env.NEXT_PUBLIC_API_URL_INTERNAL = 'http://backend:8000';
    const { SERVER_BACKEND_URL } = require('./server-backend-url');
    expect(SERVER_BACKEND_URL).toBe('http://backend:8000');
  });

  it('falls back to public URL when no INTERNAL set', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.prod.com/api';
    const { SERVER_BACKEND_URL } = require('./server-backend-url');
    expect(SERVER_BACKEND_URL).toBe('https://api.prod.com/api');
  });

  it('prefers INTERNAL over public URL', () => {
    process.env.NEXT_PUBLIC_API_URL_INTERNAL = 'http://backend:8000';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.prod.com/api';
    const { SERVER_BACKEND_URL } = require('./server-backend-url');
    expect(SERVER_BACKEND_URL).toBe('http://backend:8000');
  });
});
