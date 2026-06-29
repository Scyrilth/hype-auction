export function sanitizeText(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

export function sanitizeUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("javascript:") || url.startsWith("data:")) return "";
  return url;
}
