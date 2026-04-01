"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  jobRoles: number;
  candidates: number;
  companies: number;
  resumes: number;
  bugs: { total: number; open: number; deployed: number };
  features: { total: number; open: number; deployed: number };
}

interface JobRole {
  id: string;
  name: string;
  resume_count: number;
  run_count: number;
  created_at?: string;
}

interface BugReport {
  _id: string;
  title: string;
  severity: string;
  status: string;
  reporter_name?: string;
  created_at?: string;
}

interface FeatureRequest {
  _id: string;
  title: string;
  priority: string;
  status: string;
  reporter_name?: string;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatCard({ label, value, subtitle, icon, accent }: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-5">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-8 w-16 rounded bg-muted" />
        <div className="h-3 w-32 rounded bg-muted" />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobRole[]>([]);
  const [recentBugs, setRecentBugs] = useState<BugReport[]>([]);
  const [recentFeatures, setRecentFeatures] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      // Use Next.js proxy routes (not fetchFromApi) so admin token is injected server-side
      const fetchProxy = async <T,>(url: string): Promise<T | null> => {
        try {
          const res = await fetch(url, { cache: "no-store", credentials: "include" });
          if (!res.ok) return null;
          return await res.json() as T;
        } catch { return null; }
      };

      const [projectsRes, candidatesRes, companiesRes, bugsRes, featuresRes] = await Promise.all([
        fetchProxy<{ items?: JobRole[]; total?: number }>("/api/projects?org_id=global&page=1&page_size=5"),
        fetchProxy<{ items?: unknown[]; total?: number }>("/api/candidates?page=1&page_size=1"),
        fetchProxy<{ items?: unknown[]; total?: number }>("/api/companies?org_id=global"),
        fetchProxy<{ items?: BugReport[]; total?: number }>("/api/connect/bugs?limit=100"),
        fetchProxy<{ items?: FeatureRequest[]; total?: number }>("/api/connect/features?limit=100"),
      ]);

      const jobs = projectsRes?.items || [];
      const bugs = bugsRes?.items || [];
      const features = featuresRes?.items || [];

      const totalResumes = jobs.reduce((sum, j) => sum + (j.resume_count || 0), 0);

      setStats({
        jobRoles: projectsRes?.total ?? jobs.length,
        candidates: candidatesRes?.total ?? 0,
        companies: companiesRes?.total ?? companiesRes?.items?.length ?? 0,
        resumes: totalResumes,
        bugs: {
          total: bugsRes?.total ?? bugs.length,
          open: bugs.filter((b) => b.status === "reported" || b.status === "working").length,
          deployed: bugs.filter((b) => b.status === "deployed" || b.status === "closed").length,
        },
        features: {
          total: featuresRes?.total ?? features.length,
          open: features.filter((f) => f.status === "reported" || f.status === "working").length,
          deployed: features.filter((f) => f.status === "deployed" || f.status === "accepted").length,
        },
      });

      setRecentJobs(jobs.slice(0, 5));
      setRecentBugs(bugs.filter((b) => b.status === "reported").slice(0, 5));
      setRecentFeatures(features.filter((f) => f.status === "reported").slice(0, 5));
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your Job Hunter workspace.</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <button onClick={loadDashboardData} className="ml-2 underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                label="Job Roles"
                value={stats?.jobRoles ?? 0}
                subtitle={`${stats?.resumes ?? 0} resumes uploaded`}
                accent="bg-violet-500/10"
                icon={
                  <svg className="h-5 w-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                }
              />
              <StatCard
                label="Candidates"
                value={stats?.candidates ?? 0}
                subtitle="In the system"
                accent="bg-blue-500/10"
                icon={
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Companies"
                value={stats?.companies ?? 0}
                subtitle="Active companies"
                accent="bg-cyan-500/10"
                icon={
                  <svg className="h-5 w-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
              <StatCard
                label="Bug Reports"
                value={stats?.bugs.total ?? 0}
                subtitle={`${stats?.bugs.open ?? 0} open, ${stats?.bugs.deployed ?? 0} resolved`}
                accent="bg-orange-500/10"
                icon={
                  <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              />
              <StatCard
                label="Feature Requests"
                value={stats?.features.total ?? 0}
                subtitle={`${stats?.features.open ?? 0} open, ${stats?.features.deployed ?? 0} shipped`}
                accent="bg-emerald-500/10"
                icon={
                  <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
              />
            </>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Job Roles */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Job Roles</CardTitle>
                <Link href="/recruiters/projects" className="text-xs text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3">
                      <div className="h-4 w-48 rounded bg-muted" />
                      <div className="h-4 w-16 rounded bg-muted ml-auto" />
                    </div>
                  ))}
                </div>
              ) : recentJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No job roles created yet. <Link href="/recruiters/projects" className="text-primary hover:underline">Create one</Link></p>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{job.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.resume_count} resume{job.resume_count !== 1 ? "s" : ""} &middot; {job.run_count} analysis run{job.run_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {job.created_at && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-3">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/recruiters/projects">
                  <Button variant="primary" className="w-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Job Role
                  </Button>
                </Link>
                <Link href="/connect/bug">
                  <Button variant="outline" className="w-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Report a Bug
                  </Button>
                </Link>
                <Link href="/connect/feature">
                  <Button variant="ghost" className="w-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Request a Feature
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Open Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Open Bugs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  Open Bugs
                </CardTitle>
                <Link href="/connect/bug" className="text-xs text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </div>
              ) : recentBugs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 text-center">No open bugs</p>
              ) : (
                <div className="space-y-2">
                  {recentBugs.map((bug) => {
                    const sevColor: Record<string, string> = { critical: "text-red-400", high: "text-orange-400", medium: "text-yellow-400", low: "text-blue-400" };
                    return (
                      <Link key={bug._id} href="/connect/bug" className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors">
                        <span className="text-sm text-foreground truncate">{bug.title}</span>
                        <span className={`text-xs font-medium shrink-0 ml-2 ${sevColor[bug.severity] || "text-muted-foreground"}`}>
                          {bug.severity}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Features */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Open Feature Requests
                </CardTitle>
                <Link href="/connect/feature" className="text-xs text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </div>
              ) : recentFeatures.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 text-center">No open feature requests</p>
              ) : (
                <div className="space-y-2">
                  {recentFeatures.map((feat) => (
                    <Link key={feat._id} href="/connect/feature" className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors">
                      <span className="text-sm text-foreground truncate">{feat.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{feat.priority}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
