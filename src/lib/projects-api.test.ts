/**
 * Tests for src/lib/projects-api.ts
 * Covers: apiFetch, CRUD operations, streaming, context operations
 */

import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addResumesToProject,
  removeResumeFromProject,
  listRuns,
  getRun,
  listReports,
  createCombinedReport,
  getProjectContext,
  setProjectContext,
  scoreContext,
} from './projects-api';

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

function mockFetchError(detail: string, status = 500) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status,
    statusText: 'Server Error',
    json: () => Promise.resolve({ detail }),
  });
}

describe('apiFetch (via API wrappers)', () => {
  it('throws with detail from error response', async () => {
    mockFetchError('Project not found', 404);
    await expect(getProject('bad-id')).rejects.toThrow('Project not found');
  });

  it('throws statusText when json parse fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('bad json')),
    });
    await expect(getProject('bad-id')).rejects.toThrow('Internal Server Error');
  });

  it('sets cache to no-store', async () => {
    mockFetchOk({ items: [], total: 0, page: 1, page_size: 20 });
    await listProjects('org-1');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.cache).toBe('no-store');
  });
});

describe('listProjects', () => {
  it('calls correct URL with org_id and page', async () => {
    mockFetchOk({ items: [], total: 0, page: 1, page_size: 20 });
    await listProjects('org-1', 2);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/projects?org_id=org-1&page=2&page_size=20');
  });

  it('defaults to page 1', async () => {
    mockFetchOk({ items: [], total: 0, page: 1, page_size: 20 });
    await listProjects('org-1');
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('page=1');
  });
});

describe('getProject', () => {
  it('fetches a single project', async () => {
    const project = { id: 'p1', name: 'Test' };
    mockFetchOk(project);
    const result = await getProject('p1');
    expect(result).toEqual(project);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1',
      expect.objectContaining({ cache: 'no-store' })
    );
  });
});

describe('createProject', () => {
  it('sends POST with created_by default', async () => {
    const input = { name: 'New Project', org_id: 'org-1' };
    mockFetchOk({ id: 'p-new', ...input });
    await createProject(input);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/projects');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.created_by).toBe('recruiter');
    expect(body.name).toBe('New Project');
  });
});

describe('updateProject', () => {
  it('sends PATCH to correct URL', async () => {
    mockFetchOk({ id: 'p1', name: 'Updated' });
    await updateProject('p1', { name: 'Updated' });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/projects/p1');
    expect(init.method).toBe('PATCH');
  });
});

describe('deleteProject', () => {
  it('sends DELETE', async () => {
    mockFetchOk({ deleted: 'p1' });
    const result = await deleteProject('p1');
    expect(result).toEqual({ deleted: 'p1' });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/projects/p1');
    expect(init.method).toBe('DELETE');
  });
});

describe('addResumesToProject', () => {
  it('sends POST with resume_ids', async () => {
    mockFetchOk({ id: 'p1', resume_ids: ['r1', 'r2'] });
    await addResumesToProject('p1', ['r1', 'r2']);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/projects/p1/resumes');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ resume_ids: ['r1', 'r2'] });
  });
});

describe('removeResumeFromProject', () => {
  it('sends DELETE with resume ID in path', async () => {
    mockFetchOk({ id: 'p1', resume_ids: [] });
    await removeResumeFromProject('p1', 'r1');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/projects/p1/resumes/r1');
    expect(init.method).toBe('DELETE');
  });
});

describe('listRuns', () => {
  it('fetches runs for a project', async () => {
    mockFetchOk([{ id: 'run-1', project_id: 'p1' }]);
    const result = await listRuns('p1');
    expect(result).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/runs',
      expect.any(Object)
    );
  });
});

describe('getRun', () => {
  it('fetches a specific run', async () => {
    mockFetchOk({ id: 'run-1' });
    await getRun('p1', 'run-1');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/runs/run-1',
      expect.any(Object)
    );
  });
});

describe('listReports', () => {
  it('fetches reports for a project', async () => {
    mockFetchOk([]);
    await listReports('p1');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/reports',
      expect.any(Object)
    );
  });
});

describe('createCombinedReport', () => {
  it('sends POST with report params', async () => {
    const data = { run_ids: ['r1'], weights: { r1: 1 }, top_n: 5, org_id: 'org-1' };
    mockFetchOk({ id: 'rep-1' });
    await createCombinedReport('p1', data);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/projects/p1/reports');
    expect(init.method).toBe('POST');
  });
});

describe('getProjectContext', () => {
  it('fetches context for a project', async () => {
    mockFetchOk({ project_id: 'p1', context: 'some context', context_config: null });
    const result = await getProjectContext('p1');
    expect(result.project_id).toBe('p1');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects/p1/context',
      expect.any(Object)
    );
  });
});

describe('setProjectContext', () => {
  it('sends PUT with context data', async () => {
    mockFetchOk({ project_id: 'p1', context: 'updated', context_config: null });
    await setProjectContext('p1', 'updated');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/projects/p1/context');
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body);
    expect(body.context).toBe('updated');
  });

  it('sends context_config when provided', async () => {
    const config = { enhancements: ['diversity'], custom: 'focus on leadership', dim_overrides: {} };
    mockFetchOk({ project_id: 'p1', context: 'ctx', context_config: config });
    await setProjectContext('p1', 'ctx', config);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.context_config).toEqual(config);
  });
});

describe('scoreContext', () => {
  it('sends POST with selected keys', async () => {
    mockFetchOk({ baseline: 50, stack_score: 75, stack_gain: 25, resume_count: 3, jd_found: true, dimensions: [] });
    await scoreContext('p1', ['skills', 'experience']);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/projects/p1/context/score');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ selected_keys: ['skills', 'experience'] });
  });
});
