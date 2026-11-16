"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  BrainIcon,
  CheckIcon,
  CodeIcon,
  DownloadIcon,
  LayoutIcon,
  LockIcon,
  MenuIcon,
  PaperclipIcon,
  ShieldIcon,
  SparklesIcon,
  XIcon,
  ZapIcon,
} from "@/components/ui/icons";
import { MODEL_OPTIONS } from "@/lib/chat";

const FEATURES = [
  {
    icon: ZapIcon,
    title: "Streaming, token by token",
    text: "Answers appear as they are written, with a stop button that genuinely cancels the upstream request.",
    tag: "Real-time",
  },
  {
    icon: CodeIcon,
    title: "Markdown with color",
    text: "Tables, task lists, quotes, links, and syntax-highlighted code for bash, TypeScript, Python, and more.",
    tag: "Readable",
  },
  {
    icon: BrainIcon,
    title: "Reasoning, not hidden",
    text: "When a model exposes its thinking, Aurora shows a collapsible trace with live status and timing.",
    tag: "Transparent",
  },
  {
    icon: PaperclipIcon,
    title: "Files in context",
    text: "Drop text files or images. Long pastes become attachments. Everything is prepared locally first.",
    tag: "Practical",
  },
  {
    icon: DownloadIcon,
    title: "Take it with you",
    text: "Copy any answer, or export a whole thread as clean Markdown or structured JSON in one click.",
    tag: "Portable",
  },
  {
    icon: LockIcon,
    title: "Private by default",
    text: "History lives in your browser. No account, no server-side database, no training on your threads.",
    tag: "Local-first",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Open the workspace",
    text: "One click from this page. No account, no onboarding wizard, no empty dashboard to configure.",
  },
  {
    number: "02",
    title: "Pick a free model",
    text: "Start with DeepSeek V4.1 Flash or switch models mid-thread from the header picker.",
  },
  {
    number: "03",
    title: "Ask, refine, export",
    text: "Watch the answer stream in, inspect the reasoning, then copy, share, or export the thread.",
  },
];

const MARQUEE_ITEMS = [
  ...MODEL_OPTIONS.map((model) => ({ icon: SparklesIcon, label: model.name })),
  { icon: CodeIcon, label: "Color code blocks" },
  { icon: LockIcon, label: "Local history" },
  { icon: DownloadIcon, label: "One-click export" },
  { icon: BrainIcon, label: "Visible reasoning" },
  { icon: ZapIcon, label: "Live streaming" },
];

const FOOTER_FEATURES = [
  "Streaming replies",
  "Markdown rendering",
  "Color code blocks",
  "Reasoning traces",
  "Attachments",
  "Local history",
  "Markdown export",
  "JSON export",
];

