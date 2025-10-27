"use client";
import { useEffect, useState } from "react";

import { useCandidateScope } from "@/context/PersonaContext";
import { fetchFromApi } from "@/lib/api";
import { fallbackResumeHealth } from "@/lib/fallback-data";

type SubScore = { label: string; value: number };

export default function ResumeHealthCard() {
  const { candidateId } = useCandidateScope();
  const [score, setScore] = useState<number>(fallbackResumeHealth.score);
  const [subScores, setSubScores] = useState<SubScore[]>(fallbackResumeHealth.sub_scores);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      setUsingFallback(false);
      return;
    }

    async function loadResumeHealth() {
      try {
        const response = await fetchFromApi<{
          score: number;
          sub_scores: SubScore[];
        }>(`/candidates/${candidateId}/resume-health`);
        setScore(response.score);
        setSubScores(response.sub_scores ?? []);
        setUsingFallback(false);
      } catch (error) {
        console.error("Failed to load resume health", error);
        setScore(fallbackResumeHealth.score);
        setSubScores(fallbackResumeHealth.sub_scores);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }

    void loadResumeHealth();
  }, [candidateId]);

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
      {!candidateId ? (
        <div className="text-xs text-gray-500">Switch to the candidate persona to view resume health.</div>
      ) : loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <>
          <div className="text-3xl font-bold text-blue-600">{score}/100</div>
          <div className="text-sm text-gray-500 mb-4">Resume Health</div>
          <div className="flex gap-4">
            {subScores.map((sub) => (
              <div key={sub.label} className="flex flex-col items-center cursor-pointer">
                <div className="text-lg font-semibold">{sub.value}</div>
                <div className="text-xs text-gray-400">{sub.label}</div>
              </div>
            ))}
          </div>
          {usingFallback && (
            <div className="text-xs text-gray-400 mt-3">Showing cached data while the API is unavailable.</div>
          )}
        </>
      )}
    </div>
  );
}
