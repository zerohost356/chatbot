import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { PRIVACY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Aurora stores conversations locally, when data is sent to model providers, and the controls you have.",
};

export default function PrivacyPage() {
  return <LegalPage document={PRIVACY} />;
}
