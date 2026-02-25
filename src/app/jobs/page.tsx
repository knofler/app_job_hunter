"use client";

import { useState } from "react";
import JobSearchFilters, { JobFilters } from "@/components/jobsearch/JobSearchFilters";
import JobCard from "@/components/jobsearch/JobCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Button from "@/components/ui/Button";

const defaultFilters: JobFilters = {
  hideApplied: false,
  search: "",
  sort: "date",
};

// Mock data - replace with real API
const mockJobs = [
  {
    id: '1',
    title: 'Senior Full Stack Engineer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$150k - $200k',
    matchScore: 95,
    description: 'We are looking for an experienced full stack engineer to join our growing team...',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
    postedAt: '2 days ago',
    type: 'Full-time' as const,
    applied: false,
  },
  {
    id: '2',
    title: 'Frontend Developer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '$120k - $160k',
    matchScore: 88,
    description: 'Join our innovative team building the next generation of web applications...',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
    postedAt: '4 days ago',
    type: 'Remote' as const,
    applied: false,
  },
  {
    id: '3',
    title: 'Product Manager',
    company: 'Innovation Labs',
    location: 'New York, NY',
    salary: '$140k - $180k',
    matchScore: 72,
    description: 'Lead product strategy and execution for our flagship platform...',
    skills: ['Product Strategy', 'Agile', 'User Research', 'Analytics'],
    postedAt: '1 week ago',
    type: 'Full-time' as const,
    applied: true,
  },
];

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>(defaultFilters);
  const [jobs] = useState(mockJobs);

  const handleApply = (jobId: string) => {
    console.log('Applying to job:', jobId);
    // Implement application logic
  };

  const handleViewDetails = (jobId: string) => {
    console.log('Viewing job:', jobId);
    // Navigate to job details
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Job Listings</h1>
          <p className="text-muted-foreground">Discover your next opportunity with AI-powered matching</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <JobSearchFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Job Cards Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{jobs.length}</span> jobs
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  List
                </Button>
                <Button variant="ghost" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Grid
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={handleApply}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="primary" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
