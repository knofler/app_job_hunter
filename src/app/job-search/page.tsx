"use client";

import { useState } from "react";
import JobCardList from "@/components/jobsearch/JobCardList";
import JobSearchFilters, { JobFilters } from "@/components/jobsearch/JobSearchFilters";

const defaultFilters: JobFilters = {
  hideApplied: true,
  search: "",
  sort: "match",
  locationType: [],
  jobType: [],
  experience: "any",
  skills: [],
};

export default function JobSearchPage() {
  const [filters, setFilters] = useState<JobFilters>(defaultFilters);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 tracking-tight">Job Search</h1>
            <p className="text-muted-foreground font-medium italic">Find your next opportunity with AI-powered matching</p>
          </div>
          <div className="flex items-center gap-2 text-sm bg-card border border-border px-3 py-1.5 rounded-lg shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground font-medium">Real-time matching active</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <JobSearchFilters filters={filters} onFiltersChange={setFilters} />
          </div>
          <div className="lg:col-span-3">
            <JobCardList filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
