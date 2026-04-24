"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { READER_TOKENS } from "@/lib/paper-data";
import { readAiSettings, writeAiSettings } from "@/lib/ai-settings";

export default function GeminiCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setError("No token data returned from Google.");
      return;
    }
    const params = new URLSearchParams(hash);
    const access = params.get("access_token");
    const refresh = params.get("refresh_token") || undefined;
    const expiresAtStr = params.get("expires_at");
    if (!access || !expiresAtStr) {
      setError("Missing token fields in callback.");
      return;
    }
    const existing = readAiSettings();
    writeAiSettings({
      provider: "google",
      apiKey: access,
      authMethod: "google-oauth",
      refreshToken: refresh,
      expiresAt: Number(expiresAtStr),
      projectId: existing?.projectId,
    });
    router.replace("/settings?gemini_connected=1");
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: READER_TOKENS.paper,
        color: READER_TOKENS.ink,
        fontFamily: READER_TOKENS.sans,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 380, textAlign: "center", fontSize: 14 }}>
        {error ? (
          <>
            <div style={{ color: "#8a1e1e", fontWeight: 600, marginBottom: 8 }}>
              Sign-in failed
            </div>
            <div style={{ fontSize: 12.5, color: READER_TOKENS.ink2 }}>
              {error}
            </div>
            <a
              href="/settings"
              style={{
                display: "inline-block",
                marginTop: 14,
                fontSize: 13,
                color: READER_TOKENS.accent,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Back to Settings
            </a>
          </>
        ) : (
          <div style={{ color: READER_TOKENS.ink2 }}>Connecting to Google…</div>
        )}
      </div>
    </main>
  );
}
