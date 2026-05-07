import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-11 w-full rounded-2xl border px-4 py-2 text-sm ring-offset-background transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-white/[0.02]",
  {
    variants: {
      variant: {
        default: "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/40 focus-visible:bg-white/[0.04] backdrop-blur-md",
        neon: "border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0 focus-visible:border-primary/50 focus-visible:shadow-[0_0_15px_hsl(var(--primary)/0.15)]",
        glass: "border-border/20 bg-card/40 backdrop-blur-xl hover:border-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 focus-visible:border-primary/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps extends React.ComponentProps<"input">, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
