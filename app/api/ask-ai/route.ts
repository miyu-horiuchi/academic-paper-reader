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

type RefreshedTokens = {
  access_token: string;
  expires_at: number;
};

async function refreshGoogleToken(
  refreshToken: string,
): Promise<RefreshedTokens | null> {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  return {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
}

async function callVertexAi(
  accessToken: string,
  projectId: string,
  system: string,
  userPrompt: string,
): Promise<string> {
  const model = "gemini-2.5-flash";
  const location = "us-central1";
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: `${system}\n\n${userPrompt}` }] },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Vertex AI ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("");
  return text ?? "";
}

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
        return createOpenAI({ apiKey, baseURL: "https://api.openai.com/v1" })(
          "gpt-5",
        );
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
    projectId?: string;
    refreshToken?: string;
    expiresAt?: number;
  };

  const {
    paperTitle = "",
    sectionTitle = "",
    quote = "",
    prompt = "",
    provider,
    apiKey,
    authMethod = "key",
    projectId,
    refreshToken,
    expiresAt,
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

  const systemPreamble = [
    "You are helping a reader understand an academic paper.",
    "",
    `Paper: ${paperTitle}`,
    `Section: ${sectionTitle}`,
    `Quote: "${quote}"`,
    "",
  ].join("\n");
  const userPrompt = [
    prompt,
    "",
    "Be concise and concrete. No preamble. Plain text, no markdown headers.",
  ].join("\n");
  const fullPrompt = systemPreamble + userPrompt;

  if (provider === "google" && authMethod === "google-oauth") {
    if (!projectId) {
      return Response.json(
        {
          error: "no_project",
          message:
            "Enter your Google Cloud project ID on Settings before using Gemini OAuth.",
        },
        { status: 400 },
      );
    }
    let accessToken = apiKey;
    let refreshed: RefreshedTokens | null = null;
    if (expiresAt && expiresAt < Date.now() && refreshToken) {
      refreshed = await refreshGoogleToken(refreshToken);
      if (!refreshed) {
        return Response.json(
          {
            error: "bad_key",
            detail: "Token refresh failed. Please sign in again.",
          },
          { status: 401 },
        );
      }
      accessToken = refreshed.access_token;
    }
    try {
      const text = await callVertexAi(
        accessToken,
        projectId,
        systemPreamble,
        userPrompt,
      );
      return Response.json({ text, refreshed });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isAuth = /401|403|unauthorized/i.test(message);
      return Response.json(
        {
          error: isAuth ? "bad_key" : "ai_unavailable",
          detail: message,
        },
        { status: isAuth ? 401 : 502 },
      );
    }
  }

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
