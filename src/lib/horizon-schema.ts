import { z } from "zod";

/**
 * Zod schema for Horizon transaction responses
 * Used to validate the structure of Horizon API responses to prevent runtime errors
 * if the API changes.
 */
export const HorizonTransactionSchema = z.object({
  id: z.string().optional(),
  hash: z.string().optional(),
  created_at: z.string().optional(),
  successful: z.boolean().optional(),
  source_account: z.string().optional(),
  source: z.string().optional(),
  operations_count: z.number().optional(),
}).passthrough(); // Allow other fields for graceful fallback

export type HorizonTransactionType = z.infer<typeof HorizonTransactionSchema>;

export const HorizonPaymentSchema = z.object({
  id: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  amount: z.string().optional(),
  asset_type: z.string().optional(),
  asset_code: z.string().optional(),
  transaction_successful: z.boolean().optional(),
  created_at: z.string().optional(),
  transaction_hash: z.string().optional(),
}).passthrough();

export type HorizonPaymentType = z.infer<typeof HorizonPaymentSchema>;

export const HorizonBalanceSchema = z.object({
  asset_type: z.string().optional(),
  asset_code: z.string().optional(),
  asset_issuer: z.string().optional(),
  balance: z.string().optional(),
}).passthrough();

export type HorizonBalanceType = z.infer<typeof HorizonBalanceSchema>;

/**
 * Validates a Horizon transaction record, providing graceful fallback and logging
 * if the response format is unexpected.
 */
export function validateHorizonTransaction(tx: unknown): HorizonTransactionType {
  const parsed = HorizonTransactionSchema.safeParse(tx);
  
  if (!parsed.success) {
    console.warn("Unexpected Horizon response format (transaction):", parsed.error.message);
    // Fall back gracefully by casting the raw object as a best effort
    return (tx as Record<string, unknown>) as HorizonTransactionType;
  }
  
  return parsed.data;
}

export function validateHorizonPayment(payment: unknown): HorizonPaymentType {
  const parsed = HorizonPaymentSchema.safeParse(payment);
  
  if (!parsed.success) {
    console.warn("Unexpected Horizon response format (payment):", parsed.error.message);
    return (payment as Record<string, unknown>) as HorizonPaymentType;
  }
  
  return parsed.data;
}

export function validateHorizonBalance(balance: unknown): HorizonBalanceType {
  const parsed = HorizonBalanceSchema.safeParse(balance);
  
  if (!parsed.success) {
    console.warn("Unexpected Horizon response format (balance):", parsed.error.message);
    return (balance as Record<string, unknown>) as HorizonBalanceType;
  }
  
  return parsed.data;
}
