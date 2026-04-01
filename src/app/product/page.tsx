"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface RoadmapItem {
  id: string;
  quarter: string;
  title: string;
  description: string;
  status: string;
  category: string;
}

/* ── Feature cards data ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "AI-Powered Job Matching",
    description: "Upload job descriptions and resumes. Our AI analyses, ranks, and generates detailed assessment reports across multiple dimensions.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Resume Health Check",
    description: "Get AI-driven feedback on resume quality, keyword optimisation, and alignment with target job roles.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Recruiter Workspace",
    description: "Manage job roles, run multi-candidate assessments, generate ranking reports, and build AI-powered recruitment workflows.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Multi-Run Reporting",
    description: "Run assessments with different criteria, compare results, and generate combined reports with configurable dimension weights.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Multi-Tenant & Secure",
    description: "Auth0 authentication, organisation-level data isolation, server-side secrets, and OWASP-compliant security headers.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Connect Hub",
    description: "Built-in bug tracking, feature requests, help articles, and live status tracking. Users report issues and get real-time progress updates.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Email Notifications",
    description: "Automatic email confirmations on ticket creation and status change notifications via Resend. Stay informed without checking the app.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    title: "PDF Reports & Downloads",
    description: "Generate and download polished PDF assessment reports with emerald branding, suitable for sharing with hiring managers.",
  },
];

/* ── Status badge colours ───────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-zinc-600 text-zinc-200",
  in_progress: "bg-blue-600 text-blue-100",
  completed: "bg-emerald-600 text-emerald-100",
  deferred: "bg-amber-600 text-amber-100",
};

const CATEGORY_ICONS: Record<string, string> = {
  feature: "sparkles",
  infrastructure: "server",
  security: "shield",
  performance: "bolt",
  ux: "paint",
};

/* ── Component ──────────────────────────────────────────────────────────── */

export default function ProductPage() {
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [roadmap, setRoadmap] = useState<Record<string, RoadmapItem[]>>({});

  const fetchRoadmap = useCallback(async () => {
    try {
      const res = await fetch("/api/product/roadmap", { credentials: "include", cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data.quarters || {});
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribeStatus("loading");
    try {
      const res = await fetch("/api/product/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSubscribeStatus("success");
        setEmail("");
      } else {
        setSubscribeStatus("error");
      }
    } catch {
      setSubscribeStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="container-custom relative py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Now in Production
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            AI Job Hunter
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            AI-powered recruitment platform that matches candidates to roles, generates assessment reports,
            and streamlines the entire hiring workflow.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Get Started
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/product/releases"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Release Notes
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-custom py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">What&apos;s Inside</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          A complete platform for candidates and recruiters, powered by AI and built for production.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30"
            >
              <div className="mb-4 text-primary">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="border-t border-border bg-muted/30">
        <div className="container-custom py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Roadmap</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Quarterly release plan. Track what&apos;s coming, what&apos;s in progress, and what&apos;s shipped.
          </p>

          {Object.keys(roadmap).length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">Roadmap items will appear here once published.</p>
          ) : (
            <div className="space-y-8 max-w-3xl mx-auto">
              {Object.entries(roadmap).map(([quarter, items]) => (
                <div key={quarter}>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-primary" />
                    {quarter}
                  </h3>
                  <div className="space-y-3 pl-5 border-l-2 border-border">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-muted-foreground">
                                {CATEGORY_ICONS[item.category] || "dot"}{" "}
                                {item.category}
                              </span>
                            </div>
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              STATUS_COLORS[item.status] || "bg-zinc-700 text-zinc-300"
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Subscribe */}
      <section className="border-t border-border">
        <div className="container-custom py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Stay Updated</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Subscribe to get notified when we ship new releases and features.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (subscribeStatus !== "idle") setSubscribeStatus("idle");
              }}
              placeholder="you@example.com"
              className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={subscribeStatus === "loading"}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {subscribeStatus === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
          {subscribeStatus === "success" && (
            <p className="mt-3 text-sm text-emerald-400">Subscribed! You&apos;ll receive release notifications.</p>
          )}
          {subscribeStatus === "error" && (
            <p className="mt-3 text-sm text-red-400">Something went wrong. Please try again.</p>
          )}
        </div>
      </section>

      {/* Footer links */}
      <section className="border-t border-border bg-muted/30">
        <div className="container-custom py-8 flex flex-wrap gap-6 justify-center text-sm text-muted-foreground">
          <Link href="/product/releases" className="hover:text-primary transition-colors">Release Notes</Link>
          <Link href="/connect" className="hover:text-primary transition-colors">Connect Hub</Link>
          <Link href="/connect/status" className="hover:text-primary transition-colors">Live Status</Link>
          <Link href="/connect/help/guide" className="hover:text-primary transition-colors">User Guide</Link>
        </div>
      </section>
    </div>
  );
}
