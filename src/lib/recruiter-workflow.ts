/**
 * Fetch through the Next.js API proxy routes which inject ADMIN_API_KEY server-side.
 * NEXT_PUBLIC_* tokens are unavailable at runtime in Docker (inlined at build time),
 * so all authenticated calls must go through server-side proxies.
 */
async function proxyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `/api${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse response from ${path}: ${(error as Error).message}`);
  }
}

export type ResumeReference = {
  resume_id: string;
  candidate_id?: string;
};

export type JobMetadata = {
  title?: string;
  code?: string;
  level?: string;
  salary_band?: string;
  summary?: string;
};

export type LLMProviderConfig = {
  provider: string;
  model: string;
  api_key?: string | null;
  base_url?: string | null;
  temperature?: number | null;
  max_tokens?: number | null;
  extra_headers?: Record<string, string>;
  extra_payload?: Record<string, unknown>;
};

export type RecruiterWorkflowRequest = {
  job_description: string;
  resumes: ResumeReference[];
  job_metadata?: JobMetadata;
  step_overrides?: Record<string, LLMProviderConfig>;
};

export type CoreSkill = {
  name: string;
  reason: string;
};

export type SkillAlignment = {
  skill: string;
  status: string;
  evidence: string;
};

export type CandidateAnalysis = {
  candidate_id: string;
  name?: string | null;
  match_score?: number | null;
  bias_free_score?: number | null;
  summary?: string | null;
  highlights: string[];
  skill_alignment: SkillAlignment[];
};

export type RankedCandidateItem = {
  candidate_id: string;
  rank: number;
  priority?: string | null;
  status?: string | null;
  availability?: string | null;
  notes?: string | null;
};

export type CandidateReadout = {
  candidate_id: string;
  strengths: string[];
  risks: string[];
  recommended_actions: string[];
};

export type InsightItem = {
  label: string;
  value: string;
  helper?: string | null;
};

export type InterviewQuestion = {
  question: string;
  rationale: string;
};

export type RecruiterWorkflowResponse = {
  job: JobMetadata;
  core_skills: CoreSkill[];
  ai_analysis_markdown: string;
  candidate_analysis: CandidateAnalysis[];
  ranked_shortlist: RankedCandidateItem[];
  detailed_readout: CandidateReadout[];
  engagement_plan: InsightItem[];
  fairness_guidance: InsightItem[];
  interview_preparation: InterviewQuestion[];
};

export type CandidateSummary = {
  candidate_id: string;
  name: string;
  primary_role?: string;
  candidate_type?: string;
  preferred_locations?: string[];
  experience_years?: number;
  updated_at?: string;
};

export type CandidateListResponse = {
  items: CandidateSummary[];
  total: number;
  page: number;
  page_size: number;
};

export type ResumeSummary = {
  id: string;
  name: string;
  summary?: string;
  type?: string;
  skills?: string[];
  last_updated?: string;
};

export type CandidateResumesResponse = {
  resumes: ResumeSummary[];
};

export type SearchResult = {
  candidate: CandidateSummary;
  matching_resumes: (ResumeSummary & { _search_match?: boolean })[];
  resume_count: number;
};

export type CandidateSearchResponse = {
  query: string;
  results: SearchResult[];
  total: number;
  page: number;
  page_size: number;
};

export type JobDescription = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  code?: string;
  created_at: string;
  updated_at: string;
  uploaded_at?: string;
};

export type JobListResponse = {
  items: JobDescription[];
  total: number;
  page: number;
  page_size: number;
};

export async function listCandidates(): Promise<CandidateListResponse> {
  return proxyFetch<CandidateListResponse>(`/candidates?page=1&page_size=100`);
}

export async function listAllResumes(page: number = 1, pageSize: number = 100): Promise<{ items: ResumeSummary[]; total: number }> {
  return proxyFetch<{ items: ResumeSummary[]; total: number }>(`/resumes/?page=${page}&page_size=${pageSize}`);
}

export async function searchCandidatesAndResumes(query: string, page: number = 1, pageSize: number = 20): Promise<CandidateSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  return proxyFetch<CandidateSearchResponse>(`/candidates/search?${params}`);
}

export async function listCandidateResumes(candidateId: string): Promise<CandidateResumesResponse> {
  return proxyFetch<CandidateResumesResponse>(`/candidates/${candidateId}/resumes`);
}

export async function generateRecruiterWorkflow(
  payload: RecruiterWorkflowRequest,
): Promise<RecruiterWorkflowResponse> {
  return proxyFetch<RecruiterWorkflowResponse>(`/recruiter-workflow/generate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function saveWorkflowResult(
  payload: RecruiterWorkflowResponse,
): Promise<{ success: boolean; workflow_id: string }> {
  return proxyFetch<{ success: boolean; workflow_id: string }>(`/recruiter-workflow/save`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLastWorkflow(): Promise<RecruiterWorkflowResponse | { message: string }> {
  return proxyFetch<RecruiterWorkflowResponse | { message: string }>(`/recruiter-workflow/last`);
}

export async function listJobDescriptions(page: number = 1, pageSize: number = 25): Promise<JobListResponse> {
  return proxyFetch<JobListResponse>(`/jobs/descriptions?page=${page}&page_size=${pageSize}`);
}

export async function getJobDescription(jobId: string): Promise<JobDescription> {
  return proxyFetch<JobDescription>(`/jobs/${jobId}`);
}

export async function createJobDescription(job: Omit<JobDescription, 'id' | 'created_at' | 'updated_at'>): Promise<JobDescription> {
  return proxyFetch<JobDescription>('/jobs', {
    method: 'POST',
    body: JSON.stringify(job),
  });
}

export async function updateJobDescription(jobId: string, job: Partial<Omit<JobDescription, 'id' | 'created_at' | 'updated_at'>>): Promise<JobDescription> {
  return proxyFetch<JobDescription>(`/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify(job),
  });
}
