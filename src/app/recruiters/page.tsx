"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchFromApi } from "@/lib/api";
import { fallbackRecruiters } from "@/lib/fallback-data";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const PAGE_SIZE = 5;

type Recruiter = {
  recruiter_id: string;
  name: string;
  company?: string;
  specialties?: string[];
  regions?: string[];
  email?: string;
  updated_at?: string;
};

type RecruiterListResponse = {
  items: Recruiter[];
  total: number;
  page: number;
  page_size: number;
};

function formatDate(value?: string): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function RecruitersPage() {
  const [page, setPage] = useState(1);
  const [recruiters, setRecruiters] = useState<Recruiter[]>(fallbackRecruiters.slice(0, PAGE_SIZE));
  const [total, setTotal] = useState<number>(fallbackRecruiters.length);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFromApi<RecruiterListResponse>(
          `/recruiters?page=${page}&page_size=${PAGE_SIZE}`
        );
        if (!isMounted) {
          return;
        }

        setRecruiters(response.items);
        setTotal(response.total ?? response.items.length);
        setUsingFallback(false);
      } catch (err) {
        console.error("Failed to load recruiters", err);
        if (!isMounted) {
          return;
        }
        setRecruiters(fallbackRecruiters.slice(0, PAGE_SIZE));
        setTotal(fallbackRecruiters.length);
        setUsingFallback(true);
        setError("Unable to reach the API. Showing demo recruiters.");
        if (page !== 1) {
          setPage(1);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recruiter Network</h1>
          <p className="text-sm text-muted-foreground">Connect with {total} specialist recruiters supporting the platform.</p>
        </div>
        <div>
          {loading ? (
            <Badge variant="neutral" size="sm">Loading...</Badge>
          ) : usingFallback ? (
            <Badge variant="warning" size="sm">Demo data</Badge>
          ) : (
            <Badge variant="success" size="sm">Live data</Badge>
          )}
        </div>
      </div>

      {error && (
        <Card className="mb-4 p-3 border-rose-200 bg-rose-50">
          <p className="text-sm text-rose-700">{error}</p>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Recruiter</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Specialties</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Regions</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recruiters.map(recruiter => (
                <tr key={recruiter.recruiter_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{recruiter.name}</div>
                    <div className="text-xs text-muted-foreground">{recruiter.company ?? "Independent"}</div>
                  </td>
                  <td className="px-4 py-3">
                    {recruiter.specialties && recruiter.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {recruiter.specialties.map(s => (
                          <Badge key={s} variant="info" size="sm">{s}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not specified</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {recruiter.regions && recruiter.regions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {recruiter.regions.map(r => (
                          <Badge key={r} variant="neutral" size="sm">{r}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not specified</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {recruiter.email ? (
                      <a href={`mailto:${recruiter.email}`} className="text-primary hover:underline">
                        {recruiter.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(recruiter.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
        <div className="text-sm text-muted-foreground">Showing {start} - {end} of {total}</div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
