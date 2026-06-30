"use client";

import { AlertCircle, RefreshCw, FileText, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { logError, exportErrorReports } from "@/lib/error-reporting";

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--error)]/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-[var(--error)]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={handleReportIssue}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--background-elevated)] border border-[var(--border)] text-[var(--text)] font-medium hover:bg-[var(--border)] transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                Copied Log!
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Report Issue
              </>
            )}
          </button>
        </div>
        
        {copied && (
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Error details copied to clipboard. You can now paste this when reporting the issue.
          </p>
        )}
      </div>
    </div>
  );
}
