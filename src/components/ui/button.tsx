import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-xs font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none a11y-focus",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-foreground',
        destructive:
          'bg-destructive text-white hover:opacity-90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'border border-border bg-background text-foreground hover:border-foreground dark:border-border dark:hover:border-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent',
        success: 'bg-success text-white hover:opacity-90 focus-visible:ring-success/20',
        ai: 'bg-ai text-white hover:opacity-90 focus-visible:ring-ai/20 dark:bg-ai/80',
        cancel: 'border border-border text-foreground hover:border-foreground',
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
