"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { fetchFromApi } from "@/lib/api";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
  api_version?: string;
}

export default function ProfilePage() {
  const { user, isLoading: userLoading } = useUser();
  const [details, setDetails] = useState<FullUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      if (!user) return;
      try {
        // Try to fetch resolved info from backend
        const data = await fetchFromApi<FullUserDetails>("/api/me");
        setDetails(data);
      } catch (err) {
        console.error("Backend fetch skipped or failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [user]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify({ ...user, ...details }, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (userLoading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  if (!user) return (
    <div className="container-custom py-20 text-center">
      <Card className="max-w-md mx-auto">
        <CardContent className="py-10">
          <h2 className="text-xl font-bold mb-4">Please Sign In</h2>
          <Link href="/api/auth/login"><Button>Sign In</Button></Link>
        </CardContent>
      </Card>
    </div>
  );

  // ROBUST EXTRACTION FOR FRONTEND DISPLAY
  const rawRoles = (user as any)["https://ai-job-hunter/roles"] || user.roles || [];
  const rawOrg = (user as any)["https://ai-job-hunter/org_id"] || user.org_id || "global";
  
  const displayRoles = details?.roles || (Array.isArray(rawRoles) ? rawRoles : [rawRoles]);
  const displayOrg = details?.org_id || rawOrg;

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="bg-primary h-48 w-full relative">
        <div className="container-custom relative h-full">
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <div className="w-32 h-32 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-4xl font-bold text-primary overflow-hidden">
              {user.picture ? <img src={user.picture} className="w-full h-full object-cover" /> : user.email?.[0].toUpperCase()}
            </div>
            <div className="pb-4">
              <h1 className="text-3xl font-bold text-white">{user.name || "User Profile"}</h1>
              <p className="text-primary-foreground/80">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-xs uppercase text-muted-foreground tracking-widest">Resolved Identity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {displayRoles.map((r: string) => <Badge key={r} variant="primary" className="capitalize">{r}</Badge>)}
                </div>
                <div className="pt-4 border-t flex justify-between text-sm">
                  <span className="text-muted-foreground">Org Scope</span>
                  <span className="font-bold text-primary">{displayOrg}</span>
                </div>
              </CardContent>
            </Card>
            <Link href="/api/auth/logout" className="block"><Button variant="outline" className="w-full text-red-600">Logout</Button></Link>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle>Organization Workspace</CardTitle>
                <p className="text-sm text-muted-foreground">Active Tenant: <code className="bg-muted px-1 rounded">{displayOrg}</code></p>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-bold">{details?.org_name || "Workspace Profile"}</h3>
                <p className="text-muted-foreground mt-1">{details?.org_description || "Authorized access to recruitment projects and AI tools."}</p>
                <div className="mt-6 flex gap-3">
                  <Link href="/recruiters/projects"><Button size="sm">Enter Projects</Button></Link>
                </div>
              </CardContent>
            </Card>

            <div className="mt-10">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Identity Context</h4>
                <Button variant="ghost" size="sm" onClick={handleCopyJson} className="h-7 text-xs">{copySuccess ? "Copied!" : "Copy JSON"}</Button>
              </div>
              <Card className="bg-slate-900 border-slate-800">
                <pre className="p-6 text-[11px] text-blue-300 font-mono overflow-auto max-h-80">
                  {JSON.stringify({ ...user, ...details }, null, 2)}
                </pre>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
