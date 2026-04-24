"use client";

import { useState } from "react";
import Link from "next/link";
import { READER_TOKENS } from "@/lib/paper-data";
import {
  PROVIDERS,
  readAiSettings,
  writeAiSettings,
} from "@/lib/ai-settings";
import { useAiSettings } from "@/lib/use-ai-settings";

const ASK_CHIPS = [
  {
    id: "explain",
    label: "Explain more",
    prompt:
      "Explain this in clearer, simpler language for a beginner. Use an analogy if helpful. 2–3 sentences.",
  },
  {
    id: "takeaways",
    label: "Key takeaways",
    prompt:
      "Give me the 2–3 most important takeaways as a concise bulleted list.",
  },
  {
    id: "example",
    label: "Give an example",
    prompt: "Provide one concrete, grounded example that illustrates this idea.",
  },
  {
    id: "why",
    label: "Why does this matter?",
    prompt:
      "Why does this matter? What is the significance of this in the context of the paper and the field?",
  },
] as const;

export type AskContext = {
  paperTitle: string;
  sectionTitle: string;
  quote: string;
};

export function AskAI({
  context,
  placeholder = "Ask about this sentence…",
}: {
  context: AskContext;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [chip, setChip] = useState<string | null>(null);
  const settings = useAiSettings();
  const providerLabel = settings
    ? (PROVIDERS.find((p) => p.id === settings.provider)?.modelLabel ?? null)
    : null;

  const run = async (prompt: string, chipId: string | null) => {
    if (!settings) return;
    setLoading(true);
    setAnswer("");
    setChip(chipId);
    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...context,
          prompt,
          provider: settings.provider,
          apiKey: settings.apiKey,
          authMethod: settings.authMethod,
          projectId: settings.projectId,
          refreshToken: settings.refreshToken,
          expiresAt: settings.expiresAt,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === "bad_key") {
          setAnswer(
            "Your API key was rejected by the provider. Update it in Settings.",
          );
        } else if (data?.error === "no_key" || data?.error === "no_project") {
          setAnswer(
            data?.message ?? "Configure an AI provider in Settings.",
          );
        } else {
          setAnswer(
            `Could not reach the AI. ${data?.detail ?? "Try again."}`,
          );
        }
      } else {
        const data = (await res.json()) as {
          text?: string;
          refreshed?: { access_token: string; expires_at: number };
        };
        if (data.refreshed) {
          const current = readAiSettings();
          if (current) {
            writeAiSettings({
              ...current,
              apiKey: data.refreshed.access_token,
              expiresAt: data.refreshed.expires_at,
            });
          }
        }
        setAnswer(data.text ?? "");
      }
    } catch {
      setAnswer("Could not reach the AI. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: `1px solid ${READER_TOKENS.rule}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: READER_TOKENS.accent,
          fontWeight: 600,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M5.5 1v2M5.5 8v2M1 5.5h2M8 5.5h2M2.3 2.3l1.4 1.4M7.3 7.3l1.4 1.4M2.3 8.7l1.4-1.4M7.3 3.7l1.4-1.4" />
        </svg>
        Ask AI
      </div>
      {!settings ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 6,
            background: "#fffdf7",
            border: `1px dashed ${READER_TOKENS.rule}`,
            fontSize: 12,
            color: READER_TOKENS.ink2,
            lineHeight: 1.55,
          }}
        >
          Ask AI uses your own API key — pick a provider and paste a key.{" "}
          <Link
            href="/settings"
            style={{
              color: READER_TOKENS.accent,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Set up your AI provider →
          </Link>
        </div>
      ) : (
        <>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}
          >
            {ASK_CHIPS.map((c) => (
              <button
                key={c.id}
                onClick={() => run(c.prompt, c.id)}
                disabled={loading}
                style={{
                  padding: "4px 9px",
                  borderRadius: 12,
                  border: `1px solid ${chip === c.id ? READER_TOKENS.accent : READER_TOKENS.rule}`,
                  background:
                    chip === c.id ? READER_TOKENS.accentSoft : "#faf7f2",
                  fontSize: 11,
                  fontWeight: 500,
                  color: READER_TOKENS.ink,
                  cursor: loading ? "wait" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && q.trim()) run(q.trim(), null);
              }}
              placeholder={placeholder}
              disabled={loading}
              style={{
                flex: 1,
                border: `1px solid ${READER_TOKENS.rule}`,
                borderRadius: 5,
                padding: "6px 10px",
                fontFamily: "inherit",
                fontSize: 12,
                color: READER_TOKENS.ink,
                background: "#fffdf7",
                outline: "none",
              }}
            />
            <button
              onClick={() => q.trim() && run(q.trim(), null)}
              disabled={loading || !q.trim()}
              style={{
                padding: "6px 12px",
                borderRadius: 5,
                border: "none",
                background:
                  q.trim() && !loading
                    ? READER_TOKENS.ink
                    : "rgba(60,45,30,.2)",
                color: "#fffdf7",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: q.trim() && !loading ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              {loading ? "…" : "Ask"}
            </button>
          </div>
          {providerLabel && (
            <div
              style={{
                fontSize: 10.5,
                color: READER_TOKENS.ink3,
                marginTop: 6,
                textAlign: "right",
              }}
            >
              via {providerLabel} ·{" "}
              <Link
                href="/settings"
                style={{ color: READER_TOKENS.ink3, textDecoration: "underline" }}
              >
                change
              </Link>
            </div>
          )}
        </>
      )}
      {(loading || answer) && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 6,
            background: "#1f1a15",
            color: "#f6f1e8",
            fontSize: 12.5,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
            maxHeight: 240,
            overflow: "auto",
          }}
        >
          {loading ? (
            <span style={{ opacity: 0.7 }}>Thinking…</span>
          ) : (
            answer
          )}
        </div>
      )}
    </div>
  );
}
