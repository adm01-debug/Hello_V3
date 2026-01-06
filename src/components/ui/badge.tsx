import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Core variants
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        
        // Semantic variants
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/80",
        pending: "border-transparent bg-pending text-pending-foreground hover:bg-pending/80",
        
        // Subtle/muted variants
        "subtle": "border-transparent bg-primary/10 text-primary",
        "subtle-destructive": "border-transparent bg-destructive/10 text-destructive",
        "subtle-success": "border-transparent bg-success/10 text-success",
        "subtle-warning": "border-transparent bg-warning/10 text-warning",
        "subtle-info": "border-transparent bg-info/10 text-info",
        
        // Outline colored
        "outline-success": "border-success/50 text-success bg-success/5",
        "outline-warning": "border-warning/50 text-warning bg-warning/5",
        "outline-destructive": "border-destructive/50 text-destructive bg-destructive/5",
        "outline-info": "border-info/50 text-info bg-info/5",
        
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
  success: "bg-success",
  warning: "bg-warning", 
  destructive: "bg-destructive",
  info: "bg-info",
  primary: "bg-primary",
  muted: "bg-muted-foreground",
};

function Badge({ className, variant, size, dot, dotColor = "primary", children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant: dot ? "dot" : variant, size }), className)} {...props}>
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

export { Badge, badgeVariants };
