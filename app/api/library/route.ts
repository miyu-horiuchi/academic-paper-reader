import { auth } from "@/auth";
import { kv } from "@/lib/kv";
import type { LibraryPaper } from "@/lib/paper-data";

export const runtime = "nodejs";

function key(email: string): string {
  return `user:${email}:library`;
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const library = await kv.get<LibraryPaper[] | null>(key(email));
  return Response.json({ library: library ?? null });
}

export async function PUT(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { library?: LibraryPaper[] };
  if (!Array.isArray(body.library)) {
    return Response.json({ error: "library array required" }, { status: 400 });
  }
  await kv.set(key(email), body.library);
  return Response.json({ ok: true });
}
