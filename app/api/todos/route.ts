import { auth } from "@/auth";
import { kv, userKey } from "@/lib/kv";

export const runtime = "nodejs";

type TodoItem = {
  id: string;
  paperId: string | null;
  text: string;
  done: boolean;
  due: "Today" | "Tomorrow" | "This week" | "Next week" | "Someday";
};

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const todos = await kv.get<TodoItem[] | null>(userKey(email, "todos"));
  return Response.json({ todos: todos ?? null });
}

export async function PUT(req: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { todos?: TodoItem[] };
  if (!Array.isArray(body.todos)) {
    return Response.json({ error: "todos array required" }, { status: 400 });
  }
  await kv.set(userKey(email, "todos"), body.todos);
  return Response.json({ ok: true });
}
