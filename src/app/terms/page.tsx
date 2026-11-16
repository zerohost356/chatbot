import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { TERMS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The agreement that governs your use of the Aurora chat workspace.",
};

export default function TermsPage() {
  return <LegalPage document={TERMS} />;
}
