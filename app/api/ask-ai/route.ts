import { generateText } from "ai";
import { auth } from "@/auth";

export const runtime = "nodejs";

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
  };

  const { paperTitle = "", sectionTitle = "", quote = "", prompt = "" } = body;
  if (!prompt.trim() || !quote.trim()) {
    return Response.json({ error: "prompt and quote are required" }, { status: 400 });
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
    const { text } = await generateText({
      model: "anthropic/claude-haiku-4.5",
      prompt: fullPrompt,
    });
    return Response.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: "ai_unavailable", detail: message },
      { status: 502 },
    );
  }
}
