import {
  PROVIDER_MOONPAY,
  PROVIDER_TRANSAK,
  MOONPAY_FEE_RATE,
  TRANSAK_FEE_RATE,
  BASE_RECEIVE_MULTIPLIER,
  MOONPAY_RECEIVE_MULTIPLIER,
  TRANSAK_RECEIVE_MULTIPLIER,
} from "@/lib/constants";

export type OnrampProvider = typeof PROVIDER_MOONPAY | typeof PROVIDER_TRANSAK;

export interface OnrampEstimate {
  fee: number;
  receive: number;
}

export function estimateOnrampOutput(amount: number, provider: OnrampProvider): OnrampEstimate {
  if (amount <= 0) {
    return { fee: 0, receive: 0 };
  }

  const feeRate = provider === PROVIDER_MOONPAY ? MOONPAY_FEE_RATE : TRANSAK_FEE_RATE;
  const receiveMultiplier =
    provider === PROVIDER_MOONPAY ? MOONPAY_RECEIVE_MULTIPLIER : TRANSAK_RECEIVE_MULTIPLIER;

  return {
    fee: amount * feeRate,
    receive: amount * BASE_RECEIVE_MULTIPLIER * receiveMultiplier,
  };
}
