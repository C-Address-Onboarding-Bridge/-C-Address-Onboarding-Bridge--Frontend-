import { buildAndSubmitPayment, getAccountBalances } from "./stellar";

export interface VerificationChallenge {
  id: string;
  amount: string;
  bridgeAddress: string;
  timestamp: number;
  verified: boolean;
}

const CHALLENGE_AMOUNT = "0.0001";
const VERIFICATION_STORAGE_PREFIX = "cex_challenge_";
const MAX_CHALLENGE_AGE = 30 * 60 * 1000;

export function generateChallengeId(): string {
  return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function initiateChallengeTransaction(
  sourceAddress: string,
  bridgeAddress: string,
  network: "PUBLIC" | "TESTNET"
): Promise<VerificationChallenge> {
  try {
    const challengeId = generateChallengeId();
    const challenge: VerificationChallenge = {
      id: challengeId,
      amount: CHALLENGE_AMOUNT,
      bridgeAddress,
      timestamp: Date.now(),
      verified: false,
    };

    const result = await buildAndSubmitPayment(
      sourceAddress,
      bridgeAddress,
      CHALLENGE_AMOUNT,
      "XLM",
      network
    );

    if (result.successful) {
      saveChallenge(challengeId, challenge);
      return challenge;
    } else {
      throw new Error("Challenge transaction failed");
    }
  } catch (error) {
    console.error("Failed to initiate challenge:", error);
    throw error;
  }
}

export function saveChallenge(id: string, challenge: VerificationChallenge): void {
  localStorage.setItem(VERIFICATION_STORAGE_PREFIX + id, JSON.stringify(challenge));
}

export function getChallenge(id: string): VerificationChallenge | null {
  const stored = localStorage.getItem(VERIFICATION_STORAGE_PREFIX + id);
  if (!stored) return null;
  return JSON.parse(stored);
}

export function isChallengeFresh(challenge: VerificationChallenge): boolean {
  const age = Date.now() - challenge.timestamp;
  return age < MAX_CHALLENGE_AGE;
}

export async function verifyChallengeReceived(
  challengeId: string,
  bridgeAddress: string,
  network: "PUBLIC" | "TESTNET"
): Promise<boolean> {
  try {
    const challenge = getChallenge(challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (!isChallengeFresh(challenge)) {
      throw new Error("Challenge has expired");
    }

    const balances = await getAccountBalances(bridgeAddress, network);
    const xlmBalance = parseFloat(balances.total);
    const expectedAmount = parseFloat(CHALLENGE_AMOUNT);

    if (xlmBalance >= expectedAmount) {
      challenge.verified = true;
      saveChallenge(challengeId, challenge);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Challenge verification failed:", error);
    return false;
  }
}

export function clearChallenge(id: string): void {
  localStorage.removeItem(VERIFICATION_STORAGE_PREFIX + id);
}

export function getChallengeExplorerUrl(
  transactionHash: string,
  network: "PUBLIC" | "TESTNET"
): string {
  const base = network === "PUBLIC"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";
  return `${base}/tx/${transactionHash}`;
}
