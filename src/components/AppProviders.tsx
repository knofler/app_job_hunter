"use client";

import type { PropsWithChildren } from "react";

import { PersonaProvider } from "@/context/PersonaContext";

export default function AppProviders({ children }: PropsWithChildren) {
  return <PersonaProvider>{children}</PersonaProvider>;
}
