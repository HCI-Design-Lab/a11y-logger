import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { SectionEditor } from '@/components/reports/section-editor';

test('renders existing sections', () => {
  render(
    <SectionEditor sections={[{ title: 'Overview', content: 'Some content' }]} onChange={vi.fn()} />
  );
  expect(screen.getByDisplayValue('Overview')).toBeInTheDocument();
});

test('add section button creates new empty section', () => {
  const onChange = vi.fn();
  render(<SectionEditor sections={[]} onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: /add section/i }));
  expect(onChange).toHaveBeenCalledWith([{ title: '', content: '' }]);
});

test('removing a section calls onChange without it', () => {
  const onChange = vi.fn();
  const sections = [
    { title: 'Section 1', content: 'Content 1' },
    { title: 'Section 2', content: 'Content 2' },
  ];
  render(<SectionEditor sections={sections} onChange={onChange} />);
  fireEvent.click(screen.getAllByRole('button', { name: /remove/i })[0]);
  expect(onChange).toHaveBeenCalledWith([{ title: 'Section 2', content: 'Content 2' }]);
});
