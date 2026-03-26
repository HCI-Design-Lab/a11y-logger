import { render } from '@testing-library/react';
import { Button } from '../button';

function getButtonClasses(element: HTMLElement): string {
  return element.className;
}

describe('Button hover inverse colors', () => {
  test('default variant has transparent background on hover', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:bg-transparent');
    expect(classes).toContain('hover:text-primary');
  });

  test('destructive variant has transparent background on hover in light mode', () => {
    const { getByRole } = render(<Button variant="destructive">Delete</Button>);
    const classes = getButtonClasses(getByRole('button'));
    const classList = classes.split(' ');
    expect(classes).toContain('hover:bg-transparent');
    expect(classList).not.toContain('hover:bg-white');
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

describe('Success button variant', () => {
  test('success variant renders with success background and white text', () => {
    const { getByRole } = render(<Button variant="success">New Project</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('bg-success');
    expect(classes).toContain('text-white');
  });

  test('success variant has transparent background and success text on hover', () => {
    const { getByRole } = render(<Button variant="success">New Project</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:bg-transparent');
    expect(classes).toContain('hover:text-success');
  });

  test('success variant gets dashed border on hover', () => {
    const { getByRole } = render(<Button variant="success">New Project</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:border-dashed');
  });

  test('success variant gets transparent background on hover in dark mode', () => {
    const { getByRole } = render(<Button variant="success">New Project</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('dark:hover:bg-transparent');
    expect(classes).not.toContain('dark:hover:bg-white');
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

  test('outline variant does NOT get dashed border on hover in light mode', () => {
    const { getByRole } = render(<Button variant="outline">Outline</Button>);
    const classList = getButtonClasses(getByRole('button')).split(' ');
    expect(classList).not.toContain('hover:border-dashed');
  });
});

describe('Cancel button variant', () => {
  test('cancel variant renders without error', () => {
    const { getByRole } = render(<Button variant="cancel">Cancel</Button>);
    expect(getByRole('button')).toBeInTheDocument();
  });

  test('cancel variant has no background color change on hover', () => {
    const { getByRole } = render(<Button variant="cancel">Cancel</Button>);
    const classList = getButtonClasses(getByRole('button')).split(' ');
    expect(classList).not.toContain('hover:bg-primary-foreground');
    expect(classList).not.toContain('hover:bg-white');
    expect(classList).not.toContain('hover:bg-accent');
  });

  test('cancel variant gets dashed border on hover in light mode', () => {
    const { getByRole } = render(<Button variant="cancel">Cancel</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('hover:border-dashed');
  });

  test('cancel variant gets dashed white border on hover in dark mode', () => {
    const { getByRole } = render(<Button variant="cancel">Cancel</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('dark:hover:border-dashed');
    expect(classes).toContain('dark:hover:border-white');
  });

  test('cancel variant has no background change on hover in dark mode', () => {
    const { getByRole } = render(<Button variant="cancel">Cancel</Button>);
    const classList = getButtonClasses(getByRole('button')).split(' ');
    expect(classList).not.toContain('dark:hover:bg-white');
  });
});

describe('Button dark mode hover', () => {
  test('destructive variant gets transparent background on hover in dark mode', () => {
    const { getByRole } = render(<Button variant="destructive">Delete</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('dark:hover:bg-transparent');
    expect(classes).not.toContain('dark:hover:bg-white');
  });

  test('outline variant gets transparent background on hover in dark mode', () => {
    const { getByRole } = render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('dark:hover:bg-transparent');
    expect(classes).not.toContain('dark:hover:bg-white');
  });

  test('outline variant gets dashed border on hover in dark mode', () => {
    const { getByRole } = render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('dark:hover:border-dashed');
  });

  test('success variant gets transparent background on hover in dark mode', () => {
    const { getByRole } = render(<Button variant="success">New</Button>);
    const classes = getButtonClasses(getByRole('button'));
    expect(classes).toContain('dark:hover:bg-transparent');
    expect(classes).not.toContain('dark:hover:bg-white');
  });
});
