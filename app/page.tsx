import { auth, signIn, signOut } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Academic Paper Reader
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Sign in to read and annotate papers.
          </p>
        </div>

        {session?.user ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Signed in as <strong>{session.user.email}</strong>
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/reader"
                className="px-5 py-2.5 rounded-md bg-black text-white text-sm font-medium hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Open reader
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/reader" });
            }}
          >
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-black text-white text-sm font-medium hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Sign in with Google
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
