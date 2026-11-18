import { useEffect, useState, type ReactNode } from "react";
import AnalyticsConsent from "./AnalyticsConsent";
import SiteBrand from "./SiteBrand";
import "../styles.css";

type PageArea = "Hjælp og kontakt" | "Konto" | "Kontoværktøjer" | "Om hjemmesiden";

export function ServiceShell({ children, area, className = "", address }: {
  children: ReactNode;
  area: PageArea;
  className?: string;
  address?: ReactNode;
}) {
  return (
    <div className={`service-page ${className}`}>
      <a className="service-skip" href="#hovedindhold">Gå til hovedindhold</a>
      <header className="service-header service-wrap">
        <SiteBrand />
        <nav aria-label="Hovedmenu">
          <a href="/support" aria-current={area === "Hjælp og kontakt" ? "location" : undefined}>Support</a>
          <a href="/app" aria-current={area === "Konto" ? "location" : undefined}>Konto</a>
        </nav>
      </header>
      <main className="service-main service-wrap" id="hovedindhold" tabIndex={-1}>
        <div className="service-path">
          <a href="/">Forside</a><span aria-hidden="true">/</span>
          {area === "Kontoværktøjer" && <><a href="/app">Konto</a><span aria-hidden="true">/</span></>}
          <span>{area}</span>
        </div>
        {children}
      </main>
      <footer className="service-footer">
        <div className="service-footer-inner service-wrap">
          <div className="service-footer-owner"><SiteBrand />{address}</div>
          <div className="service-footer-links">
            <nav aria-label="Praktiske oplysninger">
              <a href="/support">Support</a><a href="/slet-konto">Slet konto</a>
              <a href="/privatliv">Privatliv</a><a href="/vilkaar">Vilkår</a>
              <a href="/cookies">Cookiepolitik</a><a href="/tilgaengelighed">Tilgængelighed</a>
              <a href="/afmeld">Afmelding</a>
            </nav>
            <AnalyticsConsent />
          </div>
        </div>
      </footer>
    </div>
  );
}

export function ArrowMark({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg className="service-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {diagonal ? <path d="M6 18 18 6M7 6h11v11" /> : <path d="M4 12h15m-6-6 6 6-6 6" />}
    </svg>
  );
}

export function Contents({ entries, title = "På denne side" }: {
  entries: { id: string; title: string }[];
  title?: string;
}) {
  const [current, setCurrent] = useState("");
  useEffect(() => {
    const headings = entries.map(({ id }) => document.getElementById(id));
    let pending = 0;
    function readPosition() {
      pending = 0;
      let section = "";
      const line = Math.min(window.innerHeight * .3, 170);
      for (const heading of headings) {
        if (heading && heading.getBoundingClientRect().top <= line) section = heading.id;
      }
      setCurrent(section);
    }
    function schedule() {
      if (!pending) pending = window.requestAnimationFrame(readPosition);
    }
    readPosition();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(pending);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [entries]);

  const links = (
    <ol>{entries.map((entry, index) => (
      <li key={entry.id}><a href={`#${entry.id}`} aria-current={current === entry.id ? "location" : undefined}>
        <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{entry.title}
      </a></li>
    ))}</ol>
  );

  return (
    <>
      <nav className="service-toc service-toc-desktop" aria-label={title}>
        <p className="service-caption">{title}</p>{links}
      </nav>
      <details className="service-toc service-toc-mobile">
        <summary>{title}</summary>
        <nav aria-label={title} onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) {
            event.currentTarget.closest("details")?.removeAttribute("open");
          }
        }}>{links}</nav>
      </details>
    </>
  );
}
