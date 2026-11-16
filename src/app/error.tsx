"use client";

import { useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { AlertIcon, RefreshIcon } from "@/components/ui/icons";

export default function ErrorPage({
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
    <main className="system-page">
      <div className="system-page-bg" aria-hidden="true">
        <span className="system-page-ring" />
      </div>
      <Logo size={34} />
      <span className="system-page-code"><AlertIcon size={14} /> Runtime error</span>
      <h1>Something interrupted this page.</h1>
      <p>
        The interface hit an unexpected error. Your conversations are still stored on this device — retry
        the page or head back to the workspace.
      </p>
      {error.digest ? <code className="system-page-digest">ref {error.digest}</code> : null}
      <div className="system-page-actions">
        <button type="button" className="btn primary large" onClick={reset}>
          <RefreshIcon size={15} />
          Try again
        </button>
        <Link className="btn large" href="/new">Open workspace</Link>
        <Link className="btn ghost large" href="/">Back home</Link>
      </div>
    </main>
  );
}
