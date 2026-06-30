/**
 * Sanitization and encoding utilities for user-generated content
 * Prevents XSS attacks and ensures safe rendering of user input
 */

/**
 * HTML encodes special characters to prevent XSS attacks
 * Converts: & < > " '
 */
export function encodeHtml(text: string): string {
  if (!text) return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitizes Stellar addresses by validating format
 * Returns empty string if invalid
 */
export function sanitizeStellarAddress(address: string): string {
  if (!address) return "";
  const trimmed = address.trim();
  // Stellar addresses are 56 characters, alphanumeric only
  if (!/^[GA][A-Z0-9]{54}$/.test(trimmed)) {
    return "";
  }
  return trimmed;
}

/**
 * Sanitizes C-addresses (contract addresses) by validating format
 * Returns empty string if invalid
 */
export function sanitizeCAddress(address: string): string {
  if (!address) return "";
  const trimmed = address.trim();
  // C-addresses are 56 characters starting with C
  if (!/^C[A-Z0-9]{55}$/.test(trimmed)) {
    return "";
  }
  return trimmed;
}

/**
 * Sanitizes numeric input (amounts)
 * Allows only digits and decimal point
 */
export function sanitizeAmount(amount: string): string {
  if (!amount) return "";
  // Remove anything that's not a digit or decimal point
  const sanitized = amount.replace(/[^\d.]/g, "");
  // Prevent multiple decimal points
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    return `${parts[0]}.${parts[1]}`;
  }
  return sanitized;
}

/**
 * Sanitizes memo/free-text fields
 * Removes potentially dangerous characters and enforces length limits
 */
export function sanitizeMemo(memo: string, maxLength: number = 280): string {
  if (!memo) return "";
  // Remove null bytes and other control characters
  let sanitized = memo.replace(/\0|[\x00-\x1F\x7F]/g, "");
  // Limit length
  sanitized = sanitized.substring(0, maxLength);
  return sanitized.trim();
}

/**
 * Escapes special characters for safe display in URLs
 */
export function encodeUrl(text: string): string {
  return encodeURIComponent(text);
}

/**
 * Validates and sanitizes a complete transaction object
 */
export interface SanitizedTransaction {
  fromAddress: string;
  toAddress: string;
  amount: string;
  asset: string;
  memo?: string;
  isValid: boolean;
  errors: string[];
}

export function sanitizeTransaction(data: {
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
  asset?: string;
  memo?: string;
}): SanitizedTransaction {
  const errors: string[] = [];

  const fromAddress = sanitizeStellarAddress(data.fromAddress || "");
  if (!fromAddress && data.fromAddress) {
    errors.push("Invalid source address");
  }

  const toAddress = sanitizeCAddress(data.toAddress || "");
  if (!toAddress && data.toAddress) {
    errors.push("Invalid destination address");
  }

  const amount = sanitizeAmount(data.amount || "");
  const amountNum = parseFloat(amount);
  if (!amount || isNaN(amountNum) || amountNum <= 0) {
    errors.push("Invalid amount");
  }

  const asset = (data.asset || "XLM").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!asset) {
    errors.push("Invalid asset");
  }

  const memo = sanitizeMemo(data.memo || "");

  return {
    fromAddress,
    toAddress,
    amount,
    asset,
    memo,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Safe wrapper for rendering address in UI
 * Always HTML-encoded to prevent XSS
 */
export function SafeAddress({ address, truncate = false }: { address: string; truncate?: boolean }): string {
  const sanitized = sanitizeStellarAddress(address) || sanitizeCAddress(address) || address;
  const display = truncate
    ? `${sanitized.substring(0, 8)}...${sanitized.substring(sanitized.length - 8)}`
    : sanitized;
  return encodeHtml(display);
}

/**
 * Safe wrapper for rendering amount in UI
 * Always HTML-encoded to prevent XSS
 */
export function SafeAmount({ amount, decimals = 2 }: { amount: string; decimals?: number }): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";
  return encodeHtml(num.toFixed(decimals));
}
