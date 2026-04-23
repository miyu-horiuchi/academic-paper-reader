"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { READER_TOKENS } from "@/lib/paper-data";
import { completeOpenRouterAuth, writeAiSettings } from "@/lib/ai-settings";

export default function OpenRouterCallbackPage() {
  return (
    <Suspense>
      <Callback />
    </Suspense>
  );
}

function Callback() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<"exchanging" | "error">("exchanging");
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      setState("error");
      setMessage("OpenRouter did not return an authorization code.");
      return;
    }
    completeOpenRouterAuth(code)
      .then(({ key }) => {
        writeAiSettings({
          provider: "openrouter",
          apiKey: key,
          model: "anthropic/claude-haiku-4.5",
        });
        router.replace("/settings?connected=openrouter");
      })
      .catch((err: unknown) => {
        setState("error");
        setMessage(err instanceof Error ? err.message : String(err));
      });
  }, [params, router]);

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
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          fontSize: 14,
          lineHeight: 1.55,
          color: READER_TOKENS.ink2,
        }}
      >
        {state === "exchanging" ? (
          <div>Connecting to OpenRouter…</div>
        ) : (
          <>
            <div style={{ color: "#8a1e1e", fontWeight: 600, marginBottom: 8 }}>
              Sign-in failed
            </div>
            <div style={{ fontSize: 12.5 }}>{message}</div>
            <a
              href="/settings"
              style={{
                display: "inline-block",
                marginTop: 16,
                color: READER_TOKENS.accent,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              ← Back to Settings
            </a>
          </>
        )}
      </div>
    </main>
  );
}
