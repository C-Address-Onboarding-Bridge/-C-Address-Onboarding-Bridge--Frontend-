import { NextResponse } from "next/server";
import { recordMonitoringEvent } from "@/lib/monitoring";

export async function GET() {
  await recordMonitoringEvent({
    id: `heartbeat-${Date.now()}`,
    timestamp: new Date().toISOString(),
    level: "info",
    message: "heartbeat",
    source: "health-check",
  });

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
