import { createHash } from "node:crypto";
import {
  deriveWithdrawalToken,
  hashWithdrawalToken,
  readWaitlistMailConfig,
  sendWaitlistConfirmationEmail,
  WAITLIST_CONSENT_VERSION
} from "./_lib/waitlistEmail.js";

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
  website?: unknown;
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
  consent_version: typeof WAITLIST_CONSENT_VERSION;
  confirmation_status: "pending";
  withdrawal_token_hash: string;
  submitted_at: string | null;
  metadata: {
    capture: "prelaunch-site";
    client_submitted_at: string | null;
    consent_channel: "email";
    consent_controller: "KRISTENSON_CVR_40679456";
    consent_purposes: ["launch", "access_rounds"];
    consent_version: typeof WAITLIST_CONSENT_VERSION;
  };
};

type WaitlistConsentMetadata = WaitlistRecord["metadata"];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedAudiences = new Set(["begynder", "selvtraenende", "traener", "nysgerrig"]);
const defaultSupabaseUrl = "https://rbplnybmjwcoigiwtkuh.supabase.co";
const defaultSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicGxueWJtandjb2lnaXd0a3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUzNDQyNDUsImV4cCI6MjAzMDkyMDI0NX0.12xSasN9rsx8JzJLN_BImCvYu_7oFP_sXHdGWrnN5CM";
const rateLimitWindowMs = 10 * 60 * 1_000;
const rateLimitMaximum = 6;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

const parseBody = (body: unknown): WaitlistPayload | null => {
  if (!body) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as WaitlistPayload;
    } catch {
      return null;
    }
  }
  if (typeof body === "object") return body as WaitlistPayload;
  return null;
};

const textValue = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const isoDateValue = (value: unknown) => {
  const valueText = textValue(value, 80);
  if (!valueText) return null;
  const timestamp = Date.parse(valueText);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

const pageUrlValue = (value: unknown, maxLength = 500) => {
  const raw = textValue(value, 2_000);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return `${url.origin}${url.pathname}`.slice(0, maxLength);
  } catch {
    return null;
  }
};

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const requestAddress = (req: ApiRequest) =>
  firstHeader(req.headers["x-forwarded-for"])?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress?.trim() ||
  "";

const isRateLimited = (req: ApiRequest) => {
  const address = requestAddress(req);
  if (!address) return false;
  const now = Date.now();
  const key = createHash("sha256").update(address, "utf8").digest("hex");
  const current = requestBuckets.get(key);

  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return false;
  }

  current.count += 1;
  if (requestBuckets.size > 1_000) {
    for (const [bucketKey, bucket] of requestBuckets) {
      if (bucket.resetAt <= now) requestBuckets.delete(bucketKey);
    }
  }
  return current.count > rateLimitMaximum;
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

const supabaseSecretKey = () => {
  const secretKey = (process.env.SUPABASE_SECRET_KEY ?? "").trim();
  if (!/^sb_secret_[A-Za-z0-9_-]{20,}$/.test(secretKey)) {
    throw new Error("WAITLIST_SUPABASE_SECRET_INVALID");
  }
  return secretKey;
};

const saveToSupabase = async (record: WaitlistRecord) => {
  const baseUrl = supabaseBaseUrl();
  const apiKey = supabaseApiKey();

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

  if (response.ok) return "inserted" as const;

  const responseText = await response.text().catch(() => "");
  if (response.status === 409 && responseText.includes("23505")) {
    return "duplicate" as const;
  }

  throw new Error(`WAITLIST_INSERT_${response.status}`);
};

const callPrivilegedWaitlistRpc = async (
  name: string,
  body: Record<string, unknown>,
  secretKey: string
) => {
  const baseUrl = supabaseBaseUrl();
  const response = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`WAITLIST_RPC_${name}_${response.status}`);
  return (await response.json()) as unknown;
};

const claimConfirmation = async (token: string, secretKey: string) => {
  const claimId = await callPrivilegedWaitlistRpc(
    "tm_claim_prelaunch_waitlist_confirmation",
    { p_token: token },
    secretKey
  );
  return typeof claimId === "string" && /^[0-9a-f-]{36}$/i.test(claimId) ? claimId : null;
};

const finishConfirmation = async (
  token: string,
  claimId: string,
  accepted: boolean,
  messageId: string | null,
  secretKey: string
) =>
  (await callPrivilegedWaitlistRpc(
    "tm_finish_prelaunch_waitlist_confirmation",
    {
      p_token: token,
      p_claim_id: claimId,
      p_accepted: accepted,
      p_message_id: messageId
    },
    secretKey
  )) === true;

const refreshLegacySignup = async (
  email: string,
  withdrawalTokenHash: string,
  consentMetadata: WaitlistConsentMetadata,
  secretKey: string
) =>
  (await callPrivilegedWaitlistRpc(
    "tm_refresh_legacy_prelaunch_waitlist_signup",
    {
      p_email: email,
      p_confirmation_token_hash: withdrawalTokenHash,
      p_consent_version: WAITLIST_CONSENT_VERSION,
      p_consent_metadata: consentMetadata
    },
    secretKey
  )) === true;

