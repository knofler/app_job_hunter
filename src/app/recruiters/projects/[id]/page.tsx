"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import {
  addResumesToProject,
  deleteProject,
  getProject,
  getProjectContext,
  listReports,
  listRuns,
  removeResumeFromProject,
  setProjectContext,
  streamProjectRun,
  updateProject,
  type Project,
  type ProjectReport,
  type ProjectRun,
  type RankedCandidate,
  type StreamEvent,
  type ContextScore,
  type ContextDimension,
  type ContextConfig,
  scoreContext,
} from "@/lib/projects-api";
import { fetchFromApi } from "@/lib/api";

const DEFAULT_ORG = "global";

// ── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 90 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    score >= 75 ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
    score >= 60 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-rose-500/10 text-rose-400 border-rose-500/20";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {score}
    </span>
  );
}

// ── Shared PDF text cleaner ───────────────────────────────────────────────────
function cleanPdf(text: string): string[] {
  // Detect fragmented PDF extraction: word-per-line OR char-per-line artifact.
  // Both formats result in >70% of non-empty lines being ≤ 20 chars.
  const roughLines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const isFragmented =
    roughLines.length > 10 &&
    roughLines.filter(l => l.length <= 20).length / roughLines.length > 0.70;

  if (isFragmented) {
    const PARA = "\u2029"; // private-use paragraph separator placeholder

    // Fix 1: Drop-cap artifacts — 1–2 non-lowercase chars before a bare newline
    // that continues an uppercase word. e.g. "S\nOFTWARE" → "SOFTWARE", "(M\nICHAEL" → "(MICHAEL"
    text = text.replace(/^([^a-z\n ]{1,2})\n(?=[A-Z])/mg, "$1");

    // Fix 2: Lone closing punctuation on its own line — e.g. "MICHAEL\n)" → "MICHAEL)"
    text = text.replace(/^([)}\],:;])\n/mg, "$1");

    // Fix 3: Paragraph breaks (3+ newlines with optional spaces) → placeholder
    text = text.replace(/(\n[ \t]*){3,}/g, PARA);
    text = text.replace(/\n \n \n/g, PARA); // explicit triple-blank fallback

    // Fix 4: Word separators (single blank "\n \n") → space
    text = text.replace(/\n \n/g, " ");

    // Fix 5: Remaining bare newlines → space (joins char-level fragments)
    text = text.replace(/\n/g, " ");

    // Fix 6: Restore paragraph breaks
    text = text.replace(new RegExp(PARA, "g"), "\n");
  }

  return text
    .split("\n")
    .map(l => l.replace(/[ \t]{2,}/g, " ").replace(/[♂♀⚥⚨]/g, "").trimEnd())
    .filter(l => l.trim() !== "")
    .filter((l, i, arr) => !(l.trim() === "" && arr[i - 1]?.trim() === ""));
}

// ════════════════════════════════════════════════════════════════════════════
// JD FORMATTER — modern job-posting layout
// ════════════════════════════════════════════════════════════════════════════
const JD_SECTION_KEYWORDS = [
  "agency overview", "primary purpose", "key accountabilities",
  "key challenges", "key relationships", "role dimensions",
  "decision making", "essential requirements", "capabilities",
  "key knowledge", "knowledge and experience", "about the role",
  "responsibilities", "requirements", "qualifications",
  "what we offer", "about us", "the role", "your role",
  "additional information", "reporting line", "direct reports",
];

function isJdSection(line: string): boolean {
  const t = line.trim().toLowerCase().replace(/:$/, "");
  return JD_SECTION_KEYWORDS.some(s => t === s || t.startsWith(s));
}

type JdParsed = {
  title: string;
  org: string;
  meta: [string, string][];
  sections: Array<{ heading: string; bullets: string[]; paras: string[] }>;
};

function parseJd(raw: string, fallbackTitle?: string): JdParsed {
  const lines = cleanPdf(raw).filter(l =>
    !/^Role Description\s+.+\d+\s*$/.test(l.trim()) &&
    !/^Role Description\s*$/.test(l.trim()) &&
    !/^Role Description Fields/i.test(l.trim())
  );

  let title = fallbackTitle ?? "";
  let org = "";
  const meta: [string, string][] = [];
  const sections: JdParsed["sections"] = [];
  let inMeta = true;
  let cur: JdParsed["sections"][0] | null = null;
  let paraAccum: string[] = [];

  function flushPara() {
    if (paraAccum.length && cur) { cur.paras.push(paraAccum.join(" ")); paraAccum = []; }
    else if (paraAccum.length) { paraAccum = []; }
  }

  for (const line of lines) {
    const t = line.trim();
    if (!t) { flushPara(); continue; }

    if (isJdSection(t)) {
      flushPara();
      inMeta = false;
      cur = { heading: t.replace(/:$/, ""), bullets: [], paras: [] };
      sections.push(cur);
      continue;
    }

    if (t.startsWith("•") || t.startsWith("‣") || t.startsWith("-")) {
      flushPara();
      inMeta = false;
      if (!cur) { cur = { heading: "", bullets: [], paras: [] }; sections.push(cur); }
      cur.bullets.push(t.replace(/^[•‣-]\s*/, ""));
      continue;
    }

    // Metadata: "Field  Value" (two or more spaces separating key from value)
    if (inMeta) {
      const parts = line.split(/  +/);
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("  ").trim();
        if (!title && /^Data Engineer|^Software|^Senior|^Junior|^Lead|^Principal/i.test(val)) title = val;
        if (/department|agency/i.test(key)) org = val;
        meta.push([key, val]);
        continue;
      }
      // Short un-split line before metadata = likely the job title
      if (!title && t.length < 60 && !/^Role/.test(t)) { title = t; continue; }
    }

    if (cur) {
      if (cur.bullets.length === 0) paraAccum.push(t);
      else cur.bullets[cur.bullets.length - 1] += " " + t; // continuation of bullet
    }
  }
  flushPara();
  return { title: title || fallbackTitle || "Job Description", org, meta, sections };
}

