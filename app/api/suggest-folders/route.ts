import { generateText } from "ai";
import { auth } from "@/auth";
import { buildServerModel, hasServerInference } from "@/lib/ai-server";
import type { ProviderId } from "@/lib/ai-settings";

export const runtime = "nodejs";

type PaperSummary = {
  title?: string;
  folder?: string;
  tags?: string[];
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    interest?: string;
    goal?: string;
    library?: PaperSummary[];
    provider?: ProviderId;
    apiKey?: string;
  };

  const {
    interest = "",
    goal = "",
    library = [],
    provider,
    apiKey,
  } = body;

  if (!hasServerInference() && (!provider || !apiKey)) {
    return Response.json(
      { error: "no_key", message: "Configure an AI provider in Settings." },
      { status: 400 },
    );
  }
  if (!interest.trim() || !goal.trim()) {
    return Response.json(
      { error: "interest and goal are required" },
      { status: 400 },
    );
  }

  const libSummary = library
    .slice(0, 40)
    .map(
      (p) =>
        `- ${p.title ?? "Untitled"} (${p.folder ?? "misc"}) [${(p.tags ?? []).join(", ")}]`,
    )
    .join("\n");

  const prompt = [
    "A user of an academic paper reader wants help organizing their library into smart folders.",
    "",
    `Their interest area: ${interest.trim()}`,
    `Their end goal: ${goal.trim()}`,
    "",
    "Their current library:",
    libSummary,
    "",
    "Propose 3 folders that would help this user reach their goal, drawing from the themes present in the library. Each folder should feel like a focused reading path, not a broad category.",
    "",
    "Respond with ONLY valid JSON (no prose, no markdown fencing) matching:",
    '{"folders":[{"name":"<=24 char name","why":"<=90 char reason this folder helps the goal","keywords":["lowercase","match","terms"]}]}',
    "",
    "The keywords will be substring-matched against paper titles, tags, and folder names — keep them short and specific.",
  ].join("\n");

  try {
    const model = buildServerModel({
      clientProvider: provider,
      clientApiKey: apiKey,
    });
    if (!model) {
      return Response.json(
        { error: "no_key", message: "Configure an AI provider in Settings." },
        { status: 400 },
      );
    }
    const { text } = await generateText({ model, prompt });
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text) as {
      folders?: { name?: string; why?: string; keywords?: unknown[] }[];
    };
    const folders = (parsed.folders ?? [])
      .slice(0, 4)
      .map((f, i) => ({
        id: "ai-" + Date.now() + "-" + i,
        name: (f.name ?? "Untitled").slice(0, 32),
        why: (f.why ?? "").slice(0, 140),
        keywords: Array.isArray(f.keywords)
          ? f.keywords
              .filter((k): k is string => typeof k === "string" && k.length > 0)
              .slice(0, 8)
          : [],
      }));
    return Response.json({ folders });
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
