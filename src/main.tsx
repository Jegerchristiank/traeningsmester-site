import React, {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { createRoot, type Root } from "react-dom/client";
import "./styles.css";

/* ---------------- Types ---------------- */
type LegalPanelId = "terms" | "privacy" | "cookies" | "accessibility";
type CookieChoice = "necessary";
type WaitlistState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "submitted"; message: string }
  | { type: "error"; message: string };

/* ---------------- Config / Supabase ---------------- */
const siteUrl = "https://www.traeningsmester.dk/";
const defaultSupabaseUrl = "https://rbplnybmjwcoigiwtkuh.supabase.co";
const defaultSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicGxueWJtandjb2lnaXd0a3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUzNDQyNDUsImV4cCI6MjAzMDkyMDI0NX0.12xSasN9rsx8JzJLN_BImCvYu_7oFP_sXHdGWrnN5CM";
const supabaseUrl = (
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? defaultSupabaseUrl
).replace(/\/+$/, "");
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  defaultSupabaseAnonKey;

const company = {
  legalName: "KRISTENSON",
  cvr: "40679456",
  form: "Personligt ejet Mindre Virksomhed",
  address: "Blomstergården 13, 4700 Næstved",
  source: "CVR/Virk via Proff"
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const saveWaitlistSignup = async (email: string) => {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/prelaunch_waitlist_signups`,
    {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        email,
        audience: "nysgerrig",
        audience_label: "Pre-launch signup",
        source: siteUrl,
        consent: true,
        submitted_at: new Date().toISOString(),
        metadata: { capture: "prelaunch-site" }
      })
    }
  );
  if (response.ok) return;
  const responseText = await response.text().catch(() => "");
  if (response.status === 409 && responseText.includes("23505")) return;
  throw new Error(`Waitlist insert failed: ${response.status}`);
};

/* ---------------- Cookie storage ---------------- */
const readStoredCookieChoice = (): CookieChoice | null => {
  try {
    if (typeof window.localStorage === "undefined") return null;
    return window.localStorage.getItem("tm-cookie-choice") === "necessary"
      ? "necessary"
      : null;
  } catch {
    return null;
  }
};
const storeCookieChoice = (choice: CookieChoice) => {
  try {
    window.localStorage?.setItem("tm-cookie-choice", choice);
  } catch {
    /* embedded browsers may block storage */
  }
};

/* ---------------- Hooks ---------------- */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const finePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: fine)").matches;

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/* ---------------- Content ---------------- */
const navItems = [
  { href: "#for-hvem", label: "For hvem" },
  { href: "#appen", label: "Appen" },
  { href: "#traener", label: "Trænere" },
  { href: "#vejen", label: "Vejen frem" },
  { href: "#faq", label: "FAQ" }
];

const trustItems = [
  "100% danskudviklet",
  "Privacy-first",
  "Ingen markedsføringscookies",
  "Apple Watch & Live Activities",
  "Bygget af løftere — til løftere",
  "Program · Log · Historik",
  "AI-indsigt på vej"
];

const audience: {
  num: string;
  title: string;
  desc: string;
  className: string;
  image?: string;
  alt?: string;
}[] = [
  {
    num: "01 / Begynderen",
    title: "Kom i gang i ro",
    desc: "Dagens pas, færre valg og en tryg vej ind i centeret — uden at skulle forstå hele programteorien først.",
    className: "col-5 has-img",
    image: "/photos/beginner-training.jpg",
    alt: "Begynder træner i fitnesscenter"
  },
  {
    num: "02 / Selvtrænende",
    title: "Log som en gris, fremgang som en mester",
    desc: "Sæt, reps, vægt, supersæt og 1RM. Programmet og historikken bor samme sted som passet.",
    className: "col-7 has-img",
    image: "/photos/home-training.jpg",
    alt: "Person der træner med vægte"
  },
  {
    num: "03 / Træneren",
    title: "Klienter — ikke beskedtråde",
    desc: "Saml klienter, programmer og opfølgning i ét arbejdsrum, der ligger tæt på selve træningen.",
    className: "col-7 has-img",
    image: "/photos/coach-training.jpg",
    alt: "Træner med klient"
  },
  {
    num: "04 / Den nysgerrige",
    title: "AI-indsigt i dit program",
    desc: "Få analyse af dit program og din fremgang, når premium-funktionerne ruller ud.",
    className: "col-5 accent"
  }
];

const pillars = [
  {
    phase: "Før passet",
    title: "Programmet er lagt",
    desc: "Planlæg ugen, justér progression og vid præcis, hvad dagens pas indeholder — før du træder ind i centeret. Ingen halve planer i noter og screenshots.",
    image: "/app/programs.jpg",
    alt: "Programmer i Træningsmester"
  },
  {
    phase: "Undervejs",
    title: "Loggen holdes ren",
    desc: "Sæt, reps, vægt og noter ligger lige ved øvelsen. Ingen larm, ingen administration. Bare dig og jernet — og en log, der følger med.",
    image: "/app/exercises.jpg",
    alt: "Øvelseskatalog i Træningsmester"
  },
  {
    phase: "Bagefter",
    title: "Historikken lyver ikke",
    desc: "Se din udvikling sort på hvidt, find sidste løft på sekunder, og forbered næste pas med ro i maven.",
    image: "/app/home-training.jpg",
    alt: "Dagens træning i Træningsmester"
  }
];

const trainerFeats = [
  { num: "A", title: "Klientforløb", desc: "CRUD, BMI-felter og plan-tilknytning" },
  { num: "B", title: "Programmer i realtid", desc: "Ret og del planer med vennekoder" },
  { num: "C", title: "Adskilt arbejdsrum", desc: "Træner- og personlig-tilstand, hver for sig" }
];

const stats = [
  { end: 3, suffix: "", label: "faser i hvert pas — før, under og efter" },
  { end: 2, suffix: "", label: "profiltilstande: Personlig & Træner" },
  { end: 10, suffix: "+", label: "produktområder bygget ind i appen" },
  { end: 100, suffix: "%", label: "danskudviklet og privacy-first" }
];

const roadmap = [
  {
    time: "Nu",
    title: "Venteliste & pre-launch",
    desc: "Skriv dig op og sikr dig en plads forrest, når dørene åbner.",
    now: true
  },
  {
    time: "Næste",
    title: "Lukket beta på iOS",
    desc: "Kernen testes sammen med Apple Watch-app og Live Activities.",
    now: false
  },
  {
    time: "Efter åbning",
    title: "AI & Premium",
    desc: "AI-analyse, AI-programmer og det fulde træner-workspace ruller ud.",
    now: false
  }
];

const faqRows = [
  {
    q: "Hvornår lancerer I?",
    a: "Vi går snart i lukket beta. Der er ingen offentlig dato endnu, men ventelisten får besked først — og kommer forrest i køen."
  },
  {
    q: "Er Træningsmester kun for øvede?",
    a: "Nej. Appen er lige så meget for begynderen, der vil i gang i ro, som for den erfarne løfter, der vil have styr på log og progression."
  },
  {
    q: "Kan trænere bruge appen?",
    a: "Ja. Trænerdelen er tænkt som et rigtigt arbejdsrum til klienter, programmer og opfølgning — ikke endnu en beskedtråd."
  },
  {
    q: "Hvad kommer det til at koste?",
    a: "Kernen bliver gratis. Oveni kommer en premium-model med AI-funktioner og træner-workspace."
  },
  {
    q: "Hvad sker der med min email?",
    a: "Den bruges udelukkende til at sige til, når Træningsmester åbner. Siden bruger ingen markedsføringscookies og ingen statistikværktøjer."
  }
];

const documentRows: { id: LegalPanelId; title: string }[] = [
  { id: "terms", title: "Handelsbetingelser" },
  { id: "privacy", title: "Privatliv" },
  { id: "cookies", title: "Cookiepolitik" },
  { id: "accessibility", title: "Tilgængelighed" }
];

const legalHashIds: Record<LegalPanelId, string> = {
  terms: "handelsbetingelser",
  privacy: "privatliv",
  cookies: "cookies",
  accessibility: "tilgaengelighed"
};
const legalPanelByHash: Record<string, LegalPanelId> = {
  handelsbetingelser: "terms",
  privatliv: "privacy",
  cookies: "cookies",
  tilgaengelighed: "accessibility"
};
const cookieSettingsHash = "cookieindstillinger";

const legalPanels: Record<
  LegalPanelId,
  {
    title: string;
    kicker: string;
    summary: string;
    sections: { heading: string; body: string }[];
  }
> = {
  terms: {
    title: "Handelsbetingelser",
    kicker: "Det praktiske",
    summary:
      "Denne side sælger ikke abonnementer direkte. Betingelserne forklarer rammen for Træningsmester, når køb åbnes i appen eller gennem en app-butik.",
    sections: [
      {
        heading: "Virksomhed",
        body: `${company.legalName}, CVR ${company.cvr}, ${company.address}. Selskabsform: ${company.form}.`
      },
      {
        heading: "Køb og betaling",
        body: "Eventuelle køb vises altid i det betalingsflow, hvor købet gennemføres. Pris, periode, fornyelse og opsigelse skal fremgå før betaling."
      },
      {
        heading: "Adgang",
        body: "Digitale funktioner leveres i appen efter login og godkendt betaling, når funktionen kræver abonnement."
      },
      {
        heading: "Fortrydelse og opsigelse",
        body: "Fortrydelse, opsigelse og refusion følger den konkrete betalingskanal og de oplysninger, der vises før købet."
      },
      {
        heading: "Reklamation",
        body: "Hvis en betalt digital funktion ikke virker som forventet, skal fejlen kunne beskrives, så den kan undersøges og rettes."
      }
    ]
  },
  privacy: {
    title: "Privatliv",
    kicker: "Data",
    summary:
      "Hjemmesiden er en pre-launch side. Den henter ikke dine træningsdata og beder ikke om konto, helbred, lokation eller betaling.",
    sections: [
      {
        heading: "Ansvarlig virksomhed",
        body: `${company.legalName}, CVR ${company.cvr}, er den offentligt registrerede virksomhed bag siden. Kilde: ${company.source}.`
      },
      {
        heading: "Ventelisten",
        body: "Når du sender ventelisteformularen, gemmes din email i Træningsmesters Supabase-database, så du kan få besked, når appen åbner. Siden sender ikke bekræftelsesmail og åbner ikke din mailklient."
      },
      {
        heading: "På websitet",
        body: "Websitet bruger kun lokal lagring til at huske cookievalget. Billeder og app-skærme serveres fra samme site. Der er ingen aktive marketing- eller statistikværktøjer."
      },
      {
        heading: "I appen",
        body: "Når appen bruges, kan kontooplysninger, træningsdata, historik og coachrelationer være nødvendige for funktionerne."
      },
      {
        heading: "Adgang og kontrol",
        body: "Personlige appdata skal kunne håndteres gennem appens konto-, indstillings- og supportflader."
      }
    ]
  },
  cookies: {
    title: "Cookiepolitik",
    kicker: "Website",
    summary:
      "Siden bruger kun nødvendig lokal lagring til at huske dit valg i denne browser.",
    sections: [
      {
        heading: "Hvad gemmes",
        body: "Dit cookievalg gemmes lokalt, så banneret ikke vises igen efter accept."
      },
      {
        heading: "Hvad bruges ikke",
        body: "Der er ingen aktive marketingcookies, annoncepixels eller statistikværktøjer på websitet."
      }
    ]
  },
  accessibility: {
    title: "Tilgængelighed",
    kicker: "Brugbarhed",
    summary:
      "Websitet skal kunne bruges roligt med tastatur, tydelig kontrast, læsbare skærme og uden unødvendig bevægelse.",
    sections: [
      {
        heading: "Tastatur",
        body: "Links, knapper, dokumenter, cookieindstillinger, formular og modaler kan nås med tastatur og har synlig fokusmarkering."
      },
      {
        heading: "Kontrast",
        body: "Siden bruger tydelige flader med markante knapper, linjer og statusmarkeringer."
      },
      {
        heading: "Bevægelse",
        body: "Siden respekterer reduceret bevægelse i browseren — animationer, custom cursor og scroll-effekter slås fra, og intet kræver bevægelse for at forstå indholdet."
      },
      {
        heading: "Billeder",
        body: "App-skærme og centrale billeder har tekstalternativer, mens rene dekorative billeder holdes uden læst tekst."
      }
    ]
  }
};

/* ---------------- Animated hero canvas (brand aurora) ---------------- */
function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    let running = true;
    let mx = 0.5;
    let my = 0.4;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const blobs = [
      { c: "#0A4BE0", r: 0.6, ox: 0.6, oy: 0.3, ax: 0.1, ay: 0.08, sx: 0.00021, sy: 0.00017, ph: 0 },
      { c: "#7A2EC4", r: 0.52, ox: 0.78, oy: 0.56, ax: 0.08, ay: 0.1, sx: 0.00016, sy: 0.00023, ph: 2 },
      { c: "#FF2056", r: 0.46, ox: 0.9, oy: 0.3, ax: 0.09, ay: 0.07, sx: 0.00019, sy: 0.00015, ph: 4 },
      { c: "#0A4BE0", r: 0.4, ox: 0.52, oy: 0.72, ax: 0.07, ay: 0.06, sx: 0.00013, sy: 0.00021, ph: 1 }
    ];
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const onResize = () => resize();
    const onMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
    };
    const draw = (t: number) => {
      if (running && w && h) {
        ctx.clearRect(0, 0, w, h);
        for (const b of blobs) {
          const cx = (b.ox + Math.sin(t * b.sx + b.ph) * b.ax + (mx - 0.5) * 0.06) * w;
          const cy = (b.oy + Math.cos(t * b.sy + b.ph) * b.ay + (my - 0.5) * 0.06) * h;
          const rad = b.r * Math.max(w, h);
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
          g.addColorStop(0, hexA(b.c, 0.34));
          g.addColorStop(1, hexA(b.c, 0));
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        running = e.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(canvas);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);
  return <canvas ref={ref} className="hero-canvas" aria-hidden="true" />;
}

/* ---------------- Custom cursor ---------------- */
function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!finePointer() || prefersReducedMotion()) return;
    document.documentElement.classList.add("cursor-on");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf = 0;
    const sel = 'a,button,[role="button"],label,input,.faq-q';
    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (dotRef.current)
        dotRef.current.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    };
    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (ringRef.current)
        ringRef.current.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    const over = (e: Event) => {
      if ((e.target as Element)?.closest?.(sel))
        ringRef.current?.classList.add("is-hover");
    };
    const out = (e: Event) => {
      if ((e.target as Element)?.closest?.(sel))
        ringRef.current?.classList.remove("is-hover");
    };
    const down = () => ringRef.current?.classList.add("is-down");
    const up = () => ringRef.current?.classList.remove("is-down");
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    raf = requestAnimationFrame(loop);
    return () => {
      document.documentElement.classList.remove("cursor-on");
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, []);
  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}

/* ---------------- Count-up ---------------- */
function CountUp({
  end,
  suffix = "",
  duration = 1500
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setVal(end);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let started = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          started = true;
          io.disconnect();
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(eased * end));
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [end, duration]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* ---------------- Small components ---------------- */
function Device({ img, alt }: { img: string; alt: string }) {
  return (
    <div className="device">
      <div className="device-screen">
        <img src={img} alt={alt} loading="lazy" />
      </div>
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div"
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const Tag = as as any;
  return (
    <Tag
      className={className}
      data-reveal=""
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/* ---------------- App ---------------- */
function App() {
  const [activeLegalPanel, setActiveLegalPanel] = useState<LegalPanelId | null>(
    null
  );
  const [cookieChoice, setCookieChoice] = useState<CookieChoice | null>(null);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [pProg, setPProg] = useState(0);
  const [pActive, setPActive] = useState(0);

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [waitlistState, setWaitlistState] = useState<WaitlistState>({
    type: "idle"
  });

  const heroEmailRef = useRef<HTMLInputElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const activeLegal = activeLegalPanel ? legalPanels[activeLegalPanel] : null;

  const cleanHash = () => decodeURIComponent(window.location.hash.slice(1));
  const setAddressHash = (
    hash: string | null,
    method: "push" | "replace" = "push"
  ) => {
    const nextUrl = hash
      ? `${window.location.pathname}${window.location.search}#${hash}`
      : `${window.location.pathname}${window.location.search}`;
    if (method === "replace") window.history.replaceState(null, "", nextUrl);
    else window.history.pushState(null, "", nextUrl);
  };

  const openLegalPanel = (panel: LegalPanelId) => {
    setMobileMenuOpen(false);
    setCookieSettingsOpen(false);
    setActiveLegalPanel(panel);
    setAddressHash(legalHashIds[panel]);
  };
  const closeLegalPanel = () => {
    setActiveLegalPanel(null);
    if (legalPanelByHash[cleanHash()]) setAddressHash(null, "replace");
  };
  const openCookieSettings = () => {
    setMobileMenuOpen(false);
    setActiveLegalPanel(null);
    setCookieSettingsOpen(true);
    setAddressHash(cookieSettingsHash);
  };
  const closeCookieSettings = () => {
    setCookieSettingsOpen(false);
    if (cleanHash() === cookieSettingsHash) setAddressHash(null, "replace");
  };
  const saveCookie = () => {
    storeCookieChoice("necessary");
    setCookieChoice("necessary");
    closeCookieSettings();
  };

  const scrollToWaitlist = () => {
    setMobileMenuOpen(false);
    document
      .getElementById("venteliste")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => heroEmailRef.current?.focus(), 600);
  };

  const scrollToPillar = (i: number) => {
    const wrap = pillarsRef.current;
    if (!wrap) return;
    const total = wrap.offsetHeight - window.innerHeight;
    if (total <= 0) {
      wrap.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.scrollTo({
      top: wrap.offsetTop + total * ((i + 0.5) / pillars.length),
      behavior: "smooth"
    });
  };

  /* header scroll state */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* pillars scroll-scrub */
  useEffect(() => {
    const wrap = pillarsRef.current;
    if (!wrap) return;
    const onScroll = () => {
      const total = wrap.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setPProg(0);
        setPActive(0);
        return;
      }
      const top = wrap.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, -top / total));
      setPProg(p);
      setPActive(Math.min(pillars.length - 1, Math.floor(p * pillars.length + 0.0001)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* magnetic buttons */
  useEffect(() => {
    if (!finePointer() || prefersReducedMotion()) return;
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-magnetic]")
    );
    const cleanups: Array<() => void> = [];
    els.forEach((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.34}px)`;
      };
      const leave = () => {
        el.style.transform = "";
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      });
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  /* fit footer wordmark to width (no clipping, ever) */
  useEffect(() => {
    const el = wordRef.current;
    if (!el || !el.parentElement) return;
    const fit = () => {
      const parent = el.parentElement!;
      const cs = window.getComputedStyle(parent);
      const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const avail = parent.clientWidth - pad;
      el.style.fontSize = "100px";
      const textW = el.scrollWidth || 1;
      el.style.fontSize = `${Math.max(22, (100 * avail) / textW) * 0.99}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement);
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } })
      .fonts;
    fonts?.ready?.then(fit);
    return () => ro.disconnect();
  }, []);

  /* reveal on scroll */
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    const vh = window.innerHeight;
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add("is-visible");
      else io.observe(el);
    });
    const safety = window.setTimeout(() => {
      els.forEach((el) => el.classList.add("is-visible"));
    }, 2600);
    return () => {
      window.clearTimeout(safety);
      io.disconnect();
    };
  }, []);

  /* hash routing */
  useEffect(() => {
    const handle = () => {
      const hash = cleanHash();
      setMobileMenuOpen(false);
      if (!hash) {
        setActiveLegalPanel(null);
        setCookieSettingsOpen(false);
        return;
      }
      const legalPanel = legalPanelByHash[hash];
      if (legalPanel) {
        setCookieSettingsOpen(false);
        setActiveLegalPanel(legalPanel);
        return;
      }
      if (hash === cookieSettingsHash) {
        setActiveLegalPanel(null);
        setCookieSettingsOpen(true);
        return;
      }
      setActiveLegalPanel(null);
      setCookieSettingsOpen(false);
    };
    handle();
    window.addEventListener("hashchange", handle);
    window.addEventListener("popstate", handle);
    return () => {
      window.removeEventListener("hashchange", handle);
      window.removeEventListener("popstate", handle);
    };
  }, []);

  useEffect(() => {
    const saved = readStoredCookieChoice();
    if (saved === "necessary") setCookieChoice(saved);
  }, []);

  /* escape closes overlays */
  useEffect(() => {
    if (!activeLegalPanel && !cookieSettingsOpen && !mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mobileMenuOpen) return setMobileMenuOpen(false);
      if (activeLegalPanel) return closeLegalPanel();
      closeCookieSettings();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeLegalPanel, cookieSettingsOpen, mobileMenuOpen]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!emailPattern.test(clean)) {
      setWaitlistState({ type: "error", message: "Skriv en gyldig emailadresse." });
      return;
    }
    if (!consent) {
      setWaitlistState({
        type: "error",
        message: "Accepter kontakt om Træningsmester for at skrive dig op."
      });
      return;
    }
    setWaitlistState({ type: "submitting" });
    try {
      await saveWaitlistSignup(clean);
      setWaitlistState({
        type: "submitted",
        message: "Tak — du er skrevet op. Vi siger til."
      });
      setEmail("");
      setConsent(false);
    } catch {
      setWaitlistState({
        type: "error",
        message: "Kunne ikke skrive dig op lige nu. Prøv igen om lidt."
      });
    }
  };

  const WaitlistForm = ({
    idPrefix,
    inputRef
  }: {
    idPrefix: string;
    inputRef?: React.RefObject<HTMLInputElement | null>;
  }) => (
    <form
      className="waitlist"
      onSubmit={submit}
      data-testid={`${idPrefix}-waitlist-form`}
    >
      <div className="waitlist-row">
        <input
          ref={inputRef}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder="din@email.dk"
          aria-label="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (
              waitlistState.type === "error" ||
              waitlistState.type === "submitted"
            )
              setWaitlistState({ type: "idle" });
          }}
          required
          data-testid={`${idPrefix}-waitlist-email`}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={waitlistState.type === "submitting"}
          data-testid={`${idPrefix}-waitlist-submit`}
        >
          {waitlistState.type === "submitting" ? "Sender…" : "Skriv mig op"}
          <span className="arrow" aria-hidden="true">→</span>
        </button>
      </div>
      <label className="consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (waitlistState.type === "error") setWaitlistState({ type: "idle" });
          }}
          data-testid={`${idPrefix}-waitlist-consent`}
        />
        <span>
          I må kontakte mig om Træningsmester. Jeg kan altid svare og bede om at
          blive fjernet igen.
        </span>
      </label>
      {waitlistState.type === "submitted" || waitlistState.type === "error" ? (
        <p
          className={`form-note ${waitlistState.type}`}
          role="status"
          data-testid={`${idPrefix}-waitlist-message`}
        >
          <span className="nd" aria-hidden="true" />
          {waitlistState.message}
        </p>
      ) : null}
    </form>
  );

  return (
    <>
      <CustomCursor />

      {/* Header */}
      <header
        className={`site-header ${scrolled ? "scrolled" : ""} ${
          mobileMenuOpen ? "menu-open" : ""
        }`}
        data-testid="site-header"
      >
        <a className="brand" href="#top" data-testid="brand-home">
          <span className="brand-badge">
            <img src="/brand/tm-logo.png" alt="" />
          </span>
          <span>Træningsmester</span>
        </a>
        <nav className="site-nav" aria-label="Hovednavigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-testid={`nav-${item.href.slice(1)}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="btn btn-primary header-cta"
            style={{ height: 44, padding: "0 20px" }}
            onClick={scrollToWaitlist}
            data-magnetic=""
            data-testid="header-cta"
          >
            Skriv mig op
          </button>
          <button
            className="menu-toggle"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileMenuOpen((o) => !o)}
            data-testid="menu-toggle"
          >
            <span />
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="nav-backdrop" id="mobile-nav" data-testid="mobile-nav">
          <nav aria-label="Mobilnavigation">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <button className="btn btn-primary" onClick={scrollToWaitlist}>
            Skriv mig op →
          </button>
        </div>
      ) : null}

      <main id="top">
        {/* Hero */}
        <section className="hero" id="venteliste" aria-labelledby="hero-title">
          <HeroCanvas />
          <div className="wrap">
            <div className="hero-grid">
              <div className="hero-copy">
                <Reveal as="span" className="overline">
                  Træningsmester · iOS · watchOS
                </Reveal>
                <Reveal as="h1" delay={60}>
                  <span id="hero-title">
                    Træning uden støj.{" "}
                    <span className="grad-text">Næste skridt</span> er altid klart.
                  </span>
                </Reveal>
                <Reveal as="p" className="hero-sub" delay={120}>
                  Programmet før. Loggen undervejs. Historikken bagefter. En rolig,
                  dansk træningsapp, der samler det hele ét sted — og hjælper uden
                  at overtage fokus.
                </Reveal>
                <Reveal delay={180}>
                  <WaitlistForm idPrefix="hero" inputRef={heroEmailRef} />
                </Reveal>
                <Reveal className="hero-proof" delay={240}>
                  <div className="proof-avatars" aria-hidden="true">
                    <span style={{ backgroundImage: "url('/photos/beginner-training.jpg')" }} />
                    <span style={{ backgroundImage: "url('/photos/home-training.jpg')" }} />
                    <span style={{ backgroundImage: "url('/photos/team-training.jpg')" }} />
                    <span style={{ backgroundImage: "url('/photos/coach-training.jpg')" }} />
                  </div>
                  <p className="proof-text">
                    <strong>Begyndere, løftere og trænere</strong>
                    <br />
                    skriver sig op før lancering.
                  </p>
                </Reveal>
              </div>

              <Reveal className="hero-visual" delay={140}>
                <div className="hero-glow" aria-hidden="true" />
                <div className="hero-photo">
                  <img src="/photos/hero-training.jpg" alt="Træning i fitnesscenter" />
                </div>
                <div className="hero-chip">
                  <span className="dot" />
                  Dagens pas er klar
                </div>
                <div className="hero-device">
                  <Device img="/app/home-training.jpg" alt="Dagens træning i Træningsmester" />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Trust marquee */}
        <section className="trust" aria-label="Principper">
          <div className="marquee">
            {[0, 1].map((g) => (
              <div className="marquee-group" key={g} aria-hidden={g === 1}>
                {trustItems.map((item) => (
                  <span className="marquee-item" key={`${g}-${item}`}>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Audience bento */}
        <section className="section wrap" id="for-hvem">
          <div className="eyebrow-row">
            <div>
              <Reveal as="span" className="overline">
                For hvem
              </Reveal>
              <Reveal as="h2" className="h2" delay={60}>
                Skabt til alle, der tager <span className="grad-text">træningen alvorligt</span>
              </Reveal>
            </div>
            <Reveal as="p" delay={120}>
              Træning ser forskellig ud. Men behovet er det samme: næste handling
              skal være klar.
            </Reveal>
          </div>
          <div className="bento">
            {audience.map((card, i) => (
              <Reveal
                key={card.title}
                className={`bento-card ${card.className}`}
                delay={i * 80}
                as="article"
              >
                {card.image ? (
                  <div className="bento-img" aria-hidden="true">
                    <img src={card.image} alt={card.alt ?? ""} loading="lazy" />
                  </div>
                ) : null}
                <span className="num">{card.num}</span>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Three pillars — scroll-scrubbed pinned */}
        <section className="pillars" id="appen">
          <div className="pillars-pin-wrap" ref={pillarsRef}>
            <div className="pillars-pin">
              <div className="wrap pillars-stage">
                <div className="pillars-text">
                  <span className="overline">Appen</span>
                  <h2 className="h2">
                    Tre faser. <span className="grad-text">Ét samlet flow.</span>
                  </h2>
                  <div className="phase-rail" aria-hidden="true">
                    <span style={{ width: `${Math.round(pProg * 100)}%` }} />
                  </div>
                  <div className="phase-list">
                    {pillars.map((p, i) => (
                      <div
                        key={p.title}
                        className={`phase-item ${pActive === i ? "active" : ""}`}
                        onClick={() => scrollToPillar(i)}
                        data-testid={`pillar-nav-${i}`}
                      >
                        <span className="pn">{p.phase}</span>
                        <h3>{p.title}</h3>
                        <p>{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="scrub-stage">
                  <div className="scrub-aura" aria-hidden="true" />
                  {pillars.map((p, i) => (
                    <div
                      key={p.title}
                      className={`scrub-device ${pActive === i ? "active" : ""}`}
                      data-testid={`pillar-shot-${i}`}
                    >
                      <span className="scrub-tag">{p.phase}</span>
                      <Device img={p.image} alt={p.alt} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trainer workspace */}
        <section className="section trainer" id="traener">
          <div className="wrap trainer-grid">
            <div>
              <Reveal as="span" className="overline on-dark">
                Trænere
              </Reveal>
              <Reveal as="h2" delay={60}>
                Et dedikeret arbejdsrum til trænere
              </Reveal>
              <Reveal as="p" className="lead" delay={120}>
                Kast beskedtrådene væk. Følg klienternes progression, ret programmer
                tæt på selve træningen, og hold fokus på resultater — ikke
                administration.
              </Reveal>
              <Reveal className="trainer-feats" delay={160}>
                {trainerFeats.map((f) => (
                  <div className="trainer-feat" key={f.title}>
                    <span className="tf-num">{f.num}</span>
                    <strong>{f.title}</strong>
                    <span>{f.desc}</span>
                  </div>
                ))}
              </Reveal>
              <Reveal delay={220}>
                <button
                  className="btn btn-ghost on-dark"
                  style={{ marginTop: 30 }}
                  onClick={scrollToWaitlist}
                  data-magnetic=""
                  data-testid="trainer-cta"
                >
                  Skriv dig op som træner →
                </button>
              </Reveal>
            </div>
            <Reveal className="trainer-visual" delay={120}>
              <Device img="/app/coach.jpg" alt="Coach-overblik i Træningsmester" />
            </Reveal>
          </div>
        </section>

        {/* Quote band */}
        <section className="section quote">
          <div className="wrap quote-inner">
            <Reveal as="blockquote">
              Styrke bygges ikke på de gode dage. Den bygges på dem, du ikke gad.
            </Reveal>
            <Reveal as="cite" delay={80}>
              — Træningsmester-princippet
            </Reveal>
          </div>
        </section>

        {/* Stats band */}
        <section className="section stats">
          <div className="wrap">
            <div className="stats-grid">
              {stats.map((s) => (
                <Reveal className="stat" key={s.label} as="div">
                  <div className="sv">
                    <CountUp end={s.end} suffix={s.suffix} />
                  </div>
                  <p className="sl">{s.label}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="section wrap" id="vejen">
          <div className="eyebrow-row">
            <div>
              <Reveal as="span" className="overline">
                Vejen frem
              </Reveal>
              <Reveal as="h2" className="h2" delay={60}>
                Pre-launch i den <span className="grad-text">rigtige rækkefølge</span>
              </Reveal>
            </div>
            <Reveal as="p" delay={120}>
              Ventelisten hjælper os med at åbne for de rigtige brugere først — og gøre
              appen skarpere undervejs.
            </Reveal>
          </div>
          <div className="roadmap-track">
            {roadmap.map((step, i) => (
              <Reveal
                key={step.title}
                className={`roadmap-step ${step.now ? "now" : ""}`}
                delay={i * 100}
              >
                <span className="rs-time">{step.time}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section
          className="section wrap"
          id="faq"
          style={{ background: "var(--bg-2)" }}
        >
          <div className="faq-wrap">
            <div className="eyebrow-row" style={{ marginBottom: 28 }}>
              <div>
                <Reveal as="span" className="overline">
                  FAQ
                </Reveal>
                <Reveal as="h2" className="h2" delay={60}>
                  Spørgsmål & svar
                </Reveal>
              </div>
            </div>
            <div className="faq-list" data-testid="faq-list">
              {faqRows.map((row, i) => {
                const open = openFaq === i;
                return (
                  <div className={`faq-item ${open ? "open" : ""}`} key={row.q}>
                    <button
                      className="faq-q"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : i)}
                      data-testid={`faq-question-${i}`}
                    >
                      {row.q}
                      <span className="faq-icon" aria-hidden="true" />
                    </button>
                    <div
                      className="faq-a"
                      style={{ maxHeight: open ? 320 : 0 }}
                      data-testid={`faq-answer-${i}`}
                    >
                      <p>{row.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section final-cta">
          <div className="wrap inner">
            <Reveal as="span" className="overline on-dark">
              Pre-launch liste
            </Reveal>
            <Reveal as="h2" delay={60}>
              Vær med fra <span className="grad-text">første løft.</span>
            </Reveal>
            <Reveal as="p" delay={120}>
              Skriv dig på ventelisten og få besked, før alle andre, når
              Træningsmester åbner.
            </Reveal>
            <Reveal delay={180}>
              <WaitlistForm idPrefix="footer" />
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-word-row" aria-hidden="true">
          <div className="footer-word" ref={wordRef}>
            TRÆNINGSMESTER
          </div>
        </div>
        <div className="footer-meta">
          <div className="footer-brand">
            <span className="brand-badge">
              <img src="/brand/tm-logo.png" alt="" />
            </span>
            <div>
              <p>Træningsmester</p>
              <small>
                {company.legalName} · CVR {company.cvr} · {company.address}
              </small>
            </div>
          </div>
          <div className="footer-links" aria-label="Juridiske links">
            {documentRows.map((row) => (
              <button
                key={row.id}
                onClick={() => openLegalPanel(row.id)}
                data-testid={`footer-${row.id}`}
              >
                {row.title}
              </button>
            ))}
            <button onClick={openCookieSettings} data-testid="footer-cookie-settings">
              Cookieindstillinger
            </button>
          </div>
        </div>
      </footer>

      {/* Legal modal */}
      {activeLegal ? (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-title"
        >
          <button className="overlay-bg" aria-label="Luk" onClick={closeLegalPanel} />
          <section className="panel" data-testid="legal-panel">
            <div className="panel-head">
              <div>
                <span className="overline">{activeLegal.kicker}</span>
                <h2 id="legal-title">{activeLegal.title}</h2>
              </div>
              <button
                className="close-btn"
                aria-label="Luk dokument"
                onClick={closeLegalPanel}
                data-testid="legal-close"
              >
                ×
              </button>
            </div>
            <p className="panel-summary">{activeLegal.summary}</p>
            <div className="panel-sections">
              {activeLegal.sections.map((s) => (
                <article key={s.heading}>
                  <h3>{s.heading}</h3>
                  <p>{s.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {/* Cookie settings modal */}
      {cookieSettingsOpen ? (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-title"
        >
          <button
            className="overlay-bg"
            aria-label="Luk"
            onClick={closeCookieSettings}
          />
          <section className="panel cookie" data-testid="cookie-panel">
            <div className="panel-head">
              <div>
                <span className="overline">Website</span>
                <h2 id="cookie-title">Cookievalg</h2>
              </div>
              <button
                className="close-btn"
                aria-label="Luk cookieindstillinger"
                onClick={closeCookieSettings}
              >
                ×
              </button>
            </div>
            <p className="panel-summary">
              Vi gemmer kun dit valg i denne browser. Ingen statistik. Ingen
              markedsføring.
            </p>
            <div className="cookie-toggle">
              <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>
                Nødvendig lagring
              </span>
              <strong>Altid aktiv</strong>
            </div>
            <div className="panel-actions">
              <button className="btn btn-ghost" onClick={() => openLegalPanel("cookies")}>
                Se cookiepolitik
              </button>
              <button
                className="btn btn-primary"
                onClick={saveCookie}
                data-testid="cookie-save"
              >
                Gem valg
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* Cookie banner */}
      {!cookieChoice ? (
        <aside
          className="cookie-banner"
          aria-label="Cookieindstillinger"
          data-testid="cookie-banner"
        >
          <strong>Cookies</strong>
          <p>Kun nødvendig lagring til at huske dit valg. Intet andet.</p>
          <div className="cookie-banner-actions">
            <button onClick={openCookieSettings} data-testid="cookie-read">
              Indstillinger
            </button>
            <button className="primary" onClick={saveCookie} data-testid="cookie-accept">
              OK
            </button>
          </div>
        </aside>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${siteUrl}#organization`,
                name: "Træningsmester",
                legalName: company.legalName,
                taxID: company.cvr,
                url: siteUrl,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Blomstergården 13",
                  postalCode: "4700",
                  addressLocality: "Næstved",
                  addressCountry: "DK"
                }
              },
              {
                "@type": "WebSite",
                "@id": `${siteUrl}#website`,
                name: "Træningsmester",
                url: siteUrl,
                publisher: { "@id": `${siteUrl}#organization` },
                inLanguage: "da-DK"
              },
              {
                "@type": "SoftwareApplication",
                "@id": `${siteUrl}#app`,
                name: "Træningsmester",
                applicationCategory: "HealthApplication",
                operatingSystem: "iOS, watchOS, Android",
                url: siteUrl,
                description:
                  "Dansk træningsapp på vej til program, log, historik og coach-samarbejde.",
                publisher: { "@id": `${siteUrl}#organization` }
              }
            ]
          })
        }}
      />
    </>
  );
}

const rootElement = document.getElementById("root")!;
const windowWithRoot = window as Window & { __traeningsmesterRoot?: Root };
const root = windowWithRoot.__traeningsmesterRoot ?? createRoot(rootElement);
windowWithRoot.__traeningsmesterRoot = root;
root.render(<App />);
