import { auth } from "@/auth";
import { kv, userKey } from "@/lib/kv";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const text = await kv.get<string | null>(userKey(email, "scratchpad"));
  return Response.json({ text: text ?? "" });
}

export async function PUT(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { text?: string };
  if (typeof body.text !== "string") {
    return Response.json({ error: "text string required" }, { status: 400 });
  }
  await kv.set(userKey(email, "scratchpad"), body.text);
  return Response.json({ ok: true });
}
