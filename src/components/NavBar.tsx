"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import type { Persona } from "@/context/PersonaContext";
import { usePersona } from "@/context/PersonaContext";

const FALLBACK_ROUTE = "/dashboard";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: Record<Persona, NavItem[]> = {
  candidate: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Jobs", href: "/jobs" },
    { label: "My Jobs", href: "/my-jobs" },
    { label: "Resumes", href: "/resume" },
    { label: "Candidates", href: "/candidates" },
    { label: "Recruiters", href: "/recruiters" },
  ],
  recruiter: [
    { label: "Recruiter Dashboard", href: "/recruiters/dashboard" },
    { label: "Upload JD", href: "/recruiters/upload-jd" },
    { label: "Recruiter AI", href: "/recruiters/ai-workflow" },
    { label: "Candidates", href: "/candidates" },
    { label: "Jobs", href: "/jobs" },
  ],
  admin: [
    { label: "LLM Settings", href: "/admin/llm" },
    { label: "AI Prompts", href: "/admin/prompts" },
    { label: "Recruiter Dashboard", href: "/recruiters/dashboard" },
    { label: "Candidates", href: "/candidates" },
  ],
};

const DEFAULT_DESTINATION: Record<Persona, string> = {
  candidate: "/dashboard",
  recruiter: "/recruiters/dashboard",
  admin: "/admin/llm",
};

const personaOptions: Array<{ id: Persona; label: string }> = [
  { id: "candidate", label: "Candidate" },
  { id: "recruiter", label: "Recruiter" },
  { id: "admin", label: "Admin" },
];

export default function NavBar() {
  const { user, isLoading } = useUser();
  const { persona, setPersona } = usePersona();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = useMemo(() => NAV_ITEMS[persona], [persona]);

  const handlePersonaChange = (nextPersona: Persona) => {
    const preferred = DEFAULT_DESTINATION[nextPersona] ?? FALLBACK_ROUTE;
    const allowedRoutes = NAV_ITEMS[nextPersona]?.map(item => item.href) ?? [];
    const nextRoute = allowedRoutes.includes(preferred) ? preferred : allowedRoutes[0] ?? FALLBACK_ROUTE;
    setPersona(nextPersona);
    router.push(nextRoute);
  };

  return (
    <nav className="w-full bg-white shadow mb-8">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link href="/" className="text-xl font-bold text-blue-700">AI Job Hunter</Link>
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            const baseClass = "text-sm transition-colors";
            const activeClass = isActive ? "text-blue-700 font-semibold" : "text-gray-700 hover:text-blue-700";
            return (
              <Link key={item.href} href={item.href} className={`${baseClass} ${activeClass}`}>
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Persona
            <select
              className="rounded border border-gray-300 px-2 py-1 text-sm"
              value={persona}
              onChange={event => {
                const nextPersona = event.target.value as Persona;
                if (nextPersona === persona) {
                  return;
                }
                handlePersonaChange(nextPersona);
              }}
            >
              {personaOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          
          {isLoading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : user ? (
            <>
              <Link href="/profile" className="text-sm text-gray-700 hover:text-blue-700">
                {user.name || user.email || 'Profile'}
              </Link>
              <Link 
                href="/api/auth/logout" 
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </Link>
            </>
          ) : (
            <>
              <Link href="/api/auth/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Login
              </Link>
              <Link href="/api/auth/signup" className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
