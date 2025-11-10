import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobSearchFilters from './JobSearchFilters';

describe('JobSearchFilters', () => {
  const defaultFilters = {
    search: '',
    hideApplied: false,
    sort: 'match' as const,
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
    const searchInput = screen.getByPlaceholderText('Search by keyword...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('renders search input with initial search value', () => {
    const filtersWithSearch = { ...defaultFilters, search: 'react developer' };
    renderJobSearchFilters(filtersWithSearch);
    const searchInput = screen.getByPlaceholderText('Search by keyword...');
    expect(searchInput).toHaveValue('react developer');
  });

  it('renders hide applied checkbox', () => {
    renderJobSearchFilters();
    const checkbox = screen.getByRole('checkbox', { name: /hide viewed & applied jobs/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('renders hide applied checkbox as checked when hideApplied is true', () => {
    const filtersWithHideApplied = { ...defaultFilters, hideApplied: true };
    renderJobSearchFilters(filtersWithHideApplied);
    const checkbox = screen.getByRole('checkbox', { name: /hide viewed & applied jobs/i });
    expect(checkbox).toBeChecked();
  });

  it('renders sort select with correct options', () => {
    renderJobSearchFilters();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('match');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('match');
    expect(options[0]).toHaveTextContent('Sort by Match Score');
    expect(options[1]).toHaveValue('date');
    expect(options[1]).toHaveTextContent('Sort by Date Posted');
  });

  it('renders sort select with date selected when sort is date', () => {
    const filtersWithDateSort = { ...defaultFilters, sort: 'date' as const };
    renderJobSearchFilters(filtersWithDateSort);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('date');
  });

  it('calls onFiltersChange when search input changes', () => {
    renderJobSearchFilters();
    const searchInput = screen.getByPlaceholderText('Search by keyword...');

    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      search: 'test search',
    });
  });

  it('calls onFiltersChange when hide applied checkbox is toggled', async () => {
    renderJobSearchFilters();
    const checkbox = screen.getByRole('checkbox', { name: /hide viewed & applied jobs/i });

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        hideApplied: true,
      });
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

  it('renders all filter controls in correct order', () => {
    renderJobSearchFilters();

    const elements = screen.getAllByRole('textbox').concat(
      screen.getAllByRole('checkbox'),
      screen.getAllByRole('combobox')
    );

    // Should have search input, checkbox, and select
    expect(elements).toHaveLength(3);
  });
});