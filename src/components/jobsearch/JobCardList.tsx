"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useCandidateScope } from "@/context/PersonaContext";
import { fetchFromApi } from "@/lib/api";
import { fallbackJobs } from "@/lib/fallback-data";
import JobCard from "./JobCard";
import JobListingCard from "./JobListingCard";
import type { JobFilters } from "./JobSearchFilters";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  match_score?: number;
  salary_range?: string;
  employment_type?: string;
  posted_at?: string;
  description?: string;
  code?: string;
};

interface JobCardListProps {
  filters: JobFilters;
  pageSize?: number;
  mode?: "personalized" | "listings";
}

export default function JobCardList({ filters, pageSize = 10, mode = "personalized" }: JobCardListProps) {
  const { candidateId } = useCandidateScope();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<boolean>(false);

  const loadJobs = useCallback(
    async (targetPage: number) => {
      if (!candidateId) {
        setJobs([]);
        setHasMore(false);
        setLoading(false);
        setUsingFallback(false);
        setError(null);
        return;
      }

      try {
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append("candidate_id", candidateId);
        params.append("page", String(targetPage));
        params.append("page_size", String(pageSize));

        if (filters.search.trim()) {
          params.append("search", filters.search.trim());
        }
        if (filters.hideApplied) {
          params.append("exclude_applied", "true");
        }

        const response = await fetchFromApi<{ items: Job[]; total: number; page: number; page_size: number }>(
          `/jobs?${params.toString()}`
        );

        setUsingFallback(false);
        setJobs(prev => {
          const combined = targetPage === 1 ? response.items : [...prev, ...response.items];
          const deduped = new Map<string, Job>();
          combined.forEach(job => deduped.set(job.id, job));
          return Array.from(deduped.values());
        });

        const moreAvailable = response.items.length === pageSize;
        setHasMore(moreAvailable);
      } catch (err) {
        console.error("Failed to load jobs", err);
        if (targetPage === 1) {
          setJobs(fallbackJobs);
          setHasMore(false);
          setUsingFallback(true);
          setError(null);
        } else {
          setError("Unable to load additional jobs.");
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [candidateId, filters.hideApplied, filters.search, pageSize]
  );

  useEffect(() => {
    setPage(1);
    setJobs([]);
    setHasMore(true);
    setUsingFallback(false);
  }, [candidateId, filters.hideApplied, filters.search, filters.sort]);

  useEffect(() => {
    if (!candidateId) {
      return;
    }
    if (usingFallback && page > 1) {
      return;
    }
    void loadJobs(page);
  }, [candidateId, page, loadJobs, usingFallback]);

  useEffect(() => {
    if (!candidateId || usingFallback || !hasMore) {
      return;
    }

    const target = loaderRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry?.isIntersecting && !loadingRef.current) {
        observer.unobserve(entry.target);
        setPage(prev => prev + 1);
      }
    });

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [candidateId, hasMore, usingFallback, jobs.length]);

  const sortedJobs = useMemo(() => {
    const jobCopy = [...jobs];

    switch (filters.sort) {
      case "date":
        jobCopy.sort((a, b) => {
          const dateA = a.posted_at ? Date.parse(a.posted_at) : 0;
          const dateB = b.posted_at ? Date.parse(b.posted_at) : 0;
          return dateB - dateA;
        });
        break;
      case "salary":
        jobCopy.sort((a, b) => {
          const getSalaryValue = (value?: string) => {
            if (!value) return 0;
            const match = value.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          };
          return getSalaryValue(b.salary_range) - getSalaryValue(a.salary_range);
        });
        break;
      case "match":
      default:
        jobCopy.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
        break;
    }

    return jobCopy;
  }, [jobs, filters.sort]);

  const showInitialLoading = candidateId != null && loading && !jobs.length && !usingFallback;

  if (!candidateId) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <svg className="w-10 h-10 text-muted-foreground mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="text-sm text-muted-foreground">Switch to the candidate persona to see personalised job results.</p>
      </div>
    );
  }

  if (showInitialLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 flex gap-4 animate-pulse">
            <div className="w-11 h-11 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!sortedJobs.length) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
        <svg className="w-10 h-10 text-muted-foreground mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-sm text-muted-foreground">No jobs found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div>
      {mode !== "listings" && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {usingFallback ? "Showing cached results" : `${sortedJobs.length} jobs found`}
          </p>
          {usingFallback && (
            <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">Offline mode</span>
          )}
        </div>
      )}
      <div className={mode === "listings" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}>
        {sortedJobs.map(job => (
          mode === "listings" ? (
            <JobListingCard key={job.id} job={job} />
          ) : (
            <JobCard key={job.id} job={job} />
          )
        ))}
        {!usingFallback && hasMore && (
          <div ref={loaderRef} className="h-1" aria-hidden />
        )}
        {loading && jobs.length > 0 && (
          <div className="text-xs text-muted-foreground col-span-full py-2 text-center">Loading more jobs…</div>
        )}
        {!hasMore && !usingFallback && sortedJobs.length > 0 && (
          <div className="text-xs text-muted-foreground col-span-full py-4 text-center border-t border-border">All jobs loaded</div>
        )}
        {error && <div className="text-xs text-error col-span-full">{error}</div>}
      </div>
    </div>
  );
}
