"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { usePersona, useRecruiterScope } from "@/context/PersonaContext";
import { fallbackRecruiterWorkflow } from "@/lib/fallback-data";
import { streamRecruiterWorkflow } from "@/lib/stream-utils";
import {
  CandidateAnalysis,
  CandidateListResponse,
  CandidateReadout,
  CandidateSummary,
  listCandidateResumes,
  listCandidates,
  RecruiterWorkflowRequest,
  RecruiterWorkflowResponse,
  ResumeSummary,
} from "@/lib/recruiter-workflow";

const fallback = fallbackRecruiterWorkflow;

const fallbackCoreSkills = fallback.coreSkills.map(item => ({
  name: item.name,
  reason: item.reason,
}));

const fallbackEngagementPlan = fallback.engagementInsights.map(item => ({
  label: item.label,
  value: item.value,
  helper: item.helper ?? null,
}));

const fallbackFairnessGuidance = fallback.fairnessInsights.map(item => ({
  label: item.label,
  value: item.value,
  helper: item.helper ?? null,
}));

const fallbackInterviewPack = fallback.interviewPreparation.map(item => ({
  question: item.question,
  rationale: item.rationale,
}));

const skillStatusClasses: Record<string, string> = {
  Yes: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Partial: "bg-amber-100 text-amber-700 border-amber-200",
  No: "bg-rose-100 text-rose-700 border-rose-200",
};

