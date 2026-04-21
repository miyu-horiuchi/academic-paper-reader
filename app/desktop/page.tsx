import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { DesktopShell } from "./_components/desktop-shell";

export default async function Desktop() {
  const session = await auth();
  if (!session?.user) redirect("/");

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <DesktopShell userEmail={session.user.email} signOutAction={doSignOut} />
  );
}
