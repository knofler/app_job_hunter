"use client";

import { useState } from "react";

import JobCardList from "@/components/jobsearch/JobCardList";
import JobSearchFilters, { JobFilters } from "@/components/jobsearch/JobSearchFilters";

const defaultFilters: JobFilters = {
  hideApplied: false, // Don't hide applied jobs in general listings
  search: "",
  sort: "date", // Default to date sorting for general listings
};

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>(defaultFilters);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Listings</h1>
        <p className="text-gray-600">Discover your next opportunity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-screen">
        <div className="lg:col-span-1">
          <JobSearchFilters filters={filters} onFiltersChange={setFilters} />
        </div>
        <div className="lg:col-span-3">
          <JobCardList filters={filters} pageSize={12} mode="listings" />
        </div>
      </div>
    </div>
  );
}
