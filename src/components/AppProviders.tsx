"use client";

import type { PropsWithChildren } from "react";

import { PersonaProvider } from "@/context/PersonaContext";
import { ThemeProvider } from "@/context/ThemeContext";

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <PersonaProvider>{children}</PersonaProvider>
    </ThemeProvider>
  );
}
