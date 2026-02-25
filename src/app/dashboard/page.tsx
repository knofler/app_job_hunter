"use client";
import { MetricWidget, ActivityFeed, ChartWidget } from '@/components/dashboard';
import type { ActivityItem, ChartDataPoint } from '@/components/dashboard';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function DashboardPage() {
  // Mock data - replace with real API calls
  const recentActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'application',
      title: 'Applied to Senior Software Engineer',
      description: 'TechCorp Inc. - San Francisco, CA',
      timestamp: '2 hours ago',
      status: 'info',
    },
    {
      id: '2',
      type: 'match',
      title: 'New Job Match: 95%',
      description: 'Full Stack Developer at StartupXYZ',
      timestamp: '5 hours ago',
      status: 'success',
    },
    {
      id: '3',
      type: 'interview',
      title: 'Interview Scheduled',
      description: 'Product Manager role - Thursday 2PM',
      timestamp: '1 day ago',
      status: 'warning',
    },
    {
      id: '4',
      type: 'message',
      title: 'Message from Recruiter',
      description: 'Jane Smith from TalentCorp',
      timestamp: '2 days ago',
      status: 'neutral',
    },
  ];

  const matchScoreTrend: ChartDataPoint[] = [
    { name: 'Mon', value: 78 },
    { name: 'Tue', value: 82 },
    { name: 'Wed', value: 85 },
    { name: 'Thu', value: 83 },
    { name: 'Fri', value: 88 },
    { name: 'Sat', value: 91 },
    { name: 'Sun', value: 92 },
  ];

  const applicationStatus: ChartDataPoint[] = [
    { name: 'Applied', value: 24 },
    { name: 'Screening', value: 12 },
    { name: 'Interview', value: 5 },
    { name: 'Offer', value: 2 },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your job search overview.</p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricWidget
            title="Total Applications"
            value={24}
            subtitle="Last 30 days"
            trend={{ value: 12, isPositive: true }}
            variant="default"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <MetricWidget
            title="Avg Match Score"
            value="87%"
            subtitle="Up from last week"
            trend={{ value: 5, isPositive: true }}
            variant="success"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <MetricWidget
            title="Active Interviews"
            value={5}
            subtitle="3 this week"
            variant="info"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />

          <MetricWidget
            title="Resume Health"
            value="92/100"
            subtitle="Excellent"
            variant="success"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartWidget
            title="Match Score Trend"
            subtitle="Last 7 days"
            data={matchScoreTrend}
            type="line"
            color="#10b981"
          />

          <ChartWidget
            title="Application Pipeline"
            subtitle="Current status breakdown"
            data={applicationStatus}
            type="bar"
            color="#3b82f6"
          />
        </div>

        {/* Bottom Section - Activity Feed & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityFeed activities={recentActivities} maxItems={8} />
          </div>

          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="primary" className="w-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Jobs
                </Button>
                <Button variant="outline" className="w-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Upload Resume
                </Button>
                <Button variant="ghost" className="w-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </Button>
              </CardContent>
            </Card>

            {/* AI Suggestions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-900">Add TypeScript skills to boost matches by 15%</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">Update resume headline for better visibility</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">Apply to 3 jobs matching 90%+ score</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
