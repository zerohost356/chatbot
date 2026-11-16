import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page or local conversation does not exist in this browser.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found-bg" aria-hidden="true">
        <span className="not-found-orb" />
      </div>
      <Logo size={34} />
      <p className="not-found-code">404</p>
      <h1>This thread drifted out of orbit.</h1>
      <p className="not-found-text">
        The page or conversation you are looking for does not exist on this device. History is stored
        per browser, so it may live in a different profile.
      </p>
      <div className="not-found-actions">
        <Link className="btn primary large" href="/new">
          Return to workspace
        </Link>
        <Link className="btn ghost large" href="/">
          Back home
        </Link>
        <Link className="btn ghost large" href="/terms">
          Read the terms
        </Link>
      </div>
    </main>
  );
}
