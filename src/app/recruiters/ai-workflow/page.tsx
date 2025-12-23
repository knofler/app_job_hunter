"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import RecruiterChat from "@/components/RecruiterChat";

import { fallbackRecruiterWorkflow } from "@/lib/fallback-data";
import { streamRecruiterWorkflow } from "@/lib/stream-utils";
import {
  CandidateAnalysis,
  CandidateReadout,
  CandidateSummary,
  listCandidateResumes,
  listCandidates,
  RecruiterWorkflowRequest,
  RecruiterWorkflowResponse,
  ResumeSummary,
  JobDescription,
  listJobDescriptions,
  updateJobDescription,
  saveWorkflowResult,
  getLastWorkflow,
  searchCandidatesAndResumes,
  CandidateSearchResponse,
  SearchResult,
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

const STEP_ORDER = ['loading', 'core_skills', 'ai_analysis', 'ranked_shortlist', 'detailed_readout', 'engagement_plan', 'fairness_guidance', 'interview_preparation'];

function isStepBefore(currentStep: string | null, targetStep: string): boolean {
  if (!currentStep) return false;
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const targetIndex = STEP_ORDER.indexOf(targetStep);
  return currentIndex < targetIndex;
}

export default function RecruiterAIWorkflowPage() {

  // State variables
  const [jobTitle, setJobTitle] = useState("");
  const [jobCode, setJobCode] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [salaryBand, setSalaryBand] = useState("");
  const [jobSummary, setJobSummary] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobDescriptionSearch, setJobDescriptionSearch] = useState("");
  const [jobDescriptionCollapsed, setJobDescriptionCollapsed] = useState(true);
  const [visibleJobDescriptions, setVisibleJobDescriptions] = useState(5);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [jobDescriptionsLoading, setJobDescriptionsLoading] = useState(true);
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [visibleCandidates, setVisibleCandidates] = useState(5);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const hasSetDefaultCandidate = useRef(false);
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeSearch, setResumeSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CandidateSearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resumeCollapsed, setResumeCollapsed] = useState(false);
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [workflowResult, setWorkflowResult] = useState<RecruiterWorkflowResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [streamingStep, setStreamingStep] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Load job descriptions
  useEffect(() => {
    const loadJobDescriptions = async () => {
      try {
        const response = await listJobDescriptions();
        setJobDescriptions(response.items);
      } catch (error) {
        console.error("Failed to load job descriptions:", error);
      } finally {
        setJobDescriptionsLoading(false);
      }
    };
    loadJobDescriptions();
  }, []);

  // Load candidates
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const response = await listCandidates();
        setCandidates(response.items);
        // Auto-select the default candidate (same as resume library) if none selected and we haven't set it yet
        if (response.items.length > 0 && !selectedCandidateId && !hasSetDefaultCandidate.current) {
          const defaultCandidate = response.items.find(c => c.candidate_id === "candidate_1") || response.items[0];
          setSelectedCandidateId(defaultCandidate.candidate_id);
          hasSetDefaultCandidate.current = true;
        }
      } catch (error) {
        console.error("Failed to load candidates:", error);
        setCandidateError("Failed to load candidates");
      } finally {
        setCandidatesLoading(false);
      }
    };
    loadCandidates();
  }, []); // Empty dependency array - only run once on mount

  // Load last workflow result
  useEffect(() => {
    const loadLastWorkflow = async () => {
      try {
        const result = await getLastWorkflow();
        if ('job' in result) {
          // It's a valid workflow response
          setWorkflowResult(result);
          setLastAnalyzedAt(new Date()); // Set to current time since we don't have the exact timestamp
        }
      } catch (error) {
        console.error("Failed to load last workflow:", error);
        // Don't show error to user, just continue with empty state
      }
    };
    loadLastWorkflow();
  }, []);

  // Load resumes when candidate changes
  useEffect(() => {
    if (!selectedCandidateId) {
      setResumes([]);
      setSelectedResumeIds([]);
      return;
    }
    const loadResumes = async () => {
      setResumeLoading(true);
      try {
        const response = await listCandidateResumes(selectedCandidateId);
        setResumes(response.resumes);
        // Auto-select all resumes for the workflow
        setSelectedResumeIds(response.resumes.map(resume => resume.id));
      } catch (error) {
        console.error("Failed to load resumes:", error);
        setSelectedResumeIds([]);
      } finally {
        setResumeLoading(false);
      }
    };
    loadResumes();
  }, [selectedCandidateId]);

  // Search candidates and resumes
  useEffect(() => {
    const performSearch = async () => {
      if (!resumeSearch.trim()) {
        setSearchResults(null);
        return;
      }

      setSearchLoading(true);
      try {
        const results = await searchCandidatesAndResumes(resumeSearch, 1, 20);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300); // Debounce search
    return () => clearTimeout(debounceTimer);
  }, [resumeSearch]);

  // Update job description when selection changes
  useEffect(() => {
    if (!selectedJobId) {
      setJobDescription("");
      setJobTitle("");
      setJobCode("");
      return;
    }
    const selectedJob = jobDescriptions.find(job => job.id === selectedJobId);
    if (selectedJob) {
      setJobDescription(selectedJob.description || "");
      setJobTitle(selectedJob.title);
      setJobCode(selectedJob.code || "");
    }
  }, [selectedJobId, jobDescriptions]);

  const handleJobSelection = (jobId: string) => {
    setSelectedJobId(jobId);
    setJobDescriptionCollapsed(true);
  };

  const handleJobDescriptionUpdate = async () => {
    if (!selectedJobId) return;
    try {
      await updateJobDescription(selectedJobId, { description: jobDescription });
      // Update local state
      setJobDescriptions(prev =>
        prev.map(job =>
          job.id === selectedJobId ? { ...job, description: jobDescription } : job
        )
      );
    } catch (error) {
      console.error("Failed to update job description:", error);
    }
  };

  const workflowStepsRef = useRef<HTMLDivElement>(null);

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

  const filteredJobDescriptions = useMemo(() => {
    if (!jobDescriptionSearch.trim()) {
      return jobDescriptions;
    }
    const searchLower = jobDescriptionSearch.toLowerCase();
    return jobDescriptions.filter(job =>
      (job.title && typeof job.title === 'string' && job.title.toLowerCase().includes(searchLower)) ||
      (job.company && typeof job.company === 'string' && job.company.toLowerCase().includes(searchLower)) ||
      (job.description && typeof job.description === 'string' && job.description.toLowerCase().includes(searchLower))
    );
  }, [jobDescriptions, jobDescriptionSearch]);

  const filteredCandidates = useMemo(() => {
    if (!resumeSearch.trim()) {
      return candidates;
    }
    const searchLower = resumeSearch.toLowerCase();
    
    // Filter candidates by name/role, and if a candidate is selected, also check their resume content
    return candidates.filter(candidate => {
      // Always check candidate metadata
      const candidateMatches = 
        (candidate.name && typeof candidate.name === 'string' && candidate.name.toLowerCase().includes(searchLower)) ||
        (candidate.primary_role && typeof candidate.primary_role === 'string' && candidate.primary_role.toLowerCase().includes(searchLower)) ||
        (candidate.candidate_type && typeof candidate.candidate_type === 'string' && candidate.candidate_type.toLowerCase().includes(searchLower)) ||
        (candidate.preferred_locations && candidate.preferred_locations.some((location: string) => location && typeof location === 'string' && location.toLowerCase().includes(searchLower)));
      
      // If this candidate is selected and we have their resumes loaded, also check resume content
      if (candidate.candidate_id === selectedCandidateId) {
        const resumeMatches = resumes.some(resume =>
          (resume.name && typeof resume.name === 'string' && resume.name.toLowerCase().includes(searchLower)) ||
          (resume.summary && typeof resume.summary === 'string' && resume.summary.toLowerCase().includes(searchLower)) ||
          (resume.skills && resume.skills.some((skill: string) => skill && typeof skill === 'string' && skill.toLowerCase().includes(searchLower)))
        );
        return candidateMatches || resumeMatches;
      }
      
      return candidateMatches;
    });
  }, [candidates, resumeSearch, selectedCandidateId, resumes]);

  const filteredResumes = useMemo(() => {
    if (!resumeSearch.trim()) {
      return resumes;
    }
    const searchLower = resumeSearch.toLowerCase();
    return resumes.filter(resume =>
      (resume.name && typeof resume.name === 'string' && resume.name.toLowerCase().includes(searchLower)) ||
      (resume.summary && typeof resume.summary === 'string' && resume.summary.toLowerCase().includes(searchLower)) ||
      (resume.skills && resume.skills.some((skill: string) => skill && typeof skill === 'string' && skill.toLowerCase().includes(searchLower)))
    );
  }, [resumes, resumeSearch]);

  // Get search results for display
  const searchResultsForDisplay = useMemo(() => {
    if (!searchResults) return [];
    return searchResults.results.slice(0, visibleCandidates);
  }, [searchResults, visibleCandidates]);

  const topRecommendedResumes = useMemo((): (ResumeSummary & { matchScore: number })[] => {
    if (!selectedJobId || resumes.length === 0) {
      return [];
    }
    // This would need actual matching logic, for now return empty
    return [];
  }, [selectedJobId, resumes]);

  // Computed values for display
  const shortlist = workflowResult?.ranked_shortlist || [];
  const selectedCandidate = candidates.find(c => c.candidate_id === selectedCandidateId);
  const selectedAnalysis = selectedCandidateId ? candidateAnalysisById.get(selectedCandidateId) : undefined;
  const selectedReadout = selectedCandidateId ? readoutById.get(selectedCandidateId) : undefined;

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
          const workflowData = data as RecruiterWorkflowResponse;
          setWorkflowResult(workflowData);
          setLastAnalyzedAt(new Date());
          setStreamingStep(null);
          setStreamingMessage(null);
          
          // Save the workflow result to the database (fire and forget)
          saveWorkflowResult(workflowData).catch(saveError => {
            console.error("Failed to save workflow result:", saveError);
          });
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
            {generationError && !generationError.includes("'str' object has no attribute 'get'") && (
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Job descriptions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Job descriptions</h3>
                <p className="text-sm text-gray-500">Select a job description to edit and analyze.</p>
              </div>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {filteredJobDescriptions.length} available
              </span>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search job descriptions..."
                  value={jobDescriptionSearch}
                  onChange={(e) => setJobDescriptionSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-9 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {jobDescriptionsLoading && <p className="text-xs text-gray-500">Loading job descriptions...</p>}
              {!jobDescriptionsLoading && filteredJobDescriptions.length === 0 && jobDescriptionSearch && (
                <p className="text-xs text-gray-500">No job descriptions match your search.</p>
              )}
              {!jobDescriptionsLoading && filteredJobDescriptions.length === 0 && !jobDescriptionSearch && (
                <p className="text-xs text-gray-500">No job descriptions available.</p>
              )}

              {jobDescriptionCollapsed && selectedJobId ? (
                <div className="rounded-xl border border-blue-500 bg-blue-50 p-4 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">{jobDescriptions.find(job => job.id === selectedJobId)?.title}</p>
                      <p className="text-xs text-blue-700">{jobDescriptions.find(job => job.id === selectedJobId)?.company} • {jobDescriptions.find(job => job.id === selectedJobId)?.location}</p>
                    </div>
                    <button type="button" onClick={() => setJobDescriptionCollapsed(false)} className="rounded-lg border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">Show All</button>
                  </div>
                </div>
              ) : (
                <>
                  {filteredJobDescriptions.slice(0, visibleJobDescriptions).map(job => {
                    const isActive = job.id === selectedJobId;
                    return (
                      <button key={job.id} type="button" onClick={() => handleJobSelection(job.id)} className={`w-full rounded-xl border px-4 py-3 text-left transition ${isActive ? "border-blue-500 bg-blue-50 shadow" : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-white"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                            <p className="text-xs text-gray-600 truncate">{job.company} • {job.location}</p>
                            <p className="text-xs text-gray-500 mt-1 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{job.description ? `${job.description.substring(0, 150)}${job.description.length > 150 ? '...' : ''}` : 'No description available'}</p>
                          </div>
                          <div className="text-right text-xs text-gray-500"><p>{new Date(job.updated_at).toLocaleDateString()}</p></div>
                        </div>
                      </button>
                    );
                  })}
                  {filteredJobDescriptions.length > visibleJobDescriptions && (
                    <button type="button" onClick={() => setVisibleJobDescriptions(prev => Math.min(prev + 5, filteredJobDescriptions.length))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 hover:border-blue-300">Show 5 more job descriptions ({filteredJobDescriptions.length - visibleJobDescriptions} remaining)</button>
                  )}
                </>
              )}

              {selectedJobId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">Edit Job Description</h4>
                    <button type="button" onClick={handleJobDescriptionUpdate} className="rounded-lg border border-blue-200 bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700">Save Changes</button>
                  </div>
                  <div className="space-y-2">
                    <input type="text" value={jobTitle} onChange={event => setJobTitle(event.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Job title" />
                  </div>
                  <textarea value={jobDescription} onChange={event => setJobDescription(event.target.value)} rows={12} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Paste the job description or upload a JD file" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Candidate & Resumes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Candidate & resumes</h3>
                <p className="text-sm text-gray-500">Search candidates by name/role or resume content. Select a candidate to auto-load their resumes for analysis.</p>
              </div>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">{selectedResumeIds.length} selected</span>
            </div>

            {candidateError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{candidateError}</p>}

            <div className="relative">
              <input
                type="text"
                placeholder="Search candidates by resume content..."
                value={resumeSearch}
                onChange={(e) => setResumeSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-9 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="grid gap-3">
              {searchLoading && <p className="text-xs text-gray-500">Searching...</p>}
              {candidatesLoading && !searchResults && <p className="text-xs text-gray-500">Loading candidates...</p>}
              {!candidatesLoading && !searchResults && candidates.length === 0 && <p className="text-xs text-gray-500">No candidates available. Upload resumes via the candidate profile first.</p>}
              {!searchLoading && searchResults && searchResults.results.length === 0 && resumeSearch && <p className="text-xs text-gray-500">No candidates or resumes match your search.</p>}
              {!candidatesLoading && !searchResults && filteredCandidates.length === 0 && resumeSearch && <p className="text-xs text-gray-500">No candidates match your search.</p>}

              {/* Show search results if available */}
              {searchResults && searchResults.results.slice(0, visibleCandidates).map(searchResult => {
                const candidate = searchResult.candidate;
                const isActive = candidate.candidate_id === selectedCandidateId;
                return (
                  <div key={candidate.candidate_id} className={`rounded-xl border px-4 py-3 transition ${isActive ? "border-blue-500 bg-blue-50 shadow" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateId(candidate.candidate_id)}
                          className="text-left w-full"
                        >
                          <p className="text-sm font-semibold text-gray-900">{candidate.name}</p>
                          <p className="text-xs text-gray-600">{candidate.primary_role || "Role not captured"}</p>
                        </button>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>Candidate ID</p>
                        <p className="font-semibold text-gray-700">{candidate.candidate_id}</p>
                      </div>
                    </div>
                    {candidate.preferred_locations && candidate.preferred_locations.length > 0 && (
                      <p className="text-xs text-gray-500 mb-2">Preferred locations: {candidate.preferred_locations.join(", ")}</p>
                    )}

                    {/* Show matching resumes */}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Matching resumes ({searchResult.resume_count}):</p>
                      <div className="space-y-1">
                        {searchResult.matching_resumes.slice(0, 3).map(resume => (
                          <div key={resume.id} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selectedResumeIds.includes(resume.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedResumeIds(current => Array.from(new Set([...current, resume.id])));
                                } else {
                                  setSelectedResumeIds(current => current.filter(id => id !== resume.id));
                                }
                              }}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <p className={`text-xs font-semibold ${resume._search_match ? 'text-blue-700' : 'text-gray-800'}`}>
                                  {resume.name}
                                  {resume._search_match && <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">Match</span>}
                                </p>
                              </div>
                              {resume.summary && (
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{resume.summary}</p>
                              )}
                              {resume.skills && resume.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {resume.skills.slice(0, 3).map(skill => (
                                    <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{skill}</span>
                                  ))}
                                  {resume.skills.length > 3 && <span className="text-xs text-gray-500">+{resume.skills.length - 3} more</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {searchResult.matching_resumes.length > 3 && (
                          <p className="text-xs text-gray-500">+{searchResult.matching_resumes.length - 3} more resumes</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Show regular candidates when not searching */}
              {!searchResults && filteredCandidates.slice(0, visibleCandidates).map(candidate => {
                const isActive = candidate.candidate_id === selectedCandidateId;
                return (
                  <button key={candidate.candidate_id} type="button" onClick={() => setSelectedCandidateId(candidate.candidate_id)} className={`rounded-xl border px-4 py-3 text-left transition ${isActive ? "border-blue-500 bg-blue-50 shadow" : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-white"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{candidate.name}</p>
                        <p className="text-xs text-gray-600">{candidate.primary_role || "Role not captured"}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500"><p>Candidate ID</p><p className="font-semibold text-gray-700">{candidate.candidate_id}</p></div>
                    </div>
                    {candidate.preferred_locations && candidate.preferred_locations.length > 0 && <p className="mt-2 text-xs text-gray-500">Preferred locations: {candidate.preferred_locations.join(", ")}</p>}
                  </button>
                );
              })}

              {/* Show more button */}
              {((searchResults && searchResults.results.length > visibleCandidates) || (!searchResults && filteredCandidates.length > visibleCandidates)) && (
                <button
                  type="button"
                  onClick={() => setVisibleCandidates(prev => Math.min(prev + 5, (searchResults ? searchResults.results.length : filteredCandidates.length)))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 hover:border-blue-300"
                >
                  Show 5 more candidates ({((searchResults ? searchResults.results.length : filteredCandidates.length) - visibleCandidates)} remaining)
                </button>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800">Selected resumes for AI analysis</p>
                {selectedResumeIds.length > 0 && <button type="button" onClick={() => setResumeCollapsed(!resumeCollapsed)} className="text-xs text-blue-600 hover:text-blue-800">{resumeCollapsed ? 'Show All' : 'Collapse'}</button>}
              </div>

              {selectedResumeIds.length === 0 && (
                <p className="text-xs text-gray-500">No resumes selected. Search for candidates and select resumes above to run AI analysis.</p>
              )}

              {selectedResumeIds.length > 0 && resumeCollapsed && (
                <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-2">Selected Resumes ({selectedResumeIds.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedResumeIds.map(resumeId => {
                      // Find resume in search results or current candidate resumes
                      let resumeName = `Resume ${resumeId}`;
                      if (searchResults) {
                        for (const result of searchResults.results) {
                          const resume = result.matching_resumes.find((r: any) => r.id === resumeId);
                          if (resume) {
                            resumeName = resume.name;
                            break;
                          }
                        }
                      } else {
                        const resume = resumes.find(r => r.id === resumeId);
                        if (resume) resumeName = resume.name;
                      }
                      return (
                        <span key={resumeId} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                          {resumeName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedResumeIds.length > 0 && !resumeCollapsed && (
                <div className="space-y-2">
                  {selectedResumeIds.map(resumeId => {
                    // Find resume details in search results or current candidate resumes
                    let resume: any = null;
                    if (searchResults) {
                      for (const result of searchResults.results) {
                        resume = result.matching_resumes.find((r: any) => r.id === resumeId);
                        if (resume) break;
                      }
                    } else {
                      resume = resumes.find(r => r.id === resumeId);
                    }

                    if (!resume) return null;

                    return (
                      <div key={resumeId} className="flex items-start gap-2 p-2 rounded border border-gray-200 bg-white">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => setSelectedResumeIds(current => current.filter(id => id !== resumeId))}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-800">{resume.name}</p>
                            <button
                              type="button"
                              onClick={() => setSelectedResumeIds(current => current.filter(id => id !== resumeId))}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                          {resume.summary && (
                            <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-3">{resume.summary}</p>
                          )}
                          {resume.skills && resume.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {resume.skills.slice(0, 4).map((skill: string) => (
                                <span key={skill} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{skill}</span>
                              ))}
                              {resume.skills.length > 4 && <span className="text-xs text-gray-500">+{resume.skills.length - 4} more</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedJobId && topRecommendedResumes.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-emerald-900">Top Matches</h4>
                  <button type="button" onClick={() => {const topIds = topRecommendedResumes.slice(0, 3).map(r => r.id); setSelectedResumeIds(prev => {const combined = Array.from(new Set([...prev, ...topIds])); return combined.slice(0, 5);});}} className="rounded border border-emerald-300 bg-white px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50">Select Top 3</button>
                </div>
                <p className="text-xs text-emerald-700 mb-3">Best matching resumes for the selected job</p>
                <div className="space-y-2">
                  {topRecommendedResumes.slice(0, 5).map((resume, index) => (
                    <div key={resume.id} className="rounded-lg border border-emerald-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{resume.name}</p>
                          <p className="text-xs text-gray-600">Match: {Math.round(resume.matchScore)}%</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-emerald-600 font-medium">#{index + 1}</span>
                          <input type="checkbox" className="w-3 h-3" checked={selectedResumeIds.includes(resume.id)} onChange={event => handleResumeToggle(event, resume.id)} />
                        </div>
                      </div>
                      {resume.skills && resume.skills.length > 0 && <p className="text-xs text-gray-500 truncate">Skills: {resume.skills.slice(0, 3).join(", ")}{resume.skills.length > 3 ? "..." : ""}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* AI Chatbot Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">AI Recruiter Assistant</h2>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-[32rem]">
          <RecruiterChat
            sessionId={sessionId}
            jobId={selectedJobId || undefined}
            resumeIds={selectedResumeIds.length > 0 ? selectedResumeIds : undefined}
            workflowContext={workflowResult ? { workflowResult } : undefined}
          />
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
                if (!line || typeof line !== 'string') return null;
                
                if (line.startsWith('### ') && line.length > 4) {
                  return <h3 key={idx} className="text-lg font-semibold text-gray-900 mt-4 mb-2">{line.substring(4)}</h3>;
                } else if (line.startsWith('## ') && line.length > 3) {
                  return <h2 key={idx} className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.substring(3)}</h2>;
                } else if (line.startsWith('# ') && line.length > 2) {
                  return <h1 key={idx} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{line.substring(2)}</h1>;
                } else if (line.startsWith('- ') && line.length > 2) {
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
                        {analysis?.name || rowCandidate?.name || item.candidate_id}
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
                Focus: {selectedAnalysis?.name || selectedCandidate.name}
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
                <h3 className="text-xl font-semibold text-gray-900">{selectedAnalysis?.name || selectedCandidate.name}</h3>
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
          {displayEngagement.map((item, index) => (
            <div key={`${item.label}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
          {displayFairness.map((item, index) => {
            // Color coding based on content type - using consistent color scheme with skill alignment
            const getCardStyle = (label: string) => {
              if (label.toLowerCase().includes('bias') || label.toLowerCase().includes('fairness') || label.toLowerCase().includes('diversity')) {
                return 'border-emerald-200 bg-emerald-50'; // Green for fairness/bias related (consistent with Yes status)
              } else if (label.toLowerCase().includes('panel') || label.toLowerCase().includes('guidance')) {
                return 'border-blue-200 bg-blue-50'; // Blue for guidance
              } else if (label.toLowerCase().includes('risk') || label.toLowerCase().includes('caution')) {
                return 'border-amber-200 bg-amber-50'; // Amber for risks/cautions (consistent with Partial status)
              } else {
                return 'border-gray-200 bg-white'; // Default gray
              }
            };

            const getTextStyle = (label: string) => {
              if (label.toLowerCase().includes('bias') || label.toLowerCase().includes('fairness') || label.toLowerCase().includes('diversity')) {
                return 'text-emerald-800'; // Emerald text for fairness/bias (consistent with Yes status)
              } else if (label.toLowerCase().includes('panel') || label.toLowerCase().includes('guidance')) {
                return 'text-blue-800'; // Blue text for guidance
              } else if (label.toLowerCase().includes('risk') || label.toLowerCase().includes('caution')) {
                return 'text-amber-800'; // Amber text for risks/cautions (consistent with Partial status)
              } else {
                return 'text-gray-900'; // Default gray text
              }
            };

            return (
              <div key={`${item.label}-${index}`} className={`rounded-2xl border p-5 shadow-sm ${getCardStyle(item.label)}`}>
                <p className={`text-sm font-semibold ${getTextStyle(item.label)}`}>{item.label}</p>
                <p className={`mt-1 text-sm ${getTextStyle(item.label).replace('800', '700')}`}>{item.value}</p>
                {item.helper && <p className="mt-2 text-xs text-gray-500">{item.helper}</p>}
              </div>
            );
          })}
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
