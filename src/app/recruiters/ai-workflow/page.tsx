"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import RecruiterChat from "@/components/RecruiterChat";
import DeepAssessButton from "@/components/DeepAssessButton";
import { useWorkflowRun } from "@/contexts/WorkflowRunContext";


import {
  CandidateAnalysis,
  CandidateReadout,
  CandidateSummary,
  listCandidateResumes,
  listCandidates,
  listAllResumes,
  RecruiterWorkflowRequest,
  RecruiterWorkflowResponse,
  ResumeSummary,
  JobDescription,
  listJobDescriptions,
  updateJobDescription,
  searchCandidatesAndResumes,
  CandidateSearchResponse,
} from "@/lib/recruiter-workflow";


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

  // Workflow state lives in context — persists when navigating away
  const {
    isGenerating,
    workflowResult,
    streamingStep,
    streamingMessage,
    generationError,
    lastAnalyzedAt,
    analysisHistory,
    viewingHistoryId,
    setViewingHistoryId,
    startWorkflow,
    clearResult,
  } = useWorkflowRun();

  // Local page state (input controls only)
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
  // Multi-candidate selection: selectedCandidateIds = candidates included in the run
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null); // focused candidate for Detailed Readout
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [resumesByCandidate, setResumesByCandidate] = useState<Map<string, ResumeSummary[]>>(new Map());
  const [resumeOwnership, setResumeOwnership] = useState<Map<string, string>>(new Map()); // resumeId → candidateId
  const [resumeLoadingIds, setResumeLoadingIds] = useState<Set<string>>(new Set()); // candidateIds currently loading
  const [resumeSearch, setResumeSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CandidateSearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
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

  // Load candidates + all uploaded resumes (as pseudo-candidates)
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const [candidateResponse, resumeResponse] = await Promise.all([
          listCandidates(),
          listAllResumes(),
        ]);

        // Build a set of resume IDs already linked to a known candidate
        // so we don't show duplicates
        const knownCandidateIds = new Set(candidateResponse.items.map(c => c.candidate_id));

        // Map standalone uploaded resumes → pseudo-CandidateSummary
        const resumePseudoCandidates: CandidateSummary[] = (resumeResponse.items || [])
          .filter(r => {
            // Exclude if already covered by a known candidate
            const linkedId = (r as Record<string, unknown>).user_id as string | undefined
              || (r as Record<string, unknown>).candidate_id as string | undefined;
            return !linkedId || !knownCandidateIds.has(linkedId);
          })
          .map(r => ({
            candidate_id: r.id,
            name: (r as Record<string, unknown>).candidate_name as string || r.name || r.id,
            primary_role: r.type || "Uploaded Resume",
          }));

        const merged = [...candidateResponse.items, ...resumePseudoCandidates];
        setCandidates(merged);
      } catch (error) {
        console.error("Failed to load candidates:", error);
        setCandidateError("Failed to load candidates");
      } finally {
        setCandidatesLoading(false);
      }
    };
    loadCandidates();
  }, []); // Empty dependency array - only run once on mount

  // Toggle a candidate in/out of the comparison run.
  // Loads their resumes on first selection; removes them on deselection.
  const toggleCandidate = async (candidateId: string) => {
    setSelectedCandidateId(candidateId); // Always update focused candidate (for Detailed Readout)

    if (selectedCandidateIds.has(candidateId)) {
      // Deselect: remove their resumes from maps and deselect their resume IDs
      const theirResumeIds = (resumesByCandidate.get(candidateId) || []).map(r => r.id);
      setSelectedCandidateIds(prev => { const n = new Set(prev); n.delete(candidateId); return n; });
      setResumesByCandidate(prev => { const n = new Map(prev); n.delete(candidateId); return n; });
      setResumeOwnership(prev => { const n = new Map(prev); theirResumeIds.forEach(id => n.delete(id)); return n; });
      setSelectedResumeIds(prev => prev.filter(id => !theirResumeIds.includes(id)));
    } else {
      // Select: add candidate, load their resumes
      setSelectedCandidateIds(prev => new Set([...prev, candidateId]));
      clearResult();
      setResumeLoadingIds(prev => new Set([...prev, candidateId]));
      try {
        const isPseudo = /^[a-f0-9]{24}$/i.test(candidateId);
        const newResumes: ResumeSummary[] = isPseudo
          ? [{ id: candidateId, name: candidates.find(c => c.candidate_id === candidateId)?.name || candidateId }]
          : (await listCandidateResumes(candidateId)).resumes;
        setResumesByCandidate(prev => new Map([...prev, [candidateId, newResumes]]));
        setResumeOwnership(prev => {
          const n = new Map(prev);
          newResumes.forEach(r => n.set(r.id, candidateId));
          return n;
        });
      } catch (e) {
        console.error("Failed to load resumes for candidate", candidateId, e);
      } finally {
        setResumeLoadingIds(prev => { const n = new Set(prev); n.delete(candidateId); return n; });
      }
    }
  };

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

  // Compute active result early so useMemos below can reference it
  // When generating → live streaming; when viewing history → that record; else → latest run
  const viewingRecord = viewingHistoryId ? (analysisHistory.find(r => r.id === viewingHistoryId) ?? null) : null;
  const activeResult = isGenerating ? workflowResult : (viewingRecord?.result ?? workflowResult);

  const candidateAnalysisById = useMemo(() => {
    const map = new Map<string, CandidateAnalysis>();
    if (!activeResult) {
      return map;
    }
    for (const item of activeResult.candidate_analysis) {
      map.set(item.candidate_id, item);
    }
    return map;
  }, [activeResult]);

  const readoutById = useMemo(() => {
    const map = new Map<string, CandidateReadout>();
    if (!activeResult) {
      return map;
    }
    for (const item of activeResult.detailed_readout) {
      map.set(item.candidate_id, item);
    }
    return map;
  }, [activeResult]);

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
    if (!resumeSearch.trim()) return candidates;
    const searchLower = resumeSearch.toLowerCase();
    return candidates.filter(candidate =>
      (candidate.name && candidate.name.toLowerCase().includes(searchLower)) ||
      (candidate.primary_role && candidate.primary_role.toLowerCase().includes(searchLower))
    );
  }, [candidates, resumeSearch]);

  // Get search results for display
  const searchResultsForDisplay = useMemo(() => {
    if (!searchResults) return [];
    return searchResults.results.slice(0, visibleCandidates);
  }, [searchResults, visibleCandidates]);

  // Computed values for display
  const shortlist = activeResult?.ranked_shortlist || [];
  const selectedCandidate = candidates.find(c => c.candidate_id === selectedCandidateId);
  const selectedAnalysis = selectedCandidateId ? candidateAnalysisById.get(selectedCandidateId) : undefined;
  const selectedReadout = selectedCandidateId ? readoutById.get(selectedCandidateId) : undefined;

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (selectedCandidateIds.size === 0) return;
    if (!jobDescription.trim()) return;
    if (selectedResumeIds.length === 0) return;

    // Build payload with per-resume correct candidate_id from ownership map
    const payload: RecruiterWorkflowRequest = {
      job_description: jobDescription,
      job_metadata: { title: jobTitle, code: jobCode, level: jobLevel, salary_band: salaryBand, summary: jobSummary },
      resumes: selectedResumeIds.map(resumeId => {
        const ownerCandidateId = resumeOwnership.get(resumeId);
        const isPseudo = ownerCandidateId ? /^[a-f0-9]{24}$/i.test(ownerCandidateId) : false;
        return { resume_id: resumeId, ...(isPseudo || !ownerCandidateId ? {} : { candidate_id: ownerCandidateId }) };
      }),
    };

    const candidateNames = [...selectedCandidateIds]
      .map(id => candidates.find(c => c.candidate_id === id)?.name || id)
      .join(", ");

    setTimeout(() => { workflowStepsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 300);

    await startWorkflow(payload, {
      candidateName: candidateNames,
      candidateId: [...selectedCandidateIds][0] || "",
      jobTitle: jobTitle || "Untitled Job",
      resumeIds: [...selectedResumeIds],
    });
  };

  // Display variables derived from activeResult (computed near top of component)
  const displayCoreSkills = activeResult?.core_skills || [];
  const displayEngagement = activeResult?.engagement_plan || [];
  const displayFairness = activeResult?.fairness_guidance || [];
  const displayInterview = activeResult?.interview_preparation || [];
  const markdownAnalysis = activeResult?.ai_analysis_markdown || "";


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
                    const isActive = selectedCandidateIds.has(candidate.candidate_id);
                    return (
                      <div key={candidate.candidate_id} className={`rounded-lg border p-3 transition ${isActive ? "border-primary bg-primary/5" : "border-border bg-muted"}`}>
                        <button type="button" onClick={() => toggleCandidate(candidate.candidate_id)} className="w-full text-left mb-2 flex items-center gap-2">
                          <span className={`flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center ${isActive ? "border-primary bg-primary" : "border-muted-foreground/50"}`}>
                            {isActive && <svg className="h-2.5 w-2.5" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" /></svg>}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground">{candidate.primary_role || "No role"}</p>
                          </div>
                          {resumeLoadingIds.has(candidate.candidate_id) && <span className="ml-auto h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />}
                        </button>
                        {isActive && (
                          <div className="ml-6 space-y-1 border-l border-primary/20 pl-2">
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
                        )}
                      </div>
                    );
                  })
                : filteredCandidates.slice(0, visibleCandidates).map(candidate => {
                    const isActive = selectedCandidateIds.has(candidate.candidate_id);
                    const isLoading = resumeLoadingIds.has(candidate.candidate_id);
                    const candidateResumes = resumesByCandidate.get(candidate.candidate_id) || [];
                    return (
                      <div key={candidate.candidate_id}>
                        <button type="button" onClick={() => toggleCandidate(candidate.candidate_id)}
                          className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition ${isActive ? "border-primary bg-primary/5" : "border-border bg-muted hover:border-primary/30"}`}>
                          <span className={`flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center ${isActive ? "border-primary bg-primary" : "border-muted-foreground/50"}`}>
                            {isActive && <svg className="h-2.5 w-2.5" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" /></svg>}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{candidate.primary_role || "No role"}</p>
                          </div>
                          {isLoading && <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />}
                        </button>
                        {isActive && candidateResumes.length > 0 && (
                          <div className="ml-6 mt-1 mb-1 space-y-1 border-l border-primary/20 pl-2">
                            {candidateResumes.map(resume => (
                              <label key={resume.id} className="flex items-start gap-2 cursor-pointer py-0.5">
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
                      </div>
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
          {!isGenerating && !jobDescription.trim() && (
            <p className="text-xs text-muted-foreground text-center">✓ Select or enter a job description first</p>
          )}
          {!isGenerating && jobDescription.trim() && selectedCandidateIds.size === 0 && (
            <p className="text-xs text-muted-foreground text-center">✓ Check a candidate above to begin</p>
          )}
          {!isGenerating && jobDescription.trim() && selectedCandidateIds.size > 0 && selectedResumeIds.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">✓ Now check a resume under the candidate</p>
          )}
          <button type="button" onClick={handleGenerate}
            disabled={isGenerating || !jobDescription.trim() || selectedCandidateIds.size === 0 || selectedResumeIds.length === 0}
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

          {/* Analysis history bar */}
          {analysisHistory.length > 0 && (
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Run History</span>
                {viewingHistoryId && (
                  <button type="button" onClick={() => setViewingHistoryId(null)}
                    className="ml-auto text-xs text-primary hover:underline">
                    ← Back to latest
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {analysisHistory.map(record => (
                  <button key={record.id} type="button"
                    onClick={() => setViewingHistoryId(viewingHistoryId === record.id ? null : record.id)}
                    className={`rounded-lg border px-3 py-1.5 text-left text-xs transition-colors ${viewingHistoryId === record.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted hover:border-primary/50 text-foreground"}`}>
                    <p className="font-medium truncate max-w-[160px]">{record.candidateName}</p>
                    <p className="text-muted-foreground truncate max-w-[160px]">{record.jobTitle}</p>
                    <p className="text-muted-foreground mt-0.5">{formatDateTime(record.timestamp)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Viewing history banner */}
          {viewingRecord && !isGenerating && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-800">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Viewing historical run for <strong>{viewingRecord.candidateName}</strong> — {viewingRecord.jobTitle} — {formatDateTime(viewingRecord.timestamp)}
              <button type="button" onClick={() => setViewingHistoryId(null)} className="ml-auto font-semibold hover:underline">Dismiss</button>
            </div>
          )}

          {/* Empty state */}
          {!activeResult && !isGenerating && (
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
                  workflowContext={activeResult ? { workflowResult: activeResult } : undefined}
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
                      <th className="px-4 py-3 text-left font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {isGenerating && streamingStep === 'ranked_shortlist' && shortlist.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-primary">
                          <span className="h-3 w-3 animate-pulse rounded-full bg-primary" /> Ranking candidates...
                        </div>
                      </td></tr>
                    )}
                    {!isGenerating && shortlist.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-4 text-sm text-muted-foreground">Run the workflow to populate the ranked shortlist.</td></tr>
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
                          <td className="px-4 py-3">
                            <DeepAssessButton
                              resumeId={item.candidate_id}
                              resumeName={analysis?.name || rowCandidate?.name}
                            />
                          </td>
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
