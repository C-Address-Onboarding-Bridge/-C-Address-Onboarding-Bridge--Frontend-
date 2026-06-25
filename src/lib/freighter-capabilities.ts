import { isConnected } from "@stellar/freighter-api";

export type CapabilityType =
  | "signTransaction"
  | "getAddress"
  | "getNetwork";

export interface FreighterCapability {
  type: CapabilityType;
  description: string;
  required: boolean;
}

export const FREIGHTER_CAPABILITIES: Record<CapabilityType, FreighterCapability> = {
  getAddress: {
    type: "getAddress",
    description: "Read your Stellar address",
    required: true,
  },
  getNetwork: {
    type: "getNetwork",
    description: "Read current network (Public/Testnet)",
    required: true,
  },
  signTransaction: {
    type: "signTransaction",
    description: "Sign transactions for bridge operations",
    required: false,
  },
};

export interface GrantedCapabilities {
  [key: string]: boolean;
}

const CAPABILITIES_STORAGE_KEY = "freighter_granted_capabilities";

export async function getGrantedCapabilities(): Promise<GrantedCapabilities> {
  try {
    const stored = localStorage.getItem(CAPABILITIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export async function saveGrantedCapabilities(capabilities: GrantedCapabilities): Promise<void> {
  try {
    localStorage.setItem(CAPABILITIES_STORAGE_KEY, JSON.stringify(capabilities));
  } catch (error) {
    console.error("Failed to save granted capabilities:", error);
  }
}

export async function revokeCapability(capability: CapabilityType): Promise<void> {
  const granted = await getGrantedCapabilities();
  delete granted[capability];
  await saveGrantedCapabilities(granted);
}

export async function revokeAllCapabilities(): Promise<void> {
  await saveGrantedCapabilities({});
}

export async function requestCapabilities(capabilities: CapabilityType[]): Promise<boolean> {
  try {
    const conn = await isConnected();
    if (!conn.isConnected) {
      console.error("Freighter not connected");
      return false;
    }

    const granted = await getGrantedCapabilities();
    const toGrant: CapabilityType[] = [];

    for (const cap of capabilities) {
      if (!granted[cap]) {
        toGrant.push(cap);
      }
    }

    if (toGrant.length === 0) {
      return true;
    }

    const confirmMessage = `C-Address Bridge is requesting the following permissions:\n\n${toGrant
      .map((c) => `• ${FREIGHTER_CAPABILITIES[c].description}`)
      .join("\n")}\n\nDo you approve?`;

    if (confirm(confirmMessage)) {
      const newGranted = { ...granted };
      toGrant.forEach((cap) => {
        newGranted[cap] = true;
      });
      await saveGrantedCapabilities(newGranted);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to request capabilities:", error);
    return false;
  }
}

export async function hasCapability(capability: CapabilityType): Promise<boolean> {
  const granted = await getGrantedCapabilities();
  return granted[capability] === true;
}

export async function requireCapability(capability: CapabilityType): Promise<boolean> {
  const has = await hasCapability(capability);
  if (!has) {
    return await requestCapabilities([capability]);
  }
  return true;
}

export async function getRequiredCapabilities(): Promise<CapabilityType[]> {
  return Object.entries(FREIGHTER_CAPABILITIES)
    .filter(([, cap]) => cap.required)
    .map(([key]) => key as CapabilityType);
}

export async function getOptionalCapabilities(): Promise<CapabilityType[]> {
  return Object.entries(FREIGHTER_CAPABILITIES)
    .filter(([, cap]) => !cap.required)
    .map(([key]) => key as CapabilityType);
}

export async function ensureRequiredCapabilities(): Promise<boolean> {
  const required = await getRequiredCapabilities();
  const granted = await getGrantedCapabilities();

  const allGranted = required.every((cap) => granted[cap] === true);
  if (allGranted) {
    return true;
  }

  const missing = required.filter((cap) => granted[cap] !== true);
  return await requestCapabilities(missing);
}
