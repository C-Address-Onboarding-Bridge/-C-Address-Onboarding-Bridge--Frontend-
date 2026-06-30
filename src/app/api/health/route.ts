import { NextResponse } from "next/server";
import {
  ENV_BRIDGE_CONTRACT_ID,
  ENV_MOONPAY_API_KEY,
  ENV_TRANSAK_API_KEY,
  ENV_STELLAR_NETWORK,
  STATUS_CONFIGURED,
  STATUS_MISSING,
  DEFAULT_NETWORK,
} from "@/lib/constants";

export async function GET() {
  return NextResponse.json({
    bridgeContractId: process.env[ENV_BRIDGE_CONTRACT_ID] ? STATUS_CONFIGURED : STATUS_MISSING,
    moonpayApiKey: process.env[ENV_MOONPAY_API_KEY] ? STATUS_CONFIGURED : STATUS_MISSING,
    transakApiKey: process.env[ENV_TRANSAK_API_KEY] ? STATUS_CONFIGURED : STATUS_MISSING,
    stellarNetwork: process.env[ENV_STELLAR_NETWORK] || DEFAULT_NETWORK,
  });
}
