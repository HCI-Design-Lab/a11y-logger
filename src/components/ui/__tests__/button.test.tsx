import { render } from '@testing-library/react';
import { Button } from '../button';

function getButtonClasses(element: HTMLElement): string {
  return element.className;
}

describe('Button hover inverse colors', () => {
  test('default variant has inverse hover classes (bg becomes text color, text becomes bg color)', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:bg-primary-foreground');
    expect(classes).toContain('hover:text-primary');
  });

  test('destructive variant has inverse hover classes', () => {
    const { getByRole } = render(<Button variant="destructive">Delete</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:bg-white');
    expect(classes).toContain('hover:text-destructive');
  });

  test('outline variant has inverse hover classes', () => {
    const { getByRole } = render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:bg-foreground');
    expect(classes).toContain('hover:text-background');
  });

  test('secondary variant has inverse hover classes', () => {
    const { getByRole } = render(<Button variant="secondary">Secondary</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:bg-secondary-foreground');
    expect(classes).toContain('hover:text-secondary');
  });

  test('default variant border color does not change on hover', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const classes = getButtonClasses(getByRole('button'));
    // Border style may change but color should not be overridden
    expect(classes).not.toContain('hover:border-primary');
    expect(classes).not.toContain('hover:border-foreground');
  });

  test('outline variant border color does not change on hover', () => {
    const { getByRole } = render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).not.toContain('hover:border-foreground');
    expect(classes).not.toContain('hover:border-primary');
  });
});

describe('Button hover dashed border', () => {
  test('default variant gets dashed border on hover', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:border');
    expect(classes).toContain('hover:border-dashed');
  });

  test('destructive variant gets dashed border on hover', () => {
    const { getByRole } = render(<Button variant="destructive">Delete</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:border');
    expect(classes).toContain('hover:border-dashed');
  });

  test('secondary variant gets dashed border on hover', () => {
    const { getByRole } = render(<Button variant="secondary">Secondary</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:border');
    expect(classes).toContain('hover:border-dashed');
  });

  test('ghost variant gets dashed border on hover', () => {
    const { getByRole } = render(<Button variant="ghost">Ghost</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:border');
    expect(classes).toContain('hover:border-dashed');
  });

  test('outline variant does NOT get dashed border on hover', () => {
    const { getByRole } = render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).not.toContain('hover:border-dashed');
  });
});
