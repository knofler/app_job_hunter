"use client";

import { useState } from "react";
import JobCardList from "@/components/jobsearch/JobCardList";
import JobSearchFilters, { JobFilters } from "@/components/jobsearch/JobSearchFilters";

const defaultFilters: JobFilters = {
  hideApplied: true,
  search: "",
  sort: "match",
};

export default function JobSearchPage() {
  const [filters, setFilters] = useState<JobFilters>(defaultFilters);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container-custom py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">Job Search</h1>
          <p className="text-muted-foreground">Find your next opportunity with AI-powered matching</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <JobSearchFilters filters={filters} onFiltersChange={setFilters} />
          </div>
          <div className="md:col-span-3">
            <JobCardList filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