function formatDateTime(value: Date | null): string {
  if (!value) {
    return "Never";
  }
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function candidateDisplayName(candidate: CandidateSummary, index: number): string {
  return candidate.name || `Candidate ${index + 1}`;
}

const STEP_ORDER = ['loading', 'core_skills', 'ai_analysis', 'ranked_shortlist', 'detailed_readout', 'engagement_plan', 'fairness_guidance', 'interview_preparation'];

function isStepBefore(currentStep: string | null, targetStep: string): boolean {
  if (!currentStep) return false;
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const targetIndex = STEP_ORDER.indexOf(targetStep);
  return currentIndex !== -1 && targetIndex !== -1 && currentIndex < targetIndex;
}

type CandidateOption = CandidateSummary & {
  displayName: string;
};

export default function RecruiterAIWorkflowPage() {
  const { candidateId } = usePersona();
  const { isRecruiter } = useRecruiterScope();
  const [jobTitle, setJobTitle] = useState<string>(fallback.jobTitle);
  const [jobCode, setJobCode] = useState<string>(fallback.jobCode);
  const [jobLevel, setJobLevel] = useState<string>(fallback.jobLevel);
  const [jobSummary, setJobSummary] = useState<string>(fallback.jobSummary);
  const [salaryBand, setSalaryBand] = useState<string>(fallback.salaryBand);
  const [jobDescription, setJobDescription] = useState<string>(fallback.jobDescription);

  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState<boolean>(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [resumeLoading, setResumeLoading] = useState<boolean>(false);

  const [workflowResult, setWorkflowResult] = useState<RecruiterWorkflowResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date | null>(null);
  const [streamingStep, setStreamingStep] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [candidateListCollapsed, setCandidateListCollapsed] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function loadCandidates() {
      setCandidatesLoading(true);
      try {
        const response: CandidateListResponse = await listCandidates();
        if (cancelled) {
          return;
        }
        const mapped = response.items.map((candidate, index) => ({
          ...candidate,
          displayName: candidateDisplayName(candidate, index),
        }));
        setCandidates(mapped);
  const defaultCandidate = mapped.find(item => item.candidate_id === candidateId) || mapped[0];
        if (defaultCandidate) {
          setSelectedCandidateId(defaultCandidate.candidate_id);
        }
        setCandidateError(null);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setCandidateError((error as Error).message || "Failed to load candidates");
        }
      } finally {
        if (!cancelled) {
          setCandidatesLoading(false);
        }
      }
    }
    loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  useEffect(() => {
    if (!selectedCandidateId) {
      setResumes([]);
      setSelectedResumeIds([]);
      return;
    }
    let cancelled = false;
    async function loadResumes() {
      setResumeLoading(true);
      try {
        const response = await listCandidateResumes(selectedCandidateId);
        if (cancelled) {
          return;
        }
        setResumes(response.resumes);
        if (response.resumes.length > 0) {
          setSelectedResumeIds([response.resumes[0].id]);
        } else {
          setSelectedResumeIds([]);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setResumes([]);
          setSelectedResumeIds([]);
        }
      } finally {
        if (!cancelled) {
          setResumeLoading(false);
        }
      }
    }
    loadResumes();
    return () => {
      cancelled = true;
    };
  }, [selectedCandidateId]);

  const candidateAnalysisById = useMemo(() => {
    const map = new Map<string, CandidateAnalysis>();
    if (!workflowResult) {
      return map;
    }
    for (const item of workflowResult.candidate_analysis) {
      map.set(item.candidate_id, item);
    }
    return map;
  }, [workflowResult]);

  const readoutById = useMemo(() => {
    const map = new Map<string, CandidateReadout>();
    if (!workflowResult) {
      return map;
    }
    for (const item of workflowResult.detailed_readout) {
      map.set(item.candidate_id, item);
    }
    return map;
  }, [workflowResult]);

  const selectedCandidate = candidates.find(candidate => candidate.candidate_id === selectedCandidateId) || null;
  const selectedAnalysis = selectedCandidateId ? candidateAnalysisById.get(selectedCandidateId) || null : null;
  const selectedReadout = selectedCandidateId ? readoutById.get(selectedCandidateId) || null : null;

  const shortlist = workflowResult?.ranked_shortlist || [];
  
  // Define ref before conditional return
  const workflowStepsRef = useRef<HTMLDivElement>(null);

  if (!isRecruiter) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-gray-500">
        Switch to the recruiter persona to run the AI hiring workflow.
      </div>
    );
  }

  const handleResumeToggle = (event: ChangeEvent<HTMLInputElement>, resumeId: string) => {
    if (event.target.checked) {
      setSelectedResumeIds(current => {
        const merged = Array.from(new Set([...current, resumeId]));
        return merged.slice(0, 5);
      });
    } else {
      setSelectedResumeIds(current => current.filter(id => id !== resumeId));
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) {
      return;
    }
    if (!selectedCandidateId) {
      setGenerationError("Select a candidate before running the workflow");
      return;
    }
    if (!jobDescription.trim()) {
      setGenerationError("Job description is required");
      return;
    }
    if (selectedResumeIds.length === 0) {
      setGenerationError("Select at least one resume");
      return;
    }

    const payload: RecruiterWorkflowRequest = {
      job_description: jobDescription,
      job_metadata: {
        title: jobTitle,
        code: jobCode,
        level: jobLevel,
        salary_band: salaryBand,
        summary: jobSummary,
      },
      resumes: selectedResumeIds.map(resumeId => ({
        resume_id: resumeId,
        candidate_id: selectedCandidateId,
      })),
    };

    setIsGenerating(true);
    setGenerationError(null);
    setStreamingStep(null);
    setStreamingMessage(null);
    setCandidateListCollapsed(true);
    
    // Clear previous results to show streaming effect
    setWorkflowResult(null);
    
    // Scroll to workflow steps section
    setTimeout(() => {
      workflowStepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);

    try {
      await streamRecruiterWorkflow(payload, {
        onStatus: (step, message) => {
          setStreamingStep(step);
          setStreamingMessage(message);
        },
        onPartial: (step, data) => {
          // Handle partial streaming updates (e.g., markdown text appearing character by character)
          setWorkflowResult(prev => {
            const baseResult = prev || {
              job: payload.job_metadata || { title: "", code: "", level: "", salary_band: "", summary: "" },
              core_skills: [],
              ai_analysis_markdown: "",
              candidate_analysis: [],
              ranked_shortlist: [],
              detailed_readout: [],
              engagement_plan: [],
              fairness_guidance: [],
              interview_preparation: [],
            };

            // Handle partial ai_analysis (streaming markdown)
            if (step === "ai_analysis" && data && typeof data === "object" && "markdown" in data) {
              const partialData = data as { markdown: string };
              return {
                ...baseResult,
                ai_analysis_markdown: partialData.markdown,
              } as RecruiterWorkflowResponse;
            }

            // Handle partial arrays for engagement_plan, fairness_guidance, interview_preparation
            if (step === "engagement_plan" && Array.isArray(data)) {
              return {
                ...baseResult,
                engagement_plan: data,
              } as RecruiterWorkflowResponse;
            }

            if (step === "fairness_guidance" && Array.isArray(data)) {
              return {
                ...baseResult,
                fairness_guidance: data,
              } as RecruiterWorkflowResponse;
            }

            if (step === "interview_preparation" && Array.isArray(data)) {
              return {
                ...baseResult,
                interview_preparation: data,
              } as RecruiterWorkflowResponse;
            }

            return baseResult;
          });
        },
        onResult: (step, data) => {
          // Update partial results as they come in
          setWorkflowResult(prev => {
            const baseResult = prev || {
              job: payload.job_metadata || { title: "", code: "", level: "", salary_band: "", summary: "" },
              core_skills: [],
              ai_analysis_markdown: "",
              candidate_analysis: [],
              ranked_shortlist: [],
              detailed_readout: [],
              engagement_plan: [],
              fairness_guidance: [],
              interview_preparation: [],
            };

            // Handle ai_analysis special case (has nested structure)
            if (step === "ai_analysis" && data && typeof data === "object" && "markdown" in data && "candidates" in data) {
              const analysisData = data as { markdown: string; candidates: CandidateAnalysis[] };
              return {
                ...baseResult,
                ai_analysis_markdown: analysisData.markdown,
                candidate_analysis: analysisData.candidates,
              } as RecruiterWorkflowResponse;
            }

            // For all other steps, map directly
            return { ...baseResult, [step]: data } as RecruiterWorkflowResponse;
          });
        },
        onComplete: (data) => {
          setWorkflowResult(data as RecruiterWorkflowResponse);
          setLastAnalyzedAt(new Date());
          setStreamingStep(null);
          setStreamingMessage(null);
        },
        onError: (error) => {
          setGenerationError(error);
          setStreamingStep(null);
          setStreamingMessage(null);
        },
      });
    } catch (error) {
      console.error(error);
      setGenerationError((error as Error).message || "Failed to generate recruiter workflow");
      setStreamingStep(null);
      setStreamingMessage(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // When generating, show empty arrays to demonstrate streaming effect
  // When not generating, show real data or fallback
  const displayCoreSkills = isGenerating 
    ? (workflowResult?.core_skills || [])
    : (workflowResult?.core_skills && workflowResult.core_skills.length > 0)
      ? workflowResult.core_skills
      : fallbackCoreSkills;
  
  const displayEngagement = isGenerating
    ? (workflowResult?.engagement_plan || [])
    : (workflowResult?.engagement_plan && workflowResult.engagement_plan.length > 0)
      ? workflowResult.engagement_plan
      : fallbackEngagementPlan;
  
  const displayFairness = isGenerating
    ? (workflowResult?.fairness_guidance || [])
    : (workflowResult?.fairness_guidance && workflowResult.fairness_guidance.length > 0)
      ? workflowResult.fairness_guidance
      : fallbackFairnessGuidance;
  
  const displayInterview = isGenerating
    ? (workflowResult?.interview_preparation || [])
    : (workflowResult?.interview_preparation && workflowResult.interview_preparation.length > 0)
      ? workflowResult.interview_preparation
      : fallbackInterviewPack;
  
  const markdownAnalysis = isGenerating
    ? (workflowResult?.ai_analysis_markdown || "")
    : workflowResult?.ai_analysis_markdown
      || fallback.workflowSteps
        .map(step => `### ${step.title}\n${step.description}`)
        .join("\n\n");

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-10">
      <header className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
          Recruiter AI Workflow
        </span>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Recruiter AI workflow</h1>
            <p className="text-gray-600">
              Capture the job context, choose candidate resumes, and let the AI engine produce ranked shortlists,
              detailed readouts, fairness guidance, and interview packs.
            </p>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 space-y-2">
              <div className="grid gap-2 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-blue-900">
                  Job title
                  <input
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={jobTitle}
                    onChange={event => setJobTitle(event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-blue-900">
                  Job code
                  <input
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={jobCode}
                    onChange={event => setJobCode(event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-blue-900">
                  Level / program
                  <input
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={jobLevel}
                    onChange={event => setJobLevel(event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-blue-900">
                  Salary band
                  <input
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
                    value={salaryBand}
                    onChange={event => setSalaryBand(event.target.value)}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm text-blue-900">
                Summary / recruiter notes
                <textarea
                  className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
                  rows={3}
                  value={jobSummary}
                  onChange={event => setJobSummary(event.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm text-gray-500">
            <div>
              <span className="font-semibold text-gray-700">Last analysis:</span> {formatDateTime(lastAnalyzedAt)}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedCandidateId || selectedResumeIds.length === 0}
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Run workflow"}
            </button>
            {generationError && (
              <p className="max-w-xs rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {generationError}
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">1. Inputs captured</h2>
          {isGenerating && <span className="text-sm text-blue-600">Processing...</span>}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Job description</h3>
                <p className="text-sm text-gray-500">Paste the recruiter-owned job brief driving the AI prompt.</p>
              </div>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Required
              </span>
            </div>
            <textarea
              value={jobDescription}
              onChange={event => setJobDescription(event.target.value)}
              rows={16}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Paste the job description or upload a JD file"
            />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Candidate & resumes</h3>
                <p className="text-sm text-gray-500">Pick a candidate and up to five resumes to analyse.</p>
              </div>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {selectedResumeIds.length} selected
              </span>
            </div>
            {candidateError && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{candidateError}</p>
            )}
            <div className="grid gap-3">
              {candidatesLoading && <p className="text-xs text-gray-500">Loading candidates...</p>}
              {!candidatesLoading && candidates.length === 0 && (
                <p className="text-xs text-gray-500">No candidates available. Upload resumes via the candidate profile first.</p>
              )}
              {candidateListCollapsed && selectedCandidateId ? (
                // Show only selected candidate when collapsed
                <div className="space-y-3">
                  {(() => {
                    const selectedCandidate = candidates.find(c => c.candidate_id === selectedCandidateId);
                    if (!selectedCandidate) return null;
                    return (
                      <div className="rounded-xl border border-blue-500 bg-blue-50 px-4 py-3 shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{selectedCandidate.displayName}</p>
                            <p className="text-xs text-gray-600">{selectedCandidate.primary_role || "Role not captured"}</p>
                          </div>
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                            Selected
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setCandidateListCollapsed(false)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 hover:border-blue-300"
                  >
                    Show all candidates
                  </button>
                </div>
              ) : (
                // Show all candidates when not collapsed
                candidates.map(candidate => {
                  const isActive = candidate.candidate_id === selectedCandidateId;
                  return (
                    <button
                      key={candidate.candidate_id}
                      type="button"
                      onClick={() => setSelectedCandidateId(candidate.candidate_id)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        isActive ? "border-blue-500 bg-blue-50 shadow" : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{candidate.displayName}</p>
                          <p className="text-xs text-gray-600">{candidate.primary_role || "Role not captured"}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>Candidate ID</p>
                          <p className="font-semibold text-gray-700">{candidate.candidate_id}</p>
                        </div>
                      </div>
                      {candidate.preferred_locations && candidate.preferred_locations.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500">Preferred locations: {candidate.preferred_locations.join(", ")}</p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">Available resumes</p>
              {resumeLoading && <p className="text-xs text-gray-500">Loading resumes...</p>}
              {!resumeLoading && resumes.length === 0 && (
                <p className="text-xs text-gray-500">No resumes available for this candidate yet.</p>
              )}
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                {resumes.map(resume => (
                  <li key={resume.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedResumeIds.includes(resume.id)}
                      onChange={event => handleResumeToggle(event, resume.id)}
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{resume.name}</p>
                      {resume.summary && <p className="text-gray-500">{resume.summary}</p>}
                      {resume.skills && resume.skills.length > 0 && (
                        <p className="text-gray-500">Skills: {resume.skills.join(", ")}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-gray-500">Upload additional resumes via the candidate profile to make them available here.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4" ref={workflowStepsRef}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">2. Workflow steps</h2>
          {isGenerating && streamingStep === 'loading' && (
            <span className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
              {streamingMessage || 'AI generating...'}
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {fallback.workflowSteps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700">
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm text-gray-600">{step.description}</p>
              {step.bullets && step.bullets.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-500">
                  {step.bullets.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">3. Core must-have skills</h2>
          {isGenerating && streamingStep === 'core_skills' && (
            <span className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
              {streamingMessage || 'AI generating...'}
            </span>
          )}
          {isGenerating && isStepBefore(streamingStep, 'core_skills') && displayCoreSkills.length === 0 && (
            <span className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-400"></span>
              Waiting...
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {isGenerating && streamingStep === 'core_skills' && displayCoreSkills.length === 0 && (
            <div className="col-span-full rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-600"></span>
                Analyzing core skills from job description...
              </div>
            </div>
          )}
          {displayCoreSkills.map(skill => (
            <div key={skill.name} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{skill.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">4. AI-powered analysis</h2>
          {isGenerating && (streamingStep === 'ai_analysis' || (streamingStep && ['loading', 'core_skills'].includes(streamingStep) && !markdownAnalysis)) && (
            <span className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
              {streamingStep === 'ai_analysis' ? 'AI generating...' : 'Waiting...'}
            </span>
          )}
        </div>
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {isGenerating && streamingStep === 'ai_analysis' && !markdownAnalysis && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-blue-700">
              <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-600"></span>
              Waiting for AI response...
            </div>
          )}
          {markdownAnalysis && (
            <div className="prose prose-sm max-w-none text-gray-800">
              {markdownAnalysis.split('\n').map((line, idx) => {
                if (line.startsWith('### ')) {
                  return <h3 key={idx} className="text-lg font-semibold text-gray-900 mt-4 mb-2">{line.substring(4)}</h3>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={idx} className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.substring(3)}</h2>;
                } else if (line.startsWith('# ')) {
                  return <h1 key={idx} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{line.substring(2)}</h1>;
                } else if (line.startsWith('- ')) {
                  return <li key={idx} className="ml-4 text-gray-700">{line.substring(2)}</li>;
                } else if (line.trim() === '') {
                  return <br key={idx} />;
                } else {
                  return <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>;
                }
              })}
            </div>
          )}
          {isGenerating && markdownAnalysis && streamingStep === 'ai_analysis' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
              Streaming...
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">5. Ranked shortlist</h2>
          {isGenerating && streamingStep === 'ranked_shortlist' && (
            <span className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
              {streamingMessage || 'AI generating...'}
            </span>
          )}
          {isGenerating && isStepBefore(streamingStep, 'ranked_shortlist') && shortlist.length === 0 && (
            <span className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-400"></span>
              Waiting...
            </span>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Candidate</th>
                <th className="px-4 py-3 text-left font-semibold">Match</th>
                <th className="px-4 py-3 text-left font-semibold">Bias-free</th>
                <th className="px-4 py-3 text-left font-semibold">Priority</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isGenerating && streamingStep === 'ranked_shortlist' && shortlist.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-center text-sm text-blue-700" colSpan={6}>
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-600"></span>
                      Ranking candidates and generating shortlist...
                    </div>
                  </td>
                </tr>
              )}
              {!isGenerating && shortlist.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan={6}>
                    Run the workflow to populate the ranked shortlist.
                  </td>
                </tr>
              )}
              {shortlist.map(item => {
                const rowCandidate = candidates.find(candidate => candidate.candidate_id === item.candidate_id);
                const analysis = candidateAnalysisById.get(item.candidate_id);
                const isActive = item.candidate_id === selectedCandidateId;
                return (
                  <tr
                    key={`${item.candidate_id}-${item.rank}`}
                    className={`${isActive ? "bg-blue-50/60" : "bg-white"} hover:bg-blue-50/50`}
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">
                        {analysis?.name || rowCandidate?.displayName || item.candidate_id}
                      </div>
                      <div className="text-xs text-gray-600">Rank {item.rank}</div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{analysis?.match_score ?? "--"}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{analysis?.bias_free_score ?? "--"}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">{item.priority ?? "--"}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">{item.status ?? "--"}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">{item.availability ?? "--"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCandidate && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-900">6. Detailed readout</h2>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Focus: {selectedAnalysis?.name || selectedCandidate.displayName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isGenerating && streamingStep === 'detailed_readout' && (
                <span className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
                  {streamingMessage || 'AI generating...'}
                </span>
              )}
              {isGenerating && isStepBefore(streamingStep, 'detailed_readout') && !selectedReadout && (
                <span className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
                  <span className="inline-block h-2 w-2 rounded-full bg-gray-400"></span>
                  Waiting...
                </span>
              )}
            </div>
          </div>
          <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">{selectedAnalysis?.name || selectedCandidate.displayName}</h3>
                <p className="text-sm text-gray-600">{selectedCandidate.primary_role || "Role not captured"}</p>
                {selectedCandidate.experience_years != null && (
                  <p className="text-sm text-gray-600">Experience: {selectedCandidate.experience_years} years</p>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-4 text-sm text-gray-600">
                {selectedAnalysis?.match_score != null && (
                  <div>
                    <span className="font-semibold text-gray-800">Match score</span>
                    <div className="text-lg font-bold text-blue-700">{selectedAnalysis.match_score}</div>
                  </div>
                )}
                {selectedAnalysis?.bias_free_score != null && (
                  <div>
                    <span className="font-semibold text-gray-800">Bias-free score</span>
                    <div className="text-lg font-bold text-emerald-700">{selectedAnalysis.bias_free_score}</div>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-800">Selected resumes</span>
                  <div className="text-xs text-gray-600">{selectedResumeIds.join(", ") || "None"}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Workflow run</span>
                  <div className="text-xs text-gray-600">{formatDateTime(lastAnalyzedAt)}</div>
                </div>
              </div>
            </div>

            {selectedAnalysis?.summary && <p className="text-sm text-gray-700">{selectedAnalysis.summary}</p>}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Highlights</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                {selectedAnalysis && selectedAnalysis.highlights.length === 0 && <li>No highlights returned.</li>}
                {selectedAnalysis?.highlights.map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-blue-400" />
                    <span>{item}</span>
                  </li>
                ))}
                {!selectedAnalysis && <li className="text-xs text-gray-500">Run the workflow to populate highlights.</li>}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Skill alignment</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {selectedAnalysis?.skill_alignment.map(alignment => (
                  <div
                    key={`${alignment.skill}-${alignment.status}`}
                    className={`rounded-xl border px-4 py-3 text-sm ${skillStatusClasses[alignment.status] || "border-gray-200 bg-gray-50 text-gray-700"}`}
                  >
                    <p className="font-semibold">{alignment.skill}</p>
                    <p className="text-xs">{alignment.evidence}</p>
                  </div>
                ))}
                {(!selectedAnalysis || selectedAnalysis.skill_alignment.length === 0) && (
                  <p className="text-xs text-gray-500">Run the workflow to see AI-assessed skill alignment.</p>
                )}
              </div>
            </div>

            {selectedReadout && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Strengths</h4>
                  <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                    {selectedReadout.strengths.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                    {selectedReadout.strengths.length === 0 && <li>No strengths supplied.</li>}
                  </ul>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-700">Risks</h4>
                  <ul className="mt-2 space-y-1 text-sm text-amber-800">
                    {selectedReadout.risks.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                    {selectedReadout.risks.length === 0 && <li>No risks supplied.</li>}
                  </ul>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-700">Recommended actions</h4>
                  <ul className="mt-2 space-y-1 text-sm text-blue-800">
                    {selectedReadout.recommended_actions.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                    {selectedReadout.recommended_actions.length === 0 && <li>No actions supplied.</li>}
                  </ul>
                </div>
              </div>
            )}
            {!selectedReadout && <p className="text-xs text-gray-500">Run the workflow to populate the detailed readout.</p>}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">Engagement plan</h2>
          {isGenerating && streamingStep === 'engagement_plan' && (
            <span className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
              {streamingMessage || 'AI generating...'}
            </span>
          )}
          {isGenerating && isStepBefore(streamingStep, 'engagement_plan') && displayEngagement.length === 0 && (
            <span className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-400"></span>
              Waiting...
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {isGenerating && streamingStep === 'engagement_plan' && displayEngagement.length === 0 && (
            <div className="col-span-full rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-600"></span>
                Creating engagement plan...
              </div>
            </div>
          )}
          {!isGenerating && displayEngagement.length === 0 && <p className="text-sm text-gray-500">Run the workflow to populate engagement actions.</p>}
          {displayEngagement.map(item => (
            <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="mt-1 text-sm text-gray-700">{item.value}</p>
              {item.helper && <p className="mt-2 text-xs text-gray-500">{item.helper}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">Fairness & panel guidance</h2>
          {isGenerating && streamingStep === 'fairness_guidance' && (
            <span className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
              {streamingMessage || 'AI generating...'}
            </span>
          )}
          {isGenerating && isStepBefore(streamingStep, 'fairness_guidance') && displayFairness.length === 0 && (
            <span className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-400"></span>
              Waiting...
            </span>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {isGenerating && streamingStep === 'fairness_guidance' && displayFairness.length === 0 && (
            <div className="col-span-full rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-600"></span>
                Generating fairness & panel guidance...
              </div>
            </div>
          )}
          {!isGenerating && displayFairness.length === 0 && <p className="text-sm text-gray-500">Run the workflow to receive panel guidance.</p>}
          {displayFairness.map(item => (
            <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="mt-1 text-sm text-gray-700">{item.value}</p>
              {item.helper && <p className="mt-2 text-xs text-gray-500">{item.helper}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">Interview preparation pack</h2>
          {isGenerating && streamingStep === 'interview_preparation' && (
            <span className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
              {streamingMessage || 'AI generating...'}
            </span>
          )}
          {isGenerating && isStepBefore(streamingStep, 'interview_preparation') && displayInterview.length === 0 && (
            <span className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-400"></span>
              Waiting...
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {isGenerating && streamingStep === 'interview_preparation' && displayInterview.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-blue-700">
              <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-600"></span>
              Preparing interview questions...
            </div>
          )}
          {!isGenerating && displayInterview.length === 0 && <p className="text-sm text-gray-500">Run the workflow to populate interview prompts.</p>}
          <ul className="space-y-3 text-sm text-gray-700">
            {displayInterview.map(item => (
              <li key={item.question} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="font-semibold text-gray-900">{item.question}</p>
                <p className="text-xs text-gray-500">{item.rationale}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

