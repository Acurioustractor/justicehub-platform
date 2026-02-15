/**
 * Card Component
 * 
 * A flexible card component for displaying content with consistent styling.
 * Follows the JusticeHub design system.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        outline: "border-2 border-border",
        elevated: "shadow-lg border-border",
        flat: "shadow-none border-border",
        // JusticeHub specific variants
        justice: "border-2 border-black bg-white",
        data: "border-l-4 border-l-primary bg-primary/5",
        story: "border border-gray-200 bg-white hover:shadow-md transition-shadow",
        metric: "border-2 border-gray-300 bg-gray-50",
        success: "border-l-4 border-l-green-600 bg-green-50",
        warning: "border-l-4 border-l-yellow-500 bg-yellow-50",
        error: "border-l-4 border-l-red-600 bg-red-50",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-6",
        lg: "p-8",
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
  ({ className, variant, padding, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "div" : "div";

    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// JusticeHub specific card components
const DataCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <Card
      ref={ref}
      variant="data"
      className={cn("text-center", className)}
      {...props}
    >
      {children}
    </Card>
  )
);
DataCard.displayName = "DataCard";

const StoryCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <Card
      ref={ref}
      variant="story"
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </Card>
  )
);
StoryCard.displayName = "StoryCard";

const MetricCard = React.forwardRef<
  HTMLDivElement,
  CardProps & {
    value: string | number;
    label: string;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }
>(({ className, value, label, description, trend, trendValue, ...props }, ref) => (
  <Card
    ref={ref}
    variant="metric"
    className={cn("text-center", className)}
    {...props}
  >
    <CardContent className="p-6">
      <div className="text-3xl font-bold font-mono mb-2">{value}</div>
      <div className="text-lg font-semibold mb-1">{label}</div>
      {description && (
        <div className="text-sm text-gray-600 mb-2">{description}</div>
      )}
      {trend && trendValue && (
        <div className={cn(
          "text-sm font-medium",
          trend === 'up' && "text-green-600",
          trend === 'down' && "text-red-600",
          trend === 'neutral' && "text-gray-600"
        )}>
          {trend === 'up' && '↗ '}
          {trend === 'down' && '↘ '}
          {trendValue}
        </div>
      )}
    </CardContent>
  </Card>
));
MetricCard.displayName = "MetricCard";

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  DataCard,
  StoryCard,
  MetricCard,
  cardVariants 
};