export const COUNTRY_OPTIONS = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "NL", name: "Netherlands" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NZ", name: "New Zealand" },
  { code: "IE", name: "Ireland" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "PT", name: "Portugal" },
  { code: "PL", name: "Poland" },
  { code: "PH", name: "Philippines" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "ID", name: "Indonesia" },
  { code: "ZA", name: "South Africa" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "IL", name: "Israel" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "TR", name: "Turkey" },
  { code: "OTHER", name: "Other" },
] as const;

/** Full country names for shipping address forms (legacy). */
export const COUNTRIES = COUNTRY_OPTIONS.map((country) => country.name);

export function getCountryName(codeOrName: string | null | undefined): string {
  if (!codeOrName?.trim()) return "Unknown";

  const trimmed = codeOrName.trim();
  const byCode = COUNTRY_OPTIONS.find((country) => country.code === trimmed);
  if (byCode) return byCode.name;

  const byName = COUNTRY_OPTIONS.find((country) => country.name === trimmed);
  return byName?.name ?? trimmed;
}

export function getCountryCode(
  codeOrName: string | null | undefined
): string | null {
  if (!codeOrName?.trim()) return null;

  const trimmed = codeOrName.trim();
  const byCode = COUNTRY_OPTIONS.find((country) => country.code === trimmed);
  if (byCode) return byCode.code;

  const byName = COUNTRY_OPTIONS.find((country) => country.name === trimmed);
  if (byName) return byName.code;

  return trimmed.length === 2 ? trimmed.toUpperCase() : null;
}

export function countriesMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const codeA = getCountryCode(a);
  const codeB = getCountryCode(b);
  if (!codeA || !codeB) return false;
  return codeA === codeB;
}
