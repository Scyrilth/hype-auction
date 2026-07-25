export type WalletAuthSession = {
  token: string;
  wallet: string;
  expiresAt: number;
};

let activeSession: WalletAuthSession | null = null;

export function setWalletAuthSession(session: WalletAuthSession | null): void {
  activeSession = session;
}

export function clearWalletAuthSession(): void {
  activeSession = null;
}

export function getWalletAuthSession(): WalletAuthSession | null {
  if (!activeSession) return null;
  if (activeSession.expiresAt <= Date.now()) {
    activeSession = null;
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
