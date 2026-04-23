import { auth, signIn, signOut } from "@/auth";
import Link from "next/link";
import { READER_TOKENS } from "@/lib/paper-data";

export default async function Home() {
  const session = await auth();

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: READER_TOKENS.paper,
        color: READER_TOKENS.ink,
        fontFamily: READER_TOKENS.sans,
        padding: 32,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontFamily: READER_TOKENS.serif,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: -0.5,
            color: READER_TOKENS.ink,
            marginBottom: 10,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 16 16"
            fill={READER_TOKENS.accent}
          >
            <path d="M3 2v12l5-3 5 3V2z" />
          </svg>
          Papers
        </div>
        <p
          style={{
            color: READER_TOKENS.ink2,
            marginBottom: 32,
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          Read and annotate academic papers with inline explanations at the
          reading level that fits you.
        </p>

        {session?.user ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ fontSize: 13, color: READER_TOKENS.ink3 }}>
              Signed in as{" "}
              <strong style={{ color: READER_TOKENS.ink }}>
                {session.user.email}
              </strong>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                href="/reader"
                style={{
                  padding: "9px 16px",
                  borderRadius: 6,
                  background: READER_TOKENS.accent,
                  color: "#fffdf7",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
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
                  style={{
                    padding: "9px 16px",
                    borderRadius: 6,
                    background: "transparent",
                    border: `1px solid ${READER_TOKENS.ruleStrong}`,
                    color: READER_TOKENS.ink2,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
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
              style={{
                padding: "10px 18px",
                borderRadius: 6,
                background: READER_TOKENS.accent,
                border: "none",
                color: "#fffdf7",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sign in with Google
            </button>
          </form>
        )}
        <div
          style={{
            marginTop: 28,
            fontSize: 12,
            color: READER_TOKENS.ink3,
          }}
        >
          <Link
            href="/download"
            style={{ color: READER_TOKENS.ink2, textDecoration: "none" }}
          >
            Download for Mac →
          </Link>
        </div>
      </div>
    </main>
  );
}
