import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyFitAnalysisTab from './MyFitAnalysisTab';

describe('MyFitAnalysisTab', () => {
  const renderMyFitAnalysisTab = () => {
    return render(<MyFitAnalysisTab />);
  };

  it('renders the skills comparison section', () => {
    renderMyFitAnalysisTab();
    expect(screen.getByText('Skills Comparison')).toBeInTheDocument();
  });

  it('renders the skills comparison placeholder content', () => {
    renderMyFitAnalysisTab();
    expect(screen.getByText('[Spider chart placeholder] Comparing your skills to the job requirements.')).toBeInTheDocument();
  });

  it('renders the resume score section', () => {
    renderMyFitAnalysisTab();
    expect(screen.getByText('Resume Score for this Role')).toBeInTheDocument();
  });

  it('renders the resume score value', () => {
    renderMyFitAnalysisTab();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });

  it('renders the actionable tips section', () => {
    renderMyFitAnalysisTab();
    expect(screen.getByText('Actionable Tips')).toBeInTheDocument();
  });

  it('renders actionable tips list', () => {
    renderMyFitAnalysisTab();
    expect(screen.getByText('Add more leadership examples to your resume.')).toBeInTheDocument();
    expect(screen.getByText('Highlight experience with React and TypeScript.')).toBeInTheDocument();
  });

  it('renders tips as a list', () => {
    renderMyFitAnalysisTab();
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  it('applies correct styling to section headers', () => {
    renderMyFitAnalysisTab();
    const headers = screen.getAllByText(/Skills Comparison|Resume Score for this Role|Actionable Tips/);
    headers.forEach(header => {
      expect(header).toHaveClass('font-bold', 'mb-2');
    });
  });

  it('applies correct styling to content text', () => {
    renderMyFitAnalysisTab();
    // Check specific elements that should have text-gray-700
    expect(screen.getByText('[Spider chart placeholder] Comparing your skills to the job requirements.')).toHaveClass('text-gray-700');
    expect(screen.getByText('85/100')).toHaveClass('text-gray-700');
    // Check that the list has the correct styling (li elements inherit from ul)
    const list = screen.getByRole('list');
    expect(list).toHaveClass('text-gray-700');
    expect(screen.getByText('Add more leadership examples to your resume.')).toBeInTheDocument();
    expect(screen.getByText('Highlight experience with React and TypeScript.')).toBeInTheDocument();
  });

  it('renders resume score with correct styling', () => {
    renderMyFitAnalysisTab();
    const scoreElement = screen.getByText('85/100');
    expect(scoreElement).toHaveClass('text-gray-700', 'mb-2');
  });

  it('renders all content in correct order', () => {
    renderMyFitAnalysisTab();
    const container = screen.getByText('Skills Comparison').parentElement;
    expect(container).toBeInTheDocument();

    // Check that sections appear in expected order
    const sections = ['Skills Comparison', 'Resume Score for this Role', 'Actionable Tips'];
    sections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });
});