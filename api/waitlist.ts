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
  name?: unknown;
  audience?: unknown;
  audienceLabel?: unknown;
  note?: unknown;
  consent?: unknown;
  source?: unknown;
  submittedAt?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedAudiences = new Set(["begynder", "selvtraenende", "traener", "nysgerrig"]);

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

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

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
  const name = textValue(body.name, 120);
  const note = textValue(body.note, 1000);
  const audience = textValue(body.audience, 40);
  const audienceLabel = textValue(body.audienceLabel, 80);
  const source = textValue(body.source, 220);
  const submittedAt = textValue(body.submittedAt, 60);

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

  const webhookUrl = process.env.WAITLIST_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(503).json({ ok: false, code: "WAITLIST_NOT_CONFIGURED" });
    return;
  }

  const forwardedFor = firstHeader(req.headers["x-forwarded-for"]);
  const payload = {
    email,
    name,
    audience,
    audienceLabel,
    note,
    source,
    submittedAt,
    receivedAt: new Date().toISOString(),
    referrer: firstHeader(req.headers.referer) ?? "",
    userAgent: firstHeader(req.headers["user-agent"]) ?? "",
    ipHint: forwardedFor?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? ""
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (process.env.WAITLIST_WEBHOOK_SECRET) {
    headers["X-Waitlist-Secret"] = process.env.WAITLIST_WEBHOOK_SECRET;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      res.status(502).json({ ok: false, code: "WEBHOOK_REJECTED" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ ok: false, code: "WEBHOOK_UNAVAILABLE" });
  }
}
