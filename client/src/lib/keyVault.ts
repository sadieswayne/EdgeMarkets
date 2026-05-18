const STORAGE_PREFIX = 'edge_vault_';
// WARNING: Client-side key storage uses obfuscation only, not true encryption.
// Keys stored here are accessible to anyone with browser access.
// For production use, migrate to server-side encrypted storage with user auth.

export interface StoredKey {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  platform: string;
  addedAt: number;
}

function encode(data: string): string {
  const bytes = new TextEncoder().encode(data);
  const shifted = bytes.map((b, i) => (b + 7 + i) % 256);
  let result = '';
  shifted.forEach(b => { result += String.fromCharCode(b); });
  return btoa(result);
}

function decode(encoded: string): string {
  const raw = atob(encoded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const unshifted = bytes.map((b, i) => (b - 7 - i + 512) % 256);
  return new TextDecoder().decode(unshifted);
}

export function storeApiKey(platform: string, key: Omit<StoredKey, 'platform' | 'addedAt'>): void {
  const data: StoredKey = {
    ...key,
    platform,
    addedAt: Date.now(),
  };
  const encoded = encode(JSON.stringify(data));
  localStorage.setItem(`${STORAGE_PREFIX}${platform}`, encoded);
}

export function retrieveApiKey(platform: string): StoredKey | null {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${platform}`);
  if (!raw) return null;
  try {
    return JSON.parse(decode(raw));
  } catch {
    return null;
  }
}

export function deleteApiKey(platform: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${platform}`);
}

export function listStoredPlatforms(): string[] {
  const platforms: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      platforms.push(key.slice(STORAGE_PREFIX.length));
    }
  }
  return platforms;
}
