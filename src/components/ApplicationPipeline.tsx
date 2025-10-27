"use client";

import { useEffect, useMemo, useState } from "react";

import { useCandidateScope } from "@/context/PersonaContext";
import { fetchFromApi } from "@/lib/api";
import { fallbackPipelineCounts } from "@/lib/fallback-data";

type PipelineResponse = {
  pipeline: Record<string, number>;
};

const PIPELINE_CONFIG: Array<{
  label: string;
  keys: string[];
}> = [
  { label: "Saved Jobs", keys: ["Draft", "Saved"] },
  { label: "Applied", keys: ["Applied"] },
  { label: "Interviewing", keys: ["Shortlisted", "Phone Interview", "Interview Round 1", "Interview Round 2", "Onsite"] },
  { label: "Offer", keys: ["Offer", "Offer Pending", "Offer Accepted"] },
];

export default function ApplicationPipeline() {
  const { candidateId } = useCandidateScope();
  const [pipeline, setPipeline] = useState<Record<string, number>>(fallbackPipelineCounts);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      setUsingFallback(false);
      return;
    }

    async function loadPipeline() {
      try {
        const response = await fetchFromApi<PipelineResponse>(
          `/candidates/${candidateId}/pipeline`
        );
        setPipeline(response.pipeline);
        setUsingFallback(false);
      } catch (error) {
        console.error("Failed to load pipeline", error);
        setPipeline(fallbackPipelineCounts);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }

    void loadPipeline();
  }, [candidateId]);

  const pipelineTotals = useMemo(() => {
    return PIPELINE_CONFIG.map(({ label, keys }) => ({
      label,
      count: keys.reduce((total, key) => total + (pipeline[key] ?? 0), 0),
    }));
  }, [pipeline]);

  const otherCount = useMemo(() => {
    const trackedKeys = PIPELINE_CONFIG.flatMap(entry => entry.keys);
    return Object.entries(pipeline)
      .filter(([status]) => !trackedKeys.includes(status))
      .reduce((total, [, count]) => total + count, 0);
  }, [pipeline]);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="text-base font-semibold mb-4">Application Pipeline</div>
      {!candidateId ? (
        <div className="text-xs text-gray-500">Switch to the candidate persona to review your applications.</div>
      ) : loading ? (
        <div className="text-sm text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="flex gap-4 overflow-x-auto">
            {pipelineTotals.map(({ label, count }) => (
              <div key={label} className="flex-1 min-w-[140px]">
                <div className="font-bold mb-2">{label}</div>
                <div className="bg-gray-100 rounded p-2 min-h-[60px]">{count} job{count === 1 ? "" : "s"}</div>
              </div>
            ))}
            {otherCount > 0 && (
              <div className="flex-1 min-w-[140px]">
                <div className="font-bold mb-2">Other</div>
                <div className="bg-gray-100 rounded p-2 min-h-[60px]">{otherCount} job{otherCount === 1 ? "" : "s"}</div>
              </div>
            )}
          </div>
          {usingFallback && (
            <div className="text-xs text-gray-400 mt-3">Showing cached pipeline while the API is unavailable.</div>
          )}
        </>
      )}
    </div>
  );
}
