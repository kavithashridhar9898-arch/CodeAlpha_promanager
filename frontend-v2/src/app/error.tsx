'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-center p-6 bg-card rounded-xl border border-border shadow-sm">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        An error occurred while rendering this page or component.
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
      >
        <RefreshCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
