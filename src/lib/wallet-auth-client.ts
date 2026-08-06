const SESSION_STORAGE_KEY = "hype-auction-wallet-session";

export type WalletAuthSession = {
  token: string;
  wallet: string;
  expiresAt: number;
};

let activeSession: WalletAuthSession | null = null;

function readFromSessionStorage(): WalletAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WalletAuthSession;
    if (
      !parsed ||
      typeof parsed.token !== "string" ||
      typeof parsed.wallet !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeToSessionStorage(session: WalletAuthSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // sessionStorage may be unavailable (private browsing, etc.) — fail silently,
    // in-memory session still works for the current page lifetime.
  }
}

export function setWalletAuthSession(session: WalletAuthSession | null): void {
  activeSession = session;
  writeToSessionStorage(session);
}

export function clearWalletAuthSession(): void {
  activeSession = null;
  writeToSessionStorage(null);
}

export function getWalletAuthSession(): WalletAuthSession | null {
  if (!activeSession) {
    activeSession = readFromSessionStorage();
  }
  if (!activeSession) return null;
  if (activeSession.expiresAt <= Date.now()) {
    activeSession = null;
    writeToSessionStorage(null);
    return null;
  }
  return activeSession;
}

export function getWalletAuthHeaders(): Record<string, string> {
  const session = getWalletAuthSession();
  if (!session?.token) return {};
  return { Authorization: `Bearer ${session.token}` };
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}
