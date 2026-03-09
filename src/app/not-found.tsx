import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-subtle, #fafafa)' }}
    >
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-zinc-900 dark:text-white tabular-nums">404</h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Page not found
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center mt-6 px-5 py-2.5 rounded-lg bg-violet-600 text-white font-medium text-sm hover:bg-violet-500 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
