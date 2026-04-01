"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface ChangeItem {
  category: string;
  text: string;
}

interface Release {
  id: string;
  version: string;
  title: string;
  description: string;
  changes: ChangeItem[];
  release_date: string;
  published_at: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  feature: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  bugfix: { bg: "bg-red-500/20", text: "text-red-400" },
  improvement: { bg: "bg-blue-500/20", text: "text-blue-400" },
  breaking: { bg: "bg-amber-500/20", text: "text-amber-400" },
};

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReleases = useCallback(async () => {
    try {
      const res = await fetch("/api/product/releases?limit=50", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setReleases(data.items || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <section className="border-b border-border">
        <div className="container-custom py-12">
          <Link href="/product" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
            &larr; Back to Product
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Release Notes</h1>
          <p className="text-muted-foreground max-w-xl">
            A record of every release shipped to production. Each entry includes version, changes, and categorised notes.
          </p>
        </div>
      </section>

      {/* Releases timeline */}
      <section className="container-custom py-12">
        {loading ? (
          <div className="space-y-6 max-w-3xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No releases published yet.</p>
            <p className="text-muted-foreground text-sm mt-2">Release notes will appear here as versions are deployed.</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {releases.map((release, idx) => (
              <article
                key={release.id}
                className="relative rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30"
              >
                {/* Version bar */}
                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-primary/20 text-primary px-3 py-0.5 text-sm font-bold">
                      v{release.version}
                    </span>
                    {idx === 0 && (
                      <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-xs font-medium">
                        Latest
                      </span>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground">{formatDate(release.release_date)}</time>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  <h2 className="text-lg font-semibold mb-2">{release.title}</h2>
                  {release.description && (
                    <p className="text-sm text-muted-foreground mb-4">{release.description}</p>
                  )}

                  {release.changes.length > 0 && (
                    <ul className="space-y-2">
                      {release.changes.map((change, ci) => {
                        const colors = CATEGORY_COLORS[change.category] || CATEGORY_COLORS.improvement;
                        return (
                          <li key={ci} className="flex items-start gap-2">
                            <span
                              className={`shrink-0 mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${colors.bg} ${colors.text}`}
                            >
                              {change.category}
                            </span>
                            <span className="text-sm">{change.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
