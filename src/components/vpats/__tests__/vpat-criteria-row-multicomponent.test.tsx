// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { UseFormRegister } from 'react-hook-form';
import { Table, TableBody } from '@/components/ui/table';
import { VpatCriteriaRow } from '@/components/vpats/vpat-criteria-row';
import type { VpatCriterionRow } from '@/lib/db/vpat-criterion-rows';

type RemarksFormValues = Record<string, string>;
const mockRegister = ((name: string) => ({
  name,
  ref: vi.fn(),
  onChange: vi.fn(),
  onBlur: vi.fn(),
})) as unknown as UseFormRegister<RemarksFormValues>;

function makeRow(overrides: Partial<VpatCriterionRow> = {}): VpatCriterionRow {
  return {
    id: 'row-1',
    vpat_id: 'v1',
    criterion_id: 'c1',
    criterion_code: '1.1.1',
    criterion_name: 'Non-text Content',
    criterion_name_translated: null,
    criterion_description: '',
    criterion_level: 'A',
    criterion_section: 'Perceivable',
    conformance: 'not_evaluated',
    remarks: null,
    ai_confidence: null,
    ai_reasoning: null,
    ai_referenced_issues: null,
    ai_suggested_conformance: null,
    last_generated_at: null,
    updated_at: '',
    issue_count: 0,
    components: [],
    ...overrides,
  };
}

const wrap = (ui: React.ReactElement) =>
  render(
    <Table>
      <TableBody>{ui}</TableBody>
    </Table>
  );

describe('VpatCriteriaRow — single component', () => {
  it('renders inline conformance select for single-component row (no sub-table)', () => {
    const row = makeRow({
      components: [
        {
          id: 1,
          criterion_row_id: 'row-1',
          component_name: 'web',
          conformance: 'not_evaluated',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
      ],
    });
    wrap(
      <VpatCriteriaRow
        row={row}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.queryByTestId('component-sub-table')).toBeNull();
    expect(screen.getByLabelText('Conformance for 1.1.1')).toBeDefined();
  });
});

describe('VpatCriteriaRow — multi-component', () => {
  it('renders a sub-table when row has >1 component', () => {
    const row = makeRow({
      components: [
        {
          id: 1,
          criterion_row_id: 'row-1',
          component_name: 'web',
          conformance: 'supports',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          criterion_row_id: 'row-1',
          component_name: 'electronic-docs',
          conformance: 'partially_supports',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
      ],
    });
    wrap(
      <VpatCriteriaRow
        row={row}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByTestId('component-sub-table')).toBeDefined();
    expect(screen.getByText('web')).toBeDefined();
    expect(screen.getByText('electronic-docs')).toBeDefined();
  });

  it('renders conformance selects for each component in sub-table', () => {
    const row = makeRow({
      components: [
        {
          id: 1,
          criterion_row_id: 'row-1',
          component_name: 'web',
          conformance: 'supports',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          criterion_row_id: 'row-1',
          component_name: 'electronic-docs',
          conformance: 'partially_supports',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
      ],
    });
    wrap(
      <VpatCriteriaRow
        row={row}
        isEven={false}
        readOnly={false}
        aiEnabled={false}
        isGenerating={false}
        isGeneratingAll={false}
        onRowChange={vi.fn()}
        scheduleRemarksSave={vi.fn()}
        register={mockRegister}
      />
    );
    expect(screen.getByLabelText('Conformance for 1.1.1 — web')).toBeDefined();
    expect(screen.getByLabelText('Conformance for 1.1.1 — electronic-docs')).toBeDefined();
  });

  it('renders Generate button for multi-component row when aiEnabled', () => {
    const row = {
      id: 'row1',
      vpat_id: 'vpat1',
      criterion_code: '1.1.1',
      criterion_name: 'Non-text Content',
      criterion_description: '',
      criterion_name_translated: null,
      section: 'wcag',
      conformance: 'not_evaluated',
      remarks: null,
      issue_count: 0,
      ai_confidence: null,
      ai_reasoning: null,
      ai_suggested_conformance: null,
      ai_referenced_issues: null,
      last_generated_at: null,
      components: [
        { component_name: 'Web', conformance: 'not_evaluated', remarks: null },
        { component_name: 'Docs', conformance: 'not_evaluated', remarks: null },
      ],
    };
    const onGenerateRow = vi.fn();
    render(
      <table>
        <tbody>
          <VpatCriteriaRow
            row={row as never}
            isEven={false}
            readOnly={false}
            aiEnabled={true}
            isGenerating={false}
            isGeneratingAll={false}
            onRowChange={vi.fn()}
            scheduleRemarksSave={vi.fn()}
            onGenerateRow={onGenerateRow}
            register={vi
              .fn()
              .mockReturnValue({ ref: vi.fn(), name: 'row1', onChange: vi.fn(), onBlur: vi.fn() })}
          />
        </tbody>
      </table>
    );
    expect(screen.getByRole('button', { name: /generate for 1\.1\.1/i })).toBeInTheDocument();
  });

  it('renders in readOnly mode without throwing', () => {
    const row = makeRow({
      components: [
        {
          id: 1,
          criterion_row_id: 'row-1',
          component_name: 'web',
          conformance: 'supports',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          criterion_row_id: 'row-1',
          component_name: 'electronic-docs',
          conformance: 'partially_supports',
          remarks: null,
          created_at: '',
          updated_at: '',
        },
      ],
    });
    expect(() =>
      wrap(
        <VpatCriteriaRow
          row={row}
          isEven={false}
          readOnly={true}
          aiEnabled={false}
          isGenerating={false}
          isGeneratingAll={false}
          onRowChange={vi.fn()}
          scheduleRemarksSave={vi.fn()}
          register={mockRegister}
        />
      )
    ).not.toThrow();
  });
});
