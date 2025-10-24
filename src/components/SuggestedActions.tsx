"use client";
import { useEffect, useState } from "react";

import { fetchFromApi } from "@/lib/api";
import { ACTIVE_CANDIDATE_ID } from "@/lib/constants";
import { fallbackSuggestedActions } from "@/lib/fallback-data";

type Action = { id: string; text: string; priority?: string | null; category?: string | null };

export default function SuggestedActions() {
  const [actions, setActions] = useState<Action[]>(fallbackSuggestedActions);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function loadActions() {
      try {
        const response = await fetchFromApi<{ actions: Action[] }>(
          `/candidates/${ACTIVE_CANDIDATE_ID}/suggested-actions`
        );
        setActions(response.actions);
        setUsingFallback(false);
      } catch (error) {
        console.error("Failed to load suggested actions", error);
        setActions(fallbackSuggestedActions);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }

    void loadActions();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="text-base font-semibold mb-2">Top AI-Suggested Actions</div>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {actions.map((action) => (
              <li key={action.id} className="flex flex-col">
                <span>{action.text}</span>
                {(action.priority || action.category) && (
                  <span className="text-xs text-gray-400">
                    {[action.priority, action.category].filter(Boolean).join(" • ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {usingFallback && (
            <div className="text-xs text-gray-400 mt-3">Showing cached actions while the API is unavailable.</div>
          )}
        </>
      )}
    </div>
  );
}
