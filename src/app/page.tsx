import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Aurora — a calmer place to think with AI",
  description:
    "A local-first AI chat workspace with streaming answers, beautiful Markdown, color-highlighted code, visible reasoning, attachments, and private on-device history.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <LandingPage />;
}
