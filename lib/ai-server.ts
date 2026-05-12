import type { LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import {
  PROVIDERS,
  type AiAuthMethod,
  type ProviderId,
} from "@/lib/ai-settings";

export function hasServerInference(): boolean {
  return Boolean(
    process.env.GMI_API_KEY &&
      process.env.GMI_BASE_URL &&
      process.env.GMI_TEXT_MODEL,
  );
}

export function buildServerModel(opts: {
  clientProvider?: ProviderId;
  clientApiKey?: string;
  authMethod?: AiAuthMethod;
}): LanguageModel | null {
  if (hasServerInference()) {
    return createOpenAI({
      apiKey: process.env.GMI_API_KEY!,
      baseURL: process.env.GMI_BASE_URL!,
    })(process.env.GMI_TEXT_MODEL!);
  }
  const { clientProvider, clientApiKey, authMethod = "key" } = opts;
  if (!clientProvider || !clientApiKey) return null;
  const entry = PROVIDERS.find((p) => p.id === clientProvider);
  if (!entry) return null;
  switch (clientProvider) {
    case "anthropic":
      return createAnthropic({ apiKey: clientApiKey })(entry.model);
    case "openai":
      if (authMethod === "codex-oauth") {
        return createOpenAI({
          apiKey: clientApiKey,
          baseURL: "https://api.openai.com/v1",
        })("gpt-5");
      }
      return createOpenAI({ apiKey: clientApiKey })(entry.model);
    case "google":
      return createGoogleGenerativeAI({ apiKey: clientApiKey })(entry.model);
    case "xai":
      return createXai({ apiKey: clientApiKey })(entry.model);
  }
}
