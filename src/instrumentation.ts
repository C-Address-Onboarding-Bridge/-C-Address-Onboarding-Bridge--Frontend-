/**
 * Next.js instrumentation hook — runs once on server startup before any
 * requests are handled. We use it to fail fast on env misconfiguration rather
 * than surfacing cryptic errors at request time.
 */
export async function register() {
  // Only validate on the server; NEXT_PUBLIC_* vars are also available in the
  // browser, but startup validation belongs to the server process.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./lib/env");
    validateEnv();
  }
}
