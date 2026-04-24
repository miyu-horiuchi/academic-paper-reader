import { auth } from "@/auth";
import { kv } from "@/lib/kv";
import type { AiFolder } from "@/lib/ai-folders";

export const runtime = "nodejs";

function key(email: string): string {
  return `user:${email}:ai-folders`;
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const folders = await kv.get<AiFolder[] | null>(key(email));
  return Response.json({ folders: folders ?? [] });
}

export async function PUT(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { folders?: AiFolder[] };
  if (!Array.isArray(body.folders)) {
    return Response.json({ error: "folders array required" }, { status: 400 });
  }
  await kv.set(key(email), body.folders);
  return Response.json({ ok: true });
}
