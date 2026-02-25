"use client";
import { useEffect, useState } from "react";

import { useCandidateScope } from "@/context/PersonaContext";
import { fetchFromApi } from "@/lib/api";
import { fallbackSuggestedActions } from "@/lib/fallback-data";

type Action = { id: string; text: string; priority?: string | null; category?: string | null };

export default function SuggestedActions() {
  const { candidateId } = useCandidateScope();
  const [actions, setActions] = useState<Action[]>(fallbackSuggestedActions);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      setUsingFallback(false);
      return;
    }

    async function loadActions() {
      try {
        const response = await fetchFromApi<{ actions: Action[] }>(
          `/candidates/${candidateId}/suggested-actions`
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
  }, [candidateId]);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="text-base font-semibold mb-2">Top AI-Suggested Actions</div>
      {!candidateId ? (
        <div className="text-xs text-muted-foreground">Switch to the candidate persona to see personalised actions.</div>
      ) : loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : (
        <>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
            {actions.map((action) => (
              <li key={action.id} className="flex flex-col">
                <span>{action.text}</span>
                {(action.priority || action.category) && (
                  <span className="text-xs text-muted-foreground">
                    {[action.priority, action.category].filter(Boolean).join(" • ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {usingFallback && (
            <div className="text-xs text-muted-foreground mt-3">Showing cached actions while the API is unavailable.</div>
          )}
        </>
      )}
    </div>
  );
}
