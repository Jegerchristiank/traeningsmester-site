import assert from "node:assert/strict";
import test from "node:test";
import type { SendMailOptions } from "nodemailer";
import {
  buildWaitlistConfirmationEmail,
  deriveWithdrawalToken,
  hashWithdrawalToken,
  readWaitlistMailConfig,
  sendWaitlistConfirmationEmail,
  WAITLIST_CONSENT_VERSION,
  WAITLIST_TOKEN_PATTERN,
  type WaitlistMailTransport
} from "../api/_lib/waitlistEmail.ts";

const runtimeEnvironment = {
  TM_SMTP_HOST: "cp13.nordicway.dk",
  TM_SMTP_PORT: "465",
  TM_SMTP_SECURE: "true",
  TM_SMTP_USER: "waitlist@traeningsmester.dk",
  TM_SMTP_PASS: "test-password-never-used",
  TM_SMTP_ENVELOPE_FROM: "waitlist@traeningsmester.dk",
  TM_MAIL_FROM: "waitlist@traeningsmester.dk",
  TM_MAIL_FROM_NAME: "Træningsmester",
  TM_MAIL_REPLY_TO: "kontakt@traeningsmester.dk",
  WAITLIST_TOKEN_SECRET: "test-secret-that-is-longer-than-thirty-two-characters",
  PUBLIC_SITE_URL: "https://www.traeningsmester.dk"
};

test("withdrawal tokens are deterministic, normalized and opaque", () => {
  const first = deriveWithdrawalToken(" Person@Example.dk ", runtimeEnvironment.WAITLIST_TOKEN_SECRET);
  const second = deriveWithdrawalToken("person@example.dk", runtimeEnvironment.WAITLIST_TOKEN_SECRET);

  assert.equal(first, second);
  assert.match(first, WAITLIST_TOKEN_PATTERN);
  assert.equal(first.length, 43);
  assert.match(hashWithdrawalToken(first), /^[a-f0-9]{64}$/);
  assert.equal(WAITLIST_CONSENT_VERSION, "waitlist_launch_access_email_v1");
});

test("mail configuration keeps secrets server-side and uses bounded SMTPS", () => {
  const config = readWaitlistMailConfig(runtimeEnvironment);

  assert.equal(config.smtp.host, "cp13.nordicway.dk");
  assert.equal(config.smtp.port, 465);
  assert.equal(config.smtp.secure, true);
  assert.equal(config.smtp.connectionTimeout, 8_000);
  assert.equal(config.smtp.socketTimeout, 15_000);
  assert.equal(config.smtp.debug, false);
  assert.equal(config.fromEmail, "waitlist@traeningsmester.dk");
  assert.equal(config.replyTo, "kontakt@traeningsmester.dk");
});

test("mail configuration rejects missing or weak server secrets", () => {
  assert.throws(
    () => readWaitlistMailConfig({ ...runtimeEnvironment, TM_SMTP_PASS: "" }),
    /WAITLIST_MAIL_CONFIG_MISSING_TM_SMTP_PASS/
  );
  assert.throws(
    () => readWaitlistMailConfig({ ...runtimeEnvironment, WAITLIST_TOKEN_SECRET: "short" }),
    /WAITLIST_MAIL_CONFIG_INVALID_WAITLIST_TOKEN_SECRET/
  );
  assert.throws(
    () => readWaitlistMailConfig({ ...runtimeEnvironment, PUBLIC_SITE_URL: "ftp://localhost" }),
    /WAITLIST_MAIL_CONFIG_INVALID_PUBLIC_SITE_URL/
  );
});

test("confirmation content is neutral, complete and tracking-free", () => {
  const token = deriveWithdrawalToken("person@example.dk", runtimeEnvironment.WAITLIST_TOKEN_SECRET);
  const message = buildWaitlistConfirmationEmail(token, runtimeEnvironment.PUBLIC_SITE_URL);

  assert.equal(message.subject, "Din tilmelding til Træningsmester er modtaget");
  assert.match(message.html, /lang="da"/);
  assert.match(message.html, /KRISTENSON/);
  assert.match(message.html, /CVR 40679456/);
  assert.match(message.html, /Blomstergården 13/);
  assert.match(message.html, /lancering og adgangsrunder/);
  assert.match(message.html, /Træk min tilmelding tilbage/);
  assert.match(message.html, /\/afmeld#token=/);
  assert.match(message.text, /Tilmeldingen er gratis og forpligter ikke til køb/);
  assert.match(message.text, /Privatliv:/);
  assert.doesNotMatch(message.html, /<img\b/i);
  assert.doesNotMatch(message.html, /tracking|utm_|pixel/i);
});

test("sender supplies HTML, text and functional unsubscribe headers", async () => {
  const config = readWaitlistMailConfig(runtimeEnvironment);
  const token = deriveWithdrawalToken("person@example.dk", config.tokenSecret);
  let captured: SendMailOptions = {};
  const transport: WaitlistMailTransport = {
    async sendMail(options) {
      captured = options;
      return { messageId: "<accepted@example>", accepted: ["person@example.dk"], rejected: [] };
    }
  };

  const result = await sendWaitlistConfirmationEmail(
    "person@example.dk",
    token,
    config,
    transport
  );

  assert.equal(result.messageId, "<accepted@example>");
  const headers = captured.headers as Record<string, string>;
  assert.equal(captured.subject, "Din tilmelding til Træningsmester er modtaget");
  assert.equal(captured.to, "person@example.dk");
  assert.equal(typeof captured.html, "string");
  assert.equal(typeof captured.text, "string");
  assert.match(String(headers["List-Unsubscribe"]), /waitlist-withdraw\?token=/);
  assert.equal(headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.equal(captured.disableFileAccess, true);
  assert.equal(captured.disableUrlAccess, true);
});

test("sender rejects an SMTP response that accepts no recipient", async () => {
  const config = readWaitlistMailConfig(runtimeEnvironment);
  const token = deriveWithdrawalToken("person@example.dk", config.tokenSecret);
  const transport: WaitlistMailTransport = {
    async sendMail() {
      return { messageId: "<rejected@example>", accepted: [], rejected: ["person@example.dk"] };
    }
  };

  await assert.rejects(
    sendWaitlistConfirmationEmail("person@example.dk", token, config, transport),
    /WAITLIST_SMTP_RECIPIENT_NOT_ACCEPTED/
  );
});
