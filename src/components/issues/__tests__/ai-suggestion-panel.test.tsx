import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { AiSuggestionPanel } from '../ai-suggestion-panel';

describe('AiSuggestionPanel', () => {
  const defaultProps = {
    aiDescription: '',
    onDescriptionChange: vi.fn(),
    onGenerate: vi.fn(),
    aiLoading: false,
    aiError: null,
  };

  it('renders the AI assistance textarea', () => {
    render(<AiSuggestionPanel {...defaultProps} />);
    expect(screen.getByLabelText(/ai assistance description/i)).toBeInTheDocument();
  });

  it('renders the Generate with AI button', () => {
    render(<AiSuggestionPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /generate with ai/i })).toBeInTheDocument();
  });

  it('disables the Generate button when aiDescription is empty', () => {
    render(<AiSuggestionPanel {...defaultProps} aiDescription="" />);
    expect(screen.getByRole('button', { name: /generate with ai/i })).toBeDisabled();
  });

  it('enables the Generate button when aiDescription has content', () => {
    render(<AiSuggestionPanel {...defaultProps} aiDescription="Some description" />);
    expect(screen.getByRole('button', { name: /generate with ai/i })).not.toBeDisabled();
  });

  it('calls onDescriptionChange when textarea value changes', () => {
    const onDescriptionChange = vi.fn();
    render(<AiSuggestionPanel {...defaultProps} onDescriptionChange={onDescriptionChange} />);
    fireEvent.change(screen.getByLabelText(/ai assistance description/i), {
      target: { value: 'new text' },
    });
    expect(onDescriptionChange).toHaveBeenCalledWith('new text');
  });

  it('calls onGenerate when the button is clicked', () => {
    const onGenerate = vi.fn();
    render(
      <AiSuggestionPanel {...defaultProps} aiDescription="has content" onGenerate={onGenerate} />
    );
    fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('shows Generating… label and disables button while aiLoading is true', () => {
    render(<AiSuggestionPanel {...defaultProps} aiDescription="desc" aiLoading={true} />);
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });

  it('disables the textarea while aiLoading is true', () => {
    render(<AiSuggestionPanel {...defaultProps} aiLoading={true} />);
    expect(screen.getByLabelText(/ai assistance description/i)).toBeDisabled();
  });

  it('displays aiError when provided', () => {
    render(<AiSuggestionPanel {...defaultProps} aiError="AI not configured" />);
    expect(screen.getByText(/ai not configured/i)).toBeInTheDocument();
  });

  it('does not display an error paragraph when aiError is null', () => {
    render(<AiSuggestionPanel {...defaultProps} aiError={null} />);
    expect(screen.queryByText(/ai not configured/i)).not.toBeInTheDocument();
  });

  it('shows instructional text about component, location, and behavior', () => {
    render(<AiSuggestionPanel {...defaultProps} />);
    expect(screen.getByText(/component/i)).toBeInTheDocument();
    expect(screen.getByText(/location/i)).toBeInTheDocument();
  });
});
