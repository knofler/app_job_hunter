/**
 * Tests for src/lib/recruiter-ranking.ts
 * Covers: listResumeOptions, uploadJobDescriptionFile, uploadResumeFile,
 *         listJobDescriptions, generateRecruiterRanking
 */

import {
  listResumeOptions,
  uploadJobDescriptionFile,
  uploadResumeFile,
  listJobDescriptions,
  generateRecruiterRanking,
} from './recruiter-ranking';
import { fetchFromApi } from './api';

jest.mock('./api', () => ({
  fetchFromApi: jest.fn(),
}));

const mockFetchFromApi = fetchFromApi as jest.MockedFunction<typeof fetchFromApi>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listResumeOptions', () => {
  it('calls fetchFromApi with correct default limit', async () => {
    mockFetchFromApi.mockResolvedValue({ items: [] });
    await listResumeOptions();
    expect(mockFetchFromApi).toHaveBeenCalledWith('/recruiter-ranking/resumes?limit=200');
  });

  it('passes custom limit', async () => {
    mockFetchFromApi.mockResolvedValue({ items: [] });
    await listResumeOptions(50);
    expect(mockFetchFromApi).toHaveBeenCalledWith('/recruiter-ranking/resumes?limit=50');
  });
});

describe('uploadJobDescriptionFile', () => {
  it('sends FormData with file and title', async () => {
    mockFetchFromApi.mockResolvedValue({ job_id: 'j1' });
    const file = new File(['content'], 'jd.pdf', { type: 'application/pdf' });

    await uploadJobDescriptionFile(file, 'Senior Dev');

    expect(mockFetchFromApi).toHaveBeenCalledWith('/jobs/upload-jd', {
      method: 'POST',
      body: expect.any(FormData),
    });

    const formData = mockFetchFromApi.mock.calls[0][1]!.body as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('title')).toBe('Senior Dev');
  });
});

describe('uploadResumeFile', () => {
  it('sends FormData with file and candidate name', async () => {
    mockFetchFromApi.mockResolvedValue({ resume_id: 'r1' });
    const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });

    await uploadResumeFile(file, 'Jane Doe');

    expect(mockFetchFromApi).toHaveBeenCalledWith('/resumes/', {
      method: 'POST',
      body: expect.any(FormData),
    });

    const formData = mockFetchFromApi.mock.calls[0][1]!.body as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('candidate_name')).toBe('Jane Doe');
    expect(formData.get('name')).toBe('Jane Doe');
  });
});

describe('listJobDescriptions', () => {
  it('calls fetchFromApi with correct endpoint', async () => {
    mockFetchFromApi.mockResolvedValue({ items: [] });
    await listJobDescriptions();
    expect(mockFetchFromApi).toHaveBeenCalledWith('/jobs/descriptions?page=1&page_size=50');
  });
});

describe('generateRecruiterRanking', () => {
  it('sends POST with payload', async () => {
    const payload = {
      job_description: 'Senior React Developer',
      resumes: [{ resume_id: 'r1' }],
    };
    mockFetchFromApi.mockResolvedValue({ ranked_shortlist: [] });

    await generateRecruiterRanking(payload);

    expect(mockFetchFromApi).toHaveBeenCalledWith('/recruiter-ranking/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });

  it('returns ranked shortlist', async () => {
    const response = {
      ranked_shortlist: [
        { candidate_id: 'c1', resume_id: 'r1', score: 90, rank: 1 },
      ],
    };
    mockFetchFromApi.mockResolvedValue(response);

    const result = await generateRecruiterRanking({
      job_description: 'test',
      resumes: [{ resume_id: 'r1' }],
    });
    expect(result.ranked_shortlist).toHaveLength(1);
    expect(result.ranked_shortlist[0].score).toBe(90);
  });
});
