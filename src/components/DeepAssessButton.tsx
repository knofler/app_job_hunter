"use client";

import { useRouter } from "next/navigation";

interface DeepAssessButtonProps {
  resumeId: string;
  resumeName?: string;
  jdId?: string;
  /** Pre-filled job description text (used when jdId is not available) */
  jdText?: string;
  className?: string;
}

/**
 * Button that navigates to /recruiters/ai-assessment with pre-filled
 * resume and job description context.
 */
export default function DeepAssessButton({
  resumeId,
  resumeName,
  jdId,
  jdText,
  className = "",
}: DeepAssessButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    const params = new URLSearchParams();
    params.set("resumeId", resumeId);
    if (resumeName) params.set("resumeName", resumeName);
    if (jdId) params.set("jdId", jdId);
    // jdText can be long — only pass if no jdId available and text is short enough for URL
    if (!jdId && jdText && jdText.length < 2000) {
      params.set("jdText", jdText);
    }
    router.push(`/recruiters/ai-assessment?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors ${className}`}
      title="Open deep AI assessment for this candidate"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
      Deep Assess
    </button>
  );
}
