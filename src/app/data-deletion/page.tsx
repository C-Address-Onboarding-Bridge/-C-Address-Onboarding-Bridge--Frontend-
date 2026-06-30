"use client";

import { useState } from "react";
import { Trash2, Mail, Check, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DataDeletionPage() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    const subject = encodeURIComponent("Data Deletion Request");
    const body = encodeURIComponent(
      `Email: ${email}\n\nReason for request:\n${reason || "Not specified"}\n\nI request the deletion of all data associated with this email address under applicable data protection laws.`
    );
    window.open(`mailto:privacy@caddressbridge.com?subject=${subject}&body=${body}`, "_blank");
    localStorage.removeItem("cookie-consent");
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/privacy"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Privacy Policy
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-[var(--primary-light)]" />
        </div>
        <h1 className="text-3xl font-bold">Data Deletion Request</h1>
      </div>
      <p className="text-[var(--text-muted)] mb-8">
        Under GDPR and other privacy regulations, you have the right to request deletion of
        your personal data. Since we do not operate centralized servers storing personal data,
        deletion primarily involves clearing your local storage and removing any cached data.
      </p>

      {submitted ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[var(--success)]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Request Submitted</h2>
          <p className="text-sm text-[var(--text-muted)] mb-2">
            Your data deletion request has been initiated. We&apos;ve sent a draft email to
            our privacy team at <strong>privacy@caddressbridge.com</strong>.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Your local data has been cleared. You will receive confirmation within 30 days.
            If you don&apos;t hear back, please send an email directly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <label className="block text-sm font-medium mb-2">
              Email Address <span className="text-[var(--error)]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            {!validEmail && email && (
              <p className="text-xs text-[var(--error)] mt-1">Invalid email address</p>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <label className="block text-sm font-medium mb-2">
              Reason for Request <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us why you'd like your data deleted..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
            />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--text-muted)]">
                <p className="mb-1">
                  <strong>Note:</strong> Blockchain transactions are permanent and cannot be
                  deleted. We can only remove data stored locally in your browser and any
                  server-side logs we may hold.
                </p>
                <p>
                  Submitting this form will also clear your local consent preferences and
                  cached data.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!email}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Submit Deletion Request
          </button>
        </form>
      )}

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-semibold mb-3">What Data Will Be Deleted</h2>
        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
            <span>Cookie consent preferences stored in localStorage</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
            <span>UI state and cached preferences</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0 mt-0.5" />
            <span>Any server-side logs containing your IP or email</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5 text-[var(--error)]">✕</span>
            <span className="text-[var(--text-muted)]/60">Blockchain transaction history (public and immutable by design)</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-semibold mb-2">Alternate Methods</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          You can also submit a request by emailing us directly at{" "}
          <a href="mailto:privacy@caddressbridge.com" className="text-[var(--primary-light)] hover:underline">
            privacy@caddressbridge.com
          </a>.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          We will respond to all verified requests within 30 days as required by GDPR.
        </p>
      </div>
    </div>
  );
}
