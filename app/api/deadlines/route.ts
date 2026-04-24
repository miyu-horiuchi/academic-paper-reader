import { auth } from "@/auth";
import { kv } from "@/lib/kv";

export const runtime = "nodejs";

type Deadline = {
  id: string;
  name: string;
  date: string;
  link: string;
  note: string;
};

function key(email: string): string {
  return `user:${email}:deadlines`;
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await kv.get<Deadline[] | null>(key(email));
  return Response.json({ rows: rows ?? null });
}

export async function PUT(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { rows?: Deadline[] };
  if (!Array.isArray(body.rows)) {
    return Response.json({ error: "rows array required" }, { status: 400 });
  }
  await kv.set(key(email), body.rows);
  return Response.json({ ok: true });
}
