/**
 * Projects API client — typed wrapper for the /api/projects backend routes.
 * All calls go through Next.js API proxy routes to keep admin token server-side.
 */

export interface Project {
  id: string;
  name: string;
  description: string;
  org_id: string;
  created_by: string;
  job_id: string | null;
  resume_ids: string[];
  status: "active" | "archived";
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectRun {
  id: string;
  project_id: string;
  run_type: string;
  run_label: string;
  params: Record<string, unknown>;
  resume_count: number;
  ranked: RankedCandidate[];
  run_notes: string;
  status: string;
  duration_seconds?: number;
  created_at: string;
}

export interface RankedCandidate {
  rank: number;
  resume_id: string;
  name: string;
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

export interface ProjectReport {
  id: string;
  project_id: string;
  run_ids: string[];
  weights: Record<string, number>;
  top_n: number;
  ranked: Array<{
    resume_id: string;
    name: string;
    weighted_score: number;
    run_scores: Record<string, number>;
    strengths: string[];
    gaps: string[];
  }>;
  created_at: string;
}

export interface PaginatedProjects {
  items: Project[];
  total: number;
  page: number;
  page_size: number;
}

const BASE = "/api/projects";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API error");
  }
  return res.json() as Promise<T>;
}

export async function listProjects(orgId: string, page = 1): Promise<PaginatedProjects> {
  return apiFetch<PaginatedProjects>(`${BASE}?org_id=${encodeURIComponent(orgId)}&page=${page}&page_size=20`);
}

export async function getProject(projectId: string): Promise<Project> {
  return apiFetch<Project>(`${BASE}/${projectId}`);
}

export async function createProject(data: {
  name: string;
  description?: string;
  org_id: string;
  job_id?: string | null;
}): Promise<Project> {
  return apiFetch<Project>(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ created_by: "recruiter", ...data }),
  });
}

export async function updateProject(projectId: string, updates: Partial<Pick<Project, "name" | "description" | "job_id" | "status">>): Promise<Project> {
  return apiFetch<Project>(`${BASE}/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function deleteProject(projectId: string): Promise<{ deleted: string }> {
  return apiFetch<{ deleted: string }>(`${BASE}/${projectId}`, { method: "DELETE" });
}

export async function addResumesToProject(projectId: string, resumeIds: string[]): Promise<Project> {
  return apiFetch<Project>(`${BASE}/${projectId}/resumes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_ids: resumeIds }),
  });
}

export async function removeResumeFromProject(projectId: string, resumeId: string): Promise<Project> {
  return apiFetch<Project>(`${BASE}/${projectId}/resumes/${resumeId}`, { method: "DELETE" });
}

export async function listRuns(projectId: string): Promise<ProjectRun[]> {
  return apiFetch<ProjectRun[]>(`${BASE}/${projectId}/runs`);
}

export async function getRun(projectId: string, runId: string): Promise<ProjectRun> {
  return apiFetch<ProjectRun>(`${BASE}/${projectId}/runs/${runId}`);
}

export async function listReports(projectId: string): Promise<ProjectReport[]> {
  return apiFetch<ProjectReport[]>(`${BASE}/${projectId}/reports`);
}

export async function createCombinedReport(
  projectId: string,
  data: { run_ids: string[]; weights: Record<string, number>; top_n: number; org_id: string }
): Promise<ProjectReport> {
  return apiFetch<ProjectReport>(`${BASE}/${projectId}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export type StreamEvent =
  | { type: "status"; step: string; message: string }
  | { type: "result"; step: string; data: RankedCandidate[]; run_id: string; run_notes: string }
  | { type: "error"; step: string; message: string }
  | { type: "complete"; step: string; run_id: string; duration_seconds?: number };

export async function streamProjectRun(
  projectId: string,
  runType: string,
  params: Record<string, unknown>,
  orgId: string,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const res = await fetch(`${BASE}/${projectId}/runs/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run_type: runType, org_id: orgId, params }),
  });

  if (!res.ok || !res.body) throw new Error("Stream failed to start");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6)) as StreamEvent;
          onEvent(event);
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface ContextConfig {
  enhancements: string[];
  custom: string;
  dim_overrides?: Record<string, string>;
  dim_weights?: Record<string, number>;
}

export async function getProjectContext(projectId: string): Promise<{ project_id: string; context: string; context_config: ContextConfig | null }> {
  return apiFetch(`${BASE}/${projectId}/context`);
}

export async function setProjectContext(
  projectId: string,
  context: string,
  context_config?: ContextConfig,
): Promise<{ project_id: string; context: string; context_config: ContextConfig | null }> {
  return apiFetch(`${BASE}/${projectId}/context`, {
    method: "PUT",
    body: JSON.stringify({ context, context_config }),
  });
}

export interface ContextDimension {
  key: string;
  label: string;
  description: string;
  core: boolean;
  selected: boolean;
  jd_relevance: number;
  coverage: number;
  predicted_improvement: number;
}

export interface ContextScore {
  baseline: number;
  stack_score: number;
  stack_gain: number;
  resume_count: number;
  jd_found: boolean;
  dimensions: ContextDimension[];
}

export async function scoreContext(projectId: string, selectedKeys: string[]): Promise<ContextScore> {
  return apiFetch(`${BASE}/${projectId}/context/score`, {
    method: "POST",
    body: JSON.stringify({ selected_keys: selectedKeys }),
  });
}
