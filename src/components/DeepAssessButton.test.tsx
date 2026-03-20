/**
 * Tests for DeepAssessButton component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import DeepAssessButton from './DeepAssessButton';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
});

describe('DeepAssessButton', () => {
  it('renders the button with text "Deep Assess"', () => {
    render(<DeepAssessButton resumeId="r1" />);
    expect(screen.getByText('Deep Assess')).toBeInTheDocument();
  });

  it('navigates with resumeId on click', () => {
    render(<DeepAssessButton resumeId="r1" />);
    fireEvent.click(screen.getByText('Deep Assess'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('resumeId=r1'));
  });

  it('includes resumeName in URL when provided', () => {
    render(<DeepAssessButton resumeId="r1" resumeName="John Resume" />);
    fireEvent.click(screen.getByText('Deep Assess'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('resumeName=John+Resume'));
  });

  it('includes jdId in URL when provided', () => {
    render(<DeepAssessButton resumeId="r1" jdId="jd-123" />);
    fireEvent.click(screen.getByText('Deep Assess'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('jdId=jd-123'));
  });

  it('includes jdText when no jdId and text is short enough', () => {
    render(<DeepAssessButton resumeId="r1" jdText="Short JD text" />);
    fireEvent.click(screen.getByText('Deep Assess'));
    const url = mockPush.mock.calls[0][0];
    expect(url).toContain('jdText=');
  });

  it('does not include jdText when jdId is provided', () => {
    render(<DeepAssessButton resumeId="r1" jdId="jd-1" jdText="Some JD" />);
    fireEvent.click(screen.getByText('Deep Assess'));
    const url = mockPush.mock.calls[0][0];
    expect(url).not.toContain('jdText=');
  });

  it('does not include jdText when text is too long (>= 2000 chars)', () => {
    const longText = 'x'.repeat(2000);
    render(<DeepAssessButton resumeId="r1" jdText={longText} />);
    fireEvent.click(screen.getByText('Deep Assess'));
    const url = mockPush.mock.calls[0][0];
    expect(url).not.toContain('jdText=');
  });

  it('navigates to /recruiters/ai-assessment', () => {
    render(<DeepAssessButton resumeId="r1" />);
    fireEvent.click(screen.getByText('Deep Assess'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/recruiters/ai-assessment'));
  });

  it('has the correct title attribute', () => {
    render(<DeepAssessButton resumeId="r1" />);
    const button = screen.getByTitle('Open deep AI assessment for this candidate');
    expect(button).toBeInTheDocument();
  });
});
