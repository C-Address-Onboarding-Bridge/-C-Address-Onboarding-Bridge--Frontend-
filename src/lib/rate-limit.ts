/**
 * Rate limiting and anti-spam utilities
 * Prevents spam transactions through client-side throttling and cooldown periods
 */

interface RateLimitState {
  lastSubmissionTime: number;
  failureCount: number;
  lastFailureTime: number;
  isSubmitting: boolean;
}

interface RateLimitConfig {
  minSubmissionIntervalMs: number;
  failureCooldownMs: number;
  maxFailuresBeforeCooldown: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  minSubmissionIntervalMs: 1000, // Minimum 1 second between submissions
  failureCooldownMs: 30000, // 30 second cooldown after failure
  maxFailuresBeforeCooldown: 3, // Trigger cooldown after 3 failures
};

const rateLimitStates = new Map<string, RateLimitState>();
const submissionDeduplicationMap = new Map<string, string>();

/**
 * Gets or creates a rate limit state for a given key
 */
function getOrCreateState(key: string): RateLimitState {
  if (!rateLimitStates.has(key)) {
    rateLimitStates.set(key, {
      lastSubmissionTime: 0,
      failureCount: 0,
      lastFailureTime: 0,
      isSubmitting: false,
    });
  }
  return rateLimitStates.get(key)!;
}

/**
 * Checks if a submission is rate limited
 * Returns the time to wait (in ms) if rate limited, 0 if allowed
 */
export function checkRateLimit(
  key: string = "default",
  config: Partial<RateLimitConfig> = {}
): number {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const state = getOrCreateState(key);
  const now = Date.now();

  // Check for failure-based cooldown
  if (state.failureCount >= mergedConfig.maxFailuresBeforeCooldown) {
    const timeSinceLastFailure = now - state.lastFailureTime;
    if (timeSinceLastFailure < mergedConfig.failureCooldownMs) {
      return mergedConfig.failureCooldownMs - timeSinceLastFailure;
    } else {
      // Cooldown period expired, reset failure count
      state.failureCount = 0;
    }
  }

  // Check for minimum interval between submissions
  const timeSinceLastSubmission = now - state.lastSubmissionTime;
  if (timeSinceLastSubmission < mergedConfig.minSubmissionIntervalMs) {
    return mergedConfig.minSubmissionIntervalMs - timeSinceLastSubmission;
  }

  return 0;
}

/**
 * Records a successful submission attempt
 */
export function recordSubmissionAttempt(key: string = "default"): void {
  const state = getOrCreateState(key);
  state.lastSubmissionTime = Date.now();
  state.isSubmitting = true;
}

/**
 * Records a failed submission attempt and updates failure count
 */
export function recordSubmissionFailure(key: string = "default"): void {
  const state = getOrCreateState(key);
  state.lastFailureTime = Date.now();
  state.failureCount += 1;
  state.isSubmitting = false;
}

/**
 * Records a successful submission completion and resets failure count
 */
export function recordSubmissionSuccess(key: string = "default"): void {
  const state = getOrCreateState(key);
  state.failureCount = 0;
  state.isSubmitting = false;
}

/**
 * Resets rate limit state for a given key
 */
export function resetRateLimit(key: string = "default"): void {
  rateLimitStates.delete(key);
}

/**
 * Generates a deterministic ID for a transaction based on its parameters
 * Used for deduplication to prevent double submissions
 */
export function generateTransactionId(
  fromAddress: string,
  toAddress: string,
  amount: string,
  asset: string
): string {
  const data = `${fromAddress}|${toAddress}|${amount}|${asset}`;
  // Simple hash-like function (not cryptographic, just for deduplication)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${Math.abs(hash).toString(36)}_${data.split('|').map(s => s.substring(0, 4)).join('')}`;
}

/**
 * Checks if a transaction with the same parameters was recently submitted
 * Returns true if duplicate detected
 */
export function checkForDuplicateSubmission(
  fromAddress: string,
  toAddress: string,
  amount: string,
  asset: string,
  windowMs: number = 60000 // 1 minute deduplication window
): boolean {
  const txId = generateTransactionId(fromAddress, toAddress, amount, asset);
  const lastSubmissionTime = submissionDeduplicationMap.get(txId);

  if (!lastSubmissionTime) {
    return false;
  }

  const timeSinceSubmission = Date.now() - parseInt(lastSubmissionTime, 10);
  if (timeSinceSubmission > windowMs) {
    submissionDeduplicationMap.delete(txId);
    return false;
  }

  return true;
}

/**
 * Records a transaction submission for deduplication
 */
export function recordTransactionSubmission(
  fromAddress: string,
  toAddress: string,
  amount: string,
  asset: string
): void {
  const txId = generateTransactionId(fromAddress, toAddress, amount, asset);
  submissionDeduplicationMap.set(txId, Date.now().toString());
}

/**
 * Clears old deduplication entries (cleanup for memory efficiency)
 * Should be called periodically
 */
export function cleanupOldDuplicateEntries(windowMs: number = 60000): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  submissionDeduplicationMap.forEach((timestamp, txId) => {
    if (now - parseInt(timestamp, 10) > windowMs) {
      keysToDelete.push(txId);
    }
  });

  keysToDelete.forEach(key => submissionDeduplicationMap.delete(key));
}

/**
 * Gets the remaining cooldown time in seconds
 */
export function getRemainingCooldownSeconds(
  key: string = "default",
  config: Partial<RateLimitConfig> = {}
): number {
  const remainingMs = checkRateLimit(key, config);
  return Math.ceil(remainingMs / 1000);
}

/**
 * Checks if a submission is currently in progress
 */
export function isSubmissionInProgress(key: string = "default"): boolean {
  const state = getOrCreateState(key);
  return state.isSubmitting;
}
