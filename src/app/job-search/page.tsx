"use client";
import JobSearchFilters from "@/components/jobsearch/JobSearchFilters";
import JobCardList from "@/components/jobsearch/JobCardList";

export default function JobSearchPage() {
  return (
    <div className="max-w-7xl mx-auto py-10 px-4 grid grid-cols-1 md:grid-cols-4 gap-8 min-h-screen">
      {/* Filter Panel */}
      <div className="md:col-span-1">
        <JobSearchFilters />
      </div>
      {/* Job List */}
      <div className="md:col-span-3">
        <JobCardList />
      </div>
    </div>
  );
}
