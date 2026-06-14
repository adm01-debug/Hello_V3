/* eslint-disable react-refresh/only-export-components -- file intentionally exports variants/hooks alongside components; HMR-only rule */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: "shadow-md hover:shadow-lg transition-shadow duration-200",
        interactive: "shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer hover:-translate-y-0.5",
        glass: "bg-card/80 backdrop-blur-xl border-border/50 shadow-lg",
        bordered: "border-2",
        ghost: "border-transparent bg-transparent shadow-none",
        stat: "shadow-sm overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:pointer-events-none",
        success: "border-success/30 bg-success/5",
        warning: "border-warning/30 bg-warning/5",
        destructive: "border-destructive/30 bg-destructive/5",
        info: "border-info/30 bg-info/5",
        // Neon variants
        neon: "bg-card/60 backdrop-blur-xl border-primary/20 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)]",
        "neon-interactive": "bg-card/60 backdrop-blur-xl border-border/30 shadow-sm hover:border-primary/30 hover:shadow-[0_0_25px_-5px_hsl(var(--primary)/0.25)] transition-all duration-300 cursor-pointer hover:-translate-y-1",
        "glass-neon": "bg-card/40 backdrop-blur-2xl border-primary/15 shadow-[0_0_40px_-5px_hsl(var(--primary)/0.15),inset_0_1px_0_0_rgb(255_255_255/0.05)]",
      },
      padding: {
        default: "",
        none: "[&>*]:p-0",
        compact: "[&_.card-header]:p-4 [&_.card-content]:p-4 [&_.card-content]:pt-0 [&_.card-footer]:p-4",
        relaxed: "[&_.card-header]:p-8 [&_.card-content]:p-8 [&_.card-content]:pt-0 [&_.card-footer]:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(cardVariants({ variant, padding }), className)} 
      {...props} 
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-header flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-content p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-footer flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };