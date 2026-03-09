import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock Tiptap — it requires browser APIs not available in jsdom
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    chain: () => ({ focus: () => ({ toggleBold: () => ({ run: vi.fn() }) }) }),
    isActive: vi.fn(() => false),
    getHTML: vi.fn(() => '<p>Hello</p>'),
    commands: { setContent: vi.fn() },
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
    isEmpty: false,
  })),
  EditorContent: vi.fn(({ editor }) => (
    <div data-testid="editor-content" contentEditable suppressContentEditableWarning>
      {editor ? 'editor loaded' : 'no editor'}
    </div>
  )),
}));

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-heading', () => ({ default: { configure: vi.fn(() => ({})) } }));

import { RichTextEditor } from '@/components/ui/rich-text-editor';

describe('RichTextEditor', () => {
  it('renders the editor content area', () => {
    render(<RichTextEditor value="<p>Hello</p>" onChange={vi.fn()} />);
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  it('renders toolbar with bold button', () => {
    render(<RichTextEditor value="" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
  });

  it('renders toolbar with italic button', () => {
    render(<RichTextEditor value="" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
  });

  it('renders toolbar with underline button', () => {
    render(<RichTextEditor value="" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /underline/i })).toBeInTheDocument();
  });

  it('renders toolbar with heading buttons', () => {
    render(<RichTextEditor value="" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /h2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /h3/i })).toBeInTheDocument();
  });

  it('renders toolbar with bullet list button', () => {
    render(<RichTextEditor value="" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /bullet list/i })).toBeInTheDocument();
  });

  it('renders toolbar with ordered list button', () => {
    render(<RichTextEditor value="" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /ordered list/i })).toBeInTheDocument();
  });

  it('renders toolbar with blockquote button', () => {
    render(<RichTextEditor value="" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /blockquote/i })).toBeInTheDocument();
  });
});
