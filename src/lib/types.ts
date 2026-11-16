export type Role = "user" | "assistant" | "system";

export type AttachmentKind = "text" | "image" | "file";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  kind: AttachmentKind;
  /** Text excerpt for text files, data URL for images. */
  content?: string;
  truncated?: boolean;
}

export type MessageStatus = "streaming" | "done" | "stopped" | "error";

export interface Message {
  id: string;
  role: Role;
  content: string;
  reasoning?: string;
  createdAt: number;
  model?: string;
  attachments?: Attachment[];
  status?: MessageStatus;
  error?: string;
  durationMs?: number;
  usage?: TokenUsage;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  messages: Message[];
  pinned?: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  vendor: string;
  description?: string;
  context?: number;
  reasoning?: boolean;
  vision?: boolean;
  free?: boolean;
  recommended?: boolean;
  available?: boolean;
}

export interface ViewPreferences {
  lineNumbers: boolean;
  wrapCode: boolean;
  showTimestamps: boolean;
}
