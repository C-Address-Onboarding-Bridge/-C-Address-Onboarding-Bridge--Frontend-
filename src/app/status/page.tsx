import type { Metadata } from "next";
import Link from "next/link";
import { getMonitoringConfig, getMonitoringStatus } from "@/lib/monitoring";

export const metadata: Metadata = {
  title: "Status | C-Address Bridge",
  description: "Live monitoring status and recent incident history for the C-Address Bridge deployment.",
};

export const dynamic = "force-dynamic";

export default function StatusPage() {
  const status = getMonitoringStatus();
  const config = getMonitoringConfig();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Deployment status</p>
        <h1 className="text-4xl font-semibold text-[var(--foreground)]">C-Address Bridge monitoring overview</h1>
        <p className="max-w-2xl text-base text-[var(--text-muted)]">
          This page surfaces the current health of the production deployment along with recent errors and alert configuration.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Current state</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {status.status === "operational" ? "Operational" : status.status === "degraded" ? "Degraded" : "Outage"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">{status.summary}</p>
          </div>
          <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${status.status === "operational" ? "bg-emerald-500/10 text-emerald-600" : status.status === "degraded" ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600"}`}>
            {status.status === "operational" ? "Healthy" : status.status === "degraded" ? "Needs attention" : "Critical"}
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <dt className="text-sm text-[var(--text-muted)]">Last heartbeat</dt>
            <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{status.lastHeartbeatAt ? new Date(status.lastHeartbeatAt).toLocaleString() : "No heartbeat yet"}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <dt className="text-sm text-[var(--text-muted)]">Last event</dt>
            <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{status.lastEventAt ? new Date(status.lastEventAt).toLocaleString() : "No events captured"}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <dt className="text-sm text-[var(--text-muted)]">Alerting</dt>
            <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{config.alertWebhookUrl ? "Webhook configured" : "Webhook not configured"}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Recent events</h2>
          <ul className="mt-6 space-y-3">
            {status.recentEvents.length === 0 ? (
              <li className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
                No monitoring events have been captured yet.
              </li>
            ) : (
              status.recentEvents.map((event) => (
                <li key={event.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--foreground)]">{event.message}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{event.level}</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{new Date(event.timestamp).toLocaleString()}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Alerting & uptime</h2>
          <ul className="mt-6 space-y-4 text-sm text-[var(--text-muted)]">
            <li>Uptime monitoring is exposed via the health endpoint at /api/monitoring/health.</li>
            <li>Client-side exceptions are captured automatically and forwarded to the monitoring endpoint.</li>
            <li>Critical errors can trigger an external webhook when MONITORING_ALERT_WEBHOOK_URL is configured.</li>
            <li>Status page visibility is enabled by default and can be toggled with NEXT_PUBLIC_MONITORING_STATUS_PAGE.</li>
          </ul>
          <Link href="/" className="mt-6 inline-flex text-sm font-medium text-[var(--primary)] hover:opacity-80">
            Back to the app
          </Link>
        </section>
      </div>
    </div>
  );
}
