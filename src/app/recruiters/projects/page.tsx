"use client";

import Link from "next/link";

// Placeholder — full implementation coming in Sprint 3
export default function ProjectsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <svg className="h-10 w-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-foreground">Projects</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Project workspaces are coming soon. Each project groups a job description with all applicants,
        AI runs, combined reports, and candidate assessments in one place.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/recruiters/ai-workflow"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          AI Workflow (existing)
        </Link>
        <Link
          href="/recruiters/ranking"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Ranking (existing)
        </Link>
      </div>
    </div>
  );
}
