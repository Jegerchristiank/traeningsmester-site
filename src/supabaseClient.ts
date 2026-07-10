import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";

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

export function isSupabaseConfigured() {
  return getSupabaseStatus().configured;
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

export async function getSupabaseSession() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOutSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function resolveSupabaseAssetUrl(value: string | null | undefined, bucket = "workout_images") {
  const rawValue = value?.trim();
  if (!rawValue) return undefined;
  if (/^(https?:|data:|blob:)/i.test(rawValue) || rawValue.startsWith("/")) return rawValue;
  const status = getSupabaseStatus();
  if (!status.url) return undefined;
  const encodedPath = rawValue
    .replace(/^\/+/, "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${status.url}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

export type SupabaseAuthSession = {
  session: Session;
  user: User;
};
