import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/en.json';
import { GenerateAllConfirmDialog } from '@/components/vpats/generate-all-confirm-dialog';

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('GenerateAllConfirmDialog', () => {
  it('shows the criteria count in the description', () => {
    renderWithIntl(
      <GenerateAllConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        criteriaCount={42}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/42 criteria/)).toBeInTheDocument();
  });

  it('warns that generation may take a few minutes', () => {
    renderWithIntl(
      <GenerateAllConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        criteriaCount={10}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/few minutes/i)).toBeInTheDocument();
  });

  it('calls onConfirm when the Generate button is clicked', async () => {
    const onConfirm = vi.fn();
    renderWithIntl(
      <GenerateAllConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        criteriaCount={5}
        onConfirm={onConfirm}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /generate/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onOpenChange(false) when Cancel is clicked', async () => {
    const onOpenChange = vi.fn();
    renderWithIntl(
      <GenerateAllConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        criteriaCount={5}
        onConfirm={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('Generate button uses the ai variant', () => {
    renderWithIntl(
      <GenerateAllConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        criteriaCount={5}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /generate/i })).toHaveAttribute('data-variant', 'ai');
  });

  it('Generate button has a Sparkles icon', () => {
    renderWithIntl(
      <GenerateAllConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        criteriaCount={5}
        onConfirm={vi.fn()}
      />
    );
    const generateBtn = screen.getByRole('button', { name: /generate/i });
    expect(generateBtn.querySelector('.lucide-sparkles')).toBeInTheDocument();
  });

  it('Cancel button has an X icon', () => {
    renderWithIntl(
      <GenerateAllConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        criteriaCount={5}
        onConfirm={vi.fn()}
      />
    );
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    expect(cancelBtn.querySelector('.lucide-x')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    renderWithIntl(
      <GenerateAllConfirmDialog
        open={false}
        onOpenChange={vi.fn()}
        criteriaCount={5}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByText(/criteria/)).not.toBeInTheDocument();
  });

  it('shows title via i18n', () => {
    renderWithIntl(
      <GenerateAllConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        criteriaCount={5}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/generate all criteria/i)).toBeInTheDocument();
  });
});
