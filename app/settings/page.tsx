import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { READER_TOKENS } from "@/lib/paper-data";
import { PapersIcon } from "@/components/papers-icon";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: READER_TOKENS.paper,
        color: READER_TOKENS.ink,
        fontFamily: READER_TOKENS.sans,
        padding: "40px 24px 60px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link
          href="/reader"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: READER_TOKENS.ink2,
            fontSize: 13,
            marginBottom: 28,
          }}
        >
          <PapersIcon size={20} />
          <span>Papers</span>
          <span style={{ color: READER_TOKENS.ink3 }}>· Settings</span>
        </Link>

        <h1
          style={{
            fontFamily: READER_TOKENS.serif,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: -0.3,
            margin: "0 0 8px",
          }}
        >
          AI provider
        </h1>
        <p
          style={{
            color: READER_TOKENS.ink2,
            fontSize: 13.5,
            lineHeight: 1.55,
            margin: "0 0 28px",
          }}
        >
          Ask AI runs on your own API key. Keys are saved only in this
          browser&rsquo;s local storage and sent to the provider through this
          app on each request &mdash; never stored on any server.
        </p>

        <SettingsForm />
      </div>
    </main>
  );
}
