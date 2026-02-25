"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchFromApi } from "@/lib/api";

interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  resume_count: number;
  run_count: number;
  created_at?: string;
  status?: string;
}

interface SeedStatus {
  users?: number;
  jobs?: number;
  resumes?: number;
  projects?: number;
}

function MetricCard({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${accent ?? "bg-primary/10"}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [seedStatus, setSeedStatus] = useState<SeedStatus>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projRes, seedRes] = await Promise.all([
          fetchFromApi("/api/projects?org_id=global&page=1&page_size=20").catch(() => null),
          fetchFromApi("/api/admin/seed/status").catch(() => null),
        ]);
        if (projRes?.items) setProjects(projRes.items);
        else if (Array.isArray(projRes)) setProjects(projRes);
        if (seedRes) setSeedStatus(seedRes);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalResumes = projects.reduce((s, p) => s + (p.resume_count ?? 0), 0);
  const totalRuns = projects.reduce((s, p) => s + (p.run_count ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of your recruitment workspace</p>
        </div>
        <Link
          href="/recruiters/projects"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Active Projects" value={projects.length} icon="📁" accent="bg-primary/10" />
        <MetricCard label="Resumes Loaded" value={totalResumes || (seedStatus.resumes ?? 0)} icon="📄" accent="bg-indigo-500/10" />
        <MetricCard label="AI Runs" value={totalRuns} icon="⚡" accent="bg-amber-500/10" />
        <MetricCard label="Candidates Seeded" value={seedStatus.users ?? "—"} icon="👥" accent="bg-emerald-500/10" />
      </div>

      {/* Two-panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Projects list */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <h2 className="text-sm font-semibold text-foreground">Active Projects</h2>
            </div>
            <Link href="/recruiters/projects" className="text-xs text-primary hover:underline">View all →</Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState message="No projects yet. Create your first project to get started." />
          ) : (
            <div className="divide-y divide-border">
              {projects.slice(0, 8).map(p => (
                <Link key={p.id} href={`/recruiters/projects/${p.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.resume_count ?? 0} resumes · {p.run_count ?? 0} AI runs
                      </p>
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick actions + status */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/30">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
            </div>
            <div className="p-3 space-y-1.5">
              {[
                { label: "Create new project", href: "/recruiters/projects", icon: "📁" },
                { label: "Run AI assessment", href: "/recruiters/ai-workflow", icon: "⚡" },
                { label: "View rankings", href: "/recruiters/ranking", icon: "🏆" },
                { label: "Manage settings", href: "/settings", icon: "⚙️" },
              ].map(a => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-foreground"
                >
                  <span>{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* System status */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <h2 className="text-sm font-semibold text-foreground">Data Status</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "Candidates", value: seedStatus.users },
                { label: "Jobs", value: seedStatus.jobs },
                { label: "Resumes", value: seedStatus.resumes },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-mono text-foreground font-medium">{s.value ?? "—"}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <Link href="/settings/data" className="text-xs text-primary hover:underline">Manage seed data →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
