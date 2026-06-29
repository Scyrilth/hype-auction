export const COOKIE_CONSENT_STORAGE_KEY = "ha_cookie_consent";

export const COOKIE_CONSENT_CHANGED_EVENT = "ha_cookie_consent_changed";

export type CookieConsentChoice = "all" | "essential";

export type CookieConsentRecord = {
  consent: CookieConsentChoice;
  date: string;
};

export function getCookieConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CookieConsentRecord;
    if (parsed.consent !== "all" && parsed.consent !== "essential") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.consent === "all";
}

export function saveCookieConsent(consent: CookieConsentChoice): CookieConsentRecord {
  const record: CookieConsentRecord = {
    consent,
    date: new Date().toISOString(),
  };

  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT));

  return record;
}
