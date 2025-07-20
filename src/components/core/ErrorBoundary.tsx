'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack,
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // Placeholder for error logging service integration
    // e.g., Sentry, LogRocket, etc.
    try {
      console.error('Logging error to monitoring service:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    } catch (loggingError) {
      console.error('Failed to log error to monitoring service:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={error!} retry={this.handleRetry} />;
      }

      return <DefaultErrorFallback error={error!} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <Card className="max-w-lg mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <CardTitle>Something went wrong</CardTitle>
        </div>
        <CardDescription>
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm font-mono text-red-700 dark:text-red-300">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={retry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="default"
          >
            Reload Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Async error boundary for handling async errors
export function AsyncErrorBoundary({ 
  children,
  onError 
}: { 
  children: React.ReactNode;
  onError?: (error: Error) => void;
}) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      if (onError) {
        onError(new Error(event.reason));
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}