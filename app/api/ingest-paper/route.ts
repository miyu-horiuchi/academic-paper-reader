import { generateText } from "ai";
import { auth } from "@/auth";
import { kv } from "@/lib/kv";
import { buildServerModel, hasServerInference } from "@/lib/ai-server";
import type { AiAuthMethod, ProviderId } from "@/lib/ai-settings";
import type { Paper, Section, Sentence } from "@/lib/paper-data";

export const runtime = "nodejs";
export const maxDuration = 60;

const LEVELS = ["beginner", "intermediate", "expert"] as const;

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
type RawPaper = { sections?: unknown; summary?: unknown };

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
  if (!hasServerInference() && (!provider || !apiKey)) {
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
    "  ],",
    '  "summary": "A concise 40-70 word paragraph describing THIS paper\'s core idea / architecture / finding in concrete, visualizable terms (name the components, flows, or objects)."',
    "}",
    "",
    "Constraints:",
    "- 4 to 6 sections covering the arc of the paper (e.g. abstract, motivation, approach, key results, implications).",
    "- 2 to 4 body sentences per section. Each sentence should be 1–2 lines and stand alone.",
    "- Each `explain` field is one paragraph (2–4 sentences).",
    "- For beginner: avoid jargon, use everyday analogies. For expert: be precise and dense.",
    "- Be faithful to the abstract; do not invent specific numbers, datasets, or claims that aren't grounded in it. If something would be speculation, keep it general.",
    "",
    "For `summary` (used to generate an isometric diagram of the paper):",
    "- 40-70 words, one paragraph, no line breaks.",
    "- Concrete and visualizable — name the parts, the flow, or the metaphor (e.g. 'two encoder columns feeding into a decoder via curved attention arrows', 'a strand of DNA above three petri dishes coloured by culturability score').",
    "- Skip framing words like 'this paper' — describe the THING.",
    "",
    "Respond with ONLY the JSON object.",
  ]
    .filter(Boolean)
    .join("\n");

  let text: string;
  try {
    const model = buildServerModel({
      clientProvider: provider,
      clientApiKey: apiKey,
      authMethod,
    });
    if (!model) {
      return Response.json(
        { error: "no_key", message: "Configure an AI provider in Settings." },
        { status: 400 },
      );
    }
    const textResult = await generateText({
      model,
      prompt,
      maxOutputTokens: 8000,
    });
    text = textResult.text;
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
    const snippet = text.slice(0, 200).replace(/\s+/g, " ").trim();
    return Response.json(
      {
        error: "parse_error",
        detail: `Model returned non-JSON output. Got: "${snippet}…"`,
      },
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

  const summary =
    typeof parsed.summary === "string" ? parsed.summary : null;
  // Image generation is deferred to a separate /api/regenerate-visual call
  // so the ingest response returns within Vercel's serverless time budget.
  const visualUrl: string | undefined = undefined;

  const paper: Paper = {
    id: paperId,
    title,
    authors,
    venue: venue ?? (source === "arxiv" ? "arXiv" : "Imported"),
    pinned: false,
    folder,
    updated: "just now",
    sections,
    visualUrl,
    summary: summary ?? undefined,
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
