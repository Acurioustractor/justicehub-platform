'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Spinner component
export function Spinner({ size = 'default', className }: { size?: 'sm' | 'default' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('animate-spin rounded-full border-2 border-primary border-r-transparent', sizeClasses[size], className)} />
  );
}

// Loading screen for full page
export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96 mb-6" />
        
        {/* Key metrics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Main content skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Analytics skeleton
export function AnalyticsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Key metrics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        
        {/* Chart skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Story card skeleton
export function StoryCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

// Inline loading for buttons and small elements
export function InlineSpinner({ className }: { className?: string }) {
  return <Spinner size="sm" className={cn('mr-2', className)} />;
}

// Loading button
export function LoadingButton({ 
  children, 
  isLoading, 
  className,
  ...props 
}: any) {
  return (
    <button 
      className={cn('flex items-center justify-center', className)} 
      disabled={isLoading}
      {...props}
    >
      {isLoading && <InlineSpinner />}
      {children}
    </button>
  );
}

// Progressive loading component
export function ProgressiveLoader({ 
  stages, 
  currentStage 
}: { 
  stages: string[]; 
  currentStage: number;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-lg font-medium">{stages[currentStage] || 'Loading...'}</p>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
        />
      </div>
      
      {/* Stage list */}
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {index < currentStage ? (
              <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full" />
              </div>
            ) : index === currentStage ? (
              <Spinner size="sm" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-600" />
            )}
            <span className={index <= currentStage ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}>
              {stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}