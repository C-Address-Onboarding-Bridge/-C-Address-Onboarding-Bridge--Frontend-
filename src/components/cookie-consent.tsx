"use client";

import { useState, useEffect } from "react";
import { Cookie, X, Check, Settings } from "lucide-react";
import Link from "next/link";

type ConsentState = "loading" | "accepted" | "declined" | null;

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>("loading");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cookie-consent");
    if (stored === "accepted" || stored === "declined") {
      setConsent(stored);
    } else {
      setConsent(null);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setConsent("accepted");
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setConsent("declined");
  };

  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-3xl mx-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-[var(--primary-light)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Cookie Consent</h3>
              <button
                onClick={() => setConsent("declined")}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              We use localStorage to store your preferences and improve your experience.
              No tracking cookies are used without your consent.
            </p>

            {showDetails && (
              <div className="mt-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-muted)] space-y-2">
                <p><strong>Essential:</strong> Wallet connection state, UI preferences, consent choice.</p>
                <p><strong>Analytics:</strong> Anonymous page views and feature usage (only if accepted).</p>
                <p>
                  See our{" "}
                  <Link href="/privacy" className="text-[var(--primary-light)] hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  for full details.
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleAccept}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Accept
              </button>
              <button
                onClick={handleDecline}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
