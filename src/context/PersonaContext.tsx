"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { DEFAULT_CANDIDATE_ID, DEFAULT_RECRUITER_ID } from "@/lib/constants";

type Persona = "candidate" | "recruiter" | "admin";

type PersonaContextValue = {
  persona: Persona;
  setPersona: (persona: Persona) => void;
  candidateId: string;
  recruiterId: string;
};

const STORAGE_KEY = "ai-job-hunter.activePersona";

const PersonaContext = createContext<PersonaContextValue | undefined>(undefined);

function resolveInitialPersona(): Persona {
  if (typeof window === "undefined") {
    return "candidate";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "candidate" || stored === "recruiter" || stored === "admin") {
    return stored;
  }

  return "candidate";
}

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersonaState] = useState<Persona>(() => resolveInitialPersona());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "candidate" || stored === "recruiter" || stored === "admin") {
      setPersonaState(stored);
    }
  }, []);

  const setPersona = useCallback((nextPersona: Persona) => {
    setPersonaState(nextPersona);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextPersona);
    }
  }, []);

  const value = useMemo<PersonaContextValue>(() => ({
    persona,
    setPersona,
    candidateId: DEFAULT_CANDIDATE_ID,
    recruiterId: DEFAULT_RECRUITER_ID,
  }), [persona, setPersona]);

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona(): PersonaContextValue {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
}

export function useCandidateScope() {
  const { persona, candidateId } = usePersona();
  return {
    isCandidate: persona === "candidate",
    candidateId: persona === "candidate" ? candidateId : null,
  } as const;
}

export function useRecruiterScope() {
  const { persona, recruiterId } = usePersona();
  return {
    isRecruiter: persona === "recruiter",
    recruiterId: persona === "recruiter" ? recruiterId : null,
  } as const;
}

export type { Persona };
