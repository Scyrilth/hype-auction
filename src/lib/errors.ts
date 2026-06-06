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

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Failed to place bid.";
}
