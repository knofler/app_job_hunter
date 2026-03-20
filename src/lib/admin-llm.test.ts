/**
 * Tests for src/lib/admin-llm.ts
 * Covers: request helper, fetchProviders, fetchSettings, updateSettings,
 *         PROVIDER_DEFAULTS, fetchProviderDefaults
 */

import {
  fetchProviders,
  fetchSettings,
  updateSettings,
  fetchProviderDefaults,
  PROVIDER_DEFAULTS,
} from './admin-llm';

beforeEach(() => {
  jest.restoreAllMocks();
  global.fetch = jest.fn();
});

function mockFetchOk(data: unknown) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(text: string, status = 500) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status,
    statusText: 'Server Error',
    text: () => Promise.resolve(text),
  });
}

describe('PROVIDER_DEFAULTS', () => {
  it('has expected provider keys', () => {
    expect(Object.keys(PROVIDER_DEFAULTS)).toEqual(
      expect.arrayContaining(['openai', 'anthropic', 'google', 'deepseek', 'bedrock'])
    );
  });

  it('openai defaults have expected structure', () => {
    expect(PROVIDER_DEFAULTS.openai).toEqual({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 4000,
    });
  });

  it('anthropic defaults have expected structure', () => {
    expect(PROVIDER_DEFAULTS.anthropic).toMatchObject({
      model: expect.stringContaining('claude'),
      temperature: 0.7,
    });
  });
});

describe('fetchProviders', () => {
  it('calls the correct endpoint', async () => {
    const mockData = { providers: [{ id: 'openai', label: 'OpenAI', supports_json_mode: true }] };
    mockFetchOk(mockData);

    const result = await fetchProviders();
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/llm/providers',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        cache: 'no-store',
      })
    );
  });

  it('throws on non-ok response with error text', async () => {
    mockFetchError('Access denied', 403);
    await expect(fetchProviders()).rejects.toThrow('Access denied');
  });

  it('throws with fallback message when error body is empty', async () => {
    mockFetchError('', 500);
    await expect(fetchProviders()).rejects.toThrow(
      'Request to /api/admin/llm/providers failed with status 500'
    );
  });
});

describe('fetchSettings', () => {
  it('calls the correct endpoint', async () => {
    const settings = {
      id: 's1',
      default: { provider: 'openai', model: 'gpt-4o-mini' },
      steps: {},
      updated_at: '2025-01-01',
    };
    mockFetchOk(settings);

    const result = await fetchSettings();
    expect(result).toEqual(settings);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/llm/settings',
      expect.any(Object)
    );
  });
});

describe('updateSettings', () => {
  it('sends PUT with payload', async () => {
    const payload = {
      default: { provider: 'openai', model: 'gpt-4o' },
      steps: {},
    };
    const response = { ...payload, id: 's1', updated_at: '2025-01-02' };
    mockFetchOk(response);

    const result = await updateSettings(payload);
    expect(result).toEqual(response);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/admin/llm/settings');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual(payload);
  });
});

describe('fetchProviderDefaults', () => {
  it('calls the correct endpoint with provider name', async () => {
    const defaults = { model: 'gpt-4o', temperature: 0.5 };
    mockFetchOk(defaults);

    const result = await fetchProviderDefaults('openai');
    expect(result).toEqual(defaults);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/llm/providers/openai/defaults',
      expect.any(Object)
    );
  });
});
