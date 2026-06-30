import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10">
          <FileQuestion className="h-8 w-8 text-[var(--primary-light)]" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
        <p className="mb-6 text-[var(--text-muted)]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
