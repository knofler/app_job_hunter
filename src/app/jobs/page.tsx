"use client";

import { useState } from "react";

import JobCardList from "@/components/jobsearch/JobCardList";
import JobSearchFilters, { JobFilters } from "@/components/jobsearch/JobSearchFilters";

const defaultFilters: JobFilters = {
  hideApplied: true,
  search: "",
  sort: "match",
};

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>(defaultFilters);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 grid grid-cols-1 md:grid-cols-4 gap-8 min-h-screen">
      <div className="md:col-span-1">
        <JobSearchFilters filters={filters} onFiltersChange={setFilters} />
      </div>
      <div className="md:col-span-3">
        <JobCardList filters={filters} pageSize={12} />
      </div>
    </div>
  );
}
