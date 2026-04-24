"use client";

import { useState } from "react";
import Link from "next/link";
import { READER_TOKENS, type LibraryPaper } from "@/lib/paper-data";
import { suggestionMatches, type AiFolder } from "@/lib/ai-folders";
import { useAiSettings } from "@/lib/use-ai-settings";

export function SuggestFolders({
  library,
  existing,
  onAccept,
}: {
  library: LibraryPaper[];
  existing: AiFolder[];
  onAccept: (folder: AiFolder) => void;
}) {
  const settings = useAiSettings();
  const [open, setOpen] = useState(false);
  const [interest, setInterest] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<AiFolder[]>([]);

  const canSubmit =
    !!settings &&
    interest.trim().length > 2 &&
    goal.trim().length > 2 &&
    !loading;

  const run = async () => {
    if (!canSubmit || !settings) return;
    setLoading(true);
    setError("");
    setSuggestions([]);
    try {
      const res = await fetch("/api/suggest-folders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          interest: interest.trim(),
          goal: goal.trim(),
          library: library.map((p) => ({
            title: p.title,
            folder: p.folder,
            tags: p.tags,
          })),
          provider: settings.provider,
          apiKey: settings.apiKey,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === "bad_key") {
          setError("Your API key was rejected. Update it in Settings.");
        } else if (data?.error === "no_key") {
          setError("Configure an AI provider in Settings first.");
        } else {
          setError("Couldn't read suggestions. Try rephrasing your goal.");
        }
        return;
      }
      const data = (await res.json()) as { folders?: AiFolder[] };
      if (!data.folders?.length) {
        setError("No folders suggested. Try a more specific goal.");
        return;
      }
      setSuggestions(data.folders);
    } catch {
      setError("Couldn't reach the AI. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const isAccepted = (s: AiFolder) => existing.some((f) => f.name === s.name);

  return (
    <div style={{ marginTop: 18, padding: "0 6px" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 6px",
          background: "transparent",
          border: "none",
          color: READER_TOKENS.accent,
          fontFamily: "inherit",
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          fontWeight: 600,
          cursor: "pointer",
          borderTop: `1px solid ${READER_TOKENS.rule}`,
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          stroke={READER_TOKENS.accent}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5.5 1v2M5.5 8v2M1 5.5h2M8 5.5h2M2.3 2.3l1.4 1.4M7.3 7.3l1.4 1.4M2.3 8.7l1.4-1.4M7.3 3.7l1.4-1.4" />
        </svg>
        <span style={{ flex: 1, textAlign: "left" }}>Suggest folders</span>
        <span
          style={{
            color: READER_TOKENS.ink3,
            fontSize: 10,
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform .15s",
          }}
        >
          ›
        </span>
      </button>

      {open && (
        <div
          style={{ padding: "8px 6px 14px", fontSize: 12, color: READER_TOKENS.ink2 }}
        >
          {!settings ? (
            <div
              style={{
                fontSize: 11.5,
                lineHeight: 1.5,
                color: READER_TOKENS.ink3,
                padding: "8px 10px",
                background: "#fffdf7",
                border: `1px dashed ${READER_TOKENS.rule}`,
                borderRadius: 5,
              }}
            >
              Connect an AI provider first —{" "}
              <Link
                href="/settings"
                style={{
                  color: READER_TOKENS.accent,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                open Settings →
              </Link>
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.45,
                  color: READER_TOKENS.ink3,
                  marginBottom: 10,
                }}
              >
                Tell the library what you care about and where you&rsquo;re
                headed. It&rsquo;ll propose folders drawn from your papers.
              </div>

              <label
                style={{
                  display: "block",
                  fontSize: 10.5,
                  letterSpacing: 0.4,
                  color: READER_TOKENS.ink3,
                  fontWeight: 600,
                  marginBottom: 3,
                }}
              >
                Interest area
              </label>
              <input
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="e.g. transformer architectures"
                style={inputStyle}
              />
              <label
                style={{
                  display: "block",
                  fontSize: 10.5,
                  letterSpacing: 0.4,
                  color: READER_TOKENS.ink3,
                  fontWeight: 600,
                  marginBottom: 3,
                  marginTop: 8,
                }}
              >
                End goal
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. understand attention well enough to reimplement from scratch"
                rows={2}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  lineHeight: 1.4,
                }}
              />
              <button
                onClick={run}
                disabled={!canSubmit}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "none",
                  marginTop: 8,
                  background: canSubmit
                    ? READER_TOKENS.accent
                    : "rgba(184,135,61,.25)",
                  color: "#fffdf7",
                  fontFamily: "inherit",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  letterSpacing: 0.2,
                }}
              >
                {loading ? "Thinking…" : "Suggest folders"}
              </button>
              {error && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#a14b2a" }}>
                  {error}
                </div>
              )}

              {suggestions.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {suggestions.map((s) => {
                    const matches = library.filter((p) =>
                      suggestionMatches(p, s),
                    );
                    const accepted = isAccepted(s);
                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: "9px 10px",
                          background: "#fffdf7",
                          border: `1px solid ${READER_TOKENS.rule}`,
                          borderRadius: 5,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 13 13"
                            fill="none"
                            stroke={READER_TOKENS.accent}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 4v7h9V5H6.5L5.5 4z" />
                          </svg>
                          <span
                            style={{
                              flex: 1,
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: READER_TOKENS.ink,
                            }}
                          >
                            {s.name}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: READER_TOKENS.ink3,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {matches.length} papers
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            lineHeight: 1.45,
                            color: READER_TOKENS.ink2,
                            marginBottom: 6,
                          }}
                        >
                          {s.why}
                        </div>
                        {s.keywords.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 3,
                              marginBottom: 8,
                            }}
                          >
                            {s.keywords.map((k) => (
                              <span
                                key={k}
                                style={{
                                  fontSize: 9.5,
                                  padding: "1px 6px",
                                  borderRadius: 8,
                                  background: "rgba(184,135,61,.1)",
                                  color: READER_TOKENS.accent,
                                  letterSpacing: 0.2,
                                }}
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => onAccept(s)}
                          disabled={accepted}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 4,
                            border: `1px solid ${accepted ? READER_TOKENS.rule : READER_TOKENS.accent}`,
                            background: accepted
                              ? "transparent"
                              : READER_TOKENS.accent,
                            color: accepted
                              ? READER_TOKENS.ink3
                              : "#fffdf7",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: accepted ? "default" : "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {accepted ? "Added" : "Add folder"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  background: "#fffdf7",
  border: `1px solid ${READER_TOKENS.rule}`,
  borderRadius: 4,
  fontFamily: "inherit",
  fontSize: 12,
  color: READER_TOKENS.ink,
  boxSizing: "border-box",
  outline: "none",
};