const safeErrorCode = (error: unknown) => {
  if (!(error instanceof Error)) return "UNKNOWN";
  return error.message.match(/^[A-Z0-9_]{3,180}$/)?.[0] ?? "UNCLASSIFIED";
};

type WaitlistHandlerDependencies = {
  sendConfirmationEmail: typeof sendWaitlistConfirmationEmail;
};

export const createWaitlistHandler = (
  dependencies: Partial<WaitlistHandlerDependencies> = {}
) => async function handler(req: ApiRequest, res: ApiResponse) {
  const sendConfirmationEmail =
    dependencies.sendConfirmationEmail ?? sendWaitlistConfirmationEmail;
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
  const audienceLabel = textValue(body.audienceLabel, 80) || "Pre-launch signup";
  const source = pageUrlValue(body.source, 220);
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

  if (textValue(body.website, 200)) {
    res.status(200).json({ ok: true, confirmation: "accepted" });
    return;
  }

  if (isRateLimited(req)) {
    res.status(429).json({ ok: false, code: "RATE_LIMITED" });
    return;
  }

  let mailConfig: ReturnType<typeof readWaitlistMailConfig>;
  let withdrawalToken: string;
  try {
    mailConfig = readWaitlistMailConfig();
    withdrawalToken = deriveWithdrawalToken(email, mailConfig.tokenSecret);
  } catch (error) {
    console.error(`[waitlist] mail configuration rejected: ${safeErrorCode(error)}`);
    res.status(503).json({ ok: false, code: "MAIL_NOT_CONFIGURED" });
    return;
  }

  let secretKey: string;
  try {
    // Validate this server-only capability before looking up or inserting the
    // address. That keeps a missing/misconfigured key from becoming a way to
    // distinguish existing waitlist members from new addresses.
    secretKey = supabaseSecretKey();
  } catch (error) {
    console.error(`[waitlist] database capability rejected: ${safeErrorCode(error)}`);
    res.status(503).json({ ok: false, code: "SERVICE_NOT_CONFIGURED" });
    return;
  }

  const record: WaitlistRecord = {
    email,
    audience,
    audience_label: audienceLabel,
    name: null,
    note: null,
    source: source || "prelaunch-site",
    referrer: pageUrlValue(firstHeader(req.headers.referer)),
    consent: true,
    consent_version: WAITLIST_CONSENT_VERSION,
    confirmation_status: "pending",
    withdrawal_token_hash: `\\x${hashWithdrawalToken(withdrawalToken)}`,
    submitted_at: new Date().toISOString(),
    metadata: {
      capture: "prelaunch-site",
      client_submitted_at: submittedAt,
      consent_channel: "email",
      consent_controller: "KRISTENSON_CVR_40679456",
      consent_purposes: ["launch", "access_rounds"],
      consent_version: WAITLIST_CONSENT_VERSION
    }
  };

  let saveResult: Awaited<ReturnType<typeof saveToSupabase>>;
  try {
    saveResult = await saveToSupabase(record);
  } catch {
    res.status(502).json({ ok: false, code: "DATABASE_REJECTED" });
    return;
  }

  if (saveResult === "duplicate") {
    try {
      await refreshLegacySignup(
        email,
        record.withdrawal_token_hash,
        record.metadata,
        secretKey
      );
    } catch (error) {
      // A duplicate must keep the same public response regardless of whether it is
      // a legacy, pending, accepted or withdrawn row. The subsequent claim remains
      // safe and lets already-pending/failed rows use their existing retry path.
      console.error(`[waitlist] legacy consent refresh failed: ${safeErrorCode(error)}`);
    }
  }

  let claimId: string | null = null;
  try {
    claimId = await claimConfirmation(withdrawalToken, secretKey);
  } catch (error) {
    console.error(`[waitlist] confirmation claim failed: ${safeErrorCode(error)}`);
    res.status(200).json({ ok: true, stored: "supabase", confirmation: "accepted" });
    return;
  }

  if (!claimId) {
    res.status(200).json({ ok: true, stored: "supabase", confirmation: "accepted" });
    return;
  }

  try {
    const delivery = await sendConfirmationEmail(email, withdrawalToken, mailConfig);
    try {
      await finishConfirmation(
        withdrawalToken,
        claimId,
        true,
        delivery.messageId,
        secretKey
      );
    } catch (error) {
      console.error(`[waitlist] confirmation acknowledgement failed: ${safeErrorCode(error)}`);
    }
    res.status(200).json({ ok: true, stored: "supabase", confirmation: "accepted" });
  } catch (error) {
    console.error(`[waitlist] confirmation delivery failed: ${safeErrorCode(error)}`);
    try {
      await finishConfirmation(withdrawalToken, claimId, false, null, secretKey);
    } catch (finishError) {
      console.error(`[waitlist] confirmation failure state failed: ${safeErrorCode(finishError)}`);
    }
    res.status(200).json({ ok: true, stored: "supabase", confirmation: "accepted" });
  }
};

export default createWaitlistHandler();
