"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Guide sections
// ---------------------------------------------------------------------------

interface Section {
  id: string;
  title: string;
  icon: string;
  screenshot?: string;
  screenshotAlt?: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "rocket",
    content: (
      <div className="space-y-3 text-sm text-zinc-300">
        <p>Job Hunter helps recruiters screen candidates with AI-powered analysis and helps candidates find their best job matches.</p>
        <ol className="list-decimal list-inside space-y-2 text-zinc-400">
          <li><strong className="text-zinc-200">Choose your persona</strong> — use the top navigation to switch between Candidate and Recruiter views.</li>
          <li><strong className="text-zinc-200">Recruiter?</strong> Start by uploading a Job Description, then create a Job Role to begin screening.</li>
          <li><strong className="text-zinc-200">Candidate?</strong> Upload your resume, browse jobs, and apply to matches.</li>
        </ol>
      </div>
    ),
  },
  {
    id: "recruiter-workflow",
    title: "Recruiter Workflow",
    icon: "briefcase",
    content: (
      <div className="space-y-4 text-sm text-zinc-300">
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">1. Upload a Job Description</h4>
          <p className="text-zinc-400">Go to <strong>Job Roles</strong> and click <strong>New Job Role</strong>. Give it a name, optional dates, then attach a JD by searching existing ones or uploading a new PDF/DOCX.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">2. Add Resumes</h4>
          <p className="text-zinc-400">Open your Job Role and upload candidate resumes. Drag and drop multiple files at once.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">3. Run AI Workflow</h4>
          <p className="text-zinc-400">Navigate to <strong>AI Workflow</strong>, select your Job Role, and run the analysis. The AI will score candidates across skills, experience, and culture fit with real-time streaming results.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">4. Review Rankings</h4>
          <p className="text-zinc-400">Check the <strong>Ranking</strong> page for a ranked shortlist. Each candidate shows strengths, gaps, and a hiring recommendation.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">5. Deep Assessment</h4>
          <p className="text-zinc-400">For top candidates, use <strong>Deep Assess</strong> to get an executive summary, interview angles, and red flags.</p>
        </div>
      </div>
    ),
  },
  {
    id: "candidate-workflow",
    title: "Candidate Workflow",
    icon: "user",
    content: (
      <div className="space-y-4 text-sm text-zinc-300">
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">1. Upload Your Resume</h4>
          <p className="text-zinc-400">Go to <strong>My Resume</strong> to upload and manage your CVs. Set your primary resume for applications.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">2. Search Jobs</h4>
          <p className="text-zinc-400">Use <strong>Find Jobs</strong> to browse available positions. Filter by location, job type, experience level, and skills. Jobs are sorted by AI match score.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">3. Apply</h4>
          <p className="text-zinc-400">Apply directly from the job listing. Your resume is automatically attached.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">4. Track Applications</h4>
          <p className="text-zinc-400">Visit <strong>My Applications</strong> to track status: Applied → Shortlisted → Interview → Offered.</p>
        </div>
      </div>
    ),
  },
  {
    id: "connect-hub",
    title: "Connect Hub",
    icon: "chat",
    content: (
      <div className="space-y-4 text-sm text-zinc-300">
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">Bug Reports</h4>
          <p className="text-zinc-400">Found a problem? Go to <strong>Connect → Bug Reports</strong> and click <strong>Report a Bug</strong>. Add a title, description, severity, steps to reproduce, and optional screenshots. Enter your email to get notified when the status changes.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">Feature Requests</h4>
          <p className="text-zinc-400">Have an idea? Go to <strong>Connect → Feature Requests</strong> and submit your suggestion. Vote on other requests to help prioritise. You can edit or withdraw your requests while they&apos;re in &quot;Reported&quot; status.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">Status Tracking</h4>
          <p className="text-zinc-400">Every bug and feature moves through: <strong>Reported → Working → Solved → Deployed</strong>. Filter by status to see what&apos;s in progress. If you provided your email, you&apos;ll be notified at each step.</p>
        </div>
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "chart",
    content: (
      <div className="space-y-3 text-sm text-zinc-300">
        <p className="text-zinc-400">The Dashboard shows a live overview of your workspace:</p>
        <ul className="list-disc list-inside space-y-1 text-zinc-400">
          <li><strong className="text-zinc-200">Job Roles</strong> — total count and resumes uploaded</li>
          <li><strong className="text-zinc-200">Candidates</strong> — total in the system</li>
          <li><strong className="text-zinc-200">Bug Reports</strong> — open vs resolved</li>
          <li><strong className="text-zinc-200">Feature Requests</strong> — open vs shipped</li>
          <li><strong className="text-zinc-200">Recent Job Roles</strong> — quick access to your latest projects</li>
          <li><strong className="text-zinc-200">Open Items</strong> — bugs and features needing attention</li>
        </ul>
      </div>
    ),
  },
  {
    id: "settings",
    title: "Settings & Admin",
    icon: "cog",
    content: (
      <div className="space-y-4 text-sm text-zinc-300">
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">LLM Providers</h4>
          <p className="text-zinc-400">Configure which AI model powers the analysis. Set API keys, model selection, and parameters like temperature and max tokens.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">AI Prompts</h4>
          <p className="text-zinc-400">View and edit the system prompts used at each workflow step. Customise how the AI evaluates candidates.</p>
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100 mb-1">Dark / Light Mode</h4>
          <p className="text-zinc-400">Toggle the theme using the sun/moon icon in the top navigation bar.</p>
        </div>
      </div>
    ),
  },
  {
    id: "tips",
    title: "Tips & Best Practices",
    icon: "lightbulb",
    content: (
      <div className="space-y-2 text-sm text-zinc-400">
        <ul className="list-disc list-inside space-y-2">
          <li><strong className="text-zinc-200">Use clear JD titles</strong> — include the role and timeframe (e.g. &quot;Data Engineer – Q3 2025&quot;) so you can find them later.</li>
          <li><strong className="text-zinc-200">Upload PDFs when possible</strong> — they parse more reliably than DOCX files.</li>
          <li><strong className="text-zinc-200">Run multiple analysis types</strong> — skills match and leadership assessment give different perspectives on the same candidates.</li>
          <li><strong className="text-zinc-200">Use the sort/filter on bug reports</strong> — sort by &quot;Oldest&quot; to see long-standing issues first.</li>
          <li><strong className="text-zinc-200">Add your email on reports</strong> — you&apos;ll get notified when your bug is fixed or feature is shipped.</li>
        </ul>
      </div>
    ),
  },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  rocket: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
  ),
  briefcase: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  ),
  user: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  ),
  chat: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  ),
  chart: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
  ),
  cog: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ),
  lightbulb: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
  ),
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UserGuidePage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/connect" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          Connect Hub
        </Link>
        <span className="mx-2 text-zinc-600">/</span>
        <span className="text-sm text-zinc-300">User Guide</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Application User Guide</h1>
        <p className="mt-1 text-sm text-zinc-400">Everything you need to know about using Job Hunter</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-20 space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left ${
                  activeSection === section.id
                    ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                <span className={activeSection === section.id ? "text-violet-400" : "text-zinc-500"}>
                  {ICON_MAP[section.icon]}
                </span>
                {section.title}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {SECTIONS.map((section) => (
            <div
              key={section.id}
              className={activeSection === section.id ? "block" : "hidden"}
            >
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                    {ICON_MAP[section.icon]}
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-100">{section.title}</h2>
                </div>
                {section.screenshot && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-zinc-700">
                    <Image
                      src={section.screenshot}
                      alt={section.screenshotAlt || section.title}
                      width={1400}
                      height={900}
                      className="w-full h-auto"
                    />
                  </div>
                )}
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
