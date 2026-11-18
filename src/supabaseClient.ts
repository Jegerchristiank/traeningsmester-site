import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseStatus = {
  configured: boolean;
  url: string;
  host: string | null;
  usingLegacyAnonKey: boolean;
  reason?: string;
};

let client: SupabaseClient | null = null;

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ""
).trim();

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return globalThis.atob(padded);
}

function jwtRole(key: string) {
  const [, payload] = key.split(".");
  if (!payload) return null;
  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as { role?: unknown };
    return typeof parsed.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}

function validatePublicKey(key: string) {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("service_role") || jwtRole(key) === "service_role") {
    throw new Error("Supabase service-role keys må aldrig bruges i webklienten.");
  }
}

function hostForUrl(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function getSupabaseStatus(): SupabaseStatus {
  if (!supabaseUrl) {
    return {
      configured: false,
      url: "",
      host: null,
      usingLegacyAnonKey: false,
      reason: "VITE_SUPABASE_URL mangler."
    };
  }
  if (!supabaseKey) {
    return {
      configured: false,
      url: supabaseUrl,
      host: hostForUrl(supabaseUrl),
      usingLegacyAnonKey: false,
      reason: "VITE_SUPABASE_PUBLISHABLE_KEY mangler."
    };
  }
  validatePublicKey(supabaseKey);
  return {
    configured: true,
    url: supabaseUrl,
    host: hostForUrl(supabaseUrl),
    usingLegacyAnonKey: supabaseKey.split(".").length === 3
  };
}

export function getSupabaseClient() {
  const status = getSupabaseStatus();
  if (!status.configured) return null;
  if (!client) {
    client = createClient(status.url, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return client;
}
