const STORAGE_KEY_PREFIX = "c_bridge_encrypted_";
const ENCRYPTION_KEY_STORE = "c_bridge_encryption_key";

async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(ENCRYPTION_KEY_STORE);
  if (stored) {
    const keyData = JSON.parse(stored);
    return await crypto.subtle.importKey(
      "jwk",
      keyData,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  }

  const key = await generateKey();
  const keyJwk = await crypto.subtle.exportKey("jwk", key);
  localStorage.setItem(ENCRYPTION_KEY_STORE, JSON.stringify(keyJwk));
  return key;
}

export async function encryptData(data: string): Promise<string> {
  const key = await getOrCreateKey();
  const encoded = new TextEncoder().encode(data);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}

export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getOrCreateKey();
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}

export function clearAllStorageData(): void {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX) || key === ENCRYPTION_KEY_STORE) {
      keys.push(key);
    }
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

export async function storeEncrypted(key: string, data: string): Promise<void> {
  const encrypted = await encryptData(data);
  localStorage.setItem(STORAGE_KEY_PREFIX + key, encrypted);
}

export async function retrieveEncrypted(key: string): Promise<string | null> {
  const encrypted = localStorage.getItem(STORAGE_KEY_PREFIX + key);
  if (!encrypted) return null;
  return await decryptData(encrypted);
}

export function removeEncrypted(key: string): void {
  localStorage.removeItem(STORAGE_KEY_PREFIX + key);
}
