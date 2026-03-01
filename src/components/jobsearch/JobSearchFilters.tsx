"use client";

import { ChangeEvent } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type JobFilters = {
  hideApplied: boolean;
  search: string;
  sort: "match" | "date" | "salary";
  locationType: string[];
  jobType: string[];
  experience: string;
  skills: string[];
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

  const toggleFilter = (key: keyof JobFilters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const handleExperienceChange = (value: string) => {
    onFiltersChange({ ...filters, experience: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      hideApplied: true,
      search: "",
      sort: "match",
      locationType: [],
      jobType: [],
      experience: "any",
      skills: [],
    });
  };

  return (
    <aside className="bg-card border border-border rounded-xl p-5 space-y-6 sticky top-20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Filters</h2>
        <button 
          onClick={clearFilters}
          className="text-xs text-primary hover:underline font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Search</label>
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full bg-muted/50 border border-border rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Title, company, or skills..."
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Sort by</label>
        <select 
          className="w-full bg-muted/50 border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
          value={filters.sort} 
          onChange={handleSortChange}
        >
          <option value="match">Best Match</option>
          <option value="date">Most Recent</option>
          <option value="salary">Highest Salary</option>
        </select>
      </div>

      {/* Location Type */}
      <div className="space-y-3 pt-2 border-t border-border">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Location</label>
        <div className="space-y-2">
          {["Remote", "On-site", "Hybrid"].map(type => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                checked={filters.locationType.includes(type)}
                onChange={() => toggleFilter("locationType", type)}
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Job Type */}
      <div className="space-y-3 pt-2 border-t border-border">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Job Type</label>
        <div className="space-y-2">
          {["Full-time", "Contract", "Part-time"].map(type => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                checked={filters.jobType.includes(type)}
                onChange={() => toggleFilter("jobType", type)}
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="space-y-3 pt-2 border-t border-border">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Experience</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: "any", label: "Any Experience" },
            { id: "entry", label: "Entry (0-2y)" },
            { id: "mid", label: "Mid (3-5y)" },
            { id: "senior", label: "Senior (5y+)" }
          ].map(level => (
            <button
              key={level.id}
              onClick={() => handleExperienceChange(level.id)}
              className={`text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                filters.experience === level.id 
                  ? "bg-primary text-white font-medium shadow-sm" 
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hide Applied */}
      <div className="pt-4 border-t border-border">
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm font-medium text-foreground">Hide applied jobs</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={filters.hideApplied}
              onChange={handleCheckboxChange}
            />
            <div className="w-10 h-6 bg-muted border border-border rounded-full peer-checked:bg-primary transition-colors" />
            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </div>
        </label>
      </div>

      <Button className="w-full mt-2" size="sm">
        Apply Filters
      </Button>
    </aside>
  );
}
