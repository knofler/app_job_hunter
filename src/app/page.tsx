

"use client";

import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const FEATURES = [
  {
    icon: "🎯",
    title: "Project Workspaces",
    desc: "Group a JD with all its applicants. Run AI assessments, track every result, and compare across runs — all in one place.",
  },
  {
    icon: "🤖",
    title: "AI-Powered Ranking",
    desc: "Rank by skills, leadership, salary fit, or a custom prompt. The AI reads every resume and scores candidates against your criteria.",
  },
  {
    icon: "📊",
    title: "Multi-Run Reporting",
    desc: "Combine results from multiple assessments with weighted scoring. Generate board-ready reports in seconds.",
  },
  {
    icon: "✍️",
    title: "Assessment Generation",
    desc: "Auto-generate tailored interview assessments per candidate. Adjust by prompt and store results inside the project.",
  },
  {
    icon: "🔒",
    title: "Multi-Tenant & Secure",
    desc: "Each organisation gets its own isolated workspace. Auth0-backed SSO with role-based access control.",
  },
  {
    icon: "⚡",
    title: "Streaming Results",
    desc: "Watch AI analysis stream in real-time. No waiting for full page reloads — results appear as the model thinks.",
  },
];

const STATS = [
  { value: "10×", label: "Faster shortlisting" },
  { value: "95%", label: "Recruiter satisfaction" },
  { value: "100+", label: "Resumes per run" },
  { value: "6", label: "AI assessment types" },
];

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-emerald-400 flex items-center justify-center text-zinc-950 font-black text-sm">A</span>
          <span className="font-bold text-zinc-100 tracking-tight">AI Job Hunter</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/api/auth/login" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <Link href="/api/auth/login" className="text-sm font-semibold bg-emerald-400 text-zinc-950 px-4 py-1.5 rounded-lg hover:bg-emerald-300 transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI-powered recruitment platform
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.95] mb-6">
            Hire smarter.<br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Move faster.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload a job description, add applicants, and let AI rank, score, and report — so your team focuses on the humans worth meeting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/api/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-400 text-zinc-950 font-bold px-8 py-3.5 rounded-xl hover:bg-emerald-300 transition-all text-base shadow-lg shadow-emerald-500/20"
            >
              Start for free
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/recruiters/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-zinc-700 text-zinc-300 font-semibold px-8 py-3.5 rounded-xl hover:border-zinc-500 hover:text-zinc-100 transition-all text-base"
            >
              View demo
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 text-xs animate-bounce">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-zinc-800">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center py-10 px-6">
              <span className="text-4xl font-black text-emerald-400 tracking-tighter">{s.value}</span>
              <span className="text-sm text-zinc-500 mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-4">
            Everything your team needs to<br />
            <span className="text-zinc-500">hire without the noise.</span>
          </h2>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            One platform from job description to final offer. No spreadsheets, no guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all duration-300"
            >
              <div className="h-11 w-11 rounded-xl bg-zinc-800 group-hover:bg-emerald-500/10 flex items-center justify-center text-xl mb-4 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-bold text-zinc-100 mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden border-t border-zinc-800 py-28 px-6">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[800px] rounded-full bg-emerald-500/8 blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
            Ready to transform<br />how you hire?
          </h2>
          <p className="text-zinc-500 text-lg mb-10">
            Join forward-thinking teams using AI to find the right people, faster.
          </p>
          <Link
            href="/api/auth/login"
            className="inline-flex items-center gap-2 bg-emerald-400 text-zinc-950 font-bold px-10 py-4 rounded-xl hover:bg-emerald-300 transition-all text-lg shadow-xl shadow-emerald-500/20"
          >
            Get started free
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded bg-emerald-400 flex items-center justify-center text-zinc-950 font-black text-xs">A</span>
          <span>AI Job Hunter</span>
        </div>
        <span>© {new Date().getFullYear()} All rights reserved.</span>
      </footer>
    </div>
  );
}

