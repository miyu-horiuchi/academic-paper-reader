import Link from "next/link";
import { READER_TOKENS } from "@/lib/paper-data";

const DMG_URL =
  "https://github.com/miyu-horiuchi/academic-paper-reader/releases/latest/download/AcademicPaperReader-macOS.dmg";

export default function DownloadPage() {
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
      <div style={{ width: "100%", maxWidth: 460, textAlign: "center" }}>
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
          <svg width="22" height="22" viewBox="0 0 16 16" fill={READER_TOKENS.accent}>
            <path d="M3 2v12l5-3 5 3V2z" />
          </svg>
          Papers
        </div>
        <h1
          style={{
            fontFamily: READER_TOKENS.serif,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: -0.3,
            margin: "20px 0 10px",
          }}
        >
          Papers for macOS
        </h1>
        <p
          style={{
            color: READER_TOKENS.ink2,
            marginBottom: 28,
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          A native Mac app for reading papers in a dedicated window. Same reader,
          no browser tab noise.
        </p>

        <a
          href={DMG_URL}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 22px",
            borderRadius: 8,
            background: READER_TOKENS.accent,
            color: "#fffdf7",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 1px 2px rgba(60,40,20,.12)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
          >
            <path d="M11.2 8.56c-.02-1.87 1.53-2.77 1.6-2.82-.88-1.28-2.24-1.46-2.73-1.48-1.16-.12-2.26.68-2.85.68-.59 0-1.5-.66-2.46-.64-1.27.02-2.44.74-3.09 1.87-1.32 2.29-.34 5.68.94 7.54.63.91 1.37 1.93 2.34 1.89.94-.04 1.3-.61 2.44-.61 1.14 0 1.46.61 2.46.59 1.02-.02 1.66-.93 2.28-1.85.72-1.06 1.01-2.08 1.03-2.14-.02-.01-1.97-.76-1.99-3.03zM9.48 3.08c.52-.63.87-1.5.77-2.37-.74.03-1.65.49-2.19 1.12-.48.55-.9 1.44-.79 2.29.83.06 1.68-.42 2.21-1.04z" />
          </svg>
          Download for macOS
        </a>

        <div
          style={{
            marginTop: 14,
            fontSize: 11.5,
            color: READER_TOKENS.ink3,
          }}
        >
          Apple Silicon · macOS 10.15 or later · signed &amp; notarized
        </div>

        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: `1px solid ${READER_TOKENS.rule}`,
            fontSize: 12.5,
            color: READER_TOKENS.ink2,
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: 0 }}>
            Prefer the web?{" "}
            <Link
              href="/reader"
              style={{ color: READER_TOKENS.accent, textDecoration: "none", fontWeight: 600 }}
            >
              Open in browser →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
