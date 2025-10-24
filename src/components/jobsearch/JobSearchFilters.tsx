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
    <aside className="bg-white rounded-xl shadow p-6 mb-4">
      <div className="font-semibold mb-2">Filters</div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={filters.hideApplied} onChange={handleCheckboxChange} />
          Hide Viewed &amp; Applied Jobs
        </label>
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Search by keyword..."
          value={filters.search}
          onChange={handleSearchChange}
        />
        <select className="border rounded px-2 py-1 text-sm" value={filters.sort} onChange={handleSortChange}>
          <option value="match">Sort by Match Score</option>
          <option value="date">Sort by Date Posted</option>
          <option value="salary">Sort by Salary</option>
        </select>
      </div>
    </aside>
  );
}
