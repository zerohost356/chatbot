import type { Metadata } from "next";
import ChatWorkspace from "@/components/chat/ChatWorkspace";

export const metadata: Metadata = {
  title: "New conversation",
  description: "Open a fresh Aurora conversation with streaming answers, Markdown, and highlighted code.",
  robots: { index: false, follow: false },
};

export default function NewChatPage() {
  return <ChatWorkspace />;
}