function useLandingMotion(rootRef: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      setScrolled(window.scrollY > 24);
      root.style.setProperty("--scroll-shift", `${window.scrollY * -0.05}px`);
      root.style.setProperty("--scroll-shift-slow", `${window.scrollY * -0.025}px`);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    let pointerFrame = 0;
    let pointerX = 50;
    let pointerY = 20;
    const onPointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
      pointerY = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100;
      if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(() => {
          pointerFrame = 0;
          root.style.setProperty("--mx", `${pointerX}%`);
          root.style.setProperty("--my", `${pointerY}%`);
        });
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    root.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.removeEventListener("pointermove", onPointerMove);
      if (frame) window.cancelAnimationFrame(frame);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    };
  }, [rootRef]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [rootRef]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-ripple]");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "landing-ripple";
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      target.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    };
    root.addEventListener("pointerdown", onPointerDown);
    return () => root.removeEventListener("pointerdown", onPointerDown);
  }, [rootRef]);

  return { progress, scrolled };
}

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { progress, scrolled } = useLandingMotion(rootRef);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing" ref={rootRef}>
      <div className="landing-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="landing-bg" aria-hidden="true">
        <span className="landing-grid" />
        <span className="landing-glow landing-glow-a" />
        <span className="landing-glow landing-glow-b" />
        <span className="landing-glow landing-glow-c" />
        <span className="landing-spotlight" />
      </div>

      <header className={`landing-nav${scrolled ? " is-scrolled" : ""}`}>
        <div className="landing-nav-inner">
          <Logo size={32} />
          <nav className="landing-links" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#models">Models</a>
            <a href="#privacy">Privacy</a>
          </nav>
          <div className="landing-nav-actions">
            <ThemeToggle />
            <Link className="btn primary landing-nav-cta" href="/new">
              Get started
              <ArrowUpRightIcon size={15} />
            </Link>
            <button
              type="button"
              className="icon-btn landing-menu-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>
        <div className={`landing-mobile-menu${menuOpen ? " is-open" : ""}`}>
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#how" onClick={closeMenu}>How it works</a>
          <a href="#models" onClick={closeMenu}>Models</a>
          <a href="#privacy" onClick={closeMenu}>Privacy</a>
          <Link href="/new" onClick={closeMenu} className="btn primary">
            Start chatting
            <ArrowUpRightIcon size={15} />
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-badge landing-enter" style={{ animationDelay: "40ms" }}>
              <span className="landing-badge-dot" />
              Local-first · Free models · Live streaming
            </span>
            <h1 className="landing-enter" style={{ animationDelay: "110ms" }}>
              A calmer place to
              <br />
              <span className="gradient-text">think with AI.</span>
            </h1>
            <p className="landing-lede landing-enter" style={{ animationDelay: "180ms" }}>
              Aurora pairs a distraction-free workspace with beautiful Markdown, highlighted code,
              visible reasoning, and history that never leaves your browser.
            </p>
            <div className="landing-hero-actions landing-enter" style={{ animationDelay: "250ms" }}>
              <Link className="btn primary large landing-cta" href="/new" data-ripple>
                Get started
                <ArrowUpRightIcon size={17} />
              </Link>
              <a className="btn ghost large" href="#features">
                Explore features
                <ArrowDownIcon size={16} />
              </a>
            </div>
            <p className="landing-footnote landing-enter" style={{ animationDelay: "310ms" }}>
              <CheckIcon size={14} />
              No account. No setup. Your first thread is one click away.
            </p>
            <dl className="landing-stats landing-enter" style={{ animationDelay: "370ms" }}>
              <div>
                <dt>4</dt>
                <dd>free models</dd>
              </div>
              <div>
                <dt>100%</dt>
                <dd>local history</dd>
              </div>
              <div>
                <dt>0</dt>
                <dd>accounts required</dd>
              </div>
            </dl>
          </div>

          <div className="landing-hero-visual landing-enter" style={{ animationDelay: "220ms" }}>
            <span className="landing-orbit landing-orbit-a" aria-hidden="true" />
            <span className="landing-orbit landing-orbit-b" aria-hidden="true" />
            <div className="landing-window">
              <div className="landing-window-bar">
                <span className="landing-dots" aria-hidden="true">
                  <i /><i /><i />
                </span>
                <span className="landing-window-title">New conversation</span>
                <span className="landing-model-pill">DeepSeek V4.1 Flash</span>
              </div>
              <div className="landing-window-body">
                <div className="landing-bubble user">
                  Explain vector databases with a short code sample.
                </div>
                <div className="landing-reasoning">
                  <span className="landing-reasoning-dot" />
                  Thinking through a compact answer
                  <span className="landing-shimmer" />
                </div>
                <div className="landing-bubble assistant">
                  <p>
                    A vector database stores embeddings and finds the nearest neighbours to a query.
                    Think of it as a search index for meaning.
                  </p>
                  <div className="landing-code">
                    <div className="landing-code-head">
                      <span>bash</span>
                      <span>copy</span>
                    </div>
                    <pre>
                      <code>
                        <span className="tok-comment"># index once</span>
                        {"\n"}
                        <span className="tok-function">curl</span> -X POST <span className="tok-string">$AURORA/api/chat</span> \{"\n"}
                        {"  "}-H <span className="tok-string">&quot;Content-Type: application/json&quot;</span> \{"\n"}
                        {"  "}-d <span className="tok-string">&#39;{`{"messages":[{"role":"user","content":"hi"}]}`}&#39;</span>
                        <span className="landing-caret" />
                      </code>
                    </pre>
                  </div>
                  <p className="landing-stream-note">
                    <span className="landing-pulse" />
                    streaming · 42 tokens/s
                  </p>
                </div>
              </div>
              <div className="landing-window-composer">
                <span>Ask anything…</span>
                <span className="landing-send" aria-hidden="true"><ArrowDownIcon size={14} /></span>
              </div>
            </div>
            <div className="landing-float-card landing-float-a">
              <BrainIcon size={15} />
              <span>Reasoning visible</span>
            </div>
            <div className="landing-float-card landing-float-b">
              <ShieldIcon size={15} />
              <span>Stored on this device</span>
            </div>
          </div>
        </section>

        <section className="landing-marquee" aria-label="Available capabilities">
          <div className="landing-marquee-track">
            {[0, 1].map((group) => (
              <div className="landing-marquee-group" key={group} aria-hidden={group === 1}>
                {MARQUEE_ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <span className="landing-marquee-item" key={`${item.label}-${index}`}>
                      <Icon size={13} />
                      {item.label}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section-head" data-reveal>
            <span className="landing-kicker">Built for focus</span>
            <h2>Everything you need to think clearly, nothing you don&apos;t.</h2>
            <p>
              Aurora keeps the chat surface quiet and puts the useful details one layer deeper:
              reasoning, sources, attachments, and exports.
            </p>
          </div>
          <div className="landing-feature-grid">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  className="landing-feature"
                  key={feature.title}
                  data-reveal
                  style={{ transitionDelay: `${(index % 3) * 70}ms` }}
                >
                  <span className="landing-feature-icon"><Icon size={19} /></span>
                  <span className="landing-feature-tag">{feature.tag}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-section landing-how" id="how">
          <div className="landing-section-head" data-reveal>
            <span className="landing-kicker">Less ceremony</span>
            <h2>From landing page to first answer in seconds.</h2>
            <p>No sign-up wall, no credit card, no workspace to configure before you can think.</p>
          </div>
          <div className="landing-steps">
            {STEPS.map((step, index) => (
              <article
                className="landing-step"
                key={step.number}
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span className="landing-step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-models" id="models">
          <div className="landing-models-copy" data-reveal>
            <span className="landing-kicker">Free to start</span>
            <h2>DeepSeek models, ready out of the box.</h2>
            <p>
              The default lineup runs through LiteRouter. Switch models from the chat header at any
              time; the conversation and your local history stay exactly where they are.
            </p>
            <ul className="landing-check-list">
              <li><CheckIcon size={15} />1M-token context on the V4.1 family</li>
              <li><CheckIcon size={15} />Visible reasoning traces when available</li>
              <li><CheckIcon size={15} />Vision-ready image attachments</li>
            </ul>
            <Link className="btn primary large landing-cta" href="/new" data-ripple>
              Try a free model
              <ArrowUpRightIcon size={17} />
            </Link>
          </div>
          <div className="landing-model-stack">
            {MODEL_OPTIONS.map((model, index) => (
              <article
                className={`landing-model-card${model.recommended ? " is-recommended" : ""}`}
                key={model.id}
                data-reveal
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <div className="landing-model-head">
                  <span className="landing-model-orb" aria-hidden="true" />
                  <div>
                    <h3>{model.name}</h3>
                    <span>{model.id}</span>
                  </div>
                  {model.recommended ? (
                    <span className="landing-model-badge">Recommended</span>
                  ) : (
                    <span className="landing-model-badge quiet">Free</span>
                  )}
                </div>
                <p>{model.description}</p>
                <div className="landing-model-meta">
                  <span>1M context</span>
                  {model.reasoning ? <span>Reasoning</span> : null}
                  {model.vision ? <span>Vision</span> : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-privacy" id="privacy">
          <div className="landing-privacy-card" data-reveal>
            <div className="landing-privacy-copy">
              <span className="landing-kicker">Private by design</span>
              <h2>Your threads stay in your browser.</h2>
              <p>
                Aurora has no account system and no chat database. Conversations live in local
                storage on this device, and the API key stays on the server.
              </p>
              <div className="landing-privacy-actions">
                <Link className="btn large" href="/privacy">Read the privacy policy</Link>
                <Link className="landing-text-link" href="/terms">
                  Terms of use
                  <ArrowUpRightIcon size={14} />
                </Link>
              </div>
            </div>
            <div className="landing-privacy-visual" aria-hidden="true">
              <div className="landing-lock-ring">
                <LockIcon size={28} />
              </div>
              <div className="landing-storage-row">
                <span>Conversations</span>
                <span className="landing-storage-track"><i style={{ width: "72%" }} /></span>
                <span>local</span>
              </div>
              <div className="landing-storage-row">
                <span>API key</span>
                <span className="landing-storage-track"><i style={{ width: "100%" }} /></span>
                <span>server</span>
              </div>
              <div className="landing-storage-row">
                <span>Tracking</span>
                <span className="landing-storage-track quiet"><i style={{ width: "2%" }} /></span>
                <span>none</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-final" data-reveal>
          <span className="landing-final-glow" aria-hidden="true" />
          <span className="landing-kicker">Ready when you are</span>
          <h2>Start with a question.<br /><span className="gradient-text">Leave with an answer.</span></h2>
          <p>Aurora opens straight into a new conversation. Nothing to install, nothing to sign up for.</p>
          <Link className="btn primary large landing-cta" href="/new" data-ripple>
            Open the workspace
            <ArrowUpRightIcon size={17} />
          </Link>
          <span className="landing-final-note"><LayoutIcon size={14} /> Works on mobile, tablet, and desktop</span>
        </section>
      </main>

      <footer className="landing-footer" id="footer">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            <Logo size={32} />
            <p>
              A local-first AI chat workspace for people who want the answer, the reasoning, and the
              code — without the noise.
            </p>
            <span className="landing-status"><i /> Systems ready</span>
          </div>
          <div className="landing-footer-col">
            <h3>Features</h3>
            {FOOTER_FEATURES.map((feature) => (
              <a href="#features" key={feature}>{feature}</a>
            ))}
          </div>
          <div className="landing-footer-col">
            <h3>Product</h3>
            <Link href="/new">Start chatting</Link>
            <a href="#how">How it works</a>
            <a href="#models">Models</a>
            <Link href="/terms">Terms of use</Link>
            <Link href="/privacy">Privacy policy</Link>
          </div>
          <div className="landing-footer-col">
            <h3>Models</h3>
            {MODEL_OPTIONS.map((model) => (
              <a href="#models" key={model.id}>{model.name}</a>
            ))}
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} Aurora. Crafted for calm thinking.</span>
          <span className="landing-footer-keys">
            <kbd>⌘</kbd><kbd>K</kbd> new chat
            <span className="landing-footer-dot" />
            <kbd>Shift</kbd><kbd>↵</kbd> new line
          </span>
        </div>
      </footer>
    </div>
  );
}
