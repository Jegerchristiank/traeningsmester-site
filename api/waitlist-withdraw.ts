import { WAITLIST_TOKEN_PATTERN } from "./_lib/waitlistEmail.js";

type ApiRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
};

const defaultSupabaseUrl = "https://rbplnybmjwcoigiwtkuh.supabase.co";
const defaultSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicGxueWJtandjb2lnaXd0a3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUzNDQyNDUsImV4cCI6MjAzMDkyMDI0NX0.12xSasN9rsx8JzJLN_BImCvYu_7oFP_sXHdGWrnN5CM";

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const bodyToken = (body: unknown) => {
  if (typeof body === "object" && body !== null && "token" in body) {
    return typeof body.token === "string" ? body.token : "";
  }
  if (typeof body !== "string") return "";
  try {
    const parsed = JSON.parse(body) as { token?: unknown };
    return typeof parsed.token === "string" ? parsed.token : "";
  } catch {
    return new URLSearchParams(body).get("token") ?? "";
  }
};

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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

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

  const token = (firstValue(req.query?.token) || bodyToken(req.body)).trim();
  if (!WAITLIST_TOKEN_PATTERN.test(token)) {
    res.status(400).json({ ok: false, code: "INVALID_WITHDRAWAL" });
    return;
  }

  try {
    const apiKey = supabaseApiKey();
    const response = await fetch(
      `${supabaseBaseUrl()}/rest/v1/rpc/tm_withdraw_prelaunch_waitlist_signup`,
      {
        method: "POST",
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ p_token: token })
      }
    );

    if (!response.ok) throw new Error(`WAITLIST_WITHDRAW_RPC_${response.status}`);
    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ ok: false, code: "WITHDRAWAL_UNAVAILABLE" });
  }
}
