type ApiRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
};

type WaitlistPayload = {
  email?: unknown;
  audience?: unknown;
  audienceLabel?: unknown;
  consent?: unknown;
  source?: unknown;
  submittedAt?: unknown;
};

type WaitlistRecord = {
  email: string;
  audience: string;
  audience_label: string | null;
  name: string | null;
  note: string | null;
  source: string | null;
  referrer: string | null;
  consent: true;
  submitted_at: string | null;
  metadata: {
    capture: "closed-beta-site";
  };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedAudiences = new Set(["begynder", "selvtraenende", "traener", "nysgerrig"]);
const defaultSupabaseUrl = "https://rbplnybmjwcoigiwtkuh.supabase.co";
const defaultSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicGxueWJtandjb2lnaXd0a3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUzNDQyNDUsImV4cCI6MjAzMDkyMDI0NX0.12xSasN9rsx8JzJLN_BImCvYu_7oFP_sXHdGWrnN5CM";

const parseBody = (body: unknown): WaitlistPayload | null => {
  if (!body) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as WaitlistPayload;
    } catch {
      return null;
    }
  }
  if (typeof body === "object") {
    return body as WaitlistPayload;
  }
  return null;
};

const textValue = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const optionalTextValue = (value: unknown, maxLength: number) => {
  const valueText = textValue(value, maxLength);
  return valueText.length > 0 ? valueText : null;
};

const isoDateValue = (value: unknown) => {
  const valueText = textValue(value, 80);
  if (!valueText) return null;
  const timestamp = Date.parse(valueText);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const supabaseBaseUrl = () =>
  (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? defaultSupabaseUrl)
    .trim()
    .replace(/\/+$/, "");

const supabaseApiKey = () =>
  (
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    defaultSupabaseAnonKey
  ).trim();

const saveToSupabase = async (record: WaitlistRecord) => {
  const baseUrl = supabaseBaseUrl();
  const apiKey = supabaseApiKey();
  if (!baseUrl || !apiKey) return null;

  const response = await fetch(`${baseUrl}/rest/v1/prelaunch_waitlist_signups`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(record)
  });

  if (response.ok) return "inserted";

  const responseText = await response.text().catch(() => "");
  if (response.status === 409 && responseText.includes("23505")) {
    return "duplicate";
  }

  throw new Error(`Supabase waitlist insert failed: ${response.status} ${responseText.slice(0, 300)}`);
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED" });
    return;
  }

  const body = parseBody(req.body);
  if (!body) {
    res.status(400).json({ ok: false, code: "INVALID_JSON" });
    return;
  }

  const email = textValue(body.email, 180).toLowerCase();
  const audience = textValue(body.audience, 40) || "nysgerrig";
  const audienceLabel = textValue(body.audienceLabel, 80) || "Closed beta signup";
  const source = textValue(body.source, 220);
  const submittedAt = isoDateValue(body.submittedAt);

  if (!emailPattern.test(email)) {
    res.status(400).json({ ok: false, code: "INVALID_EMAIL" });
    return;
  }

  if (!allowedAudiences.has(audience)) {
    res.status(400).json({ ok: false, code: "INVALID_AUDIENCE" });
    return;
  }

  if (body.consent !== true) {
    res.status(400).json({ ok: false, code: "CONSENT_REQUIRED" });
    return;
  }

  const record: WaitlistRecord = {
    email,
    audience,
    audience_label: audienceLabel,
    name: null,
    note: null,
    source: source || "closed-beta-site",
    referrer: optionalTextValue(firstHeader(req.headers.referer), 500),
    consent: true,
    submitted_at: submittedAt,
    metadata: {
      capture: "closed-beta-site"
    }
  };

  try {
    const result = await saveToSupabase(record);
    res.status(200).json({ ok: true, stored: "supabase", duplicate: result === "duplicate" });
    return;
  } catch {
    res.status(502).json({ ok: false, code: "DATABASE_REJECTED" });
    return;
  }
}
