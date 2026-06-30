import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

// Scaffold mock database for transaction history
const mockTransactions = [
  { id: "tx_1", amount: 100, asset: "USDC", status: "success", timestamp: new Date().toISOString() },
  { id: "tx_2", amount: 500, asset: "XLM", status: "pending", timestamp: new Date().toISOString() }
];

export async function GET(req: NextRequest) {
  // Authentication check
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Database read simulation
  return NextResponse.json({ transactions: mockTransactions });
}

export async function POST(req: NextRequest) {
  // Authentication check
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Database write simulation
    const newTx = {
      id: `tx_${Date.now()}`,
      ...body,
      timestamp: new Date().toISOString()
    };
    
    mockTransactions.push(newTx);
    
    return NextResponse.json({ success: true, transaction: newTx }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
