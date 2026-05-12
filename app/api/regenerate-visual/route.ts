import { auth } from "@/auth";
import { kv } from "@/lib/kv";
import { generateIsometricVisual } from "@/lib/image-gen";
import type { Paper } from "@/lib/paper-data";

export const runtime = "nodejs";
export const maxDuration = 60;

function key(id: string): string {
  return `paper:content:${id}`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    paperId?: string;
    title?: string;
    summary?: string;
  };
  const paperId = body.paperId;
  if (!paperId) {
    return Response.json({ error: "paperId required" }, { status: 400 });
  }

  const paper = await kv.get<Paper>(key(paperId));
  if (!paper && !body.title) {
    return Response.json({ error: "paper not found" }, { status: 404 });
  }

  const title = paper?.title ?? body.title ?? "";
  const summary = paper?.summary ?? body.summary ?? null;

  const visual = await generateIsometricVisual({ title, summary });
  if ("error" in visual) {
    return Response.json(
      { error: "image_gen_failed", detail: visual.error },
      { status: 502 },
    );
  }

  if (paper) {
    const updated: Paper = { ...paper, visualUrl: visual.url };
    void kv.set(key(paperId), updated);
  }

  return Response.json({ url: visual.url });
}
