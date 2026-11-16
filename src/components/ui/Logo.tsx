import React from "react";

export default function Logo({
  size = 34,
  withWordmark = true,
  linked = true,
  href = "/",
}: {
  size?: number;
  withWordmark?: boolean;
  linked?: boolean;
  href?: string;
}) {
  const content = (
    <span className="brand">
      <span
        className="logo-orb"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span className="logo-core" />
        <span className="logo-ring" />
        <span className="logo-spark" />
      </span>
      {withWordmark ? (
        <span className="brand-text">
          <span className="brand-name">Aurora</span>
          <span className="brand-sub">Chat workspace</span>
        </span>
      ) : null}
    </span>
  );

  if (!linked) return content;
  return (
    <a href={href} className="brand-link" aria-label="Aurora home">
      {content}
    </a>
  );
}
