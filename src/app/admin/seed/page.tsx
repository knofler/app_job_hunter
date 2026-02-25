"use client";

import { useCallback, useEffect, useState } from "react";

interface SeedCounts {
  users: number;
  jobs: number;
  resumes: number;
  applications: number;
  candidates: number;
  recruiters: number;
  prompts: number;
}

interface SeedStatus {
  seeded: boolean;
  counts: SeedCounts;
}

type ActionState = "idle" | "loading" | "success" | "error";

export default function AdminSeedPage() {
  const [status, setStatus] = useState<SeedStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionMsg, setActionMsg] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/seed/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      setStatus(await res.json());
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function runAction(endpoint: string, label: string) {
    setActionState("loading");
    setActionMsg(`${label}…`);
    try {
      const res = await fetch(`/api/admin/seed/${endpoint}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Unknown error");
      setActionState("success");
      setActionMsg(data.message ?? "Done.");
      setConfirmClear(false);
      await fetchStatus();
    } catch (e: unknown) {
      setActionState("error");
      setActionMsg(e instanceof Error ? e.message : "Action failed.");
    }
  }

  const total = status
    ? Object.values(status.counts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Seed Data Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control dummy / demo data in the database. Use <strong className="text-foreground">Run Seed</strong> to
            populate demo data, or <strong className="text-foreground">Clear All</strong> to start fresh.
          </p>
        </div>

        {/* Status card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Database Status</h2>
            <button
              onClick={fetchStatus}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Checking database…</p>
          ) : status ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${status.seeded ? "bg-emerald-400" : "bg-zinc-500"}`} />
                <span className="text-sm font-medium text-foreground">
                  {status.seeded ? "Seed data present" : "No seed data — database is empty"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{total.toLocaleString()} total documents</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(status.counts).map(([col, count]) => (
                  <div key={col} className="rounded-lg bg-muted px-3 py-2.5 text-center">
                    <p className="text-xl font-bold text-foreground">{count.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{col}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-rose-400">Could not connect to backend. Is Docker running?</p>
          )}
        </div>

        {/* Action feedback */}
        {actionState !== "idle" && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${
            actionState === "loading" ? "border-border bg-muted text-muted-foreground" :
            actionState === "success" ? "border-emerald-700 bg-emerald-950/50 text-emerald-300" :
            "border-rose-700 bg-rose-950/50 text-rose-300"
          }`}>
            {actionState === "loading" && (
              <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {actionMsg}
          </div>
        )}

        {/* Actions */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground">Actions</h2>

          {/* Run seed */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Run Seed</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Populate users, jobs, resumes, applications, candidates, recruiters, and prompts.
                Safe to run — skips collections that already have data.
              </p>
            </div>
            <button
              disabled={actionState === "loading"}
              onClick={() => runAction("run", "Seeding")}
              className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              Run Seed
            </button>
          </div>

          {/* Clear prompts */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Reset Prompts</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clear only AI prompts collection. Prompts will reload from defaults on next seed run.
              </p>
            </div>
            <button
              disabled={actionState === "loading"}
              onClick={() => runAction("clear-prompts", "Clearing prompts")}
              className="shrink-0 rounded-lg border border-amber-600 px-4 py-2 text-sm font-semibold text-amber-400 hover:bg-amber-950/40 transition-colors disabled:opacity-50"
            >
              Reset Prompts
            </button>
          </div>

          {/* Clear all — with confirmation */}
          <div className="rounded-lg border border-rose-800/60 bg-rose-950/20 p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-rose-300">Clear All Seed Data</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently deletes users, jobs, resumes, applications, candidates, and recruiters.
                  <strong className="text-rose-400"> This cannot be undone.</strong>
                </p>
              </div>
              {!confirmClear && (
                <button
                  disabled={actionState === "loading"}
                  onClick={() => setConfirmClear(true)}
                  className="shrink-0 rounded-lg border border-rose-700 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-950/60 transition-colors disabled:opacity-50"
                >
                  Clear All
                </button>
              )}
            </div>
            {confirmClear && (
              <div className="flex items-center gap-3">
                <p className="text-xs text-rose-300 flex-1">Are you sure? This deletes all demo data permanently.</p>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={actionState === "loading"}
                  onClick={() => runAction("clear", "Clearing all seed data")}
                  className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  Yes, Delete All
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Seed operations run in the backend container. Requires Docker to be running with the API service healthy.
        </p>
      </div>
    </div>
  );
}
