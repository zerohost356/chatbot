import type { Attachment } from "./types";
import { formatBytes, uid } from "./utils";

export const MAX_FILES = 8;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
export const MAX_TEXT_CHARS = 40_000;
export const MAX_IMAGES = 4;
export const MAX_IMAGE_DATA_URL = 420_000;

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "mdx", "json", "jsonc", "js", "jsx", "ts", "tsx",
  "css", "scss", "less", "html", "htm", "xml", "svg", "yml", "yaml", "toml",
  "ini", "env", "csv", "tsv", "log", "py", "rb", "go", "rs", "java", "kt",
  "c", "h", "cpp", "hpp", "cs", "php", "sh", "bash", "zsh", "fish", "sql",
  "graphql", "gql", "prisma", "dockerfile", "gitignore", "lock", "conf",
]);

const TEXT_MIME = /^text\/|json|javascript|typescript|xml|yaml|csv|toml|graphql/;

function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? name.toLowerCase() : name.slice(idx + 1).toLowerCase();
}

export function isTextFile(file: File): boolean {
  if (TEXT_MIME.test(file.type)) return true;
  return TEXT_EXTENSIONS.has(extensionOf(file.name));
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function makeAttachment(
  overrides: Omit<Attachment, "id"> & { id?: string },
): Attachment {
  return { id: overrides.id ?? uid("a"), ...overrides };
}

async function compressImage(file: File): Promise<string | null> {
  if (typeof document === "undefined") return null;
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    let quality = 0.84;
    let dataUrl = "";
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) break;
      ctx.drawImage(bitmap, 0, 0, width, height);
      dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_IMAGE_DATA_URL) break;
      width = Math.max(320, Math.round(width * 0.8));
      height = Math.max(320, Math.round(height * 0.8));
      quality = Math.max(0.55, quality - 0.08);
    }
    bitmap.close?.();
    return dataUrl.length <= MAX_IMAGE_DATA_URL * 1.4 ? dataUrl : null;
  } catch {
    return null;
  }
}

export interface AttachmentReadResult {
  added: Attachment[];
  errors: string[];
}

export async function readFiles(
  files: File[],
  existing: Attachment[],
  options: { visionEnabled?: boolean } = {},
): Promise<AttachmentReadResult> {
  const added: Attachment[] = [];
  const errors: string[] = [];
  let total = existing.reduce((sum, a) => sum + a.size, 0);
  let images = existing.filter((a) => a.kind === "image").length;

  for (const file of files) {
    if (existing.length + added.length >= MAX_FILES) {
      errors.push(`You can attach up to ${MAX_FILES} files per message.`);
      break;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(`${file.name} is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_FILE_BYTES)}.`);
      continue;
    }
    if (total + file.size > MAX_TOTAL_BYTES) {
      errors.push(`Attachments are limited to ${formatBytes(MAX_TOTAL_BYTES)} in total.`);
      break;
    }
    if (existing.some((a) => a.name === file.name && a.size === file.size)) {
      errors.push(`${file.name} is already attached.`);
      continue;
    }
    total += file.size;

    if (isImageFile(file)) {
      if (images >= MAX_IMAGES) {
        errors.push(`Up to ${MAX_IMAGES} images can be attached at once.`);
        continue;
      }
      const dataUrl = await compressImage(file);
      if (!dataUrl) {
        errors.push(`${file.name} could not be optimized. Try a smaller image.`);
        continue;
      }
      images += 1;
      added.push(
        makeAttachment({
          name: file.name,
          size: dataUrl.length,
          type: "image/jpeg",
          kind: "image",
          content: dataUrl,
        }),
      );
      if (!options.visionEnabled) {
        errors.push("This model may not read images. Pick a vision model for best results.");
      }
      continue;
    }

    if (isTextFile(file)) {
      let text = "";
      try {
        text = await file.text();
      } catch {
        errors.push(`${file.name} could not be read.`);
        continue;
      }
      const truncated = text.length > MAX_TEXT_CHARS;
      added.push(
        makeAttachment({
          name: file.name,
          size: file.size,
          type: file.type || "text/plain",
          kind: "text",
          content: truncated ? text.slice(0, MAX_TEXT_CHARS) : text,
          truncated,
        }),
      );
      continue;
    }

    added.push(
      makeAttachment({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        kind: "file",
      }),
    );
    errors.push(`${file.name} is binary — only its name and size will be shared.`);
  }

  return { added, errors };
}

export function pastedTextAttachment(text: string): Attachment {
  const content = text.slice(0, MAX_TEXT_CHARS);
  return makeAttachment({
    name: `Pasted text · ${content.length.toLocaleString("en-US")} chars`,
    size: text.length,
    type: "text/plain",
    kind: "text",
    content,
    truncated: text.length > MAX_TEXT_CHARS,
  });
}

export function attachmentKindLabel(attachment: Attachment): string {
  if (attachment.kind === "image") return "Image";
  if (attachment.kind === "text") return "Text file";
  return "File";
}
