'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={reset}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="ghost">
            <Home className="mr-1.5 h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
