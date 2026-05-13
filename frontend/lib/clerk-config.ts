/**
 * Clerk publishable keys must be real values from https://dashboard.clerk.com
 * (placeholders like pk_test_placeholder will crash Clerk's parser).
 */
export function isClerkConfigured(): boolean {
  const k = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  if (!k) return false;
  if (k.includes("placeholder") || k.endsWith("...")) return false;
  if (!k.startsWith("pk_test_") && !k.startsWith("pk_live_")) return false;
  // Real Clerk keys are long; short fake values must fail.
  return k.length >= 50;
}
