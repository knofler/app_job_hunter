"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchFromApi } from "@/lib/api";
import { fallbackCandidates } from "@/lib/fallback-data";

const PAGE_SIZE = 5;

type Candidate = {
  candidate_id: string;
  name: string;
  primary_role?: string;
  candidate_type?: string;
  preferred_locations?: string[];
  experience_years?: number;
  updated_at?: string;
};

type CandidateListResponse = {
  items: Candidate[];
  total: number;
  page: number;
  page_size: number;
};

function formatDate(value?: string): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function CandidatesPage() {
  const [page, setPage] = useState(1);
  const [candidates, setCandidates] = useState<Candidate[]>(fallbackCandidates.slice(0, PAGE_SIZE));
  const [total, setTotal] = useState<number>(fallbackCandidates.length);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFromApi<CandidateListResponse>(
          `/candidates?page=${page}&page_size=${PAGE_SIZE}`
        );
        if (!isMounted) {
          return;
        }

        setCandidates(response.items);
        setTotal(response.total ?? response.items.length);
        setUsingFallback(false);
      } catch (err) {
        console.error("Failed to load candidates", err);
        if (!isMounted) {
          return;
        }
        setCandidates(fallbackCandidates.slice(0, PAGE_SIZE));
        setTotal(fallbackCandidates.length);
        setUsingFallback(true);
        setError("Unable to reach the API. Showing demo candidates.");
        if (page !== 1) {
          setPage(1);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidate Directory</h1>
          <p className="text-sm text-gray-500">Browse {total} candidates across {usingFallback ? "the demo" : "our"} talent pool.</p>
        </div>
        <div className="text-sm text-gray-500">
          {loading ? "Loading..." : usingFallback ? "Demo data" : "Live data"}
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

      <div className="overflow-x-auto bg-white border border-blue-100 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-blue-100">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Candidate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Preferred Locations</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Experience</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {candidates.map(candidate => (
              <tr key={candidate.candidate_id} className="hover:bg-blue-50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{candidate.name}</div>
                  <div className="text-xs text-gray-500">{candidate.primary_role ?? "Role not specified"}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{candidate.candidate_type ?? "Unknown"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {candidate.preferred_locations && candidate.preferred_locations.length > 0
                    ? candidate.preferred_locations.join(", ")
                    : "Not specified"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{candidate.experience_years ?? 0} yrs</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatDate(candidate.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
        <div className="text-sm text-gray-500">Showing {start} - {end} of {total}</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-3 py-1 rounded border border-blue-200 text-sm text-blue-700 disabled:opacity-50"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
          <button
            type="button"
            className="px-3 py-1 rounded border border-blue-200 text-sm text-blue-700 disabled:opacity-50"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
