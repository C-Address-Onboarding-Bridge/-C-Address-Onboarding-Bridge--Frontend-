export type MonitoringLevel = "info" | "warning" | "error" | "critical";

export interface MonitoringPayload {
  id: string;
  timestamp: string;
  level: MonitoringLevel;
  message: string;
  source: string;
  url?: string;
  userAgent?: string;
  context?: Record<string, unknown>;
  stack?: string;
}

interface MonitoringIncident {
  id: string;
  message: string;
  level: MonitoringLevel;
  createdAt: string;
}

interface MonitoringStatusSnapshot {
  status: "operational" | "degraded" | "outage";
  summary: string;
  lastHeartbeatAt: string | null;
  lastEventAt: string | null;
  recentEvents: MonitoringPayload[];
  incidents: MonitoringIncident[];
}

const recentEvents: MonitoringPayload[] = [];
const incidents: MonitoringIncident[] = [];
let lastHeartbeatAt: string | null = null;

function getEnvValue(key: string): string {
  return process.env[key] ?? "";
}

export function getMonitoringConfig() {
  const enabledValue = getEnvValue("NEXT_PUBLIC_MONITORING_ENABLED").trim().toLowerCase();
  const enabled = enabledValue === "true" ? true : enabledValue === "false" ? false : process.env.NODE_ENV === "production";

  return {
    enabled,
    endpoint: getEnvValue("NEXT_PUBLIC_MONITORING_ENDPOINT") || "/api/monitoring/events",
    alertWebhookUrl: getEnvValue("MONITORING_ALERT_WEBHOOK_URL"),
    statusPageEnabled: getEnvValue("NEXT_PUBLIC_MONITORING_STATUS_PAGE").toLowerCase() !== "false",
  };
}

export function isMonitoringEnabled(): boolean {
  return getMonitoringConfig().enabled;
}

function sanitizeContext(context: Record<string, unknown> = {}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined).map(([key, value]) => [key, value]),
  );
}

function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: "Unknown error" };
  }
}

function buildPayload(level: MonitoringLevel, message: string, context: Record<string, unknown> = {}, source: string): MonitoringPayload {
  const timestamp = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp,
    level,
    message,
    source,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    context: sanitizeContext(context),
  };
}

export async function captureException(error: unknown, context: Record<string, unknown> = {}, source = "application") {
  const normalized = normalizeError(error);
  const payload = buildPayload("error", normalized.message, { ...context, stack: normalized.stack }, source);
  await sendMonitoringPayload(payload);
}

export async function captureMessage(message: string, context: Record<string, unknown> = {}, level: MonitoringLevel = "info", source = "application") {
  const payload = buildPayload(level, message, context, source);
  await sendMonitoringPayload(payload);
}

async function sendMonitoringPayload(payload: MonitoringPayload) {
  if (!isMonitoringEnabled()) {
    return;
  }

  if (typeof window !== "undefined" && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    navigator.sendBeacon(getMonitoringConfig().endpoint, JSON.stringify(payload));
    return;
  }

  try {
    if (typeof fetch === "function") {
      await fetch(getMonitoringConfig().endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch {
    // Intentionally swallow monitoring transport failures so they do not break the app.
  }
}

export async function recordMonitoringEvent(payload: MonitoringPayload) {
  recentEvents.unshift(payload);
  if (recentEvents.length > 100) {
    recentEvents.pop();
  }

  if (payload.level === "info" && payload.message === "heartbeat") {
    lastHeartbeatAt = payload.timestamp;
  }

  if (payload.level === "error" || payload.level === "critical") {
    incidents.unshift({
      id: payload.id,
      message: payload.message,
      level: payload.level,
      createdAt: payload.timestamp,
    });
    if (incidents.length > 10) {
      incidents.pop();
    }
    await triggerAlert(payload);
  }

  return getMonitoringStatus();
}

async function triggerAlert(payload: MonitoringPayload) {
  const { alertWebhookUrl } = getMonitoringConfig();
  if (!alertWebhookUrl) {
    return;
  }

  try {
    await fetch(alertWebhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Alert delivery failures should not disrupt the application.
  }
}

export function getMonitoringStatus(): MonitoringStatusSnapshot {
  const now = Date.now();
  const recentEventsWindow = recentEvents.filter((event) => now - new Date(event.timestamp).getTime() <= 15 * 60 * 1000);
  const criticalEvents = recentEventsWindow.filter((event) => event.level === "critical" || event.level === "error");
  const heartbeatFresh = lastHeartbeatAt ? now - new Date(lastHeartbeatAt).getTime() <= 5 * 60 * 1000 : false;

  let status: MonitoringStatusSnapshot["status"] = "operational";
  let summary = "All services are operating normally.";

  if (criticalEvents.length > 0) {
    status = "outage";
    summary = "Critical errors are being detected. Investigate immediately.";
  } else if (!heartbeatFresh) {
    status = "degraded";
    summary = "The service has not reported a heartbeat recently.";
  }

  return {
    status,
    summary,
    lastHeartbeatAt,
    lastEventAt: recentEvents[0]?.timestamp ?? null,
    recentEvents: recentEvents.slice(0, 5),
    incidents: incidents.slice(0, 5),
  };
}
