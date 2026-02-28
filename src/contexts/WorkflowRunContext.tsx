"use client";

/**
 * WorkflowRunContext — persists AI workflow state across navigation.
 * Lives at the recruiter layout level so analysis continues running
 * even when the user navigates away from the AI Workflow page.
 */

import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  RecruiterWorkflowRequest,
  RecruiterWorkflowResponse,
  saveWorkflowResult,
} from "@/lib/recruiter-workflow";
import { streamRecruiterWorkflow } from "@/lib/stream-utils";

export type AnalysisRecord = {
  id: string;
  timestamp: Date;
  candidateName: string;
  candidateId: string;
  jobTitle: string;
  resumeIds: string[];
  result: RecruiterWorkflowResponse;
};

type WorkflowRunContextType = {
  isGenerating: boolean;
  workflowResult: RecruiterWorkflowResponse | null;
  streamingStep: string | null;
  streamingMessage: string | null;
  generationError: string | null;
  lastAnalyzedAt: Date | null;
  analysisHistory: AnalysisRecord[];
  viewingHistoryId: string | null;
  setViewingHistoryId: (id: string | null) => void;
  clearResult: () => void;
  startWorkflow: (
    payload: RecruiterWorkflowRequest,
    meta: { candidateName: string; candidateId: string; jobTitle: string; resumeIds: string[] }
  ) => Promise<void>;
};

const WorkflowRunContext = createContext<WorkflowRunContextType | null>(null);

export function WorkflowRunProvider({ children }: { children: React.ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<RecruiterWorkflowResponse | null>(null);
  const [streamingStep, setStreamingStep] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

  // Track current run meta in a ref so callbacks always see latest values
  const currentMetaRef = useRef<{ candidateName: string; candidateId: string; jobTitle: string; resumeIds: string[] } | null>(null);

  const clearResult = useCallback(() => {
    setWorkflowResult(null);
    setViewingHistoryId(null);
    setGenerationError(null);
  }, []);

  const startWorkflow = useCallback(async (
    payload: RecruiterWorkflowRequest,
    meta: { candidateName: string; candidateId: string; jobTitle: string; resumeIds: string[] }
  ) => {
    if (isGenerating) return;

    currentMetaRef.current = meta;

    // Archive current result to history before clearing
    setWorkflowResult(prev => {
      if (prev && lastAnalyzedAt) {
        const record: AnalysisRecord = {
          id: `run_${lastAnalyzedAt.getTime()}`,
          timestamp: lastAnalyzedAt,
          candidateName: meta.candidateName,
          candidateId: meta.candidateId,
          jobTitle: meta.jobTitle,
          resumeIds: [...meta.resumeIds],
          result: prev,
        };
        setAnalysisHistory(h => [record, ...h].slice(0, 20));
      }
      return null;
    });

    setIsGenerating(true);
    setGenerationError(null);
    setStreamingStep(null);
    setStreamingMessage(null);
    setViewingHistoryId(null);

    const baseResult: RecruiterWorkflowResponse = {
      job: payload.job_metadata || { title: "", code: "", level: "", salary_band: "", summary: "" },
      core_skills: [],
      ai_analysis_markdown: "",
      candidate_analysis: [],
      ranked_shortlist: [],
      detailed_readout: [],
      engagement_plan: [],
      fairness_guidance: [],
      interview_preparation: [],
    };

    try {
      await streamRecruiterWorkflow(payload, {
        onStatus: (step, message) => {
          setStreamingStep(step);
          setStreamingMessage(message);
        },
        onPartial: (step, data) => {
          setWorkflowResult(prev => {
            const base = prev || baseResult;
            if (step === "ai_analysis" && data && typeof data === "object" && "markdown" in data) {
              const p = data as { markdown: string; candidates?: unknown[] };
              return { ...base, ai_analysis_markdown: p.markdown, candidate_analysis: (p.candidates as RecruiterWorkflowResponse["candidate_analysis"]) || base.candidate_analysis };
            }
            return { ...base, [step]: data } as RecruiterWorkflowResponse;
          });
        },
        onResult: (step, data) => {
          setWorkflowResult(prev => ({ ...(prev || baseResult), [step]: data } as RecruiterWorkflowResponse));
        },
        onComplete: (data) => {
          const workflowData = data as RecruiterWorkflowResponse;
          const now = new Date();
          setWorkflowResult(workflowData);
          setLastAnalyzedAt(now);
          setStreamingStep(null);
          setStreamingMessage(null);

          // Add completed run to history
          const m = currentMetaRef.current;
          if (m) {
            const record: AnalysisRecord = {
              id: `run_${now.getTime()}`,
              timestamp: now,
              candidateName: m.candidateName,
              candidateId: m.candidateId,
              jobTitle: m.jobTitle,
              resumeIds: [...m.resumeIds],
              result: workflowData,
            };
            setAnalysisHistory(h => [record, ...h].slice(0, 20));
          }

          saveWorkflowResult(workflowData).catch(err => console.error("Failed to save workflow:", err));
        },
        onError: (error) => {
          setGenerationError(error);
          setStreamingStep(null);
          setStreamingMessage(null);
        },
      });
    } catch (error) {
      setGenerationError((error as Error).message || "Failed to generate recruiter workflow");
      setStreamingStep(null);
      setStreamingMessage(null);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, lastAnalyzedAt]);

  return (
    <WorkflowRunContext.Provider value={{
      isGenerating,
      workflowResult,
      streamingStep,
      streamingMessage,
      generationError,
      lastAnalyzedAt,
      analysisHistory,
      viewingHistoryId,
      setViewingHistoryId,
      clearResult,
      startWorkflow,
    }}>
      {children}
    </WorkflowRunContext.Provider>
  );
}

export function useWorkflowRun() {
  const ctx = useContext(WorkflowRunContext);
  if (!ctx) throw new Error("useWorkflowRun must be used within WorkflowRunProvider");
  return ctx;
}
