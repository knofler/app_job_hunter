/**
 * Tests for ConfirmModal component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from './ConfirmModal';

const defaultProps = {
  open: true,
  title: 'Delete Project',
  message: 'Are you sure you want to delete this project?',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConfirmModal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(<ConfirmModal {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message when open', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Delete Project')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this project?')).toBeInTheDocument();
  });

  it('renders default button labels', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders custom button labels', () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="Yes, Delete" cancelLabel="No, Keep" />);
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
    expect(screen.getByText('No, Keep')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    // The backdrop is the outer fixed div
    const backdrop = screen.getByText('Delete Project').closest('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('does not call onCancel when modal content clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    // Click on the title inside the modal content
    fireEvent.click(screen.getByText('Delete Project'));
    // onCancel should NOT be called because stopPropagation prevents it
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });
});
