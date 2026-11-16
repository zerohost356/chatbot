import Logo from "@/components/ui/Logo";

export default function AppLoading() {
  return (
    <div className="app-loading">
      <div className="app-loading-brand">
        <Logo size={34} />
      </div>
      <div className="app-loading-shell" aria-hidden="true">
        <div className="app-loading-side">
          <span className="skeleton skeleton-pill" />
          <span className="skeleton" />
          <span className="skeleton short" />
          <span className="skeleton short" />
          <span className="skeleton" />
        </div>
        <div className="app-loading-main">
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line short" />
          <span className="skeleton skeleton-card" />
        </div>
      </div>
      <p className="app-loading-text" role="status">Preparing your workspace…</p>
    </div>
  );
}
