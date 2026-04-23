"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { READER_TOKENS } from "@/lib/paper-data";
import {
  PROVIDERS,
  OPENROUTER_MODELS,
  beginOpenRouterAuth,
  readAiSettings,
  writeAiSettings,
  clearAiSettings,
  type ProviderId,
} from "@/lib/ai-settings";

type TestResult =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok" }
  | { kind: "bad_key" }
  | { kind: "error"; detail: string };

export function SettingsForm() {
  const searchParams = useSearchParams();
  const [provider, setProvider] = useState<ProviderId>("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [orModel, setOrModel] = useState<string>(OPENROUTER_MODELS[0].id);
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [test, setTest] = useState<TestResult>({ kind: "idle" });
  const [justConnected, setJustConnected] = useState(false);

  useEffect(() => {
    const existing = readAiSettings();
    if (existing) {
      setProvider(existing.provider);
      setApiKey(existing.apiKey);
      if (existing.model) setOrModel(existing.model);
    }
    if (searchParams.get("connected") === "openrouter") {
      setJustConnected(true);
      setTimeout(() => setJustConnected(false), 3000);
    }
  }, [searchParams]);

  const entry = PROVIDERS.find((p) => p.id === provider)!;
  const isOpenRouter = provider === "openrouter";
  const connectedToOR =
    isOpenRouter && apiKey.startsWith("sk-or-") && apiKey.length > 20;

  const onSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    writeAiSettings({
      provider,
      apiKey: trimmed,
      model: isOpenRouter ? orModel : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  const onClear = () => {
    clearAiSettings();
    setApiKey("");
    setSaved(false);
    setTest({ kind: "idle" });
  };

  const onSignIn = async () => {
    const authUrl = await beginOpenRouterAuth(window.location.origin);
    window.location.href = authUrl;
  };

  const runTest = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    setTest({ kind: "running" });
    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paperTitle: "Test",
          sectionTitle: "Test",
          quote: "test",
          prompt: "Reply with the single word: ok",
          provider,
          apiKey: trimmed,
          model: isOpenRouter ? orModel : undefined,
        }),
      });
      if (res.ok) {
        setTest({ kind: "ok" });
      } else {
        const data = await res.json().catch(() => ({}));
        setTest(
          data?.error === "bad_key"
            ? { kind: "bad_key" }
            : { kind: "error", detail: data?.detail ?? "Unknown error" },
        );
      }
    } catch (err) {
      setTest({
        kind: "error",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const label = {
    display: "block",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
    color: READER_TOKENS.ink3,
    fontWeight: 600,
    marginBottom: 8,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={label}>Provider</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProvider(p.id);
                  setTest({ kind: "idle" });
                  if (p.id !== provider) setApiKey("");
                }}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${active ? READER_TOKENS.accent : READER_TOKENS.rule}`,
                  background: active ? READER_TOKENS.accentSoft : "#fffdf7",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: READER_TOKENS.ink,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {p.label}
                  {p.id === "openrouter" && (
                    <span
                      style={{
                        fontSize: 9.5,
                        background: READER_TOKENS.accent,
                        color: "#fffdf7",
                        padding: "1px 5px",
                        borderRadius: 8,
                        letterSpacing: 0.4,
                        fontWeight: 700,
                      }}
                    >
                      OAUTH
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: READER_TOKENS.ink3 }}>
                  {p.modelLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isOpenRouter ? (
        <>
          {justConnected && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 6,
                background: "rgba(184,135,61,.12)",
                color: READER_TOKENS.ink,
                border: `1px solid ${READER_TOKENS.accent}`,
                fontSize: 12.5,
              }}
            >
              Connected to OpenRouter. Pick a model and save.
            </div>
          )}

          {!connectedToOR ? (
            <div>
              <label style={label}>Sign in</label>
              <button
                type="button"
                onClick={onSignIn}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: READER_TOKENS.ink,
                  color: "#fffdf7",
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M5 1h8v12H5M9 7H1M4 4L1 7l3 3" />
                </svg>
                Sign in with OpenRouter
              </button>
              <div
                style={{
                  fontSize: 11.5,
                  color: READER_TOKENS.ink3,
                  marginTop: 8,
                  lineHeight: 1.55,
                }}
              >
                You&rsquo;ll be redirected to OpenRouter to authorize. One
                sign-in covers Claude, GPT, Gemini, and Grok — usage is billed
                to your OpenRouter account.
              </div>
            </div>
          ) : (
            <>
              <div>
                <label style={label}>Model</label>
                <select
                  value={orModel}
                  onChange={(e) => {
                    setOrModel(e.target.value);
                    setTest({ kind: "idle" });
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 6,
                    border: `1px solid ${READER_TOKENS.rule}`,
                    background: "#fffdf7",
                    fontFamily: "inherit",
                    fontSize: 13,
                    color: READER_TOKENS.ink,
                    outline: "none",
                  }}
                >
                  {OPENROUTER_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    fontSize: 11.5,
                    color: READER_TOKENS.ink3,
                    marginTop: 6,
                  }}
                >
                  Connected · key stored in this browser.{" "}
                  <button
                    type="button"
                    onClick={onClear}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: 11.5,
                      color: READER_TOKENS.accent,
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div>
          <label style={label}>API key</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type={show ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTest({ kind: "idle" });
              }}
              placeholder={
                entry.keyPrefix ? `${entry.keyPrefix}...` : "paste your API key"
              }
              style={{
                flex: 1,
                border: `1px solid ${READER_TOKENS.rule}`,
                borderRadius: 6,
                padding: "9px 12px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 12.5,
                color: READER_TOKENS.ink,
                background: "#fffdf7",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              style={{
                padding: "0 12px",
                borderRadius: 6,
                border: `1px solid ${READER_TOKENS.rule}`,
                background: "#fffdf7",
                color: READER_TOKENS.ink2,
                fontSize: 11.5,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: READER_TOKENS.ink3,
              marginTop: 6,
              lineHeight: 1.55,
            }}
          >
            Get a key from{" "}
            <a
              href={entry.keysUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                color: READER_TOKENS.accent,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {entry.label}&rsquo;s console
            </a>
            . Keys stay in this browser; nothing is synced to a server.
          </div>
        </div>
      )}

      {(connectedToOR || (!isOpenRouter && apiKey.trim())) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onSave}
            style={{
              padding: "9px 18px",
              borderRadius: 6,
              border: "none",
              background: READER_TOKENS.accent,
              color: "#fffdf7",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
          <button
            type="button"
            onClick={runTest}
            disabled={test.kind === "running"}
            style={{
              padding: "9px 14px",
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
            {test.kind === "running" ? "Testing…" : "Test connection"}
          </button>
          {!isOpenRouter && (
            <button
              type="button"
              onClick={onClear}
              style={{
                padding: "9px 14px",
                borderRadius: 6,
                background: "transparent",
                border: `1px solid ${READER_TOKENS.rule}`,
                color: READER_TOKENS.ink3,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                marginLeft: "auto",
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {test.kind === "ok" && (
        <TestLine tone="ok">Connection works.</TestLine>
      )}
      {test.kind === "bad_key" && (
        <TestLine tone="bad">
          The provider rejected that credential. Re-connect or update the key.
        </TestLine>
      )}
      {test.kind === "error" && (
        <TestLine tone="bad">
          Couldn&rsquo;t reach the provider: {test.detail}
        </TestLine>
      )}
    </div>
  );
}

function TestLine({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "ok" | "bad";
}) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 6,
        fontSize: 12.5,
        lineHeight: 1.5,
        background:
          tone === "ok" ? "rgba(184,135,61,.12)" : "rgba(170,30,30,.08)",
        color: tone === "ok" ? READER_TOKENS.ink : "#8a1e1e",
        border: `1px solid ${tone === "ok" ? READER_TOKENS.accent : "rgba(170,30,30,.3)"}`,
      }}
    >
      {children}
    </div>
  );
}
