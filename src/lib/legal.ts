export interface LegalSection {
  id: string;
  title: string;
  icon: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
}

export interface LegalDocument {
  kind: "terms" | "privacy";
  title: string;
  kicker: string;
  intro: string;
  updated: string;
  summary: { label: string; value: string }[];
  sections: LegalSection[];
}

export const TERMS: LegalDocument = {
  kind: "terms",
  title: "Terms of Service",
  kicker: "The agreement",
  intro:
    "These terms describe how you may use Aurora, a local-first chat workspace. By opening the app or sending a message, you agree to them. If you do not agree, please stop using Aurora.",
  updated: "November 15, 2026",
  summary: [
    { label: "Effective", value: "November 15, 2026" },
    { label: "Reading time", value: "6 minutes" },
    { label: "Applies to", value: "Aurora web app" },
  ],
  sections: [
    {
      id: "acceptance",
      title: "Acceptance of these terms",
      icon: "check",
      paragraphs: [
        "By accessing Aurora you confirm that you can form a binding contract in your jurisdiction and that you will follow these terms. If you use Aurora for an organization, you confirm that you have authority to accept these terms on its behalf.",
        "We may update these terms when the product changes. Material changes will be reflected in the effective date above. Continuing to use Aurora after an update means you accept the revised terms.",
      ],
    },
    {
      id: "service",
      title: "What Aurora is",
      icon: "sparkles",
      paragraphs: [
        "Aurora is a chat interface for large language models. It renders Markdown, highlights code, streams responses, stores conversations in your browser, and lets you export what you create.",
        "Aurora is not a model provider. When a live model is selected, your prompt is sent through the configured LiteRouter endpoint to the model you chose. When the local demo model is selected, no prompt leaves your browser beyond the app server that generates the demo response.",
      ],
      bullets: [
        "The interface and storage layer run in your browser.",
        "Streaming responses are proxied by the Aurora server so API keys never reach the client.",
        "Model availability, quality, and pricing are controlled by the upstream provider.",
      ],
    },
    {
      id: "accounts",
      title: "Your account and local data",
      icon: "database",
      paragraphs: [
        "Aurora does not require an account. Conversations, preferences, and attachment previews are stored in your browser's local storage. You are responsible for maintaining access to that browser profile and for exporting anything you cannot afford to lose.",
        "Clearing site data, using private browsing, changing devices, or exhausting browser storage can remove your history. Aurora displays storage usage and warns when space is low, but it cannot recover data that the browser has deleted.",
      ],
      note: "Export important threads as Markdown or JSON before clearing browser data.",
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      icon: "shield",
      paragraphs: [
        "You may use Aurora for lawful purposes. You may not use it to violate rights, distribute malware, bypass access controls, or generate content that is illegal where you live.",
        "Do not attempt to overload, probe, or reverse engineer the service in ways that harm other users or the upstream providers. Automated abuse of free model allowances is prohibited.",
      ],
      bullets: [
        "No harassment, threats, or targeted abuse.",
        "No uploading of content you do not have permission to share.",
        "No attempts to extract API keys, system prompts, or other users' data.",
        "No circumvention of rate limits or provider terms.",
      ],
    },
    {
      id: "ai-content",
      title: "AI-generated content",
      icon: "brain",
      paragraphs: [
        "Model output can be inaccurate, incomplete, biased, or invented. Aurora does not verify facts, code, legal claims, medical claims, or citations. You are responsible for reviewing output before relying on it.",
        "You own the prompts you write. Subject to the upstream provider's terms, you may use the output as you see fit. We do not claim ownership of your conversations.",
      ],
      note: "Do not use Aurora as the sole source for legal, medical, financial, or safety-critical decisions.",
    },
    {
      id: "attachments",
      title: "Attachments and third-party content",
      icon: "file",
      paragraphs: [
        "You may attach text files, images, and other files subject to the limits shown in the composer. Text is read locally and stored as an excerpt. Images are downscaled in the browser. Binary files keep only their metadata.",
        "When you send a message, excerpts and images may be transmitted to the selected model provider. Do not attach sensitive information unless you are comfortable with that processing.",
      ],
      bullets: [
        "You must have the right to share every attachment.",
        "Attachments are not scanned for malware.",
        "Truncated excerpts may be stored when storage is full.",
      ],
    },
    {
      id: "providers",
      title: "Model providers and network requests",
      icon: "globe",
      paragraphs: [
        "Live responses are routed through LiteRouter to the model you select. Your use of those models is also subject to the provider's terms and privacy practices. Aurora does not control third-party availability, latency, or output.",
        "If a live model is unavailable, Aurora may fall back to a local demo response and label it clearly. A fallback is not a guarantee of service continuity.",
      ],
    },
    {
      id: "ip",
      title: "Intellectual property",
      icon: "scale",
      paragraphs: [
        "The Aurora interface, including its design, code, and branding, is protected by intellectual property laws. We grant you a limited, revocable, non-exclusive license to use the app for personal or internal business purposes.",
        "Open-source dependencies remain governed by their own licenses. Model weights and provider services remain governed by their respective terms.",
      ],
    },
    {
      id: "availability",
      title: "Availability and changes",
      icon: "refresh",
      paragraphs: [
        "Aurora is provided as-is and may change, pause, or stop without notice. Features such as model access, attachment limits, exports, and storage behavior may evolve.",
        "We do not guarantee uptime, data durability, or compatibility with every browser. Always keep an independent copy of important work.",
      ],
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      icon: "alert",
      paragraphs: [
        "To the maximum extent permitted by law, Aurora is provided without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.",
        "We do not warrant that the service will be uninterrupted, secure, or error-free, or that any output will be accurate or appropriate for your use case.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      icon: "lock",
      paragraphs: [
        "To the maximum extent permitted by law, Aurora and its contributors will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, data, goodwill, or business opportunity.",
        "Where liability cannot be excluded, our total liability is limited to the amount you paid to use Aurora in the twelve months before the claim, or one hundred US dollars, whichever is greater.",
      ],
    },
    {
      id: "termination",
      title: "Termination",
      icon: "trash",
      paragraphs: [
        "You may stop using Aurora at any time. You can clear local history from the info panel or by clearing site data in your browser.",
        "We may suspend or restrict access if we believe these terms are being violated or if doing so is necessary to protect the service, providers, or other users.",
      ],
    },
    {
      id: "law",
      title: "Governing law and disputes",
      icon: "globe",
      paragraphs: [
        "These terms are governed by the laws applicable where the service operator is established, without regard to conflict-of-law rules. Local consumer protections that cannot be waived still apply.",
        "Before filing a formal claim, please contact us so we can try to resolve the issue informally.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      icon: "mail",
      paragraphs: [
        "Questions about these terms can be sent to legal@aurora.chat. Include enough detail for us to understand your request.",
        "For privacy-specific requests, see the Privacy Policy for the relevant contact and process.",
      ],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  kind: "privacy",
  title: "Privacy Policy",
  kicker: "Your data, explained",
  intro:
    "Aurora is local-first by design. Your conversations live in your browser. This policy explains exactly what is stored, when data is transmitted, and the controls you have.",
  updated: "November 15, 2026",
  summary: [
    { label: "Effective", value: "November 15, 2026" },
    { label: "Reading time", value: "7 minutes" },
    { label: "Default storage", value: "Your browser" },
  ],
  sections: [
    {
      id: "overview",
      title: "Overview",
      icon: "sparkles",
      paragraphs: [
        "Aurora does not require an account and does not maintain a server-side conversation database. Threads, titles, model choice, preferences, and attachment previews are stored in local storage on your device.",
        "Two things can leave your browser: the messages you send to a live model, and ordinary network metadata required to deliver the app. The sections below describe each case.",
      ],
      bullets: [
        "No advertising trackers.",
        "No selling of personal data.",
        "No cross-site behavioral profiles.",
      ],
    },
    {
      id: "local-data",
      title: "Data you create",
      icon: "database",
      paragraphs: [
        "Aurora stores conversation titles, messages, reasoning traces, timestamps, model identifiers, token estimates, and attachment metadata in your browser's local storage.",
        "Text attachments are stored as truncated excerpts — currently up to about 40,000 characters per file. Images are downscaled and stored as data URLs. Binary files keep only their name, size, and type.",
      ],
      note: "Local storage is readable by anyone with access to your browser profile. Use a trusted device and lock screen.",
    },
    {
      id: "storage",
      title: "Where data is stored",
      icon: "lock",
      paragraphs: [
        "All conversation data is stored under a single namespaced local-storage key on the current origin. Preferences, theme, and the last selected model use separate keys.",
        "Aurora does not sync between devices. If you want the same thread elsewhere, export it and store the file yourself.",
      ],
    },
    {
      id: "transmission",
      title: "When data leaves your browser",
      icon: "globe",
      paragraphs: [
        "When you send a message with a live model selected, the conversation context, relevant text-attachment excerpts, and any attached images are sent to the Aurora server, which forwards them to LiteRouter and the chosen model provider.",
        "Reasoning text may be returned by models that expose it. It is displayed in the app and stored with the message unless you delete the thread.",
      ],
      bullets: [
        "Demo mode produces responses on the app server without calling a model provider.",
        "The server does not write your prompt to a database.",
        "Upstream providers process prompts under their own policies.",
      ],
    },
    {
      id: "attachments",
      title: "Attachments",
      icon: "file",
      paragraphs: [
        "Attachment processing happens in your browser. Text files are read with the File API. Images are resized with a canvas before storage. Binary files are not parsed.",
        "If storage is full, Aurora may drop older conversations or attachment excerpts to keep the app working. It will tell you when that happens.",
      ],
    },
    {
      id: "providers",
      title: "Model provider processing",
      icon: "server",
      paragraphs: [
        "LiteRouter acts as a gateway to third-party models. The provider that runs your selected model may retain prompts and outputs according to its own retention and training policies. Aurora cannot guarantee how a provider handles data.",
        "Free model tiers may have different retention or usage terms than paid tiers. Review the provider's documentation before sending confidential material.",
      ],
      note: "Do not send secrets, credentials, regulated health data, or client-confidential information to a model you do not trust.",
    },
    {
      id: "logs",
      title: "Technical data and logs",
      icon: "clock",
      paragraphs: [
        "The hosting platform may record standard request metadata such as IP address, user agent, timestamps, and error information for security and reliability. These logs are not used to build advertising profiles.",
        "We do not intentionally log message bodies in application code. Infrastructure providers may capture request data transiently as part of normal operation.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      icon: "key",
      paragraphs: [
        "Aurora does not use advertising cookies. It uses local storage for functionality: conversation history, theme, view preferences, and the last selected model.",
        "You can clear these values from your browser settings or from the danger zone in the conversation info panel. Clearing them removes your local history permanently.",
      ],
      bullets: [
        "aurora.theme — light or dark preference.",
        "aurora.conversations.v1 — threads and messages.",
        "aurora.prefs.v1 — code and timestamp display options.",
        "aurora.model.v1 — last selected model.",
      ],
    },
    {
      id: "retention",
      title: "Retention and deletion",
      icon: "trash",
      paragraphs: [
        "Local data remains until you delete a thread, clear all history, or clear site data. Deletion is immediate in the interface and cannot be undone.",
        "Exported files are outside Aurora's control. Delete them from your device or cloud storage when you no longer need them.",
      ],
    },
    {
      id: "security",
      title: "Security",
      icon: "shield",
      paragraphs: [
        "API keys are held server-side and are never included in client bundles. Traffic should be served over HTTPS in production. Streaming responses use no-store cache headers.",
        "No system is perfectly secure. Local storage is not encrypted at rest by Aurora. Protect your device, use a strong screen lock, and avoid sending sensitive data to third-party models.",
      ],
    },
    {
      id: "rights",
      title: "Your rights",
      icon: "scale",
      paragraphs: [
        "Because Aurora does not hold a server-side account profile, most access and deletion requests can be fulfilled directly in the app. You can view, export, and delete threads from the interface.",
        "If you believe a provider has processed your data unlawfully, contact that provider. For questions about Aurora itself, use the contact details below.",
      ],
    },
    {
      id: "children",
      title: "Children",
      icon: "users",
      paragraphs: [
        "Aurora is not directed to children under 13, or under the minimum age required by local law. Do not use the service if you are below that age.",
        "If you believe a child has provided personal information, contact us so we can help remove it.",
      ],
    },
    {
      id: "international",
      title: "International transfers",
      icon: "globe",
      paragraphs: [
        "Model providers may process requests in countries other than yours. Those transfers are governed by the provider's safeguards and applicable law.",
        "Aurora itself is a static-first application; your local history does not move between regions.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      icon: "refresh",
      paragraphs: [
        "We will update this policy when the product or legal requirements change. The effective date at the top always reflects the current version.",
        "If a change materially affects how personal data is handled, we will make that clear in the app.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      icon: "mail",
      paragraphs: [
        "Privacy questions can be sent to privacy@aurora.chat. We aim to respond within a reasonable period.",
        "For security reports, include a clear reproduction and avoid accessing data that is not yours.",
      ],
    },
  ],
};
