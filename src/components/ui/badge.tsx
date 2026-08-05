/* eslint-disable react-refresh/only-export-components -- file intentionally exports variants/hooks alongside components; HMR-only rule */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Core variants — neon enhanced
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-[0_0_8px_hsl(var(--primary)/0.2)]",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-[0_0_8px_hsl(var(--destructive)/0.2)]",
        outline: "text-foreground border-border/50",
        
        // Semantic variants
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80 shadow-[0_0_8px_hsl(var(--success)/0.2)]",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80 shadow-[0_0_8px_hsl(var(--warning)/0.2)]",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/80 shadow-[0_0_8px_hsl(var(--info)/0.2)]",
        pending: "border-transparent bg-pending text-pending-foreground hover:bg-pending/80 shadow-[0_0_8px_hsl(var(--pending)/0.2)]",
        
        // Subtle/muted variants — neon glow on hover
        "subtle": "border-transparent bg-primary/10 text-primary hover:bg-primary/15 hover:shadow-[0_0_8px_hsl(var(--primary)/0.15)]",
        "subtle-destructive": "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/15",
        "subtle-success": "border-transparent bg-success/10 text-success hover:bg-success/15",
        "subtle-warning": "border-transparent bg-warning/10 text-warning hover:bg-warning/15",
        "subtle-info": "border-transparent bg-info/10 text-info hover:bg-info/15",
        
        // Outline colored — neon borders
        "outline-success": "border-success/40 text-success bg-success/5 hover:shadow-[0_0_8px_hsl(var(--success)/0.15)]",
        "outline-warning": "border-warning/40 text-warning bg-warning/5 hover:shadow-[0_0_8px_hsl(var(--warning)/0.15)]",
        "outline-destructive": "border-destructive/40 text-destructive bg-destructive/5 hover:shadow-[0_0_8px_hsl(var(--destructive)/0.15)]",
        "outline-info": "border-info/40 text-info bg-info/5 hover:shadow-[0_0_8px_hsl(var(--info)/0.15)]",
        
        // Neon special
        "neon": "border-primary/30 bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)]",
        
        // Glass
        "glass": "border-border/20 bg-card/40 backdrop-blur-sm text-foreground",
        
        // Special
        "dot": "pl-1.5 gap-1",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
    VariantProps<typeof badgeVariants> {
  /** Show a colored dot before the text */
  dot?: boolean;
  /** Color of the dot (only when dot=true) */
  dotColor?: "success" | "warning" | "destructive" | "info" | "primary" | "muted";
}

const dotColorClasses = {
  success: "bg-success shadow-[0_0_6px_hsl(var(--success)/0.5)]",
  warning: "bg-warning shadow-[0_0_6px_hsl(var(--warning)/0.5)]", 
  destructive: "bg-destructive shadow-[0_0_6px_hsl(var(--destructive)/0.5)]",
  info: "bg-info shadow-[0_0_6px_hsl(var(--info)/0.5)]",
  primary: "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]",
  muted: "bg-muted-foreground",
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dot, dotColor = "primary", children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant: dot ? "dot" : variant, size }), className)} {...props}>
        {dot && (
          <span 
            className={cn("h-1.5 w-1.5 rounded-full", dotColorClasses[dotColor])} 
            aria-hidden="true" 
          />
        )}
        {children}
      </div>
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };