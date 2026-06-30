import { StrKey } from "@stellar/stellar-sdk";

/**
 * Validates a Soroban C-address.
 * Returns null when valid, or a contextual error string.
 * Returns a "required" error when address is blank (use for submitted forms).
 */
export function validateCAddress(address: string, required = false): string | null {
  if (!address) {
    return required ? "Contract ID is required." : null;
  }

  if (!address.startsWith("C")) {
    if (address.startsWith("G") && StrKey.isValidEd25519PublicKey(address)) {
      return "This is a Stellar Account ID. Please enter a Soroban Contract ID starting with 'C'.";
    }
    return "Soroban Contract IDs must be exactly 56 characters long and start with 'C'.";
  }

  if (address.length !== 56) {
    return "Soroban Contract IDs must be exactly 56 characters long and start with 'C'.";
  }

  if (!StrKey.isValidContract(address)) {
    return "Invalid Contract ID checksum. Check for typos or omitted characters.";
  }

  return null;
}
