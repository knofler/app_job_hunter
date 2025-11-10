import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApplicationProfileTabs from './ApplicationProfileTabs';

describe('ApplicationProfileTabs', () => {
  const renderApplicationProfileTabs = () => {
    return render(<ApplicationProfileTabs />);
  };

  it('renders all three tabs', () => {
    renderApplicationProfileTabs();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('My Fit Analysis')).toBeInTheDocument();
    expect(screen.getByText('Application Journey')).toBeInTheDocument();
  });

  it('shows Overview tab content by default', () => {
    renderApplicationProfileTabs();
    expect(screen.getByText('AI-Generated Job Summary')).toBeInTheDocument();
    expect(screen.getByText('Key Details')).toBeInTheDocument();
  });

  it('switches to My Fit Analysis tab when clicked', () => {
    renderApplicationProfileTabs();
    const fitAnalysisTab = screen.getByText('My Fit Analysis');
    fireEvent.click(fitAnalysisTab);

    expect(screen.getByText('Skills Comparison')).toBeInTheDocument();
    expect(screen.getByText('Resume Score for this Role')).toBeInTheDocument();
  });

  it('switches to Application Journey tab when clicked', () => {
    renderApplicationProfileTabs();
    const journeyTab = screen.getByText('Application Journey');
    fireEvent.click(journeyTab);

    expect(screen.getByText('Application Journey Timeline')).toBeInTheDocument();
    expect(screen.getByText('Applied on Oct 26')).toBeInTheDocument();
  });

  it('highlights the active tab with correct styling', () => {
    renderApplicationProfileTabs();
    const overviewTab = screen.getByText('Overview');
    expect(overviewTab).toHaveClass('border-blue-600', 'text-blue-600');

    const fitAnalysisTab = screen.getByText('My Fit Analysis');
    expect(fitAnalysisTab).toHaveClass('border-transparent', 'text-gray-500');

    const journeyTab = screen.getByText('Application Journey');
    expect(journeyTab).toHaveClass('border-transparent', 'text-gray-500');
  });

  it('highlights My Fit Analysis tab when active', () => {
    renderApplicationProfileTabs();
    const fitAnalysisTab = screen.getByText('My Fit Analysis');
    fireEvent.click(fitAnalysisTab);

    expect(fitAnalysisTab).toHaveClass('border-blue-600', 'text-blue-600');
    expect(screen.getByText('Overview')).toHaveClass('border-transparent', 'text-gray-500');
    expect(screen.getByText('Application Journey')).toHaveClass('border-transparent', 'text-gray-500');
  });

  it('highlights Application Journey tab when active', () => {
    renderApplicationProfileTabs();
    const journeyTab = screen.getByText('Application Journey');
    fireEvent.click(journeyTab);

    expect(journeyTab).toHaveClass('border-blue-600', 'text-blue-600');
    expect(screen.getByText('Overview')).toHaveClass('border-transparent', 'text-gray-500');
    expect(screen.getByText('My Fit Analysis')).toHaveClass('border-transparent', 'text-gray-500');
  });

  it('renders tabs in correct order', () => {
    renderApplicationProfileTabs();
    const tabButtons = screen.getAllByRole('button');
    expect(tabButtons).toHaveLength(3);
    expect(tabButtons[0]).toHaveTextContent('Overview');
    expect(tabButtons[1]).toHaveTextContent('My Fit Analysis');
    expect(tabButtons[2]).toHaveTextContent('Application Journey');
  });

  it('applies correct base styling to all tabs', () => {
    renderApplicationProfileTabs();
    const tabs = screen.getAllByRole('button');

    tabs.forEach(tab => {
      expect(tab).toHaveClass(
        'pb-2',
        'px-2',
        'font-semibold',
        'border-b-2',
        'transition-colors'
      );
    });
  });

  it('applies inactive tab styling correctly', () => {
    renderApplicationProfileTabs();
    const fitAnalysisTab = screen.getByText('My Fit Analysis');

    expect(fitAnalysisTab).toHaveClass('border-transparent', 'text-gray-500');
    expect(fitAnalysisTab).not.toHaveClass('border-blue-600', 'text-blue-600');
  });

  it('maintains tab state when switching between tabs', () => {
    renderApplicationProfileTabs();

    // Switch to My Fit Analysis
    fireEvent.click(screen.getByText('My Fit Analysis'));
    expect(screen.getByText('Skills Comparison')).toBeInTheDocument();

    // Switch to Application Journey
    fireEvent.click(screen.getByText('Application Journey'));
    expect(screen.getByText('Application Journey Timeline')).toBeInTheDocument();

    // Switch back to Overview
    fireEvent.click(screen.getByText('Overview'));
    expect(screen.getByText('AI-Generated Job Summary')).toBeInTheDocument();
  });
});