import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // ─── Base ────────────────────────────────────────────────────────────────────
  // transition-all covers color/background/shadow changes (150ms default via Tailwind)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // ─── Primary ────────────────────────────────────────────────────────────
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:shadow-[0_0_0_3px_oklch(0.93_0.05_265/0.35)] aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:bg-destructive/10",
        // ─── Destructive ────────────────────────────────────────────────────────
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 dark:hover:bg-destructive/80 dark:active:bg-destructive/70 focus-visible:border-destructive focus-visible:ring-[3px] focus-visible:ring-destructive/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // ─── Outline ─────────────────────────────────────────────────────────────
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent active:bg-accent/80 dark:border-sidebar-border dark:bg-transparent dark:hover:bg-input/50 dark:active:bg-input/70 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:shadow-[0_0_0_3px_oklch(0.93_0.05_265/0.35)] aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // ─── Secondary ───────────────────────────────────────────────────────────
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80 dark:active:bg-secondary/70 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:shadow-[0_0_0_3px_oklch(0.93_0.05_265/0.35)] aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // ─── Ghost ──────────────────────────────────────────────────────────────
        ghost:
          "hover:bg-accent active:bg-accent/80 dark:hover:bg-accent/50 dark:active:bg-accent/70 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:shadow-[0_0_0_3px_oklch(0.93_0.05_265/0.35)] aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // ─── Link ───────────────────────────────────────────────────────────────
        link: "text-primary underline-offset-4 hover:underline active:opacity-80 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 min-w-[44px] min-h-[44px] p-1 md:p-0",
        "icon-sm": "size-8 min-w-[44px] min-h-[44px] p-2 md:p-0",
        "icon-lg": "size-10 min-w-[44px] min-h-[44px] p-0.5 md:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