function FormatJd({ text, jobTitle }: { text: string; jobTitle?: string }) {
  if (!text.trim()) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">No description available.</p>
    </div>
  );

  const { title, org, meta, sections } = parseJd(text, jobTitle);

  // Spotlight meta rows: cluster, department, classification, date
  const spotlightKeys = ["cluster", "department", "classification", "date of approval", "agency website"];
  const spotlightMeta = meta.filter(([k]) => spotlightKeys.some(s => k.toLowerCase().includes(s)));
  const detailMeta = meta.filter(([k]) => !spotlightKeys.some(s => k.toLowerCase().includes(s)));

  return (
    <div className="space-y-5">
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/70 mb-2">Position</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight leading-tight">{title}</h1>
        {org && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs text-primary font-medium">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              {org}
            </span>
          </div>
        )}
        {spotlightMeta.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {spotlightMeta.map(([k, v], i) => (
              <span key={i} className="text-[11px] text-muted-foreground">
                <span className="text-muted-foreground/50">{k}: </span>{v}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail metadata grid ── */}
      {detailMeta.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr] divide-y divide-border/30">
            {detailMeta.map(([k, v], i) => (
              <div key={i} className="contents">
                <div className="px-3 py-2 bg-muted/30 text-[11px] text-muted-foreground/60 font-medium">{k}</div>
                <div className="px-3 py-2 text-[11px] text-foreground">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sections ── */}
      {sections.map((sec, i) => (
        <div key={i} className="space-y-2">
          {sec.heading && (
            <div className="flex items-center gap-2">
              <span className="h-4 w-0.5 rounded-full bg-primary shrink-0" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                {sec.heading}
              </h3>
            </div>
          )}
          {sec.paras.map((p, j) => (
            <p key={j} className="text-sm text-muted-foreground leading-relaxed pl-3">{p}</p>
          ))}
          {sec.bullets.length > 0 && (
            <ul className="space-y-2 pl-3">
              {sec.bullets.map((item, j) => (
                <li key={j} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RESUME FORMATTER — modern resume template
// ════════════════════════════════════════════════════════════════════════════
const RESUME_SECTIONS = new Set([
  "education", "experience", "skills", "technical skills", "projects",
  "certifications", "certification", "summary", "objective",
  "work experience", "professional experience", "professional summary",
  "core competencies", "publications", "awards", "activities",
  "languages", "interests", "volunteering", "volunteer", "leadership",
  "references", "additional", "achievements", "key skills",
  "recent experience", "recent relevant experience", "relevant experience",
  "employment history", "career history", "work history",
  "personal statement", "profile", "about me", "contact",
]);

const DATE_RE = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{4}|\d{4}\s*[-–]\s*(?:\d{4}|Present|Current)/i;

type ResumeBlock =
  | { kind: "header"; name: string; contact: string }
  | { kind: "section"; text: string }
  | { kind: "entry"; org: string; date: string; subtitle: string[]; bullets: string[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "text"; text: string };

function parseResume(text: string): ResumeBlock[] {
  const lines = cleanPdf(text);
  const blocks: ResumeBlock[] = [];

  const stripIcons = (s: string) =>
    s.replace(/\/[a-zA-Z]+[^\s]*/g, "").replace(/\s+/g, " ").trim();

  let i = 0;
  // Skip blanks, grab name
  while (i < lines.length && !lines[i].trim()) i++;
  const rawName = stripIcons(lines[i] ?? ""); i++;
  // If name line is long (word-per-line PDF joined headline), extract just the name portion
  const JOB_TITLE_WORDS = new Set([
    "engineer", "developer", "manager", "analyst", "designer", "consultant",
    "specialist", "architect", "director", "lead", "senior", "junior", "head",
    "officer", "coordinator", "executive", "associate", "principal", "staff",
  ]);
  const nameParts = rawName.split(/\s+/);
  let nameEnd = nameParts.length;
  for (let j = 1; j < nameParts.length; j++) {
    if (JOB_TITLE_WORDS.has(nameParts[j].toLowerCase()) || /[|&@]/.test(nameParts[j])) {
      nameEnd = j; break;
    }
  }
  const name = nameParts.slice(0, nameEnd || Math.min(nameParts.length, 3)).join(" ");
  // Contact line
  let contact = "";
  if (i < lines.length) {
    const cl = stripIcons(lines[i]);
    if (cl.includes("@") || cl.includes("+") || /\d{7,}/.test(cl)) { contact = cl; i++; }
  }
  blocks.push({ kind: "header", name, contact });

  let curSection = "";
  let curEntry: Extract<ResumeBlock, { kind: "entry" }> | null = null;
  let pendingBullets: string[] = [];
  let pendingText: string[] = [];

  function flushBullets() {
    if (!pendingBullets.length) return;
    if (curEntry) { curEntry.bullets.push(...pendingBullets); pendingBullets = []; }
    else { blocks.push({ kind: "bullets", items: [...pendingBullets] }); pendingBullets = []; }
  }
  function flushText() {
    if (!pendingText.length) return;
    if (curEntry) { curEntry.subtitle.push(pendingText.join(" ")); pendingText = []; }
    else { blocks.push({ kind: "text", text: pendingText.join(" ") }); pendingText = []; }
  }
  function flushEntry() {
    if (curEntry) { blocks.push({ ...curEntry }); curEntry = null; }
  }

  for (; i < lines.length; i++) {
    const raw = lines[i];
    const t = stripIcons(raw);
    if (!t) { flushBullets(); flushText(); continue; }

    const lower = t.toLowerCase().replace(/:$/, "");

    if (RESUME_SECTIONS.has(lower)) {
      flushBullets(); flushText(); flushEntry();
      curSection = lower;
      blocks.push({ kind: "section", text: t.replace(/:$/, "") });
      continue;
    }

    // All-caps line = likely a section header (handles non-standard names & word-per-line PDFs)
    const isAllCapsHeader =
      t.length >= 3 && t.length <= 60 &&
      /^[A-Z][A-Z0-9 &/()–-]+$/.test(t) &&
      !/^\d/.test(t);
    if (isAllCapsHeader) {
      flushBullets(); flushText(); flushEntry();
      curSection = lower;
      blocks.push({ kind: "section", text: t.replace(/:$/, "") });
      continue;
    }

    if (t.startsWith("•") || t.startsWith("-") || t.startsWith("*") || t.startsWith("◆") || t.startsWith("⬥") || t.startsWith("●")) {
      flushText();
      const item = t.replace(/^[•*◆⬥●-]\s*/, "");
      if (curEntry) curEntry.bullets.push(item);
      else pendingBullets.push(item);
      continue;
    }

    // Entry line detection (company/institution with date)
    const inExpOrEdu = [
      "experience", "education", "work experience", "professional experience",
      "recent experience", "recent relevant experience", "relevant experience",
      "employment history", "career history", "work history",
    ].includes(curSection);
    const dateMatch = t.match(DATE_RE);
    if (inExpOrEdu && dateMatch) {
      flushBullets(); flushText(); flushEntry();
      const datePart = dateMatch[0];
      const orgPart = t.replace(datePart, "").replace(/\s+$/, "").trim();
      curEntry = { kind: "entry", org: orgPart, date: datePart, subtitle: [], bullets: [] };
      continue;
    }

    // Sub-line of an entry (role title, location, etc.)
    if (curEntry && !pendingBullets.length) { curEntry.subtitle.push(t); continue; }

    flushBullets(); flushText();
    pendingText.push(t);
  }
  flushBullets(); flushText(); flushEntry();
  return blocks;
}

const SECTION_ICONS: Record<string, string> = {
  education: "🎓", experience: "💼", "work experience": "💼",
  "professional experience": "💼", skills: "⚡", "technical skills": "⚡",
  "key skills": "⚡", projects: "🚀", certifications: "🏅",
  certification: "🏅", summary: "👤", "professional summary": "👤",
  achievements: "🌟", awards: "🌟", languages: "🌐",
};

function FormatResume({ text }: { text: string }) {
  if (!text.trim()) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-muted-foreground">No content available.</p>
    </div>
  );
  const blocks = parseResume(text);

  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.kind === "header") return (
          <div key={i} className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{b.name || "—"}</h1>
              {b.contact && (
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{b.contact}</p>
              )}
            </div>
          </div>
        );

        if (b.kind === "section") {
          const icon = SECTION_ICONS[b.text.toLowerCase()] ?? "◆";
          return (
            <div key={i} className="flex items-center gap-2 pt-1">
              <span className="text-sm">{icon}</span>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary flex-1">{b.text}</h3>
              <span className="h-px flex-1 bg-border/50" />
            </div>
          );
        }

        if (b.kind === "entry") return (
          <div key={i} className="group rounded-xl border border-border/40 bg-card/50 hover:border-primary/20 hover:bg-card transition-colors p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold text-foreground leading-snug">{b.org}</span>
              {b.date && (
                <span className="shrink-0 rounded-full bg-primary/8 border border-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary/80">
                  {b.date}
                </span>
              )}
            </div>
            {b.subtitle.map((s, j) => (
              <p key={j} className="text-xs text-muted-foreground italic">{s}</p>
            ))}
            {b.bullets.length > 0 && (
              <ul className="space-y-1.5 pt-0.5">
                {b.bullets.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-2 h-1 w-1 rounded-full bg-primary/50 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

        if (b.kind === "bullets") return (
          <ul key={i} className="space-y-1.5">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-2.5 text-sm text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        );

        if (b.kind === "text") return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">{b.text}</p>
        );
        return null;
      })}
    </div>
  );
}

// ── Run Modal ────────────────────────────────────────────────────────────────
const RUN_TYPES = [
  { value: "top_n", label: "Top N Candidates", icon: "🏆", description: "Rank best overall candidates" },
  { value: "leadership", label: "Leadership Fit", icon: "👔", description: "Assess leadership qualities" },
  { value: "skill_based", label: "Skill Match", icon: "🔧", description: "Rank by specific skill set" },
  { value: "specific_skill", label: "Single Skill", icon: "🎯", description: "Focus on one key skill" },
  { value: "custom_prompt", label: "Custom Prompt", icon: "✏️", description: "Your own assessment criteria" },
  { value: "salary_fit", label: "Salary Fit", icon: "💰", description: "Match within salary budget" },
];

function NewRunModal({
  projectId,
  onClose,
  onComplete,
}: {
  projectId: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [runType, setRunType] = useState("top_n");
  const [topN, setTopN] = useState(5);
  const [customPrompt, setCustomPrompt] = useState("");
  const [specificSkill, setSpecificSkill] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events]);

  async function handleRun() {
    setIsStreaming(true);
    setEvents([]);
    const params: Record<string, unknown> = { top_n: topN };
    if (runType === "custom_prompt") params.custom_prompt = customPrompt;
    if (runType === "specific_skill") params.specific_skill = specificSkill;
    if (runType === "salary_fit") params.max_salary = maxSalary;
    try {
      await streamProjectRun(projectId, runType, params, DEFAULT_ORG, (ev) => {
        setEvents((prev) => [...prev, ev]);
      });
    } finally {
      setIsStreaming(false);
      // Auto-close after 1.5s so user can read the summary
      setTimeout(() => { onComplete(); onClose(); }, 1500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-bold text-foreground">New AI Assessment Run</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>

        {!isStreaming && events.length === 0 ? (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {RUN_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => setRunType(rt.value)}
                  className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition ${
                    runType === rt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-lg shrink-0">{rt.icon}</span>
                  <div>
                    <p className={`text-xs font-semibold ${runType === rt.value ? "text-primary" : "text-foreground"}`}>{rt.label}</p>
                    <p className="text-xs text-muted-foreground">{rt.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Top N candidates
                <input type="number" min={1} max={20} value={topN} onChange={e => setTopN(Number(e.target.value))}
                  className="input h-9 w-24 text-sm" />
              </label>
              {runType === "custom_prompt" && (
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                  Assessment prompt
                  <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={3}
                    className="input h-auto resize-none text-sm" placeholder="Describe your assessment criteria…" />
                </label>
              )}
              {runType === "specific_skill" && (
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                  Skill to focus on
                  <input value={specificSkill} onChange={e => setSpecificSkill(e.target.value)}
                    className="input h-9 text-sm" placeholder="e.g. Python, SQL, leadership" />
                </label>
              )}
              {runType === "salary_fit" && (
                <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                  Max salary budget
                  <input value={maxSalary} onChange={e => setMaxSalary(e.target.value)}
                    className="input h-9 text-sm" placeholder="e.g. $120,000" />
                </label>
              )}
            </div>

            <button onClick={handleRun}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Run
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Step progress */}
            <div className="space-y-2">
              {[
                { step: "loading",          label: "Loading resumes",           icon: "📂" },
                { step: "core_skills",      label: "Extracting core skills",    icon: "🔍" },
                { step: "ai_analysis",      label: "AI-powered analysis",       icon: "🤖" },
                { step: "ranked_shortlist", label: "Ranking candidates",        icon: "🏆" },
                { step: "detailed_readout", label: "Detailed readouts",         icon: "📋" },
                { step: "engagement_plan",  label: "Engagement plan",           icon: "🤝" },
                { step: "fairness_guidance",label: "Fairness guidance",         icon: "⚖️" },
              ].map(({ step, label, icon }) => {
                const statusEv = events.find(e => e.type === "status" && e.step === step);
                const resultEv = events.find(e => e.type === "result" && e.step === step);
                const errorEv  = events.find(e => e.type === "error"  && e.step === step);
                const isActive = !!statusEv && !resultEv && !errorEv;
                const isDone   = !!resultEv;
                const isError  = !!errorEv;
                const isPending = !statusEv && !resultEv && !errorEv;
                return (
                  <div key={step} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 ${
                    isActive ? "bg-primary/10 border border-primary/20" :
                    isDone   ? "bg-emerald-500/5 border border-emerald-500/15" :
                    isError  ? "bg-rose-500/5 border border-rose-500/15" :
                               "border border-transparent opacity-40"
                  }`}>
                    <span className="text-base shrink-0 w-6 text-center">
                      {isDone  ? "✅" :
                       isError ? "❌" :
                       isActive ? <span className="inline-block animate-spin text-primary">⟳</span> :
                       icon}
                    </span>
                    <span className={`text-xs font-medium flex-1 ${
                      isActive ? "text-primary" :
                      isDone   ? "text-emerald-400" :
                      isError  ? "text-rose-400" :
                                 "text-muted-foreground"
                    }`}>{label}</span>
                    {isActive && (
                      <span className="flex gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                      </span>
                    )}
                    {isError && <span className="text-xs text-rose-400 truncate max-w-[120px]">{(errorEv as { type: "error"; step: string; message: string } | undefined)?.message?.slice(0, 40)}</span>}
                  </div>
                );
              })}
            </div>
            {/* Overall status */}
            <div className="text-center text-xs text-muted-foreground border-t border-border pt-3">
              {isStreaming
                ? <span className="animate-pulse text-primary font-medium">AI is analysing your candidates…</span>
                : events.some(e => e.type === "complete")
                  ? <span className="text-emerald-400 font-semibold">✓ Analysis complete</span>
                  : <span className="text-rose-400">Analysis ended with errors</span>}
            </div>
            {!isStreaming && (
              <button onClick={() => { onComplete(); onClose(); }}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Resume Picker Modal ───────────────────────────────────────────────────────
function ResumePickerModal({
  projectResumeIds,
  onAdd,
  onClose,
}: {
  projectResumeIds: string[];
  onAdd: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"search" | "upload">("search");

  // ── Search tab state ──
  const [search, setSearch] = useState("");
  const [allResumes, setAllResumes] = useState<Array<{ id: string; name: string; candidate_name: string; summary?: string }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingList, setLoadingList] = useState(true);

  // ── Upload tab state ──
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetchFromApi(`/api/recruiter-ranking/resumes?org_id=${DEFAULT_ORG}&limit=100`)
      .then((d) => setAllResumes((d as { items?: typeof allResumes })?.items ?? []))
      .catch(() => setAllResumes([]))
      .finally(() => setLoadingList(false));
  }, []);

  const filtered = allResumes.filter(r =>
    !projectResumeIds.includes(r.id) &&
    (r.name.toLowerCase().includes(search.toLowerCase()) ||
     (r.candidate_name ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setUploadError("");
    const newIds: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${f.name}`);
        const formData = new FormData();
        formData.append("file", f);
        formData.append("user_id", f.name.replace(/\.[^.]+$/, ""));
        formData.append("resume_type", "applicant");
        formData.append("org_id", DEFAULT_ORG);
        const res = await fetch("/api/resumes", { method: "POST", body: formData });
        if (!res.ok) throw new Error(`Upload failed for ${f.name}: ${res.statusText}`);
        const data = await res.json();
        const newId: string = data.id ?? data._id ?? data.resume_id ?? "";
        if (newId) newIds.push(newId);
      }
      if (newIds.length > 0) {
        onAdd(newIds);
        onClose();
      } else {
        throw new Error("No resume IDs returned");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setUploadProgress("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-bold text-foreground">Add Resumes to Project</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["search", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                tab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t === "search" ? "Search Existing" : "Upload New"}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tab === "search" ? (
            <>
              <input
                type="text" placeholder="Search candidates…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="input h-9 text-sm w-full"
              />
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {loadingList && <p className="text-xs text-muted-foreground py-4 text-center">Loading resumes…</p>}
                {!loadingList && filtered.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No resumes found</p>}
                {filtered.map(r => (
                  <label key={r.id} className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition ${
                    selected.has(r.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}>
                    <input type="checkbox" checked={selected.has(r.id)}
                      onChange={e => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(r.id); else next.delete(r.id);
                        setSelected(next);
                      }}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.candidate_name}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button
                disabled={selected.size === 0}
                onClick={() => { onAdd(Array.from(selected)); onClose(); }}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Add {selected.size > 0 ? `${selected.size} resume${selected.size > 1 ? "s" : ""}` : "Resumes"}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Resume Files (select multiple)</label>
                <label className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
                  files.length > 0 ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}>
                  <input type="file" accept=".pdf,.doc,.docx" multiple className="hidden"
                    onChange={e => { setFiles(Array.from(e.target.files ?? [])); setUploadError(""); }} />
                  <svg className={`h-8 w-8 ${files.length > 0 ? "text-primary" : "text-muted-foreground"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {files.length > 0 ? (
                    <div className="text-center">
                      <p className="text-xs font-medium text-primary">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{files.map(f => f.name).join(", ")}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground text-center">Click to browse (select multiple)<br /><span className="text-zinc-600">PDF, DOC, DOCX</span></span>
                  )}
                </label>
              </div>
              {uploadProgress && <p className="text-xs text-primary">{uploadProgress}</p>}
              {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}
              <button
                disabled={files.length === 0 || uploading}
                onClick={handleUpload}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
              >
                {uploading && <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                {uploading ? (uploadProgress || "Uploading…") : `Upload ${files.length > 0 ? files.length + " File" + (files.length > 1 ? "s" : "") : ""} & Add`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<ProjectRun[]>([]);
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [context, setContextText] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [contextSaving, setContextSaving] = useState(false);
  const [customDimText, setCustomDimText] = useState<Record<string, string>>({});
  const [expandedCoreDims, setExpandedCoreDims] = useState<string[]>([]);
  const [dimWeights, setDimWeights] = useState<Record<string, number>>({});
  const [resumeNames, setResumeNames] = useState<Record<string, string>>({});
  const [resumeDetails, setResumeDetails] = useState<Record<string, { name: string; preview: string; summary: string; skills: string[] }>>({});
  const [contextScore, setContextScore] = useState<ContextScore | null>(null);
  const [selectedContextKeys, setSelectedContextKeys] = useState<string[]>([]);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<ProjectRun | null>(null);
  const [rightPanel, setRightPanel] = useState<"run" | "resume" | "jd">("run");
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [previewJd, setPreviewJd] = useState<{ id: string; title: string; description: string } | null>(null);
  const [jdLoading, setJdLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"runs" | "context" | "resumes">("resumes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRunModal, setShowRunModal] = useState(false);
  const [showResumePicker, setShowResumePicker] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const router = useRouter();

  async function handleDeleteProject() {
    if (!project) return;
    setDeleting(true);
    try {
      await deleteProject(projectId);
      router.push("/recruiters/projects");
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const fetchAll = useCallback(async () => {
    try {
      const [proj, runList, reportList, ctx] = await Promise.all([
        getProject(projectId),
        listRuns(projectId),
        listReports(projectId),
        getProjectContext(projectId).catch(() => ({ context: "", context_config: null })),
      ]);
      setProject(proj);
      setRuns(runList);
      setReports(reportList);
      setContextText(ctx.context ?? "");
      // Restore saved context_config
      if (ctx.context_config) {
        setSelectedContextKeys(ctx.context_config.enhancements ?? []);
        setCustomContext(ctx.context_config.custom ?? "");
        if (ctx.context_config.dim_overrides) setCustomDimText(ctx.context_config.dim_overrides);
        if (ctx.context_config.dim_weights) setDimWeights(ctx.context_config.dim_weights);
      } else if (ctx.context) {
        setCustomContext(ctx.context);
      }
      if (runList.length > 0 && !selectedRun) setSelectedRun(runList[0]);

      if (proj.resume_ids?.length > 0) {
        fetch(`/api/recruiter-ranking/resumes?org_id=global&limit=200`)
          .then(r => r.ok ? r.json() : { items: [] })
          .then((d: { items?: Array<{ id: string; name: string; preview?: string; summary?: string; skills?: string[] }> }) => {
            const names: Record<string, string> = {};
            const details: Record<string, { name: string; preview: string; summary: string; skills: string[] }> = {};
            (d.items ?? []).forEach(r => {
              names[r.id] = r.name;
              details[r.id] = { name: r.name, preview: r.preview ?? "", summary: r.summary ?? "", skills: r.skills ?? [] };
            });
            setResumeNames(names);
            setResumeDetails(details);
          })
          .catch(() => {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedRun]);

  // Fetch context scores when context tab becomes active or selected keys change
  const fetchContextScore = useCallback(async (keys: string[]) => {
    setScoringLoading(true);
    try {
      const result = await scoreContext(projectId, keys);
      setContextScore(result);
    } catch { /* silent */ }
    finally { setScoringLoading(false); }
  }, [projectId]);

  useEffect(() => {
    if (activeTab === "context") fetchContextScore(selectedContextKeys);
  }, [activeTab, selectedContextKeys, fetchContextScore]);

  useEffect(() => { fetchAll(); }, [projectId]); // eslint-disable-line

  async function handleAddResumes(ids: string[]) {
    try {
      await addResumesToProject(projectId, ids);
      fetchAll(); // refresh project + resume names
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add resumes");
    }
  }

  async function handleRemoveResume(resumeId: string) {
    try {
      const updated = await removeResumeFromProject(projectId, resumeId);
      setProject(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove resume");
    }
  }

  async function handleSaveContext() {
    setContextSaving(true);
    try {
      // Compile context text from selected dimensions + custom text
      const coreDims = contextScore?.dimensions.filter(d => d.core) ?? [];
      const selectedEnhDims = contextScore?.dimensions.filter(d => !d.core && selectedContextKeys.includes(d.key)) ?? [];
      const allActive = [...coreDims, ...selectedEnhDims];

      const WEIGHT_LABELS: Record<number, string> = { 1: "low", 2: "below normal", 3: "normal", 4: "high", 5: "critical" };

      let compiled = "";
      if (allActive.length > 0) {
        compiled += "Assessment criteria:\n";
        allActive.forEach(d => {
          const w = dimWeights[d.key] ?? 3;
          const wLabel = WEIGHT_LABELS[w] ?? "normal";
          compiled += `- ${d.label} (importance: ${wLabel}): ${d.description}\n`;
          const override = customDimText[d.key]?.trim();
          if (override) compiled += `  (Custom note: ${override})\n`;
        });
      }
      if (customContext.trim()) {
        compiled += (compiled ? "\nAdditional context:\n" : "") + customContext.trim();
      }

      const nonDefaultWeights = Object.fromEntries(Object.entries(dimWeights).filter(([, v]) => v !== 3));
      const config: ContextConfig = {
        enhancements: selectedContextKeys,
        custom: customContext,
        dim_overrides: Object.keys(customDimText).length > 0 ? customDimText : undefined,
        dim_weights: Object.keys(nonDefaultWeights).length > 0 ? nonDefaultWeights : undefined,
      };
      const result = await setProjectContext(projectId, compiled, config);
      setContextText(result.context);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save context");
    } finally {
      setContextSaving(false);
    }
  }

  async function handlePreviewResume(rid: string) {
    setPreviewResumeId(rid);
    setSelectedRun(null);
    setRightPanel("resume");
    // Fetch fresh resume data on demand
    if (!resumeDetails[rid]?.preview) {
      setResumeLoading(true);
      try {
        const res = await fetch(`/api/resumes/${rid}`);
        if (res.ok) {
          const data = await res.json();
          const r = data.resume ?? data;
          setResumeDetails(prev => ({
            ...prev,
            [rid]: {
              name: r.candidate_name ?? r.name ?? resumeNames[rid] ?? "",
              preview: r.preview ?? r.content ?? r.extracted_text ?? "",
              summary: r.summary ?? "",
              skills: Array.isArray(r.skills) ? r.skills : [],
            },
          }));
        }
      } catch { /* silent */ }
      finally { setResumeLoading(false); }
    }
  }

  async function handlePreviewJd(jobId: string) {
    if (previewJd?.id === jobId) { setRightPanel("jd"); return; }
    setJdLoading(true);
    setRightPanel("jd");
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      const job = data.job ?? data;
      setPreviewJd({ id: jobId, title: job.title ?? "Job Description", description: job.description || job.jd_content || "" });
    } catch { /* silent */ }
    finally { setJdLoading(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  if (error || !project) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="text-rose-400">{error || "Project not found"}</p>
      <Link href="/recruiters/projects" className="mt-4 text-sm text-primary hover:underline">← Back to Projects</Link>
    </div>
  );

  return (
    <>
      {showRunModal && (
        <NewRunModal
          projectId={projectId}
          onClose={() => setShowRunModal(false)}
          onComplete={async () => {
            setShowRunModal(false);
            setPreviewResumeId(null);
            setRightPanel("run");
            setActiveTab("runs");
            // Refresh and auto-select the newest run
            try {
              const [proj, runList] = await Promise.all([getProject(projectId), listRuns(projectId)]);
              setProject(proj);
              setRuns(runList);
              if (runList.length > 0) setSelectedRun(runList[0]);
              // Also refresh reports
              listReports(projectId).then(setReports).catch(() => {});
            } catch { /* silent */ }
          }}
        />
      )}
      {showResumePicker && (
        <ResumePickerModal
          projectResumeIds={project.resume_ids}
          onAdd={handleAddResumes}
          onClose={() => setShowResumePicker(false)}
        />
      )}

      <div className="flex h-full relative" style={{ height: "calc(100vh - 56px)" }}>

        {/* ── Mobile overlay backdrop ── */}
        {leftPanelOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/60"
            onClick={() => setLeftPanelOpen(false)}
          />
        )}

        {/* ── LEFT: Project Info ── */}
        <aside className={`
          z-40 flex flex-col overflow-hidden border-r border-border bg-card
          md:w-64 md:shrink-0 md:static md:flex
          ${leftPanelOpen
            ? "fixed inset-y-0 left-0 w-64 flex"
            : "hidden md:flex"
          }
        `} style={{ top: 56 }}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-border">
            <Link href="/recruiters/projects" className="text-xs text-muted-foreground hover:text-primary mb-2 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Projects
            </Link>
            <h1 className="text-sm font-bold text-foreground leading-tight mt-1">{project.name}</h1>
            {project.description && <p className="text-xs text-muted-foreground mt-1">{project.description}</p>}

            {/* JD Banner */}
            {project.job_id ? (
              <button
                onClick={() => handlePreviewJd(project.job_id!)}
                className={`mt-2 w-full flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors ${
                  rightPanel === "jd" ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-border bg-muted/30 text-muted-foreground hover:border-blue-500/30 hover:text-foreground"
                }`}
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs truncate">{previewJd?.title ?? "View Job Description"}</span>
              </button>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground italic">No JD linked</p>
            )}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-400 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete project
              </button>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-rose-400">Are you sure?</span>
                <button
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-border shrink-0">
            {(["resumes", "runs", "context"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "resumes" ? `Resumes (${project.resume_ids.length})` :
                 tab === "runs" ? `Runs (${runs.length})` : "Context"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* RESUMES TAB */}
            {activeTab === "resumes" && (
              <div className="p-3 space-y-2">
                <button onClick={() => setShowResumePicker(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 py-2 text-xs text-primary hover:bg-primary/5 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Resumes
                </button>
                {project.resume_ids.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">No resumes attached.</p>
                    <p className="text-xs text-muted-foreground mt-1">Add resumes to run AI assessments.</p>
                  </div>
                ) : (
                  project.resume_ids.map((rid) => (
                    <div key={rid} className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      rightPanel === "resume" && previewResumeId === rid ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30 hover:border-primary/30 hover:bg-muted/50"
                    }`}
                      onClick={() => handlePreviewResume(rid)}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {resumeNames[rid] ?? `Resume …${rid.slice(-6)}`}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{rid.slice(-8)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveResume(rid); }}
                        className="text-xs text-muted-foreground hover:text-rose-400 ml-2 shrink-0">✕</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* RUNS TAB */}
            {activeTab === "runs" && (
              <div className="p-3 space-y-2">
                {runs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">No runs yet.</p>
                  </div>
                ) : (
                  runs.map(run => (
                    <button key={run.id} onClick={() => { setSelectedRun(run); setRightPanel("run"); setPreviewResumeId(null); }}
                      className={`w-full text-left rounded-lg border px-3 py-2.5 transition ${
                        selectedRun?.id === run.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <p className="text-xs font-semibold text-foreground">{run.run_label || run.run_type}</p>
                      <p className="text-xs text-muted-foreground">{run.ranked?.length ?? 0} candidates · {new Date(run.created_at).toLocaleDateString()}{run.duration_seconds != null ? ` · ${run.duration_seconds}s` : ""}</p>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* CONTEXT TAB */}
            {activeTab === "context" && (
              <div className="p-3 space-y-3">
                {/* Header */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-0.5">Assessment Context</p>
                  <p className="text-xs text-muted-foreground">
                    Context dimensions improve AI analysis quality. Select what matters for this role.
                  </p>
                </div>

                {scoringLoading && !contextScore && (
                  <div className="flex items-center gap-2 py-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs text-muted-foreground">Analysing JD & resumes…</span>
                  </div>
                )}

                {contextScore && (() => {
                  const coreDims = contextScore.dimensions.filter(d => d.core);
                  const enhDims = contextScore.dimensions.filter(d => !d.core);
                  const allEnhKeys = enhDims.map(d => d.key);
                  const allSelected = allEnhKeys.every(k => selectedContextKeys.includes(k));
                  const coreGain = coreDims.reduce((s, d) => s + d.predicted_improvement, 0);

                  function toggleKey(key: string) {
                    setSelectedContextKeys(prev =>
                      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                    );
                  }

                  return (
                    <>
                      {/* CORE section */}
                      <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground">Core — always applied</p>
                          <span className="text-xs font-semibold text-emerald-400">+{coreGain.toFixed(0)}%</span>
                        </div>
                        <div className="space-y-1.5">
                          {coreDims.map(d => {
                            const expanded = expandedCoreDims.includes(d.key);
                            return (
                              <div key={d.key} className="rounded-md border border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
                                <button
                                  onClick={() => setExpandedCoreDims(prev => expanded ? prev.filter(k => k !== d.key) : [...prev, d.key])}
                                  className="w-full flex items-center justify-between px-2 py-1.5 text-left"
                                >
                                  <div>
                                    <p className="text-xs font-medium text-emerald-400 leading-tight">✓ {d.label}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">+{d.predicted_improvement.toFixed(0)}%</p>
                                  </div>
                                  <span className="text-[10px] text-emerald-400/60 ml-2">{expanded ? "▲" : "▼"}</span>
                                </button>
                                {expanded && (
                                  <div className="px-2 pb-2 space-y-2 border-t border-emerald-500/20 pt-2">
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">{d.description}</p>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground/60 w-20 shrink-0">JD relevance</span>
                                        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                                          <div className="h-full rounded-full bg-emerald-500/70 transition-all" style={{ width: `${(d.jd_relevance * 100).toFixed(0)}%` }} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{(d.jd_relevance * 100).toFixed(0)}%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground/60 w-20 shrink-0">Coverage</span>
                                        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                                          <div className="h-full rounded-full bg-emerald-500/70 transition-all" style={{ width: `${(d.coverage * 100).toFixed(0)}%` }} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{(d.coverage * 100).toFixed(0)}%</span>
                                      </div>
                                    </div>
                                    {/* Weight slider */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground/60">AI weight</span>
                                        <span className={`text-[10px] font-medium ${
                                          (dimWeights[d.key] ?? 3) >= 5 ? "text-rose-400" :
                                          (dimWeights[d.key] ?? 3) >= 4 ? "text-amber-400" :
                                          (dimWeights[d.key] ?? 3) <= 1 ? "text-muted-foreground/50" :
                                          (dimWeights[d.key] ?? 3) <= 2 ? "text-muted-foreground" :
                                          "text-emerald-400"
                                        }`}>
                                          {["","Low","Below normal","Normal","High","Critical"][dimWeights[d.key] ?? 3]}
                                        </span>
                                      </div>
                                      <input
                                        type="range" min={1} max={5} step={1}
                                        value={dimWeights[d.key] ?? 3}
                                        onChange={e => setDimWeights(prev => ({ ...prev, [d.key]: Number(e.target.value) }))}
                                        className="w-full h-1.5 accent-emerald-500 cursor-pointer"
                                      />
                                      <div className="flex justify-between text-[9px] text-muted-foreground/40">
                                        <span>Low</span><span>Normal</span><span>Critical</span>
                                      </div>
                                    </div>
                                    <textarea
                                      value={customDimText[d.key] ?? ""}
                                      onChange={e => setCustomDimText(prev => ({ ...prev, [d.key]: e.target.value }))}
                                      rows={2}
                                      placeholder="Add custom notes for this dimension (optional)"
                                      className="input h-auto resize-none text-[10px] w-full mt-1"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Enhancement pills */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground">Add more context</p>
                          <button
                            onClick={() => setSelectedContextKeys(allSelected ? [] : allEnhKeys)}
                            className="text-[10px] text-primary hover:underline font-medium"
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {enhDims.map(d => {
                            const on = selectedContextKeys.includes(d.key);
                            return (
                              <div key={d.key} className={`rounded-md border overflow-hidden transition-colors ${
                                on
                                  ? "border-primary/40 bg-primary/10"
                                  : "border-border bg-background"
                              }`}>
                                <button
                                  onClick={() => toggleKey(d.key)}
                                  className="w-full flex items-center justify-between px-2 py-1.5 text-left"
                                >
                                  <div>
                                    <p className={`text-xs font-medium leading-tight ${on ? "text-primary" : "text-muted-foreground"}`}>
                                      {on ? "✓" : "+"} {d.label}
                                    </p>
                                    <p className="text-[10px] mt-0.5 opacity-70">+{d.predicted_improvement.toFixed(0)}% predicted</p>
                                  </div>
                                  {on && <span className="text-[10px] text-primary/60 ml-2">▼</span>}
                                </button>
                                {on && (
                                  <div className="px-2 pb-2 space-y-2 border-t border-primary/20 pt-2">
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">{d.description}</p>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground/60 w-20 shrink-0">JD relevance</span>
                                        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                                          <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${(d.jd_relevance * 100).toFixed(0)}%` }} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{(d.jd_relevance * 100).toFixed(0)}%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground/60 w-20 shrink-0">Coverage</span>
                                        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                                          <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${(d.coverage * 100).toFixed(0)}%` }} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{(d.coverage * 100).toFixed(0)}%</span>
                                      </div>
                                    </div>
                                    {/* Weight slider */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground/60">AI weight</span>
                                        <span className={`text-[10px] font-medium ${
                                          (dimWeights[d.key] ?? 3) >= 5 ? "text-rose-400" :
                                          (dimWeights[d.key] ?? 3) >= 4 ? "text-amber-400" :
                                          (dimWeights[d.key] ?? 3) <= 1 ? "text-muted-foreground/50" :
                                          (dimWeights[d.key] ?? 3) <= 2 ? "text-muted-foreground" :
                                          "text-primary"
                                        }`}>
                                          {["","Low","Below normal","Normal","High","Critical"][dimWeights[d.key] ?? 3]}
                                        </span>
                                      </div>
                                      <input
                                        type="range" min={1} max={5} step={1}
                                        value={dimWeights[d.key] ?? 3}
                                        onChange={e => setDimWeights(prev => ({ ...prev, [d.key]: Number(e.target.value) }))}
                                        className="w-full h-1.5 accent-primary cursor-pointer"
                                      />
                                      <div className="flex justify-between text-[9px] text-muted-foreground/40">
                                        <span>Low</span><span>Normal</span><span>Critical</span>
                                      </div>
                                    </div>
                                    <textarea
                                      value={customDimText[d.key] ?? ""}
                                      onChange={e => setCustomDimText(prev => ({ ...prev, [d.key]: e.target.value }))}
                                      rows={2}
                                      placeholder="Add custom notes for this dimension (optional)"
                                      className="input h-auto resize-none text-[10px] w-full mt-1"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stack Score bar */}
                      <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground">Context Stack Score</p>
                          <span className={`text-xs font-bold ${
                            contextScore.stack_score >= 80 ? "text-emerald-400" :
                            contextScore.stack_score >= 70 ? "text-blue-400" : "text-amber-400"
                          }`}>{contextScore.stack_score.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              contextScore.stack_score >= 80 ? "bg-emerald-500" :
                              contextScore.stack_score >= 70 ? "bg-blue-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${contextScore.stack_score}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          baseline {contextScore.baseline}% → core {(contextScore.baseline + coreGain).toFixed(0)}% → selected {contextScore.stack_score.toFixed(0)}% signal quality
                        </p>
                        {!contextScore.jd_found && (
                          <p className="text-[10px] text-amber-400">⚠ No JD linked — scores estimated without JD analysis</p>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* Custom context textarea */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">Custom context</p>
                  <p className="text-[10px] text-muted-foreground">Any additional criteria not covered above</p>
                  <textarea
                    value={customContext}
                    onChange={e => setCustomContext(e.target.value)}
                    rows={5}
                    className="input h-auto resize-none text-xs w-full"
                    placeholder={`e.g. Must have 5+ years experience, open to relocation, prefer AWS over GCP`}
                  />
                </div>

                {/* Save / Clear */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveContext}
                    disabled={contextSaving}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    {contextSaving ? "Saving…" : "Save Context"}
                  </button>
                  {(selectedContextKeys.length > 0 || customContext || Object.keys(customDimText).length > 0) && (
                    <button
                      onClick={() => { setSelectedContextKeys([]); setCustomContext(""); setCustomDimText({}); setDimWeights({}); }}
                      className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-rose-400"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {context && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                    <p className="text-xs text-emerald-400 font-medium">✓ Context active — applied to all AI runs</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Run button — sticky bottom */}
          <div className="p-3 border-t border-border">
            <button
              onClick={() => setShowRunModal(true)}
              disabled={project.resume_ids.length === 0}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run AI Assessment
            </button>
            {project.resume_ids.length === 0 && (
              <p className="text-center text-xs text-muted-foreground mt-1.5">Add resumes to enable runs</p>
            )}
          </div>
        </aside>

        {/* ── RIGHT: Preview Panel ── */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-muted/20 flex flex-col">

          {/* Mobile top bar — only visible on small screens */}
          <div className="md:hidden flex items-center gap-3 px-3 py-2.5 border-b border-border bg-card shrink-0">
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span className="font-medium">{project?.name ?? "Project"}</span>
            </button>
            <div className="flex-1 flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setShowRunModal(true)}
                className="shrink-0 flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-white"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
          {/* JD Preview */}
          {rightPanel === "jd" && (
            <div className="p-6">
              {jdLoading ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6 animate-pulse">
                    <div className="h-3 bg-muted rounded w-1/4 mb-3" />
                    <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  {[1,2].map(i => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-2">
                      <div className="h-3 bg-muted rounded w-1/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : previewJd ? (
                <FormatJd text={previewJd.description} jobTitle={previewJd.title} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-muted-foreground">Failed to load job description.</p>
                </div>
              )}
            </div>
          )}

          {/* Resume Preview */}
          {rightPanel === "resume" && previewResumeId && (
            <div className="p-6">
              {resumeLoading && !resumeDetails[previewResumeId] ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                  {[1,2,3].map(i => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-2">
                      <div className="h-3 bg-muted rounded w-1/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : resumeDetails[previewResumeId]?.preview ? (
                <FormatResume text={resumeDetails[previewResumeId].preview} />
              ) : resumeDetails[previewResumeId] ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  {resumeLoading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />}
                  <p className="text-sm text-muted-foreground">No preview content available for this resume.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-muted-foreground">Could not load resume.</p>
                </div>
              )}
            </div>
          )}

          {/* Run Results */}
          {rightPanel === "run" && !selectedRun && (
            <div className="flex flex-col items-center justify-center h-full py-32 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Ready to assess</h2>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
                {project.resume_ids.length === 0
                  ? "Add resumes on the left, then run an AI assessment."
                  : "Click a resume to preview it, or run an AI assessment."}
              </p>
              <div className="mt-4 flex gap-3 text-sm text-muted-foreground">
                <span className={`flex items-center gap-1.5 ${project.resume_ids.length > 0 ? "text-emerald-400" : ""}`}>
                  {project.resume_ids.length > 0 ? "✓" : "○"} {project.resume_ids.length} resume{project.resume_ids.length !== 1 ? "s" : ""}
                </span>
                <span className={`flex items-center gap-1.5 ${context ? "text-emerald-400" : ""}`}>
                  {context ? "✓" : "○"} {context ? `Context (${selectedContextKeys.length + 2} dims)` : "No context"}
                </span>
              </div>
            </div>
          )}

          {rightPanel === "run" && selectedRun && (
            <div className="p-6 space-y-4">
              {/* Run header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">{selectedRun.run_label || selectedRun.run_type}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(selectedRun.created_at).toLocaleString()} · {selectedRun.ranked?.length ?? 0} candidates{selectedRun.duration_seconds != null ? ` · ${selectedRun.duration_seconds}s` : ""}
                  </p>
                </div>
              </div>

              {/* Ranked candidates */}
              {(selectedRun.ranked ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No ranked candidates in this run.</p>
              ) : (
                <div className="space-y-3">
                  {selectedRun.ranked.map((c: RankedCandidate) => (
                    <div key={c.resume_id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            #{c.rank}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{c.name || `Resume ${c.rank}`}</p>
                            <p className="text-xs text-muted-foreground font-mono">{c.resume_id.slice(-8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ScoreBadge score={c.score} />
                          {c.recommendation && (
                            <span className="text-xs text-muted-foreground">{c.recommendation}</span>
                          )}
                        </div>
                      </div>
                      {c.summary && <p className="text-xs text-muted-foreground">{c.summary}</p>}
                      {(c.strengths?.length > 0 || c.gaps?.length > 0) && (
                        <div className="flex gap-4 pt-1">
                          {c.strengths?.length > 0 && (
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-emerald-400 mb-1">Strengths</p>
                              <div className="flex flex-wrap gap-1">
                                {c.strengths.map(s => (
                                  <span key={s} className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {c.gaps?.length > 0 && (
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-amber-400 mb-1">Gaps</p>
                              <div className="flex flex-wrap gap-1">
                                {c.gaps.map(g => (
                                  <span key={g} className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400">{g}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* AI run notes */}
              {selectedRun.run_notes && (
                <details className="rounded-lg border border-border bg-muted/20">
                  <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground hover:text-foreground select-none">
                    💬 AI Run Notes
                  </summary>
                  <p className="px-3 pb-3 pt-1 text-xs text-muted-foreground leading-relaxed">{selectedRun.run_notes}</p>
                </details>
              )}
            </div>
          )}
          </div>{/* end flex-1 overflow-y-auto */}
        </main>
      </div>
    </>
  );
}
