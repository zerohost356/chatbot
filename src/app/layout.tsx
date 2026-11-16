import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/styles/chat.css";
import "@/styles/markdown.css";
import "@/styles/legal.css";
import "@/styles/landing.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: {
    default: "Aurora — streaming AI chat workspace",
    template: "%s · Aurora",
  },
  description:
    "A local-first, streaming AI chat workspace with beautiful Markdown, syntax-highlighted code, reasoning traces, attachments, and one-click exports.",
  applicationName: "Aurora",
  authors: [{ name: "Aurora" }],
  keywords: [
    "AI chat",
    "streaming",
    "Markdown",
    "syntax highlighting",
    "Next.js",
    "LiteRouter",
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Aurora — streaming AI chat workspace",
    description:
      "Beautiful Markdown, highlighted code, reasoning traces, attachments, and local-first history.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07080d" },
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
  ],
};

const THEME_SCRIPT = `(function(){document.documentElement.classList.add('js');try{var t=localStorage.getItem('aurora.theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
