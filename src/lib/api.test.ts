/**
 * Tests for src/lib/api.ts
 * Covers: resolveBaseUrl logic, buildHeaders, fetchFromApi
 */

// Reset modules before each test so env var changes take effect
beforeEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
  // Clear env vars that influence resolveBaseUrl
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.NEXT_PUBLIC_API_URL_LOCAL;
  delete process.env.NEXT_PUBLIC_API_URL_INTERNAL;
  delete process.env.NEXT_PUBLIC_API_FORCE_REMOTE;
  delete process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  delete process.env.NEXT_PUBLIC_ORG_ID;
  delete process.env.NEXT_PUBLIC_USE_DUMMY_DATA;
});

function loadModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./api') as typeof import('./api');
}

describe('USE_DUMMY_DATA', () => {
  it('defaults to true when env var is not set', () => {
    const { USE_DUMMY_DATA } = loadModule();
    expect(USE_DUMMY_DATA).toBe(true);
  });

  it('is false when env var is "false"', () => {
    process.env.NEXT_PUBLIC_USE_DUMMY_DATA = 'false';
    const { USE_DUMMY_DATA } = loadModule();
    expect(USE_DUMMY_DATA).toBe(false);
  });

  it('is false when env var is "0"', () => {
    process.env.NEXT_PUBLIC_USE_DUMMY_DATA = '0';
    const { USE_DUMMY_DATA } = loadModule();
    expect(USE_DUMMY_DATA).toBe(false);
  });

  it('is true when env var is any other value', () => {
    process.env.NEXT_PUBLIC_USE_DUMMY_DATA = 'yes';
    const { USE_DUMMY_DATA } = loadModule();
    expect(USE_DUMMY_DATA).toBe(true);
  });
});

describe('getApiBaseUrl / resolveBaseUrl', () => {
  it('returns localhost default when no env vars set and window is undefined', () => {
    // jsdom sets window, so we need to simulate server env
    const windowSpy = jest.spyOn(global, 'window', 'get');
    // @ts-expect-error: simulating server-side (no window)
    windowSpy.mockReturnValue(undefined);

    const { getApiBaseUrl } = loadModule();
    expect(getApiBaseUrl()).toBe('http://localhost:8010');
    windowSpy.mockRestore();
  });

  it('returns INTERNAL url on server-side when set', () => {
    process.env.NEXT_PUBLIC_API_URL_INTERNAL = 'http://backend:8000';
    const windowSpy = jest.spyOn(global, 'window', 'get');
    // @ts-expect-error: simulating server-side (no window)
    windowSpy.mockReturnValue(undefined);

    const { getApiBaseUrl } = loadModule();
    expect(getApiBaseUrl()).toBe('http://backend:8000');
    windowSpy.mockRestore();
  });

  it('returns FORCE_REMOTE url when flag is set', () => {
    process.env.NEXT_PUBLIC_API_FORCE_REMOTE = '1';
    process.env.NEXT_PUBLIC_API_URL = 'https://remote.api.com';

    const { getApiBaseUrl } = loadModule();
    expect(getApiBaseUrl()).toBe('https://remote.api.com');
  });

  it('returns localhost on client when hostname is localhost', () => {
    // jsdom window.location.hostname defaults to "localhost"
    const { getApiBaseUrl } = loadModule();
    expect(getApiBaseUrl()).toBe('http://localhost:8010');
  });

  it('returns remote URL on client when hostname is not localhost', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://prod.api.com';
    // Simulate non-localhost
    Object.defineProperty(window, 'location', {
      value: { hostname: 'myapp.vercel.app' },
      writable: true,
      configurable: true,
    });

    const { getApiBaseUrl } = loadModule();
    expect(getApiBaseUrl()).toBe('https://prod.api.com');

    // Restore
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
      configurable: true,
    });
  });

  it('respects custom local URL via NEXT_PUBLIC_API_URL_LOCAL', () => {
    process.env.NEXT_PUBLIC_API_URL_LOCAL = 'http://localhost:9999';
    const { getApiBaseUrl } = loadModule();
    // On localhost client, should use the custom local URL
    expect(getApiBaseUrl()).toBe('http://localhost:9999');
  });
});

describe('fetchFromApi', () => {
  let fetchFromApi: typeof import('./api')['fetchFromApi'];

  beforeEach(() => {
    const mod = loadModule();
    fetchFromApi = mod.fetchFromApi;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('makes a GET request and parses JSON', async () => {
    const mockData = { items: [1, 2, 3] };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockData)),
    });

    const result = await fetchFromApi('/test-path');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-path'),
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it('throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    await expect(fetchFromApi('/fail')).rejects.toThrow('Internal Server Error');
  });

  it('throws with default message when error text is empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve(''),
    });

    await expect(fetchFromApi('/missing')).rejects.toThrow('Request to /missing failed with status 404');
  });

  it('returns undefined for 204 responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
    });

    const result = await fetchFromApi('/no-content');
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty body on 200', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
    });

    const result = await fetchFromApi('/empty');
    expect(result).toBeUndefined();
  });

  it('throws on unparseable JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('not json'),
    });

    await expect(fetchFromApi('/bad-json')).rejects.toThrow('Failed to parse response from /bad-json');
  });

  it('sets Content-Type to application/json by default', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    await fetchFromApi('/headers-test');

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('injects admin token header when env is set', async () => {
    process.env.NEXT_PUBLIC_ADMIN_TOKEN = 'secret-token';
    // Reload module with new env
    const mod = loadModule();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    await mod.fetchFromApi('/admin/something');

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('X-Admin-Token')).toBe('secret-token');
  });

  it('does not inject admin token for user routes', async () => {
    process.env.NEXT_PUBLIC_ADMIN_TOKEN = 'secret-token';
    const mod = loadModule();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    await mod.fetchFromApi('/api/me/profile');

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('X-Admin-Token')).toBeNull();
  });

  it('injects X-Org-Id header when env is set', async () => {
    process.env.NEXT_PUBLIC_ORG_ID = 'org-123';
    const mod = loadModule();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    await mod.fetchFromApi('/recruiter/data');

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('X-Org-Id')).toBe('org-123');
  });

  it('does not inject X-Org-Id for job-search routes', async () => {
    process.env.NEXT_PUBLIC_ORG_ID = 'org-123';
    const mod = loadModule();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    await mod.fetchFromApi('/job-search?q=test');

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const headers = callArgs[1].headers as Headers;
    expect(headers.get('X-Org-Id')).toBeNull();
  });

  it('passes through custom init options', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    await fetchFromApi('/post-test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1].method).toBe('POST');
    expect(callArgs[1].body).toBe('{"key":"value"}');
  });
});
