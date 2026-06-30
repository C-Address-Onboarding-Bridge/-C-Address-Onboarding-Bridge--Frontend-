'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log the error automatically when the component mounts
    logError(error, { component: "GlobalErrorPage", action: "page_load" });
  }, [error]);

  const handleReportIssue = () => {
    const reportData = exportErrorReports();
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(reportData).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--error)]/10">
          <AlertCircle className="h-8 w-8 text-[var(--error)]" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
        <p className="mx-auto mb-6 max-w-md text-[var(--text-muted)]">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
