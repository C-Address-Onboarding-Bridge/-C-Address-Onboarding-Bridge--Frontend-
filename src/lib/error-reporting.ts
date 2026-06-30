export interface ErrorReport {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  component?: string;
  action?: string;
  networkState: {
    online: boolean;
    type?: string;
  };
  count: number;
}

const STORAGE_KEY = "c_address_bridge_errors";

// Helper to remove potential personal data (basic redaction)
function redactSensitiveData(text: string): string {
  if (!text) return text;
  // Simple regex to redact typical sensitive things
  // Stellar public key: G[A-Z2-7]{55}
  let redacted = text.replace(/G[A-Z2-7]{55}/g, "[REDACTED_PUBKEY]");
  // Stellar secret key: S[A-Z2-7]{55} (just in case)
  redacted = redacted.replace(/S[A-Z2-7]{55}/g, "[REDACTED_SECRETKEY]");
  // Redact email-like
  redacted = redacted.replace(/[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/g, "[REDACTED_EMAIL]");
  return redacted;
}

export function logError(
  error: Error,
  context?: { component?: string; action?: string }
): ErrorReport {
  const message = redactSensitiveData(error.message);
  const stack = redactSensitiveData(error.stack || "");

  // Create hash/signature for grouping
  const signature = `${message}_${context?.component || ""}`;

  let existingReports: ErrorReport[] = [];
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        existingReports = JSON.parse(stored);
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  const existingIndex = existingReports.findIndex(
    (r) => `${r.message}_${r.component || ""}` === signature
  );

  let report: ErrorReport;

  if (existingIndex >= 0) {
    // Group duplicate
    report = existingReports[existingIndex];
    report.count += 1;
    report.timestamp = new Date().toISOString(); // update to latest
  } else {
    // New report
    report = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      timestamp: new Date().toISOString(),
      message,
      stack,
      component: context?.component,
      action: context?.action,
      networkState: {
        online: typeof navigator !== "undefined" ? navigator.onLine : true,
        // @ts-ignore
        type: typeof navigator !== "undefined" && navigator.connection ? navigator.connection.effectiveType : "unknown",
      },
      count: 1,
    };
    existingReports.push(report);
  }

  // Keep only last 50 unique errors to avoid bloat
  if (existingReports.length > 50) {
    existingReports = existingReports.slice(existingReports.length - 50);
  }

  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingReports));
    }
  } catch (e) {
    // ignore
  }

  // Still log to console for development
  console.error("Logged Error:", report);

  return report;
}

export function exportErrorReports(): string {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored || "[]";
    }
    return "[]";
  } catch (e) {
    return "[]";
  }
}
