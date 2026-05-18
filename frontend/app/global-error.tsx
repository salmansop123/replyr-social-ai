"use client";

/**
 * Root-level error UI when the root layout fails. Must define <html> and <body>.
 * Prevents Next from getting stuck on “missing required error components, refreshing…”.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem", background: "#f8fafc" }}>
        <h1 style={{ fontSize: "1.25rem", color: "#0f172a" }}>Application error</h1>
        <p style={{ color: "#475569", maxWidth: "32rem" }}>{error.message || "Something went wrong."}</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "#0f172a",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
