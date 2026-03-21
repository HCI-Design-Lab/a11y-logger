import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { MultiSelect } from '../multi-select';

const options = [
  { value: 'p1', label: 'Project Alpha' },
  { value: 'p2', label: 'Project Beta' },
  { value: 'p3', label: 'Project Gamma' },
];

describe('MultiSelect', () => {
  it('trigger has combobox role, not button, to avoid nested button invalid HTML', () => {
    render(
      <MultiSelect options={options} selected={[]} onChange={vi.fn()} placeholder="Select…" />
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    // The combobox should be a div, not a button, so remove-buttons can nest inside without error
    expect(screen.getByRole('combobox').tagName).toBe('DIV');
  });

  it('shows placeholder when nothing is selected', () => {
    render(
      <MultiSelect
        options={options}
        selected={[]}
        onChange={vi.fn()}
        placeholder="Select projects…"
      />
    );
    expect(screen.getByText('Select projects…')).toBeInTheDocument();
  });

  it('shows selected item labels as badges when items are selected', () => {
    render(
      <MultiSelect
        options={options}
        selected={['p1', 'p2']}
        onChange={vi.fn()}
        placeholder="Select…"
      />
    );
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('opens the option list when the trigger is clicked', async () => {
    render(
      <MultiSelect options={options} selected={[]} onChange={vi.fn()} placeholder="Select…" />
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('shows all options in the dropdown', async () => {
    render(
      <MultiSelect options={options} selected={[]} onChange={vi.fn()} placeholder="Select…" />
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: /Project Alpha/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Project Beta/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Project Gamma/ })).toBeInTheDocument();
  });

  it('calls onChange with the new value when an unselected option is clicked', async () => {
    const onChange = vi.fn();
    render(
      <MultiSelect options={options} selected={[]} onChange={onChange} placeholder="Select…" />
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    expect(onChange).toHaveBeenCalledWith(['p1']);
  });

  it('calls onChange without the value when a selected option is clicked', async () => {
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={options}
        selected={['p1', 'p2']}
        onChange={onChange}
        placeholder="Select…"
      />
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Project Alpha/ }));
    expect(onChange).toHaveBeenCalledWith(['p2']);
  });

  it('filters options based on the search input', async () => {
    render(
      <MultiSelect options={options} selected={[]} onChange={vi.fn()} placeholder="Select…" />
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('textbox'), 'Alpha');
    expect(screen.getByRole('option', { name: /Project Alpha/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Project Beta/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Project Gamma/ })).not.toBeInTheDocument();
  });

  it('removes a selected item when its remove button is clicked', async () => {
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={options}
        selected={['p1', 'p2']}
        onChange={onChange}
        placeholder="Select…"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Project Alpha' }));
    expect(onChange).toHaveBeenCalledWith(['p2']);
  });
});
