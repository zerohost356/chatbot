"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { LegalDocument } from "@/lib/legal";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BrainIcon,
  CheckIcon,
  ClockIcon,
  DatabaseIcon,
  FileIcon,
  GlobeIcon,
  KeyIcon,
  LockIcon,
  MailIcon,
  RefreshIcon,
  ScaleIcon,
  ServerIcon,
  ShieldIcon,
  SparklesIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/ui/icons";

const ICONS: Record<string, React.ReactNode> = {
  check: <CheckIcon size={18} />,
  sparkles: <SparklesIcon size={18} />,
  database: <DatabaseIcon size={18} />,
  shield: <ShieldIcon size={18} />,
  brain: <BrainIcon size={18} />,
  file: <FileIcon size={18} />,
  globe: <GlobeIcon size={18} />,
  scale: <ScaleIcon size={18} />,
  refresh: <RefreshIcon size={18} />,
  alert: <AlertIcon size={18} />,
  lock: <LockIcon size={18} />,
  trash: <TrashIcon size={18} />,
  mail: <MailIcon size={18} />,
  server: <ServerIcon size={18} />,
  clock: <ClockIcon size={18} />,
  key: <KeyIcon size={18} />,
  users: <UsersIcon size={18} />,
};

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

export default function LegalPage({ document: legal }: { document: LegalDocument }) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(legal.sections[0]?.id ?? "");
  const [showTop, setShowTop] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        ticking.current = false;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        setShowTop(window.scrollY > 640);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduceMotion) {
      revealTargets.forEach((el) => el.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
      );
      revealTargets.forEach((el) => revealObserver.observe(el));
      return () => revealObserver.disconnect();
    }
    return undefined;
  }, []);

  useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(".legal-section[id]"),
    );
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [legal.kind]);

  const other = legal.kind === "terms" ? { href: "/privacy", label: "Privacy Policy" } : { href: "/terms", label: "Terms of Service" };

  return (
    <div className={`legal legal-${legal.kind}`}>
      <div className="legal-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="legal-bg" aria-hidden="true">
        <span className="legal-glow glow-one" />
        <span className="legal-glow glow-two" />
        <span className="legal-glow glow-three" />
        <span className="legal-grid" />
        <span className="legal-grain" />
      </div>

      <header className="legal-topbar">
        <Logo size={30} />
        <div className="legal-topbar-actions">
          <Link className="legal-back" href="/new">
            <ArrowLeftIcon size={15} /> Back to workspace
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="legal-main">
        <section className="legal-hero">
          <div className="legal-hero-copy">
            <p className="legal-kicker">
              <span className="legal-kicker-dot" />
              {legal.kicker}
            </p>
            <h1 className="legal-title">
              {legal.title.split(" ").map((word, index) => (
                <span key={index} className={index === legal.title.split(" ").length - 1 ? "gradient-text" : undefined}>
                  {word}{" "}
                </span>
              ))}
            </h1>
            <p className="legal-intro">{legal.intro}</p>
            <div className="legal-hero-actions">
              <Link className="btn primary large" href="/new">
                Open Aurora <ArrowUpRightIcon size={16} />
              </Link>
              <Link className="btn ghost large" href={other.href}>
                {other.label}
              </Link>
            </div>
            <dl className="legal-summary">
              {legal.summary.map((item) => (
                <div key={item.label} className="legal-summary-item">
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="legal-hero-art" aria-hidden="true">
            <span className="legal-art-ring ring-one" />
            <span className="legal-art-ring ring-two" />
            <span className="legal-art-ring ring-three" />
            <span className="legal-art-core">
              {legal.kind === "terms" ? <ScaleIcon size={34} /> : <ShieldIcon size={34} />}
            </span>
            <span className="legal-art-star star-one" />
            <span className="legal-art-star star-two" />
            <span className="legal-art-star star-three" />
            <span className="legal-art-label">
              {legal.kind === "terms" ? "Fair use" : "Local-first"}
            </span>
          </div>
        </section>

        <nav className="legal-toc-mobile" aria-label="Sections">
          {legal.sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={active === section.id ? "is-active" : undefined}
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="legal-layout">
          <article className="legal-content">
            {legal.sections.map((section, index) => (
              <section id={section.id} className="legal-section" key={section.id} data-reveal>
                <div className="legal-section-head">
                  <span className="legal-section-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="legal-section-icon">{ICONS[section.icon] ?? <SparklesIcon size={18} />}</span>
                  <h2>{section.title}</h2>
                </div>
                <div className="legal-section-body">
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>
                      <RichText text={paragraph} />
                    </p>
                  ))}
                  {section.bullets?.length ? (
                    <ul className="legal-bullets">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>
                          <span className="legal-bullet-dot" />
                          <span><RichText text={bullet} /></span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {section.note ? (
                    <div className="legal-note">
                      <ShieldIcon size={16} />
                      <p><RichText text={section.note} /></p>
                    </div>
                  ) : null}
                </div>
              </section>
            ))}

            <section className="legal-cta" data-reveal>
              <div className="legal-cta-orb" aria-hidden="true" />
              <div>
                <p className="legal-kicker">
                  <span className="legal-kicker-dot" />
                  You are in control
                </p>
                <h2>Ready to get back to the conversation?</h2>
                <p>
                  History stays on this device. Export anything worth keeping, and delete what you no
                  longer need.
                </p>
              </div>
              <div className="legal-cta-actions">
                <Link className="btn primary" href="/new">
                  Open workspace
                </Link>
                <Link className="btn ghost" href={other.href}>
                  {other.label}
                </Link>
              </div>
            </section>
          </article>

          <aside className="legal-toc" aria-label="On this page">
            <div className="legal-toc-card">
              <p className="legal-toc-title">On this page</p>
              <ol>
                {legal.sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className={active === section.id ? "is-active" : undefined}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
              <div className="legal-toc-meta">
                <ClockIcon size={13} />
                {legal.updated}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="legal-footer">
        <Logo size={24} withWordmark={false} />
        <p>© {new Date().getFullYear()} Aurora. Built for calm, local-first conversations.</p>
        <div className="legal-footer-links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/new">Workspace</Link>
        </div>
      </footer>

      <button
        type="button"
        className={`legal-top${showTop ? " is-visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <ArrowUpRightIcon size={16} />
      </button>
    </div>
  );
}
