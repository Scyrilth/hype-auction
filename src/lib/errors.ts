export const DEFAULT_USER_ERROR_MESSAGE =
  "Something went wrong. Please try again.";

const UNSAFE_MESSAGE_PATTERNS = [
  /pgrst/i,
  /postgres/i,
  /postgresql/i,
  /supabase/i,
  /duplicate key/i,
  /violates .* constraint/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /syntax error/i,
  /\bSQLSTATE\b/i,
  /JSON object requested, multiple/i,
  /permission denied/i,
  /row-level security/i,
  /JWT expired/i,
  /invalid input syntax/i,
  /node_modules/i,
  /^\s*at\s+/m,
  /\.tsx?:\d+/,
  /\.js:\d+/,
  /\\n\s+at /,
  /"code":/,
  /"details":/,
  /"hint":/,
];

function extractRawMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

function hasSupabaseOrDatabaseCode(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const record = error as Record<string, unknown>;
  const code = record.code;

  if (typeof code === "string") {
    return /^PGRST\d+$/i.test(code) || /^\d{5}$/.test(code);
  }

  return false;
}

export function isUnsafeErrorMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (trimmed.length > 240) return true;

  return UNSAFE_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isSafeUserFacingMessage(message: string): boolean {
  return !isUnsafeErrorMessage(message);
}

export function getErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_USER_ERROR_MESSAGE
): string {
  if (typeof error === "string") {
    return isUnsafeErrorMessage(error) ? fallback : error;
  }

  if (hasSupabaseOrDatabaseCode(error)) {
    return fallback;
  }

  const message = extractRawMessage(error);
  if (!message || isUnsafeErrorMessage(message)) {
    return fallback;
  }

  return message;
}

export function logSupabaseError(label: string, error: unknown) {
  console.error(`[${label}]`, error);
  console.error(`[${label}] full error object:`, JSON.stringify(error, null, 2));

  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    if ("message" in err) console.error(`[${label}] message:`, err.message);
    if ("code" in err) console.error(`[${label}] code:`, err.code);
    if ("details" in err) console.error(`[${label}] details:`, err.details);
    if ("hint" in err) console.error(`[${label}] hint:`, err.hint);
  }
}
