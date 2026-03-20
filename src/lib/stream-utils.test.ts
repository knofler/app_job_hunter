/**
 * Tests for src/lib/stream-utils.ts
 * Covers: streamRecruiterWorkflow SSE parsing, callback invocations, error handling
 */

import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });

import { streamRecruiterWorkflow } from './stream-utils';

beforeEach(() => {
  jest.restoreAllMocks();
  global.fetch = jest.fn();
  // Suppress console.log/error from the stream parser
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

/** Helper to create a mock ReadableStream from SSE lines */
function createMockStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(lines.join('\n') + '\n');
  let consumed = false;

  return {
    getReader() {
      return {
        read() {
          if (!consumed) {
            consumed = true;
            return Promise.resolve({ done: false, value: data });
          }
          return Promise.resolve({ done: true, value: undefined });
        },
        releaseLock: jest.fn(),
      };
    },
  } as unknown as ReadableStream<Uint8Array>;
}

function mockFetchStream(lines: string[], status = 200) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    body: createMockStream(lines),
  });
}

describe('streamRecruiterWorkflow', () => {
  const payload = { job_description: 'test', resumes: [] };

  it('calls fetch with correct URL and method', async () => {
    mockFetchStream(['data: {"type":"done"}']);

    await streamRecruiterWorkflow(payload, {});

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/recruiter-workflow/stream',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  });

  it('throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
    });

    await expect(
      streamRecruiterWorkflow(payload, {})
    ).rejects.toThrow('Stream request failed with status 500');
  });

  it('throws when response body is null', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      body: null,
    });

    await expect(
      streamRecruiterWorkflow(payload, {})
    ).rejects.toThrow('Response body is null');
  });

  it('invokes onStatus callback for status events', async () => {
    mockFetchStream([
      'data: {"type":"status","step":"parsing","message":"Parsing JD"}',
      'data: {"type":"done"}',
    ]);

    const onStatus = jest.fn();
    await streamRecruiterWorkflow(payload, { onStatus });

    expect(onStatus).toHaveBeenCalledWith('parsing', 'Parsing JD');
  });

  it('invokes onResult callback for result events', async () => {
    const resultData = [{ candidate_id: 'c1', score: 85 }];
    mockFetchStream([
      `data: {"type":"result","step":"ranking","data":${JSON.stringify(resultData)}}`,
      'data: {"type":"done"}',
    ]);

    const onResult = jest.fn();
    await streamRecruiterWorkflow(payload, { onResult });

    expect(onResult).toHaveBeenCalledWith('ranking', resultData);
  });

  it('invokes onPartial callback for partial events', async () => {
    const partialData = { markdown: '## Analysis' };
    mockFetchStream([
      `data: {"type":"partial","step":"ai_analysis","data":${JSON.stringify(partialData)}}`,
      'data: {"type":"done"}',
    ]);

    const onPartial = jest.fn();
    await streamRecruiterWorkflow(payload, { onPartial });

    expect(onPartial).toHaveBeenCalledWith('ai_analysis', partialData);
  });

  it('invokes onComplete callback for complete events', async () => {
    const completeData = { job: {}, core_skills: [] };
    mockFetchStream([
      `data: {"type":"complete","data":${JSON.stringify(completeData)}}`,
      'data: {"type":"done"}',
    ]);

    const onComplete = jest.fn();
    await streamRecruiterWorkflow(payload, { onComplete });

    expect(onComplete).toHaveBeenCalledWith(completeData);
  });

  it('invokes onError callback for error events', async () => {
    mockFetchStream([
      'data: {"type":"error","message":"LLM timeout"}',
      'data: {"type":"done"}',
    ]);

    const onError = jest.fn();
    await streamRecruiterWorkflow(payload, { onError });

    expect(onError).toHaveBeenCalledWith('LLM timeout');
  });

  it('returns early on done event', async () => {
    mockFetchStream([
      'data: {"type":"status","step":"step1","message":"msg1"}',
      'data: {"type":"done"}',
      'data: {"type":"status","step":"step2","message":"msg2"}',
    ]);

    const onStatus = jest.fn();
    await streamRecruiterWorkflow(payload, { onStatus });

    // step2 should NOT be processed because done was received first
    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenCalledWith('step1', 'msg1');
  });

  it('skips empty lines and non-data lines', async () => {
    mockFetchStream([
      '',
      ':comment',
      'event: something',
      'data: {"type":"status","step":"s1","message":"m1"}',
      'data: {"type":"done"}',
    ]);

    const onStatus = jest.fn();
    await streamRecruiterWorkflow(payload, { onStatus });

    expect(onStatus).toHaveBeenCalledTimes(1);
  });

  it('handles malformed JSON gracefully', async () => {
    mockFetchStream([
      'data: not valid json',
      'data: {"type":"status","step":"s1","message":"m1"}',
      'data: {"type":"done"}',
    ]);

    const onStatus = jest.fn();
    await streamRecruiterWorkflow(payload, { onStatus });

    // Should still process valid events after malformed one
    expect(onStatus).toHaveBeenCalledWith('s1', 'm1');
    expect(console.error).toHaveBeenCalled();
  });

  it('processes multiple events in sequence', async () => {
    mockFetchStream([
      'data: {"type":"status","step":"parse_jd","message":"Parsing"}',
      'data: {"type":"status","step":"analyze","message":"Analyzing"}',
      'data: {"type":"result","step":"ranking","data":[1,2,3]}',
      'data: {"type":"complete","data":{"final":true}}',
      'data: {"type":"done"}',
    ]);

    const onStatus = jest.fn();
    const onResult = jest.fn();
    const onComplete = jest.fn();
    await streamRecruiterWorkflow(payload, { onStatus, onResult, onComplete });

    expect(onStatus).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('works with no callbacks provided', async () => {
    mockFetchStream([
      'data: {"type":"status","step":"s1","message":"m1"}',
      'data: {"type":"done"}',
    ]);

    // Should not throw
    await expect(streamRecruiterWorkflow(payload, {})).resolves.toBeUndefined();
  });
});
