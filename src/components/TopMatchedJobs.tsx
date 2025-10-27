"use client";

import { useEffect, useState } from "react";

import { useCandidateScope } from "@/context/PersonaContext";
import { fetchFromApi } from "@/lib/api";
import { fallbackTopMatches } from "@/lib/fallback-data";

type MatchedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  match_score?: number;
};

export default function TopMatchedJobs() {
  const { candidateId } = useCandidateScope();
  const [jobs, setJobs] = useState<MatchedJob[]>(fallbackTopMatches);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      setUsingFallback(false);
      return;
    }

    async function loadMatches() {
      try {
        const response = await fetchFromApi<{ jobs: MatchedJob[] }>(
          `/candidates/${candidateId}/top-matches?limit=5`
        );
        setJobs(response.jobs);
        setUsingFallback(false);
      } catch (error) {
        console.error("Failed to load top matches", error);
        setJobs(fallbackTopMatches);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }

    void loadMatches();
  }, [candidateId]);

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-4">
      <div className="text-base font-semibold mb-2">Top Matched Jobs</div>
      {!candidateId ? (
        <div className="text-xs text-gray-500">Switch to the candidate persona to see personalised job matches.</div>
      ) : loading ? (
        <div className="text-sm text-gray-400">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-sm text-gray-500">No matches yet. Keep refining your profile!</div>
      ) : (
        <>
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li key={job.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{job.title}</div>
                  <div className="text-xs text-gray-500">{job.company} • {job.location}</div>
                </div>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                  {Math.round(job.match_score ?? 0)}% Match
                </span>
              </li>
            ))}
          </ul>
          {usingFallback && (
            <div className="text-xs text-gray-400 mt-3">Showing cached matches while the API is unavailable.</div>
          )}
        </>
      )}
    </div>
  );
}
