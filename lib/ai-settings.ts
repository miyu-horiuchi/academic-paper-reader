"use client";

import { useEffect, useState } from "react";

export const OPENROUTER_MODELS = [
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
  { id: "openai/gpt-5-mini", label: "GPT-5 mini" },
  { id: "openai/gpt-5", label: "GPT-5" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "x-ai/grok-3-mini", label: "Grok 3 mini" },
] as const;

export const PROVIDERS = [
  {
    id: "openrouter",
    label: "OpenRouter",
    model: "anthropic/claude-haiku-4.5",
    modelLabel: "OpenRouter (sign-in)",
    keyPrefix: "",
    keysUrl: "https://openrouter.ai/settings/keys",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    model: "claude-haiku-4-5",
    modelLabel: "Claude Haiku 4.5",
    keyPrefix: "sk-ant-",
    keysUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    label: "OpenAI",
    model: "gpt-4.1-mini",
    modelLabel: "GPT-4.1 mini",
    keyPrefix: "sk-",
    keysUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "google",
    label: "Google Gemini",
    model: "gemini-2.5-flash",
    modelLabel: "Gemini 2.5 Flash",
    keyPrefix: "",
    keysUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    model: "grok-3-mini",
    modelLabel: "Grok 3 mini",
    keyPrefix: "xai-",
    keysUrl: "https://console.x.ai/",
  },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];

export type AiSettings = {
  provider: ProviderId;
  apiKey: string;
  /** Only used when provider === "openrouter" — a model id like "anthropic/claude-haiku-4.5". */
  model?: string;
};

const STORAGE_KEY = "papers.ai.settings.v1";
const PKCE_VERIFIER_KEY = "papers.openrouter.pkce_verifier";

export function readAiSettings(): AiSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    if (!parsed.provider || !parsed.apiKey) return null;
    if (!PROVIDERS.some((p) => p.id === parsed.provider)) return null;
    return {
      provider: parsed.provider as ProviderId,
      apiKey: parsed.apiKey,
      model: parsed.model,
    };
  } catch {
    return null;
  }
}

export function writeAiSettings(s: AiSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("papers:ai-settings-changed"));
}

export function clearAiSettings() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("papers:ai-settings-changed"));
}

export function useAiSettings(): AiSettings | null {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  useEffect(() => {
    setSettings(readAiSettings());
    const onChange = () => setSettings(readAiSettings());
    window.addEventListener("papers:ai-settings-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("papers:ai-settings-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return settings;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(input: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return new Uint8Array(buf);
}

export async function beginOpenRouterAuth(origin: string): Promise<string> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64UrlEncode(verifierBytes);
  const challenge = base64UrlEncode(await sha256(verifier));
  window.sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  const callback = `${origin}/settings/openrouter-callback`;
  const url = new URL("https://openrouter.ai/auth");
  url.searchParams.set("callback_url", callback);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function completeOpenRouterAuth(
  code: string,
): Promise<{ key: string }> {
  const verifier = window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (!verifier) throw new Error("Missing PKCE verifier. Please try again.");
  const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: verifier,
      code_challenge_method: "S256",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter token exchange failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { key?: string };
  if (!data.key) throw new Error("OpenRouter did not return an API key");
  window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  return { key: data.key };
}
