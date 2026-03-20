import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobSearchFilters from './JobSearchFilters';
import type { JobFilters } from './JobSearchFilters';

describe('JobSearchFilters', () => {
  const defaultFilters: JobFilters = {
    search: '',
    hideApplied: false,
    sort: 'match',
    locationType: [],
    jobType: [],
    experience: 'any',
    skills: [],
  };

  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderJobSearchFilters = (filters = defaultFilters) => {
    return render(
      <JobSearchFilters
        filters={filters}
        onFiltersChange={mockOnFiltersChange}
      />
    );
  };

  it('renders search input with correct placeholder', () => {
    renderJobSearchFilters();
    const searchInput = screen.getByPlaceholderText('Title, company, or skills...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('renders search input with initial search value', () => {
    const filtersWithSearch = { ...defaultFilters, search: 'react developer' };
    renderJobSearchFilters(filtersWithSearch);
    const searchInput = screen.getByPlaceholderText('Title, company, or skills...');
    expect(searchInput).toHaveValue('react developer');
  });

  it('renders hide applied toggle', () => {
    renderJobSearchFilters();
    // The component uses a toggle switch with sr-only checkbox, labeled "Hide applied jobs"
    expect(screen.getByText('Hide applied jobs')).toBeInTheDocument();
  });

  it('renders sort select with correct options', () => {
    renderJobSearchFilters();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('match');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('match');
    expect(options[0]).toHaveTextContent('Best Match');
    expect(options[1]).toHaveValue('date');
    expect(options[1]).toHaveTextContent('Most Recent');
    expect(options[2]).toHaveValue('salary');
    expect(options[2]).toHaveTextContent('Highest Salary');
  });

  it('renders sort select with date selected when sort is date', () => {
    const filtersWithDateSort = { ...defaultFilters, sort: 'date' as const };
    renderJobSearchFilters(filtersWithDateSort);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('date');
  });

  it('calls onFiltersChange when search input changes', () => {
    renderJobSearchFilters();
    const searchInput = screen.getByPlaceholderText('Title, company, or skills...');

    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      search: 'test search',
    });
  });

  it('calls onFiltersChange when sort select changes', async () => {
    renderJobSearchFilters();
    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'date' } });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        sort: 'date',
      });
    });
  });

  it('renders location type filter checkboxes', () => {
    renderJobSearchFilters();
    expect(screen.getByText('Remote')).toBeInTheDocument();
    expect(screen.getByText('On-site')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
  });

  it('renders job type filter checkboxes', () => {
    renderJobSearchFilters();
    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getByText('Contract')).toBeInTheDocument();
    expect(screen.getByText('Part-time')).toBeInTheDocument();
  });

  it('renders experience level buttons', () => {
    renderJobSearchFilters();
    expect(screen.getByText('Any Experience')).toBeInTheDocument();
    expect(screen.getByText('Entry (0-2y)')).toBeInTheDocument();
    expect(screen.getByText('Mid (3-5y)')).toBeInTheDocument();
    expect(screen.getByText('Senior (5y+)')).toBeInTheDocument();
  });
});
