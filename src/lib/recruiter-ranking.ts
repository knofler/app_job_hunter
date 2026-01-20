import { fetchFromApi } from "./api";
import type { JobDescription } from "./recruiter-workflow";

export type ResumeOption = {
  id: string;
  name: string;
  candidate_id?: string | null;
  candidate_name?: string | null;
  summary?: string | null;
  skills?: string[];
  resume_type?: string | null;
  uploaded_at?: string | null;
  last_updated?: string | null;
};

export type RecruiterRankingRequest = {
  job_description: string;
  job_id?: string | null;
  job_title?: string | null;
  resumes: Array<{
    resume_id: string;
    candidate_id?: string | null;
  }>;
};

export type RankedResumeScore = {
  candidate_id: string;
  resume_id: string;
  score: number;
  rank: number;
  priority?: string | null;
  status?: string | null;
  availability?: string | null;
  notes?: string | null;
  summary?: string | null;
  confidence?: number | null;
  positive_signals?: string[];
  negative_signals?: string[];
  breakdown?: Array<{ label: string; score: number }>;
  missing_keywords?: string[];
  matched_keywords?: string[];
  improvement_suggestions?: string[];
  skills_analysis?: {
    found?: string[];
    missing?: string[];
  };
};

export type RecruiterRankingResponse = {
  ranked_shortlist: RankedResumeScore[];
};

export type ResumeOptionsResponse = {
  items: ResumeOption[];
};

export async function listResumeOptions(limit: number = 200): Promise<ResumeOptionsResponse> {
  return fetchFromApi<ResumeOptionsResponse>(`/recruiter-ranking/resumes?limit=${limit}`);
}

export async function uploadJobDescriptionFile(
  file: File,
  title: string,
): Promise<{ job_id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  return fetchFromApi<{ job_id: string }>("/jobs/upload-jd", {
    method: "POST",
    body: formData,
  });
}

export async function uploadResumeFile(
  file: File,
  candidateName: string,
): Promise<{ resume_id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("candidate_name", candidateName);
  formData.append("name", candidateName);
  return fetchFromApi<{ resume_id: string }>("/resumes/", {
    method: "POST",
    body: formData,
  });
}

export async function listJobDescriptions(): Promise<{ items: JobDescription[] }>{
  return fetchFromApi<{ items: JobDescription[] }>(`/jobs/descriptions?page=1&page_size=50`);
}

export async function generateRecruiterRanking(
  payload: RecruiterRankingRequest,
): Promise<RecruiterRankingResponse> {
  return fetchFromApi<RecruiterRankingResponse>(`/recruiter-ranking/generate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
