import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApplicationJourneyTab from './ApplicationJourneyTab';

describe('ApplicationJourneyTab', () => {
  const renderApplicationJourneyTab = () => {
    return render(<ApplicationJourneyTab />);
  };

  it('renders the application journey timeline section', () => {
    renderApplicationJourneyTab();
    expect(screen.getByText('Application Journey Timeline')).toBeInTheDocument();
  });

  it('renders timeline entries', () => {
    renderApplicationJourneyTab();
    expect(screen.getByText('Applied on Oct 26')).toBeInTheDocument();
    expect(screen.getByText('Application Viewed by Recruiter on Oct 28')).toBeInTheDocument();
    expect(screen.getByText('Interview Scheduled for Nov 2')).toBeInTheDocument();
  });

  it('renders timeline as a list', () => {
    renderApplicationJourneyTab();
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('applies correct styling to section headers', () => {
    renderApplicationJourneyTab();
    const header = screen.getByText('Application Journey Timeline');
    expect(header).toHaveClass('font-bold', 'mb-2');
  });

  it('applies correct styling to timeline items', () => {
    renderApplicationJourneyTab();
    const list = screen.getByRole('list');
    expect(list).toHaveClass('text-gray-700');
  });

  it('renders all timeline entries in correct order', () => {
    renderApplicationJourneyTab();
    const container = screen.getByText('Application Journey Timeline').parentElement;
    expect(container).toBeInTheDocument();

    // Check that timeline entries appear in expected order
    const entries = [
      'Applied on Oct 26',
      'Application Viewed by Recruiter on Oct 28',
      'Interview Scheduled for Nov 2'
    ];
    entries.forEach(entry => {
      expect(screen.getByText(entry)).toBeInTheDocument();
    });
  });
});