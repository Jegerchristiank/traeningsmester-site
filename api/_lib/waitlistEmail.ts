import { createHash, createHmac } from "node:crypto";
import nodemailer, { type SendMailOptions } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";

export const WAITLIST_CONSENT_VERSION = "waitlist_launch_access_email_v1";
export const WAITLIST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const defaultSiteUrl = "https://www.traeningsmester.dk";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RuntimeEnvironment = Record<string, string | undefined>;

export type WaitlistMailConfig = {
  smtp: SMTPTransport.Options;
  fromEmail: string;
  fromName: string;
  envelopeFrom: string;
  replyTo: string | null;
  siteUrl: string;
  tokenSecret: string;
};

export type WaitlistMailContent = {
  subject: string;
  text: string;
  html: string;
  withdrawalUrl: string;
  oneClickWithdrawalUrl: string;
  messageId: string;
};

export type WaitlistMailTransport = {
  sendMail: (options: SendMailOptions) => Promise<{
    messageId?: string;
    accepted?: unknown[];
    rejected?: unknown[];
  }>;
};

const requiredValue = (env: RuntimeEnvironment, key: string) => {
  const value = env[key]?.trim();
  if (!value) throw new Error(`WAITLIST_MAIL_CONFIG_MISSING_${key}`);
  return value;
};

const emailValue = (value: string, key: string) => {
  if (!emailPattern.test(value) || /[\r\n]/.test(value)) {
    throw new Error(`WAITLIST_MAIL_CONFIG_INVALID_${key}`);
  }
  return value;
};

const smtpUsernameValue = (value: string) => {
  if (value.length > 320 || /[\u0000-\u001F\u007F]/.test(value)) {
    throw new Error("WAITLIST_MAIL_CONFIG_INVALID_TM_SMTP_USER");
  }
  return value;
};

const booleanValue = (value: string | undefined, fallback: boolean) => {
  if (!value?.trim()) return fallback;
  if (value.trim().toLowerCase() === "true") return true;
  if (value.trim().toLowerCase() === "false") return false;
  throw new Error("WAITLIST_MAIL_CONFIG_INVALID_TM_SMTP_SECURE");
};

const portValue = (value: string | undefined) => {
  const port = Number(value?.trim() || "465");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("WAITLIST_MAIL_CONFIG_INVALID_TM_SMTP_PORT");
  }
  return port;
};

const siteUrlValue = (value: string | undefined) => {
  const url = new URL(value?.trim() || defaultSiteUrl);
  const isLocalHttp =
    url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new Error("WAITLIST_MAIL_CONFIG_INVALID_PUBLIC_SITE_URL");
  }
  return url.href.replace(/\/$/, "");
};

export function readWaitlistMailConfig(
  env: RuntimeEnvironment = process.env as RuntimeEnvironment
): WaitlistMailConfig {
  const host = requiredValue(env, "TM_SMTP_HOST");
  const port = portValue(env.TM_SMTP_PORT);
  const secure = booleanValue(env.TM_SMTP_SECURE, port === 465);
  // SMTP usernames are provider credentials and are not necessarily email
  // addresses (Resend deliberately uses the literal username `resend`).
  const user = smtpUsernameValue(requiredValue(env, "TM_SMTP_USER"));
  const pass = requiredValue(env, "TM_SMTP_PASS");
  const fromEmail = emailValue(env.TM_MAIL_FROM?.trim() || user, "TM_MAIL_FROM");
  const envelopeFrom = emailValue(
    env.TM_SMTP_ENVELOPE_FROM?.trim() || fromEmail,
    "TM_SMTP_ENVELOPE_FROM"
  );
  const replyToValue = env.TM_MAIL_REPLY_TO?.trim();
  const replyTo = replyToValue ? emailValue(replyToValue, "TM_MAIL_REPLY_TO") : null;
  const fromName = env.TM_MAIL_FROM_NAME?.trim() || "Træningsmester";
  const tokenSecret = requiredValue(env, "WAITLIST_TOKEN_SECRET");

  if (tokenSecret.length < 32) {
    throw new Error("WAITLIST_MAIL_CONFIG_INVALID_WAITLIST_TOKEN_SECRET");
  }
  if (/[\u0000-\u001F\u007F]/.test(fromName)) {
    throw new Error("WAITLIST_MAIL_CONFIG_INVALID_TM_MAIL_FROM_NAME");
  }

  return {
    smtp: {
      host,
      port,
      secure,
      name: "traeningsmester.dk",
      auth: { user, pass },
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 15_000,
      dnsTimeout: 8_000,
      logger: false,
      debug: false,
      transactionLog: false,
      tls: {
        servername: host,
        minVersion: "TLSv1.2",
        rejectUnauthorized: true
      }
    },
    fromEmail,
    fromName,
    envelopeFrom,
    replyTo,
    siteUrl: siteUrlValue(env.PUBLIC_SITE_URL),
    tokenSecret
  };
}

export function deriveWithdrawalToken(email: string, secret: string) {
  if (secret.length < 32) throw new Error("WAITLIST_TOKEN_SECRET_TOO_SHORT");
  return createHmac("sha256", secret)
    .update(`prelaunch-waitlist-withdrawal-v1:${email.trim().toLowerCase()}`, "utf8")
    .digest("base64url");
}

export function hashWithdrawalToken(token: string) {
  if (!WAITLIST_TOKEN_PATTERN.test(token)) throw new Error("WAITLIST_TOKEN_INVALID");
  return createHash("sha256").update(token, "utf8").digest("hex");
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[character] ?? character;
  });

