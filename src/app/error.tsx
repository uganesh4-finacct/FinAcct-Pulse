'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && error?.message) {
      try {
        Sentry.captureException(error);
      } catch {
        // Sentry not configured or failed
      }
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          An error occurred. It has been reported. You can try again.
        </p>
        <Button onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
    </div>
  );
}
