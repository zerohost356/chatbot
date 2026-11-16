import type { Metadata } from "next";
import ChatWorkspace from "@/components/chat/ChatWorkspace";

export const metadata: Metadata = {
  title: "Conversation",
  description: "A local-first Aurora conversation with streaming answers and exports.",
  robots: { index: false, follow: false },
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatWorkspace key={id} conversationId={id} />;
}
