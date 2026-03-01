"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { fetchFromApi } from "@/lib/api";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface FullUserDetails {
  sub: string;
  email: string;
  roles: string[];
  org_id: string;
  name?: string;
  picture?: string;
  org_name?: string;
  org_description?: string;
}

export default function ProfilePage() {
  const { user, isLoading: userLoading } = useUser();
  const [details, setDetails] = useState<FullUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetails() {
      if (!user) return;
      try {
        const data = await fetchFromApi<FullUserDetails>("/api/me");
        setDetails(data);
      } catch (err) {
        console.error("Failed to fetch user details", err);
        setError("Could not load extended profile details.");
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [user]);

  if (userLoading || (user && loading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground animate-pulse font-medium">Securing your session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-custom py-20 text-center">
        <Card className="max-w-md mx-auto border-dashed">
          <CardContent className="pt-10 pb-10">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-6">Please sign in to access your recruitment workspace and profile settings.</p>
            <Link href="/api/auth/login">
              <Button variant="primary" className="w-full">Sign In to Platform</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userInitials = details?.name 
    ? details.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user.email?.[0].toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header/Banner Area */}
      <div className="bg-primary h-48 w-full relative">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="container-custom relative h-full">
          <div className="absolute -bottom-16 left-4 md:left-8 flex flex-col md:flex-row items-end gap-6">
            <div className="w-32 h-32 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center text-4xl font-bold text-primary overflow-hidden">
              {details?.picture ? (
                <img src={details.picture} alt={details.name} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <div className="pb-4 text-left">
              <h1 className="text-3xl font-bold text-white drop-shadow-md">{details?.name || "Member Profile"}</h1>
              <p className="text-primary-foreground/80 font-medium">{details?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Account Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Identity & Roles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {details?.roles.map(role => (
                    <Badge key={role} variant="primary" className="px-3 py-1 capitalize">
                      {role}
                    </Badge>
                  )) || <span className="text-sm text-muted-foreground italic">No roles assigned</span>}
                </div>
                
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Account Status</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-medium">March 2026</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your identity is managed via secure OIDC provider. Multi-factor authentication is handled at the organization level.
                </p>
                <Link href="/api/auth/logout" className="block">
                  <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100">
                    Sign Out of All Sessions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Organization & Detailed Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Organization Section */}
            <Card className="overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="bg-primary/5">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Organization Workspace</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Tenant Scoping: <code className="bg-muted px-1 rounded">{details?.org_id}</code></p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H5a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{details?.org_name}</h3>
                    <p className="text-muted-foreground mt-1 leading-relaxed">
                      {details?.org_description || "This is your primary workspace for recruitment projects, AI assessments, and collaborative reporting."}
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Link href="/settings/orgs">
                      <Button variant="outline" size="sm">Manage Organization</Button>
                    </Link>
                    <Link href="/recruiters/projects">
                      <Button variant="primary" size="sm">View Org Projects</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Settings Tabs Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.756 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold">Preferences</h4>
                      <p className="text-xs text-muted-foreground">Notifications & Display</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:border-primary/40 transition-colors cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold">AI Settings</h4>
                      <p className="text-xs text-muted-foreground">Model Keys & Prompts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Technical Context (formerly debug) */}
            <details className="mt-10 group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-2 outline-none">
                <svg className="w-3 h-3 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
                Advanced Technical Identity Context
              </summary>
              <Card className="mt-4 bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <pre className="text-[10px] text-blue-300 font-mono overflow-auto max-h-60 leading-relaxed">
                    {JSON.stringify({ ...details, ...user }, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
