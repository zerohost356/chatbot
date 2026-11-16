"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#07080d",
          color: "#f1f3fb",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <p style={{ color: "#ff8fb8", fontFamily: "monospace", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Fatal error
          </p>
          <h1 style={{ margin: "14px 0 0", fontSize: 38, lineHeight: 1.08, letterSpacing: "-0.04em" }}>
            Aurora could not start.
          </h1>
          <p style={{ margin: "16px 0 0", color: "#858da4", fontSize: 15, lineHeight: 1.6 }}>
            The app crashed before rendering its layout. Reload the page to try again. Local conversations
            remain in this browser.
          </p>
          {error.digest ? (
            <p style={{ margin: "12px 0 0", color: "#5c647a", fontFamily: "monospace", fontSize: 11 }}>
              ref {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 26,
              height: 46,
              padding: "0 22px",
              border: 0,
              borderRadius: 13,
              background: "linear-gradient(135deg, #8f7bff, #a98bff)",
              color: "#fff",
              font: "inherit",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload Aurora
          </button>
        </div>
      </body>
    </html>
  );
}
