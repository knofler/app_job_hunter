"use client";

import { useEffect, useMemo, useState } from "react";

import { useCandidateScope } from "@/context/PersonaContext";
import { fetchFromApi } from "@/lib/api";
import { fallbackApplications } from "@/lib/fallback-data";

const STATUS_STYLES: Record<string, string> = {
  Applied:            "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Draft:              "bg-muted text-muted-foreground border-border",
  Shortlisted:        "bg-amber-500/10 text-amber-400 border-amber-500/30",
  "Interview Round 1":"bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  "Phone Interview":  "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  Offered:            "bg-primary/10 text-primary border-primary/30",
  Rejected:           "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

type ApplicationJob = {
  id?: string | null;
  title?: string | null;
  company?: string | null;
  location?: string | null;
};

type Application = {
  id: string;
  status?: string | null;
  match_score?: number | null;
  applied_at?: string | null;
  updated_at?: string | null;
  resume_id?: string | null;
  resume_slug?: string | null;
  job?: ApplicationJob | null;
};

const PAGE_SIZE = 12;

export default function MyJobsPage() {
  const { candidateId } = useCandidateScope();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);

  useEffect(() => {
    if (!candidateId) {
      setApplications([]);
      setSelectedId(null);
      setUsingFallback(false);
      setLoading(false);
      setError(null);
      return;
    }

    async function loadApplications() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchFromApi<{
          items: Application[];
          total: number;
          page: number;
          page_size: number;
        }>(`/applications/candidates/${candidateId}?page=1&page_size=${PAGE_SIZE}`);

        setApplications(response.items);
        setSelectedId(prev => prev ?? (response.items[0]?.id ?? null));
        setUsingFallback(false);
      } catch (err) {
        console.error("Failed to load applications", err);
        const mappedFallback: Application[] = fallbackApplications.map(app => ({
          id: app.id,
          status: app.status,
          match_score: app.match_score,
          applied_at: app.applied_at,
          updated_at: app.updated_at,
          resume_id: (app as { resume_id?: string }).resume_id ?? null,
          resume_slug: (app as { resume_slug?: string }).resume_slug ?? null,
          job: app.job,
        }));

        setApplications(mappedFallback);
        setSelectedId(mappedFallback[0]?.id ?? null);
        setUsingFallback(true);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    void loadApplications();
  }, [candidateId]);

  const selectedApplication = useMemo(() => {
    if (!selectedId) {
      return applications[0] ?? null;
    }
    return applications.find(app => app.id === selectedId) ?? applications[0] ?? null;
  }, [applications, selectedId]);

  const formatDate = (value?: string | null) => {
    if (!value) {
      return null;
    }
    try {
      return new Date(value).toLocaleDateString();
    } catch (err) {
      console.warn("Unable to format date", err);
      return value;
    }
  };

  if (!candidateId) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4 text-sm text-muted-foreground">
        Switch to the candidate persona to review applications.
      </div>
    );
  }

  if (loading && !applications.length) {
    return <div className="max-w-5xl mx-auto py-10 px-4 text-sm text-muted-foreground">Loading your applications...</div>;
  }

  if (!applications.length) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4 text-sm text-muted-foreground">
        No applications yet. Start exploring roles from the Jobs tab.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/2">
        <h1 className="text-2xl font-bold mb-3">My Applications</h1>
        {usingFallback && (
          <div className="text-xs text-muted-foreground mb-2">Showing cached applications while the API is unavailable.</div>
        )}
        {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
        <ul className="flex flex-col gap-2">
          {applications.map(application => {
            const job = application.job ?? {};
            const status = application.status ?? "Unknown";
            const statusStyle = STATUS_STYLES[status] ?? "bg-muted text-foreground/80 border-border";
            const appliedDate = formatDate(application.applied_at);
            const updatedDate = formatDate(application.updated_at);

            const resumeLabel = application.resume_id ?? application.resume_slug;

            return (
              <li
                key={application.id}
                className={`bg-card rounded-lg px-4 py-3 flex flex-col items-start shadow transition-all duration-200 cursor-pointer ${selectedId === application.id ? "ring-2 ring-primary" : ""}`}
                style={{ minHeight: 48 }}
                onClick={() => setSelectedId(application.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-semibold flex-1 text-foreground">{job.title ?? "Untitled Role"}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusStyle}`}>{status}</span>
                </div>
                <div className="text-sm text-foreground/80 mb-1 mt-1">
                  {(job.company ?? "Unknown Company")} • {(job.location ?? "Unknown Location")}
                </div>
                {resumeLabel && (
                  <div className="text-xs text-muted-foreground">Resume: <span className="font-semibold text-primary">{resumeLabel}</span></div>
                )}
                <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                  {appliedDate && <span>Applied: <span className="font-semibold">{appliedDate}</span></span>}
                  {updatedDate && <span>Updated: <span className="font-semibold">{updatedDate}</span></span>}
                  {application.match_score != null && (
                    <span>Match: <span className="font-semibold">{Math.round(application.match_score)}%</span></span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="w-full md:w-1/2">
        <div className="bg-card border-2 border-primary/30 rounded-lg p-6 shadow-sm min-h-[300px]">
          {selectedApplication ? (
            <>
              <div className="mb-2 font-semibold text-blue-900 text-lg">{selectedApplication.job?.title ?? "Select a job"}</div>
              <div className="mb-2 text-foreground/80">
                {(selectedApplication.job?.company ?? "Unknown Company")} • {(selectedApplication.job?.location ?? "Unknown Location")}
              </div>
              <div className="mb-2 font-semibold text-blue-900">Application Details</div>
              <div className="mb-3 text-foreground text-sm">
                {selectedApplication.status ? `Status: ${selectedApplication.status}` : "Status not available"}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {formatDate(selectedApplication.applied_at) && (
                  <div>Applied on {formatDate(selectedApplication.applied_at)}</div>
                )}
                {formatDate(selectedApplication.updated_at) && (
                  <div>Last updated on {formatDate(selectedApplication.updated_at)}</div>
                )}
                {selectedApplication.match_score != null && (
                  <div>Match score {Math.round(selectedApplication.match_score)}%</div>
                )}
                {selectedApplication.resume_id && (
                  <div>Resume ID {selectedApplication.resume_id}</div>
                )}
                {selectedApplication.resume_slug && !selectedApplication.resume_id && (
                  <div>Resume {selectedApplication.resume_slug}</div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Select an application to preview its details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
