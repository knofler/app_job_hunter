"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchFromApi } from "@/lib/api";
import { ACTIVE_CANDIDATE_ID } from "@/lib/constants";
import { fallbackJobs } from "@/lib/fallback-data";
import JobCard from "./JobCard";
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
};

interface JobCardListProps {
  filters: JobFilters;
  pageSize?: number;
}

export default function JobCardList({ filters, pageSize = 10 }: JobCardListProps) {
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
      try {
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append("candidate_id", ACTIVE_CANDIDATE_ID);
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
    [filters.hideApplied, filters.search, pageSize]
  );

  useEffect(() => {
    setPage(1);
    setJobs([]);
    setHasMore(true);
    setUsingFallback(false);
  }, [filters.hideApplied, filters.search, filters.sort]);

  useEffect(() => {
    if (usingFallback && page > 1) {
      return;
    }
    void loadJobs(page);
  }, [page, loadJobs, usingFallback]);

  useEffect(() => {
    if (usingFallback || !hasMore) {
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
  }, [hasMore, usingFallback, jobs.length]);

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

  const showInitialLoading = loading && !jobs.length && !usingFallback;

  if (showInitialLoading) {
    return <div className="text-sm text-gray-400">Loading jobs...</div>;
  }

  if (!sortedJobs.length) {
    return <div className="text-sm text-gray-500">No jobs found. Try adjusting your filters.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {usingFallback && (
        <div className="text-xs text-gray-400">Showing cached job listings while the API is unavailable.</div>
      )}
      {sortedJobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
      {!usingFallback && hasMore && (
        <div ref={loaderRef} className="h-1" aria-hidden />
      )}
      {loading && jobs.length > 0 && (
        <div className="text-xs text-gray-400">Loading more jobs…</div>
      )}
      {!hasMore && !usingFallback && (
        <div className="text-xs text-gray-400">You’ve reached the end of the job list.</div>
      )}
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}
