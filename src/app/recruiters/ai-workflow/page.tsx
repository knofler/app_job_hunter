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


  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["chat", "core_skills", "ai_analysis", "ranked_shortlist", "detailed_readout", "engagement", "fairness", "interview"])
  );
  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex" style={{ height: "calc(100vh - 56px)" }}>

      {/* ─── LEFT PANEL: Inputs ─────────────────────────────── */}
      <aside className="w-[400px] flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Step 1: Job Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Job Description</h2>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search job descriptions..."
                value={jobDescriptionSearch}
                onChange={(e) => setJobDescriptionSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 pl-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {jobDescriptionsLoading && <p className="text-xs text-muted-foreground">Loading...</p>}

            {jobDescriptionCollapsed && selectedJobId ? (
              <div className="rounded-lg border border-primary bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{jobDescriptions.find(job => job.id === selectedJobId)?.title}</p>
                    <p className="truncate text-xs text-primary">{jobDescriptions.find(job => job.id === selectedJobId)?.company}</p>
                  </div>
                  <button type="button" onClick={() => setJobDescriptionCollapsed(false)} className="ml-2 flex-shrink-0 rounded border border-primary/30 px-2 py-1 text-xs text-primary hover:bg-primary/5">Change</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredJobDescriptions.slice(0, visibleJobDescriptions).map(job => {
                  const isActive = job.id === selectedJobId;
                  return (
                    <button key={job.id} type="button" onClick={() => handleJobSelection(job.id)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-muted hover:border-primary/30 hover:bg-card"}`}>
                      <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{job.company} · {job.location}</p>
                    </button>
                  );
                })}
                {filteredJobDescriptions.length > visibleJobDescriptions && (
                  <button type="button" onClick={() => setVisibleJobDescriptions(prev => Math.min(prev + 5, filteredJobDescriptions.length))}
                    className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary">
                    Show {Math.min(5, filteredJobDescriptions.length - visibleJobDescriptions)} more
                  </button>
                )}
              </div>
            )}

            {selectedJobId && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Edit JD</span>
                  <button type="button" onClick={handleJobDescriptionUpdate}
                    className="rounded border border-primary/30 bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary/90">Save</button>
                </div>
                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  className="w-full rounded border border-border bg-card px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none" placeholder="Job title" />
                <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows={6}
                  className="w-full rounded border border-border bg-card px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none resize-none" placeholder="Job description" />
              </div>
            )}
          </div>

          {/* Step 2: Candidates & Resumes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Candidates & Resumes</h2>
              </div>
              {selectedResumeIds.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{selectedResumeIds.length} selected</span>
              )}
            </div>

            {candidateError && <p className="rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">{candidateError}</p>}

            <div className="relative">
              <input
                type="text"
                placeholder="Search candidates..."
                value={resumeSearch}
                onChange={(e) => setResumeSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 pl-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="space-y-2">
              {searchLoading && <p className="text-xs text-muted-foreground">Searching...</p>}
              {candidatesLoading && !searchResults && <p className="text-xs text-muted-foreground">Loading candidates...</p>}

              {searchResults
                ? searchResults.results.slice(0, visibleCandidates).map(searchResult => {
                    const candidate = searchResult.candidate;
                    const isActive = candidate.candidate_id === selectedCandidateId;
                    return (
                      <div key={candidate.candidate_id} className={`rounded-lg border p-3 transition ${isActive ? "border-primary bg-primary/5" : "border-border bg-muted"}`}>
                        <button type="button" onClick={() => setSelectedCandidateId(candidate.candidate_id)} className="w-full text-left mb-2">
                          <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.primary_role || "No role"}</p>
                        </button>
                        <div className="space-y-1">
                          {searchResult.matching_resumes.slice(0, 3).map(resume => (
                            <label key={resume.id} className="flex items-start gap-2 cursor-pointer">
                              <input type="checkbox" checked={selectedResumeIds.includes(resume.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedResumeIds(c => Array.from(new Set([...c, resume.id])));
                                  else setSelectedResumeIds(c => c.filter(id => id !== resume.id));
                                }}
                                className="mt-0.5 h-3.5 w-3.5" />
                              <span className={`text-xs ${resume._search_match ? "font-semibold text-primary" : "text-foreground/80"}`}>{resume.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                : filteredCandidates.slice(0, visibleCandidates).map(candidate => {
                    const isActive = candidate.candidate_id === selectedCandidateId;
                    return (
                      <button key={candidate.candidate_id} type="button" onClick={() => setSelectedCandidateId(candidate.candidate_id)}
                        className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${isActive ? "border-primary bg-primary/5" : "border-border bg-muted hover:border-primary/30"}`}>
                        <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground">{candidate.primary_role || "No role"}</p>
                      </button>
                    );
                  })
              }

              {((searchResults && searchResults.results.length > visibleCandidates) || (!searchResults && filteredCandidates.length > visibleCandidates)) && (
                <button type="button"
                  onClick={() => setVisibleCandidates(prev => Math.min(prev + 5, searchResults ? searchResults.results.length : filteredCandidates.length))}
                  className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary">
                  Show more
                </button>
              )}

              {!searchResults && candidates.length === 0 && !candidatesLoading && (
                <p className="text-xs text-muted-foreground">No candidates. Upload resumes via candidate profile.</p>
              )}
            </div>

            {/* Resumes for selected candidate */}
            {selectedCandidateId && !searchResults && resumes.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Resumes ({resumes.length})</p>
                {resumes.map(resume => (
                  <label key={resume.id} className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedResumeIds.includes(resume.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedResumeIds(c => Array.from(new Set([...c, resume.id])));
                        else setSelectedResumeIds(c => c.filter(id => id !== resume.id));
                      }}
                      className="mt-0.5 h-3.5 w-3.5" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{resume.name}</p>
                      {resume.summary && <p className="line-clamp-1 text-xs text-muted-foreground">{resume.summary}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Top matches */}
            {selectedJobId && topRecommendedResumes.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-emerald-800">Top Matches</p>
                  <button type="button"
                    onClick={() => { const ids = topRecommendedResumes.slice(0,3).map(r=>r.id); setSelectedResumeIds(p => Array.from(new Set([...p,...ids])).slice(0,5)); }}
                    className="rounded border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-100">Select Top 3</button>
                </div>
                {topRecommendedResumes.slice(0,3).map((resume,i) => (
                  <label key={resume.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedResumeIds.includes(resume.id)} onChange={(e) => handleResumeToggle(e, resume.id)} className="h-3.5 w-3.5" />
                    <span className="text-xs text-emerald-700">#{i+1}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{resume.name}</span>
                    <span className="text-xs text-emerald-600">{Math.round(resume.matchScore)}%</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Run button — sticky at bottom */}
        <div className="flex-shrink-0 border-t border-border bg-card p-4 space-y-2">
          {generationError && !generationError.includes("'str' object has no attribute 'get'") && (
            <p className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700">{generationError}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Last run: {formatDateTime(lastAnalyzedAt)}</span>
            {selectedResumeIds.length > 0 && <span className="text-primary">{selectedResumeIds.length} resume{selectedResumeIds.length > 1 ? "s" : ""}</span>}
          </div>
          <button type="button" onClick={handleGenerate}
            disabled={isGenerating || !selectedCandidateId || selectedResumeIds.length === 0}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2">
            {isGenerating ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {streamingMessage || "Running AI workflow..."}
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run AI Workflow
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ─── RIGHT PANEL: Results ────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-muted/30">
        <div className="p-6 space-y-3">

          {/* Empty state */}
          {!workflowResult && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Ready to analyze</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Select a job description and candidate resumes on the left, then click <strong>Run AI Workflow</strong>.</p>
            </div>
          )}

          {/* Progress bar when generating */}
          {isGenerating && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary">{streamingMessage || "AI workflow running..."}</p>
                  <p className="text-xs text-muted-foreground">Step: {streamingStep || "initializing"}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                {STEP_ORDER.filter(s => s !== 'loading').map(step => {
                  const idx = STEP_ORDER.indexOf(step);
                  const curIdx = STEP_ORDER.indexOf(streamingStep || 'loading');
                  const done = curIdx > idx;
                  const active = curIdx === idx;
                  return (
                    <div key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${done ? 'bg-primary' : active ? 'bg-primary/60 animate-pulse' : 'bg-primary/20'}`} />
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Recruiter Chat */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection("chat")}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-sm font-semibold text-foreground">AI Recruiter Assistant</span>
              </div>
              <svg className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.has("chat") ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections.has("chat") && (
              <div className="border-t border-border" style={{ height: "28rem" }}>
                <RecruiterChat
                  sessionId={sessionId}
                  jobId={selectedJobId || undefined}
                  resumeIds={selectedResumeIds.length > 0 ? selectedResumeIds : undefined}
                  workflowContext={workflowResult ? { workflowResult } : undefined}
                />
              </div>
            )}
          </div>

          {/* Core Skills */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection("core_skills")}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                {isGenerating && streamingStep === 'core_skills' && <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />}
                <span className="text-sm font-semibold text-foreground">Core Must-Have Skills</span>
                {displayCoreSkills.length > 0 && !isGenerating && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{displayCoreSkills.length}</span>}
                {isGenerating && isStepBefore(streamingStep, 'core_skills') && <span className="text-xs text-muted-foreground">Waiting...</span>}
              </div>
              <svg className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.has("core_skills") ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections.has("core_skills") && (
              <div className="border-t border-border p-5">
                {isGenerating && streamingStep === 'core_skills' && displayCoreSkills.length === 0 && (
                  <div className="flex items-center gap-2 py-4 text-sm text-primary">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
                    Analyzing core skills from job description...
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {displayCoreSkills.map(skill => (
                    <div key={skill.name} className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-sm font-semibold text-foreground">{skill.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{skill.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection("ai_analysis")}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                {isGenerating && (streamingStep === 'ai_analysis') && <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />}
                <span className="text-sm font-semibold text-foreground">AI-Powered Analysis</span>
                {isGenerating && isStepBefore(streamingStep, 'ai_analysis') && <span className="text-xs text-muted-foreground">Waiting...</span>}
              </div>
              <svg className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.has("ai_analysis") ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections.has("ai_analysis") && (
              <div className="border-t border-border p-5">
                {isGenerating && streamingStep === 'ai_analysis' && !markdownAnalysis && (
                  <div className="flex items-center gap-2 py-4 text-sm text-primary">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
                    Generating AI analysis...
                  </div>
                )}
                {markdownAnalysis && (
                  <div className="prose prose-sm max-w-none text-foreground space-y-1">
                    {markdownAnalysis.split('\n').map((line, idx) => {
                      if (!line || typeof line !== 'string') return null;
                      if (line.startsWith('### ')) return <h3 key={idx} className="text-base font-semibold text-foreground mt-4 mb-1">{line.substring(4)}</h3>;
                      if (line.startsWith('## ')) return <h2 key={idx} className="text-lg font-bold text-foreground mt-5 mb-2">{line.substring(3)}</h2>;
                      if (line.startsWith('# ')) return <h1 key={idx} className="text-xl font-bold text-foreground mt-6 mb-3">{line.substring(2)}</h1>;
                      if (line.startsWith('- ')) return <li key={idx} className="ml-4 text-sm text-foreground/80">{line.substring(2)}</li>;
                      if (line.trim() === '') return <br key={idx} />;
                      return <p key={idx} className="text-sm text-foreground/80 leading-relaxed">{line}</p>;
                    })}
                    {isGenerating && streamingStep === 'ai_analysis' && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Streaming...
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ranked Shortlist */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection("ranked_shortlist")}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                {isGenerating && streamingStep === 'ranked_shortlist' && <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />}
                <span className="text-sm font-semibold text-foreground">Ranked Shortlist</span>
                {shortlist.length > 0 && !isGenerating && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{shortlist.length} candidates</span>}
                {isGenerating && isStepBefore(streamingStep, 'ranked_shortlist') && <span className="text-xs text-muted-foreground">Waiting...</span>}
              </div>
              <svg className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.has("ranked_shortlist") ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections.has("ranked_shortlist") && (
              <div className="border-t border-border overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Candidate</th>
                      <th className="px-4 py-3 text-left font-semibold">Match</th>
                      <th className="px-4 py-3 text-left font-semibold">Bias-free</th>
                      <th className="px-4 py-3 text-left font-semibold">Priority</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {isGenerating && streamingStep === 'ranked_shortlist' && shortlist.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-primary">
                          <span className="h-3 w-3 animate-pulse rounded-full bg-primary" /> Ranking candidates...
                        </div>
                      </td></tr>
                    )}
                    {!isGenerating && shortlist.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-4 text-sm text-muted-foreground">Run the workflow to populate the ranked shortlist.</td></tr>
                    )}
                    {shortlist.map((item, index) => {
                      const rowCandidate = candidates.find(c => c.candidate_id === item.candidate_id);
                      const analysis = candidateAnalysisById.get(item.candidate_id);
                      const score = analysis?.match_score;
                      const scoreColor = score == null ? "bg-muted text-muted-foreground"
                        : score >= 80 ? "bg-emerald-100 text-emerald-700"
                        : score >= 60 ? "bg-blue-100 text-blue-700"
                        : score >= 40 ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700";
                      return (
                        <tr key={`${item.candidate_id}-${item.rank}`} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground">{analysis?.name || rowCandidate?.name || item.candidate_id}</p>
                            <p className="text-xs text-muted-foreground">#{index + 1}</p>
                          </td>
                          <td className="px-4 py-3">
                            {score != null ? (
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${scoreColor}`}>{score}</span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-foreground">{analysis?.bias_free_score ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{item.priority ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{item.status ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detailed Readout */}
          {selectedCandidate && (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <button type="button" onClick={() => toggleSection("detailed_readout")}
                className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  {isGenerating && streamingStep === 'detailed_readout' && <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />}
                  <span className="text-sm font-semibold text-foreground">Detailed Readout</span>
                  {selectedAnalysis && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{selectedAnalysis.name || selectedCandidate.name}</span>}
                  {isGenerating && isStepBefore(streamingStep, 'detailed_readout') && <span className="text-xs text-muted-foreground">Waiting...</span>}
                </div>
                <svg className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.has("detailed_readout") ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openSections.has("detailed_readout") && (
                <div className="border-t border-border p-5 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{selectedAnalysis?.name || selectedCandidate.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedCandidate.primary_role || "No role"}</p>
                    </div>
                    <div className="flex gap-4 text-center">
                      {selectedAnalysis?.match_score != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Match</p>
                          <p className={`text-xl font-bold ${selectedAnalysis.match_score >= 80 ? "text-emerald-600" : selectedAnalysis.match_score >= 60 ? "text-blue-600" : "text-amber-600"}`}>{selectedAnalysis.match_score}</p>
                        </div>
                      )}
                      {selectedAnalysis?.bias_free_score != null && (
                        <div>
                          <p className="text-xs text-muted-foreground">Bias-free</p>
                          <p className="text-xl font-bold text-emerald-600">{selectedAnalysis.bias_free_score}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedAnalysis?.summary && <p className="text-sm text-foreground/80">{selectedAnalysis.summary}</p>}

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skill Alignment</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedAnalysis?.skill_alignment.map(alignment => (
                        <div key={`${alignment.skill}-${alignment.status}`}
                          className={`rounded-lg border px-3 py-2.5 text-sm ${skillStatusClasses[alignment.status] || "border-border bg-muted text-foreground/80"}`}>
                          <p className="font-semibold">{alignment.skill}</p>
                          <p className="text-xs">{alignment.evidence}</p>
                        </div>
                      ))}
                      {(!selectedAnalysis || selectedAnalysis.skill_alignment.length === 0) && (
                        <p className="text-xs text-muted-foreground">Run the workflow to see skill alignment.</p>
                      )}
                    </div>
                  </div>

                  {selectedReadout && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">Strengths</h4>
                        <ul className="space-y-1 text-xs text-emerald-800">
                          {selectedReadout.strengths.map(s => <li key={s}>{s}</li>)}
                          {selectedReadout.strengths.length === 0 && <li>None supplied.</li>}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">Risks</h4>
                        <ul className="space-y-1 text-xs text-amber-800">
                          {selectedReadout.risks.map(r => <li key={r}>{r}</li>)}
                          {selectedReadout.risks.length === 0 && <li>None supplied.</li>}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Actions</h4>
                        <ul className="space-y-1 text-xs text-blue-800">
                          {selectedReadout.recommended_actions.map(a => <li key={a}>{a}</li>)}
                          {selectedReadout.recommended_actions.length === 0 && <li>None supplied.</li>}
                        </ul>
                      </div>
                    </div>
                  )}
                  {!selectedReadout && <p className="text-xs text-muted-foreground">Run the workflow to populate the detailed readout.</p>}
                </div>
              )}
            </div>
          )}

          {/* Engagement Plan */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection("engagement")}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                {isGenerating && streamingStep === 'engagement_plan' && <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />}
                <span className="text-sm font-semibold text-foreground">Engagement Plan</span>
                {displayEngagement.length > 0 && !isGenerating && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{displayEngagement.length} items</span>}
                {isGenerating && isStepBefore(streamingStep, 'engagement_plan') && <span className="text-xs text-muted-foreground">Waiting...</span>}
              </div>
              <svg className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.has("engagement") ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections.has("engagement") && (
              <div className="border-t border-border p-5">
                {isGenerating && streamingStep === 'engagement_plan' && displayEngagement.length === 0 && (
                  <div className="flex items-center gap-2 py-3 text-sm text-primary">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-primary" /> Creating engagement plan...
                  </div>
                )}
                {!isGenerating && displayEngagement.length === 0 && <p className="text-sm text-muted-foreground">Run the workflow to populate engagement actions.</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {displayEngagement.map((item, i) => (
                    <div key={`${item.label}-${i}`} className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-xs text-foreground/80">{item.value}</p>
                      {item.helper && <p className="mt-1.5 text-xs text-muted-foreground">{item.helper}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fairness Guidance */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection("fairness")}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                {isGenerating && streamingStep === 'fairness_guidance' && <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />}
                <span className="text-sm font-semibold text-foreground">Fairness & Panel Guidance</span>
                {isGenerating && isStepBefore(streamingStep, 'fairness_guidance') && <span className="text-xs text-muted-foreground">Waiting...</span>}
              </div>
              <svg className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.has("fairness") ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections.has("fairness") && (
              <div className="border-t border-border p-5">
                {isGenerating && streamingStep === 'fairness_guidance' && displayFairness.length === 0 && (
                  <div className="flex items-center gap-2 py-3 text-sm text-primary">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-primary" /> Generating fairness guidance...
                  </div>
                )}
                {!isGenerating && displayFairness.length === 0 && <p className="text-sm text-muted-foreground">Run the workflow to receive panel guidance.</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {displayFairness.map((item, i) => {
                    const lo = item.label.toLowerCase();
                    const cardCls = lo.includes('bias') || lo.includes('fairness') || lo.includes('diversity') ? "border-emerald-200 bg-emerald-50"
                      : lo.includes('risk') || lo.includes('caution') ? "border-amber-200 bg-amber-50"
                      : "border-border bg-muted";
                    const textCls = lo.includes('bias') || lo.includes('fairness') || lo.includes('diversity') ? "text-emerald-800"
                      : lo.includes('risk') || lo.includes('caution') ? "text-amber-800"
                      : "text-foreground";
                    return (
                      <div key={`${item.label}-${i}`} className={`rounded-lg border p-3 ${cardCls}`}>
                        <p className={`text-sm font-semibold ${textCls}`}>{item.label}</p>
                        <p className={`mt-1 text-xs ${textCls}`}>{item.value}</p>
                        {item.helper && <p className="mt-1.5 text-xs text-muted-foreground">{item.helper}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Interview Pack */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection("interview")}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                {isGenerating && streamingStep === 'interview_preparation' && <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />}
                <span className="text-sm font-semibold text-foreground">Interview Preparation Pack</span>
                {displayInterview.length > 0 && !isGenerating && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">{displayInterview.length} questions</span>}
                {isGenerating && isStepBefore(streamingStep, 'interview_preparation') && <span className="text-xs text-muted-foreground">Waiting...</span>}
              </div>
              <svg className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.has("interview") ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections.has("interview") && (
              <div className="border-t border-border p-5">
                {isGenerating && streamingStep === 'interview_preparation' && displayInterview.length === 0 && (
                  <div className="flex items-center gap-2 py-3 text-sm text-primary">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-primary" /> Preparing interview questions...
                  </div>
                )}
                {!isGenerating && displayInterview.length === 0 && <p className="text-sm text-muted-foreground">Run the workflow to populate interview questions.</p>}
                <ul className="space-y-2">
                  {displayInterview.map(item => (
                    <li key={item.question} className="rounded-lg border border-border bg-muted px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{item.question}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.rationale}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
