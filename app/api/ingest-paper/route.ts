import { generateText, type LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { auth } from "@/auth";
import { kv } from "@/lib/kv";
import {
  PROVIDERS,
  type AiAuthMethod,
  type ProviderId,
} from "@/lib/ai-settings";
import type { Paper, Section, Sentence } from "@/lib/paper-data";

export const runtime = "nodejs";
export const maxDuration = 60;

const LEVELS = ["beginner", "intermediate", "expert"] as const;

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

function key(id: string): string {
  return `paper:content:${id}`;
}

type RawSentence = {
  text?: unknown;
  rephrase?: { beginner?: unknown; intermediate?: unknown; expert?: unknown };
};
type RawSection = {
  id?: unknown;
  title?: unknown;
  explain?: { beginner?: unknown; intermediate?: unknown; expert?: unknown };
  body?: unknown;
};
type RawPaper = { sections?: unknown };

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function normalizeSection(raw: RawSection, idx: number): Section {
  const body: Sentence[] = Array.isArray(raw.body)
    ? raw.body
        .slice(0, 8)
        .map((entry: unknown) => {
          const r = entry as RawSentence;
          return {
            text: s(r.text),
            rephrase: {
              beginner: s(r.rephrase?.beginner, s(r.text)),
              intermediate: s(r.rephrase?.intermediate, s(r.text)),
              expert: s(r.rephrase?.expert, s(r.text)),
            },
          };
        })
        .filter((sentence) => sentence.text.length > 0)
    : [];
  return {
    id: s(raw.id, `s${idx}`).toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
    title: s(raw.title, `Section ${idx + 1}`),
    explain: {
      beginner: s(raw.explain?.beginner, ""),
      intermediate: s(raw.explain?.intermediate, ""),
      expert: s(raw.explain?.expert, ""),
    },
    body,
  };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    paperId?: string;
    title?: string;
    authors?: string;
    venue?: string | null;
    year?: string | null;
    abstract?: string | null;
    url?: string;
    source?: string;
    folder?: string;
    provider?: ProviderId;
    apiKey?: string;
    authMethod?: AiAuthMethod;
  };

  const {
    paperId,
    title = "",
    authors = "",
    venue,
    year,
    abstract,
    url = "",
    source = "url",
    folder = "ML Foundations",
    provider,
    apiKey,
    authMethod = "key",
  } = body;

  if (!paperId || !title) {
    return Response.json(
      { error: "paperId and title are required" },
      { status: 400 },
    );
  }
  if (!provider || !apiKey) {
    return Response.json(
      { error: "no_key", message: "Configure an AI provider in Settings." },
      { status: 400 },
    );
  }

  const cached = await kv.get<Paper>(key(paperId));
  if (cached) {
    return Response.json({ paper: cached, cached: true });
  }

  const sourceContext = abstract
    ? `Abstract:\n${abstract}`
    : `(No abstract available — synthesize a high-level walkthrough from the title and authors.)`;

  const prompt = [
    "You are creating a guided reader for an academic paper.",
    "",
    `Title: ${title}`,
    `Authors: ${authors || "Unknown"}`,
    venue ? `Venue: ${venue}` : "",
    year ? `Year: ${year}` : "",
    url ? `Source URL: ${url}` : "",
    "",
    sourceContext,
    "",
    "Produce a JSON-only response (no prose, no markdown fencing) that walks the reader through the paper at three levels: beginner (curious non-specialist), intermediate (graduate student in adjacent field), expert (researcher in this field). Schema:",
    "",
    "{",
    '  "sections": [',
    "    {",
    '      "id": "abstract" | "intro" | "methods" | ...,',
    '      "title": "Section title",',
    '      "explain": { "beginner": "...", "intermediate": "...", "expert": "..." },',
    '      "body": [',
    "        {",
    '          "text": "An anchor sentence as a reader would encounter it (concrete, not vague).",',
    '          "rephrase": { "beginner": "plain rewording", "intermediate": "more technical", "expert": "terse and precise" }',
    "        }",
    "      ]",
    "    }",
    "  ]",
    "}",
    "",
    "Constraints:",
    "- 4 to 6 sections covering the arc of the paper (e.g. abstract, motivation, approach, key results, implications).",
    "- 2 to 4 body sentences per section. Each sentence should be 1–2 lines and stand alone.",
    "- Each `explain` field is one paragraph (2–4 sentences).",
    "- For beginner: avoid jargon, use everyday analogies. For expert: be precise and dense.",
    "- Be faithful to the abstract; do not invent specific numbers, datasets, or claims that aren't grounded in it. If something would be speculation, keep it general.",
    "",
    "Respond with ONLY the JSON object.",
  ]
    .filter(Boolean)
    .join("\n");

  let text: string;
  try {
    const model = buildModel(provider, apiKey, authMethod);
    const result = await generateText({ model, prompt });
    text = result.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isAuth = /401|unauthorized|invalid.*key|incorrect.*key/i.test(message);
    return Response.json(
      { error: isAuth ? "bad_key" : "ai_unavailable", detail: message },
      { status: isAuth ? 401 : 502 },
    );
  }

  let parsed: RawPaper;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : text) as RawPaper;
  } catch {
    return Response.json(
      { error: "parse_error", detail: "Model returned non-JSON output." },
      { status: 502 },
    );
  }

  const sections = Array.isArray(parsed.sections)
    ? (parsed.sections as RawSection[]).slice(0, 8).map(normalizeSection)
    : [];
  if (sections.length === 0) {
    return Response.json(
      { error: "no_sections", detail: "Model returned no usable sections." },
      { status: 502 },
    );
  }

  const paper: Paper = {
    id: paperId,
    title,
    authors,
    venue: venue ?? (source === "arxiv" ? "arXiv" : "Imported"),
    pinned: false,
    folder,
    updated: "just now",
    sections,
  };

  void kv.set(key(paperId), paper);

  return Response.json({ paper, cached: false });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("paperId");
  if (!id) {
    return Response.json({ error: "paperId required" }, { status: 400 });
  }
  const paper = await kv.get<Paper>(key(id));
  if (!paper) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ paper });
}