const withdrawalUrls = (siteUrl: string, token: string) => {
  const withdrawalUrl = new URL("/afmeld", siteUrl);
  withdrawalUrl.hash = `token=${encodeURIComponent(token)}`;
  const oneClickWithdrawalUrl = new URL("/api/waitlist-withdraw", siteUrl);
  oneClickWithdrawalUrl.searchParams.set("token", token);
  return {
    withdrawalUrl: withdrawalUrl.href,
    oneClickWithdrawalUrl: oneClickWithdrawalUrl.href
  };
};

export function buildWaitlistConfirmationEmail(
  token: string,
  siteUrl = defaultSiteUrl
): WaitlistMailContent {
  const contactEmail = "christiankristensen123@gmail.com";
  const { withdrawalUrl, oneClickWithdrawalUrl } = withdrawalUrls(siteUrl, token);
  const privacyUrl = new URL("/privatliv", siteUrl).href;
  const escapedWithdrawalUrl = escapeHtml(withdrawalUrl);
  const escapedPrivacyUrl = escapeHtml(privacyUrl);
  const tokenHash = hashWithdrawalToken(token);
  const subject = "Din tilmelding til Træningsmester er modtaget";
  const text = [
    "Tak – du er skrevet op.",
    "",
    "Vi har modtaget din tilmelding til Træningsmesters venteliste. KRISTENSON sender kun e-mails om Træningsmesters lancering og adgangsrunder i overensstemmelse med det samtykke, du gav på hjemmesiden.",
    "",
    "Tilmeldingen er gratis og forpligter ikke til køb.",
    "",
    "Vil du ikke længere stå på ventelisten – eller var det ikke dig, der skrev adressen op? Træk samtykket tilbage gratis her:",
    withdrawalUrl,
    "",
    `Privatliv: ${privacyUrl}`,
    "",
    "KRISTENSON · CVR 40679456",
    "Blomstergården 13, 4700 Næstved",
    contactEmail
  ].join("\n");

  const html = `<!doctype html>
<html lang="da">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f6fb;color:#081326;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Din plads på ventelisten er registreret.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3f6fb;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dce4ef;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:28px 36px;background:#0047ab;color:#ffffff;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:42px;height:42px;border-radius:12px;background:#ffffff;color:#0047ab;text-align:center;font-size:15px;font-weight:800;line-height:42px;">TM</td>
                    <td style="padding-left:14px;font-size:20px;font-weight:700;">Træningsmester</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:42px 36px 34px;">
                <p style="margin:0 0 10px;color:#e31836;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Venteliste</p>
                <h1 style="margin:0 0 20px;font-size:32px;line-height:1.18;letter-spacing:-.02em;">Tak – du er skrevet op.</h1>
                <p style="margin:0 0 16px;color:#425067;font-size:16px;line-height:1.65;">Vi har modtaget din tilmelding til Træningsmesters venteliste. KRISTENSON sender kun e-mails om Træningsmesters lancering og adgangsrunder i overensstemmelse med det samtykke, du gav på hjemmesiden.</p>
                <p style="margin:0 0 28px;color:#425067;font-size:16px;line-height:1.65;">Tilmeldingen er gratis og forpligter ikke til køb.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius:999px;background:#eef4fc;">
                      <a href="${escapedWithdrawalUrl}" style="display:inline-block;padding:13px 20px;color:#0047ab;font-size:15px;font-weight:700;text-decoration:none;">Træk min tilmelding tilbage</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:18px 0 0;color:#657187;font-size:13px;line-height:1.55;">Du kan altid trække samtykket tilbage gratis. Brug også linket, hvis det ikke var dig, der skrev adressen op.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px;border-top:1px solid #e4e9f1;color:#657187;font-size:12px;line-height:1.65;">
                <p style="margin:0 0 8px;"><strong style="color:#26344a;">KRISTENSON</strong> · CVR 40679456<br>Blomstergården 13, 4700 Næstved<br><a href="mailto:${contactEmail}" style="color:#0047ab;text-decoration:underline;">${contactEmail}</a></p>
                <p style="margin:0;"><a href="${escapedPrivacyUrl}" style="color:#0047ab;text-decoration:underline;">Læs privatlivspolitikken</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject,
    text,
    html,
    withdrawalUrl,
    oneClickWithdrawalUrl,
    messageId: `<waitlist-${tokenHash.slice(0, 32)}@traeningsmester.dk>`
  };
}

export async function sendWaitlistConfirmationEmail(
  email: string,
  token: string,
  config: WaitlistMailConfig,
  transport?: WaitlistMailTransport
) {
  const content = buildWaitlistConfirmationEmail(token, config.siteUrl);
  const smtpTransport = transport ?? nodemailer.createTransport(config.smtp);
  const info = await smtpTransport.sendMail({
    from: { name: config.fromName, address: config.fromEmail },
    to: email,
    ...(config.replyTo ? { replyTo: config.replyTo } : {}),
    envelope: { from: config.envelopeFrom, to: email },
    subject: content.subject,
    text: content.text,
    html: content.html,
    messageId: content.messageId,
    headers: {
      "List-Unsubscribe": `<${content.oneClickWithdrawalUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Entity-Ref-ID": hashWithdrawalToken(token).slice(0, 24)
    },
    disableFileAccess: true,
    disableUrlAccess: true
  });

  if ((info.rejected?.length ?? 0) > 0 || (info.accepted?.length ?? 0) < 1) {
    throw new Error("WAITLIST_SMTP_RECIPIENT_NOT_ACCEPTED");
  }

  return {
    messageId: String(info.messageId || content.messageId).slice(0, 500)
  };
}
