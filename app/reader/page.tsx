import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ReaderShell } from "./_components/reader-shell";

export default async function Reader() {
  const session = await auth();
  if (!session?.user) redirect("/");

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <ReaderShell
      userName={session.user.name}
      userEmail={session.user.email}
      signOutAction={doSignOut}
    />
  );
}
