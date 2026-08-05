/* eslint-disable react-refresh/only-export-components -- file intentionally exports variants/hooks alongside components; HMR-only rule */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Core variants — neon enhanced
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-[0_0_12px_hsl(var(--primary)/0.15)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] shadow-[0_0_12px_hsl(var(--destructive)/0.15)]",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/25 active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Semantic variants
        success: "bg-success text-success-foreground hover:bg-success/90 active:scale-[0.98] shadow-[0_0_12px_hsl(var(--success)/0.15)]",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 active:scale-[0.98] shadow-[0_0_12px_hsl(var(--warning)/0.15)]",
        info: "bg-info text-info-foreground hover:bg-info/90 active:scale-[0.98] shadow-[0_0_12px_hsl(var(--info)/0.15)]",
        
        // Neon variants
        gradient: "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] active:scale-[0.98]",
        neon: "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] active:scale-[0.98]",
        subtle: "bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.98]",
        "subtle-destructive": "bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-[0.98]",
        "subtle-success": "bg-success/10 text-success hover:bg-success/20 active:scale-[0.98]",
        "subtle-warning": "bg-warning/10 text-warning hover:bg-warning/20 active:scale-[0.98]",
        
        // Premium/elevated — neon glow
        premium: "bg-gradient-to-r from-primary via-[hsl(280,80%,60%)] to-primary text-white shadow-[0_0_25px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_35px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5 active:translate-y-0",
        glass: "bg-background/50 backdrop-blur-xl border border-border/30 hover:bg-background/70 hover:border-primary/20 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    if (asChild) {
      return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
    }
    
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : leftIcon ? (
          <span aria-hidden="true">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };