import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { SERVER_BACKEND_URL } from "@/lib/server-backend-url";

// ---------------------------------------------------------------------------
// GET /api/connect/context
// ---------------------------------------------------------------------------

/**
 * Return the app knowledge base for AI agent context.
 * Provides app metadata, tech stack, route list, and recent changes.
 *
 * NOTE: This route is purely informational and does not proxy to the backend.
 * It reads local state to provide context for AI agents.
 *
 * Response 200: { data: { appName, techStack, routes, apiRoutes, recentChanges } }
 */
export async function GET(_request: NextRequest) {
  try {
    const appName = "AI Job Hunter";

    const techStack = {
      framework: "Next.js 16 (App Router)",
      language: "TypeScript",
      ui: ["React 19", "Tailwind CSS"],
      backend: `FastAPI (Python) via API proxy (${SERVER_BACKEND_URL})`,
      database: "MongoDB (via FastAPI backend)",
      auth: "Auth0 (@auth0/nextjs-auth0)",
    };

    const routes = [
      { path: "/", description: "Landing page" },
      { path: "/dashboard", description: "Candidate dashboard" },
      { path: "/job-search", description: "Job search with filters" },
      { path: "/my-jobs", description: "My applications" },
      { path: "/profile", description: "User profile" },
      { path: "/recruiters/projects", description: "Recruiter projects" },
      { path: "/settings/llm", description: "Admin LLM settings" },
      { path: "/connect", description: "Connect Hub (bugs, features, help)" },
    ];

    const apiRoutes = [
      "GET  /api/connect/bugs",
      "POST /api/connect/bugs",
      "GET  /api/connect/bugs/[id]",
      "PATCH /api/connect/bugs/[id]",
      "GET  /api/connect/features",
      "POST /api/connect/features",
      "GET  /api/connect/features/[id]",
      "PATCH /api/connect/features/[id]",
      "POST /api/connect/features/[id]/vote",
      "GET  /api/connect/help",
      "POST /api/connect/help",
      "POST /api/connect/help/[id]/feedback",
      "GET  /api/connect/context",
    ];

    // Read recent changes from STATE.md (first 50 lines)
    let recentChanges = "Unable to read state file";
    try {
      const statePath = path.resolve(process.cwd(), "AI/state/STATE.md");
      const stateContent = await fs.readFile(statePath, "utf-8");
      const lines = stateContent.split("\n").slice(0, 50);
      recentChanges = lines.join("\n");
    } catch {
      // STATE.md may not exist in all environments
      recentChanges = "State file not available in this environment";
    }

    return NextResponse.json(
      {
        data: {
          appName,
          techStack,
          routes,
          apiRoutes,
          recentChanges,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/connect/context] GET error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
