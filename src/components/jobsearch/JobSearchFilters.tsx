"use client";

import { ChangeEvent } from "react";

export type JobFilters = {
  hideApplied: boolean;
  search: string;
  sort: "match" | "date" | "salary";
};

interface JobSearchFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
}

export default function JobSearchFilters({ filters, onFiltersChange }: JobSearchFiltersProps) {
  function handleCheckboxChange(event: ChangeEvent<HTMLInputElement>) {
    onFiltersChange({ ...filters, hideApplied: event.target.checked });
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    onFiltersChange({ ...filters, search: event.target.value });
  }

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as JobFilters["sort"];
    onFiltersChange({ ...filters, sort: value });
  }

  return (
    <aside className="bg-card border border-border rounded-xl p-5 space-y-5 sticky top-20">
      <div>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Filters</h2>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9 w-full text-sm"
            placeholder="Search jobs..."
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sort by</label>
        <select className="input w-full text-sm" value={filters.sort} onChange={handleSortChange}>
          <option value="match">Best Match</option>
          <option value="date">Most Recent</option>
          <option value="salary">Highest Salary</option>
        </select>
      </div>

      {/* Hide Applied */}
      <div className="pt-1 border-t border-border">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={filters.hideApplied}
              onChange={handleCheckboxChange}
            />
            <div className="w-9 h-5 bg-muted border border-border rounded-full peer-checked:bg-primary transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm text-foreground">Hide applied jobs</span>
        </label>
      </div>
    </aside>
  );
}
