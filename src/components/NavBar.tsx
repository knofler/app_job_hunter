"use client";

import { useUser } from '@/context/UserContext';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import type { Persona } from "@/context/PersonaContext";
import { usePersona } from "@/context/PersonaContext";
import { useTheme } from "@/context/ThemeContext";

const FALLBACK_ROUTE = "/dashboard";

type NavItem = { label: string; href: string };

const NAV_ITEMS: Record<Persona, NavItem[]> = {
  candidate: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Find Jobs", href: "/job-search" },
    { label: "My Applications", href: "/my-jobs" },
    { label: "My Resume", href: "/resume" },
  ],
  recruiter: [
    { label: "Projects", href: "/recruiters/projects" },
  ],
  admin: [
    { label: "LLM Settings", href: "/admin/llm" },
    { label: "AI Prompts", href: "/admin/prompts" },
    { label: "Organisations", href: "/admin/orgs" },
    { label: "Seed Data", href: "/admin/seed" },
  ],
};

const DEFAULT_DESTINATION: Record<Persona, string> = {
  candidate: "/dashboard",
  recruiter: "/recruiters/projects",
  admin: "/admin/llm",
};

const personaOptions: Array<{ id: Persona; label: string; icon: string }> = [
  { id: "candidate", label: "Candidate", icon: "👤" },
  { id: "recruiter", label: "Recruiter", icon: "🏢" },
  { id: "admin", label: "Admin", icon: "⚙️" },
];

export default function NavBar() {
  const { user, isLoading, logout } = useUser();
  const { persona, setPersona } = usePersona();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = useMemo(() => NAV_ITEMS[persona], [persona]);

  const handlePersonaChange = (nextPersona: Persona) => {
    const preferred = DEFAULT_DESTINATION[nextPersona] ?? FALLBACK_ROUTE;
    const allowedRoutes = NAV_ITEMS[nextPersona]?.map(i => i.href) ?? [];
    const nextRoute = allowedRoutes.includes(preferred) ? preferred : allowedRoutes[0] ?? FALLBACK_ROUTE;
    setPersona(nextPersona);
    router.push(nextRoute);
  };

  return (
    <nav className="w-full sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="container-custom">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary shrink-0">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">AI Job Hunter</span>
          </Link>

          {/* Persona-based nav links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {navItems.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Dark/light toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {theme === "dark" ? (
                /* Sun icon */
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                /* Moon icon */
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Persona pill switcher */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
              {personaOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => opt.id !== persona && handlePersonaChange(opt.id)}
                  title={opt.label}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                    persona === opt.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-sm leading-none">{opt.icon}</span>
                  <span className="hidden lg:inline">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* User avatar / auth */}
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : user ? (
              <div className="flex items-center gap-1">
                <Link
                  href="/profile"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary hover:bg-primary/30 transition-colors"
                  title={user.name || user.email || "Profile"}
                >
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </Link>
                <button
                  onClick={logout}
                  className="hidden lg:block px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link href="/api/auth/login" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Login
                </Link>
                <Link href="/api/auth/signup" className="px-3 py-1.5 text-sm font-semibold bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
