import { NextResponse } from "next/server";
import { recordMonitoringEvent } from "@/lib/monitoring";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    await recordMonitoringEvent(payload);
    return NextResponse.json({ received: true }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Invalid monitoring payload" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Monitoring event endpoint ready." });
}
