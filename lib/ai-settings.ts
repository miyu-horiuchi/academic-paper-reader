"use client";

import { useEffect, useState } from "react";

export const PROVIDERS = [
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
  /** Reserved for future use (e.g. OAuth access tokens vs API keys). */
  authMethod?: "key" | "oauth";
};

const STORAGE_KEY = "papers.ai.settings.v1";

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
      authMethod: parsed.authMethod ?? "key",
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
