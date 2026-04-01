"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface StatusUpdate {
  id: string;
  ticket_id: string;
  ticket_type: string;
  ticket_title: string;
  stage: string;
  message: string;
  progress_percent: number;
  is_public: boolean;
  timestamp: string;
}

/* ── Stage config ───────────────────────────────────────────────────────── */

const STAGES = [
  "received",
  "analyzing",
  "planning",
  "coding",
  "testing",
  "deploying",
  "merged",
  "verified",
];

const STAGE_CONFIG: Record<string, { color: string; bgColor: string; icon: string; label: string }> = {
  received: { color: "text-zinc-400", bgColor: "bg-zinc-500", icon: "inbox", label: "Received" },
  analyzing: { color: "text-blue-400", bgColor: "bg-blue-500", icon: "search", label: "Analyzing" },
  planning: { color: "text-indigo-400", bgColor: "bg-indigo-500", icon: "map", label: "Planning" },
  coding: { color: "text-violet-400", bgColor: "bg-violet-500", icon: "code", label: "Coding" },
  testing: { color: "text-amber-400", bgColor: "bg-amber-500", icon: "test", label: "Testing" },
  deploying: { color: "text-orange-400", bgColor: "bg-orange-500", icon: "rocket", label: "Deploying" },
  merged: { color: "text-emerald-400", bgColor: "bg-emerald-500", icon: "check", label: "Merged" },
  verified: { color: "text-green-400", bgColor: "bg-green-500", icon: "verified", label: "Verified" },
};

/* ── Component ──────────────────────────────────────────────────────────── */

export default function StatusPage() {
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [ticketHistory, setTicketHistory] = useState<StatusUpdate[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await fetch("/api/connect/status", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.items || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchUpdates, 30000);
    return () => clearInterval(interval);
  }, [fetchUpdates]);

  const fetchTicketHistory = async (ticketId: string) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
      return;
    }
    setExpandedTicket(ticketId);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/connect/status/${ticketId}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setTicketHistory(data.items || []);
      }
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 60000) return "just now";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return d.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  };

  const stageIndex = (stage: string) => STAGES.indexOf(stage);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <section className="border-b border-border">
        <div className="container-custom py-8">
          <Link href="/connect" className="text-sm text-muted-foreground hover:text-primary mb-3 inline-block">
            &larr; Back to Connect Hub
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">Live Status</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Auto-refreshing
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Real-time progress on bug fixes and feature requests. Updates every 30 seconds.
          </p>
        </div>
      </section>

      {/* Status cards */}
      <section className="container-custom py-8">
        {loading ? (
          <div className="space-y-4 max-w-3xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
                <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="text-4xl mb-4 opacity-30">
              <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-muted-foreground text-lg">No active work items</p>
            <p className="text-muted-foreground text-sm mt-2">
              When the team starts working on bugs or features, progress will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {updates.map((update) => {
              const config = STAGE_CONFIG[update.stage] || STAGE_CONFIG.received;
              const currentIdx = stageIndex(update.stage);
              const isExpanded = expandedTicket === update.ticket_id;

              return (
                <div key={update.id} className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/20">
                  {/* Main card */}
                  <button
                    onClick={() => fetchTicketHistory(update.ticket_id)}
                    className="w-full text-left p-5"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            update.ticket_type === "bug"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-violet-500/20 text-violet-400"
                          }`}>
                            {update.ticket_type}
                          </span>
                          {update.is_public && (
                            <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">public</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm">{update.ticket_title}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bgColor}/20 ${config.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${config.bgColor}`} />
                          {config.label}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatTime(update.timestamp)}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{update.progress_percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${config.bgColor}`}
                          style={{ width: `${update.progress_percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stage pipeline */}
                    <div className="flex items-center gap-0.5 mt-3">
                      {STAGES.map((stage, idx) => {
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        const stageConf = STAGE_CONFIG[stage];
                        return (
                          <div key={stage} className="flex-1 flex flex-col items-center">
                            <div
                              className={`h-1.5 w-full rounded-full transition-colors ${
                                isCompleted ? stageConf.bgColor : "bg-muted"
                              } ${isCurrent ? "animate-pulse" : ""}`}
                            />
                            <span className={`text-[8px] mt-1 ${isCompleted ? stageConf.color : "text-muted-foreground/50"}`}>
                              {stageConf.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Latest message */}
                    <p className="text-xs text-muted-foreground mt-3 italic">&quot;{update.message}&quot;</p>
                  </button>

                  {/* Expanded history */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 px-5 py-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Update History</h4>
                      {historyLoading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-3 bg-muted rounded w-2/3" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      ) : ticketHistory.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No history available.</p>
                      ) : (
                        <div className="space-y-3">
                          {ticketHistory.map((h) => {
                            const hConfig = STAGE_CONFIG[h.stage] || STAGE_CONFIG.received;
                            return (
                              <div key={h.id} className="flex items-start gap-3">
                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${hConfig.bgColor}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${hConfig.color}`}>{hConfig.label}</span>
                                    <span className="text-[10px] text-muted-foreground">{formatTime(h.timestamp)}</span>
                                    <span className="text-[10px] text-muted-foreground">{h.progress_percent}%</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{h.message}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
