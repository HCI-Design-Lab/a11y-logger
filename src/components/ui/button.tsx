import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-xs font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none a11y-focus",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border border-transparent hover:bg-transparent hover:border-dashed hover:border-primary hover:text-primary hover:underline',
        destructive:
          'bg-destructive text-white border border-transparent focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 hover:bg-transparent hover:border-dashed hover:border-destructive hover:text-destructive hover:underline',
        outline:
          'border border-border bg-background text-foreground dark:border-border hover:bg-transparent hover:border-dashed hover:text-foreground hover:underline',
        secondary:
          'bg-secondary text-secondary-foreground border border-transparent hover:bg-transparent hover:border-dashed hover:border-secondary hover:text-secondary-foreground hover:underline',
        ghost:
          'text-muted-foreground border border-transparent hover:bg-transparent hover:border-dashed hover:border-border hover:text-foreground hover:underline',
        success:
          'bg-success text-success-foreground border border-transparent focus-visible:ring-success/20 hover:bg-transparent hover:border-dashed hover:border-success hover:text-success hover:underline',
        ai: 'bg-ai text-white border border-transparent focus-visible:ring-ai/20 dark:focus-visible:ring-ai/40 hover:bg-transparent hover:border-dashed hover:border-ai hover:text-ai hover:underline',
        cancel:
          'border border-border text-foreground hover:bg-transparent hover:border-dashed hover:text-foreground hover:underline',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-3 has-[>svg]:px-3 has-[>svg]:py-3',
        xs: "h-6 gap-1 rounded-[4px] px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 rounded-[4px] gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-[4px] px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-[4px] [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
    compoundVariants: [],
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
