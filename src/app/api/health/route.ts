import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    bridgeContractId: process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ID ? "configured" : "missing",
    moonpayApiKey: process.env.NEXT_PUBLIC_MOONPAY_API_KEY ? "configured" : "missing",
    transakApiKey: process.env.NEXT_PUBLIC_TRANSAK_API_KEY ? "configured" : "missing",
    stellarNetwork: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET",
  });
}
