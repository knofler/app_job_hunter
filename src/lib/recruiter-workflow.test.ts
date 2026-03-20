/**
 * Tests for src/lib/recruiter-workflow.ts
 * Covers: proxyFetch and all API wrapper functions
 */

// Mock global fetch
beforeEach(() => {
  jest.restoreAllMocks();
  global.fetch = jest.fn();
});

import {
  listCandidates,
  listAllResumes,
  searchCandidatesAndResumes,
  listCandidateResumes,
  generateRecruiterWorkflow,
  saveWorkflowResult,
  getLastWorkflow,
  listJobDescriptions,
  getJobDescription,
  createJobDescription,
  updateJobDescription,
} from './recruiter-workflow';

function mockFetchOk(data: unknown, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status,
    text: () => Promise.resolve(status === 204 ? '' : JSON.stringify(data)),
  });
}

function mockFetchError(message: string, status = 500) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve(message),
  });
}

describe('proxyFetch (via API functions)', () => {
  it('calls fetch with /api prefix and JSON content-type', async () => {
    mockFetchOk({ items: [], total: 0, page: 1, page_size: 100 });

    await listCandidates();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/candidates?page=1&page_size=100',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('throws on non-ok responses', async () => {
    mockFetchError('Not Found', 404);
    await expect(listCandidates()).rejects.toThrow('Not Found');
  });

  it('throws with default message when error text is empty', async () => {
    mockFetchError('', 500);
    await expect(listCandidates()).rejects.toThrow(
      'Request to /candidates?page=1&page_size=100 failed with status 500'
    );
  });

  it('returns undefined for 204 responses', async () => {
    mockFetchOk(null, 204);
    const result = await listCandidates();
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty body', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(''),
    });
    const result = await listCandidates();
    expect(result).toBeUndefined();
  });

  it('throws on invalid JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('not json'),
    });
    await expect(listCandidates()).rejects.toThrow('Failed to parse response');
  });
});

describe('listCandidates', () => {
  it('calls the correct endpoint', async () => {
    const mockData = { items: [], total: 0, page: 1, page_size: 100 };
    mockFetchOk(mockData);

    const result = await listCandidates();
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/candidates?page=1&page_size=100',
      expect.any(Object)
    );
  });
});

describe('listAllResumes', () => {
  it('uses default page and pageSize', async () => {
    mockFetchOk({ items: [], total: 0 });
    await listAllResumes();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/resumes/?page=1&page_size=100',
      expect.any(Object)
    );
  });

  it('passes custom page and pageSize', async () => {
    mockFetchOk({ items: [], total: 0 });
    await listAllResumes(2, 50);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/resumes/?page=2&page_size=50',
      expect.any(Object)
    );
  });
});

describe('searchCandidatesAndResumes', () => {
  it('builds correct query params', async () => {
    mockFetchOk({ query: 'react', results: [], total: 0, page: 1, page_size: 20 });

    await searchCandidatesAndResumes('react', 2, 10);

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('q=react');
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=10');
  });
});

describe('listCandidateResumes', () => {
  it('calls the correct endpoint with candidate ID', async () => {
    mockFetchOk({ resumes: [] });
    await listCandidateResumes('cand-123');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/candidates/cand-123/resumes',
      expect.any(Object)
    );
  });
});

describe('generateRecruiterWorkflow', () => {
  it('sends POST with payload', async () => {
    const payload = {
      job_description: 'Senior React Developer',
      resumes: [{ resume_id: 'r1' }],
    };
    const mockResponse = {
      job: {},
      core_skills: [],
      ai_analysis_markdown: '',
      candidate_analysis: [],
      ranked_shortlist: [],
      detailed_readout: [],
      engagement_plan: [],
      fairness_guidance: [],
      interview_preparation: [],
    };
    mockFetchOk(mockResponse);

    const result = await generateRecruiterWorkflow(payload);
    expect(result).toEqual(mockResponse);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/recruiter-workflow/generate');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(payload);
  });
});

describe('saveWorkflowResult', () => {
  it('sends POST with workflow response', async () => {
    const payload = {
      job: { title: 'Test' },
      core_skills: [],
      ai_analysis_markdown: '',
      candidate_analysis: [],
      ranked_shortlist: [],
      detailed_readout: [],
      engagement_plan: [],
      fairness_guidance: [],
      interview_preparation: [],
    } as any;
    mockFetchOk({ success: true, workflow_id: 'wf-1' });

    const result = await saveWorkflowResult(payload);
    expect(result).toEqual({ success: true, workflow_id: 'wf-1' });
  });
});

describe('getLastWorkflow', () => {
  it('calls the correct endpoint', async () => {
    mockFetchOk({ message: 'No workflows found' });
    const result = await getLastWorkflow();
    expect(result).toEqual({ message: 'No workflows found' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/recruiter-workflow/last',
      expect.any(Object)
    );
  });
});

describe('listJobDescriptions', () => {
  it('uses default pagination', async () => {
    mockFetchOk({ items: [], total: 0, page: 1, page_size: 25 });
    await listJobDescriptions();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/jobs/descriptions?page=1&page_size=25',
      expect.any(Object)
    );
  });

  it('passes custom page and pageSize', async () => {
    mockFetchOk({ items: [], total: 0, page: 2, page_size: 10 });
    await listJobDescriptions(2, 10);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/jobs/descriptions?page=2&page_size=10',
      expect.any(Object)
    );
  });
});

describe('getJobDescription', () => {
  it('fetches a single job by ID', async () => {
    const job = { id: 'j1', title: 'Dev', company: 'Co', location: 'NY', description: 'desc', created_at: '', updated_at: '' };
    mockFetchOk(job);
    const result = await getJobDescription('j1');
    expect(result).toEqual(job);
    expect(global.fetch).toHaveBeenCalledWith('/api/jobs/j1', expect.any(Object));
  });
});

describe('createJobDescription', () => {
  it('sends POST to /jobs', async () => {
    const job = { title: 'Dev', company: 'Co', location: 'NY', description: 'desc' };
    mockFetchOk({ ...job, id: 'new-id', created_at: '', updated_at: '' });
    await createJobDescription(job);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/jobs');
    expect(init.method).toBe('POST');
  });
});

describe('updateJobDescription', () => {
  it('sends PUT to /jobs/:id', async () => {
    mockFetchOk({ id: 'j1', title: 'Updated' });
    await updateJobDescription('j1', { title: 'Updated' });
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/jobs/j1');
    expect(init.method).toBe('PUT');
  });
});
