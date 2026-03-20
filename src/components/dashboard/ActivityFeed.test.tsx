/**
 * Tests for ActivityFeed component
 */

import { render, screen } from '@testing-library/react';
import ActivityFeed, { type ActivityItem } from './ActivityFeed';

const mockActivities: ActivityItem[] = [
  { id: '1', type: 'application', title: 'New Application', description: 'Applied to Senior Dev', timestamp: '2 hours ago', status: 'success' },
  { id: '2', type: 'match', title: 'New Match', description: '92% match with React role', timestamp: '5 hours ago', status: 'info' },
  { id: '3', type: 'interview', title: 'Interview Scheduled', description: 'Round 2 with Acme Corp', timestamp: '1 day ago' },
  { id: '4', type: 'message', title: 'New Message', description: 'From recruiter at Beta Inc', timestamp: '2 days ago', status: 'neutral' },
];

describe('ActivityFeed', () => {
  it('renders "Recent Activity" header', () => {
    render(<ActivityFeed activities={mockActivities} />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('renders all activity items', () => {
    render(<ActivityFeed activities={mockActivities} />);
    expect(screen.getByText('New Application')).toBeInTheDocument();
    expect(screen.getByText('New Match')).toBeInTheDocument();
    expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();
    expect(screen.getByText('New Message')).toBeInTheDocument();
  });

  it('renders descriptions and timestamps', () => {
    render(<ActivityFeed activities={mockActivities} />);
    expect(screen.getByText('Applied to Senior Dev')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('renders status badges when provided', () => {
    render(<ActivityFeed activities={mockActivities} />);
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('info')).toBeInTheDocument();
  });

  it('respects maxItems limit', () => {
    render(<ActivityFeed activities={mockActivities} maxItems={2} />);
    expect(screen.getByText('New Application')).toBeInTheDocument();
    expect(screen.getByText('New Match')).toBeInTheDocument();
    expect(screen.queryByText('Interview Scheduled')).not.toBeInTheDocument();
    expect(screen.queryByText('New Message')).not.toBeInTheDocument();
  });

  it('shows empty state when no activities', () => {
    render(<ActivityFeed activities={[]} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });
});
