import { generateText, type LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { auth } from "@/auth";
import {
  PROVIDERS,
  type AiAuthMethod,
  type ProviderId,
} from "@/lib/ai-settings";

export const runtime = "nodejs";

const CODEX_SYSTEM_PROMPT =
  "You are Codex, based on GPT-5. You are running as a coding agent in the Codex CLI on a user's computer.";

function buildModel(
  provider: ProviderId,
  apiKey: string,
  authMethod: AiAuthMethod,
): LanguageModel {
  const entry = PROVIDERS.find((p) => p.id === provider);
  if (!entry) throw new Error(`unknown provider: ${provider}`);
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(entry.model);
    case "openai":
      if (authMethod === "codex-oauth") {
        return createOpenAI({
          apiKey,
          baseURL: "https://api.openai.com/v1",
          headers: { "OpenAI-Beta": "responses=experimental" },
        })("gpt-5");
      }
      return createOpenAI({ apiKey })(entry.model);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(entry.model);
    case "xai":
      return createXai({ apiKey })(entry.model);
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    paperTitle?: string;
    sectionTitle?: string;
    quote?: string;
    prompt?: string;
    provider?: ProviderId;
    apiKey?: string;
    authMethod?: AiAuthMethod;
  };

  const {
    paperTitle = "",
    sectionTitle = "",
    quote = "",
    prompt = "",
    provider,
    apiKey,
    authMethod = "key",
  } = body;

  if (!provider || !apiKey) {
    return Response.json(
      { error: "no_key", message: "Configure an AI provider in Settings." },
      { status: 400 },
    );
  }
  if (!prompt.trim() || !quote.trim()) {
    return Response.json(
      { error: "prompt and quote are required" },
      { status: 400 },
    );
  }

  const fullPrompt = [
    "You are helping a reader understand an academic paper.",
    "",
    `Paper: ${paperTitle}`,
    `Section: ${sectionTitle}`,
    `Quote: "${quote}"`,
    "",
    prompt,
    "",
    "Be concise and concrete. No preamble. Plain text, no markdown headers.",
  ].join("\n");

  try {
    const langModel = buildModel(provider, apiKey, authMethod);
    const system =
      authMethod === "codex-oauth" ? CODEX_SYSTEM_PROMPT : undefined;
    const { text } = await generateText({
      model: langModel,
      system,
      prompt: fullPrompt,
    });
    return Response.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isAuth = /401|unauthorized|invalid.*key|incorrect.*key/i.test(message);
    return Response.json(
      {
        error: isAuth ? "bad_key" : "ai_unavailable",
        detail: message,
      },
      { status: isAuth ? 401 : 502 },
    );
  }
}
