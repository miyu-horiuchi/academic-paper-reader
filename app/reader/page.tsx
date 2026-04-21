import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function Reader() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-12">
        <h1 className="text-xl font-semibold tracking-tight">Reader</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {session.user.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="max-w-4xl mx-auto">
        <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-16 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            No papers yet. Upload or paste an arXiv link to get started.
          </p>
        </div>
      </section>
    </main>
  );
}
