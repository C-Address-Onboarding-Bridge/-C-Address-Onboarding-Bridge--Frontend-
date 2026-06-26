import { storeEncrypted, retrieveEncrypted, removeEncrypted, clearAllStorageData } from "./secure-storage";

export interface UserPreferences {
  recentAddresses: string[];
  selectedNetwork: "PUBLIC" | "TESTNET";
  lastUsedAsset: string;
  theme: "light" | "dark" | "auto";
}

const PREFERENCES_KEY = "user_preferences";
const RECENT_ADDRESSES_KEY = "recent_addresses";

const defaultPreferences: UserPreferences = {
  recentAddresses: [],
  selectedNetwork: "TESTNET",
  lastUsedAsset: "XLM",
  theme: "auto",
};

export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const stored = await retrieveEncrypted(PREFERENCES_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load preferences:", error);
  }
  return defaultPreferences;
}

export async function savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await loadPreferences();
    const updated = { ...current, ...preferences };
    await storeEncrypted(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save preferences:", error);
  }
}

export async function addRecentAddress(address: string): Promise<void> {
  try {
    const preferences = await loadPreferences();
    const recent = preferences.recentAddresses.filter((a) => a !== address);
    recent.unshift(address);
    const limited = recent.slice(0, 10);
    await savePreferences({ recentAddresses: limited });
  } catch (error) {
    console.error("Failed to add recent address:", error);
  }
}

export async function getRecentAddresses(): Promise<string[]> {
  const preferences = await loadPreferences();
  return preferences.recentAddresses;
}

export async function setSelectedNetwork(network: "PUBLIC" | "TESTNET"): Promise<void> {
  await savePreferences({ selectedNetwork: network });
}

export async function getSelectedNetwork(): Promise<"PUBLIC" | "TESTNET"> {
  const preferences = await loadPreferences();
  return preferences.selectedNetwork;
}

export async function setLastUsedAsset(asset: string): Promise<void> {
  await savePreferences({ lastUsedAsset: asset });
}

export async function getLastUsedAsset(): Promise<string> {
  const preferences = await loadPreferences();
  return preferences.lastUsedAsset;
}

export async function setTheme(theme: "light" | "dark" | "auto"): Promise<void> {
  await savePreferences({ theme });
}

export async function getTheme(): Promise<"light" | "dark" | "auto"> {
  const preferences = await loadPreferences();
  return preferences.theme;
}

export async function clearAllUserData(): Promise<void> {
  try {
    removeEncrypted(PREFERENCES_KEY);
    removeEncrypted(RECENT_ADDRESSES_KEY);
    clearAllStorageData();
  } catch (error) {
    console.error("Failed to clear user data:", error);
  }
}
