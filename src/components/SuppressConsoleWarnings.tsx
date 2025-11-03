"use client";

import { useEffect } from "react";

export default function SuppressConsoleWarnings() {
  useEffect(() => {
    // Suppress harmless SES lockdown warnings in development
    if (process.env.NODE_ENV === "development") {
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        const message = args[0];
        // Filter out SES lockdown warnings
        if (
          typeof message === "string" &&
          (message.includes("SES") || 
           message.includes("Removing unpermitted intrinsics") ||
           message.includes("lockdown"))
        ) {
          return;
        }
        originalWarn.apply(console, args);
      };

      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  return null;
}
