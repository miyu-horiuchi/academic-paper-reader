"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { READER_TOKENS } from "@/lib/paper-data";
import {
  PROVIDERS,
  readAiSettings,
  writeAiSettings,
  clearAiSettings,
  type AiAuthMethod,
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
  const [provider, setProvider] = useState<ProviderId>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [authMethod, setAuthMethod] = useState<AiAuthMethod>("key");
  const [projectId, setProjectId] = useState("");
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [test, setTest] = useState<TestResult>({ kind: "idle" });
  const [geminiFlash, setGeminiFlash] = useState<string | null>(null);

  useEffect(() => {
    const existing = readAiSettings();
    if (existing) {
      setProvider(existing.provider);
      setApiKey(existing.apiKey);
      setAuthMethod(existing.authMethod ?? "key");
      setProjectId(existing.projectId ?? "");
    }
    if (searchParams.get("gemini_connected")) {
      setGeminiFlash("Connected to Google. Enter your GCP project ID and save.");
      setProvider("google");
      setAuthMethod("google-oauth");
      setTimeout(() => setGeminiFlash(null), 4000);
    } else if (searchParams.get("gemini_error")) {
      setGeminiFlash(
        `Google sign-in failed: ${searchParams.get("gemini_error")}`,
      );
      setTimeout(() => setGeminiFlash(null), 6000);
    }
  }, [searchParams]);

  const entry = PROVIDERS.find((p) => p.id === provider)!;

  const onSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    const existing = readAiSettings();
    writeAiSettings({
      provider,
      apiKey: trimmed,
      authMethod,
      projectId:
        provider === "google" && authMethod === "google-oauth"
          ? projectId.trim() || undefined
          : undefined,
      refreshToken:
        provider === "google" && authMethod === "google-oauth"
          ? existing?.refreshToken
          : undefined,
      expiresAt:
        provider === "google" && authMethod === "google-oauth"
          ? existing?.expiresAt
          : undefined,
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
          authMethod,
          projectId: projectId.trim() || undefined,
          refreshToken: readAiSettings()?.refreshToken,
          expiresAt: readAiSettings()?.expiresAt,
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
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          {PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProvider(p.id);
                  setTest({ kind: "idle" });
                  if (p.id !== provider) {
                    setApiKey("");
                    setAuthMethod("key");
                  }
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
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: READER_TOKENS.ink3 }}>
                  {p.modelLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {geminiFlash && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            fontSize: 12.5,
            background: "rgba(47,177,114,.12)",
            color: "#207d50",
            border: `1px solid rgba(47,177,114,.3)`,
          }}
        >
          {geminiFlash}
        </div>
      )}

      {provider === "google" && (
        <div>
          <label style={label}>Method</label>
          <div style={{ display: "flex", gap: 6 }}>
            {(
              [
                { id: "key", label: "API key" },
                { id: "google-oauth", label: "Sign in with Google" },
              ] as const
            ).map((m) => {
              const active = authMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setAuthMethod(m.id);
                    setApiKey("");
                    setTest({ kind: "idle" });
                  }}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: `1px solid ${active ? READER_TOKENS.accent : READER_TOKENS.rule}`,
                    background: active ? READER_TOKENS.accentSoft : "#fffdf7",
                    color: READER_TOKENS.ink,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          {authMethod === "google-oauth" && (
            <>
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  background: "rgba(184,135,61,.08)",
                  border: `1px solid ${READER_TOKENS.rule}`,
                  borderRadius: 6,
                  fontSize: 11.5,
                  lineHeight: 1.55,
                  color: READER_TOKENS.ink2,
                }}
              >
                <strong style={{ color: READER_TOKENS.ink }}>
                  Needs a Google Cloud Project with Vertex AI enabled.
                </strong>
                <br />
                Click below to sign in with Google. After returning here, enter
                the GCP project ID that has Vertex AI enabled.{" "}
                <a
                  href="https://console.cloud.google.com/vertex-ai"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: READER_TOKENS.accent,
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Open Vertex AI console →
                </a>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/api/auth/google-gemini/start";
                }}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: READER_TOKENS.ink,
                  color: "#fffdf7",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sign in with Google
              </button>
              <label style={{ ...label, marginTop: 16 }}>
                GCP project ID
              </label>
              <input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-gcp-project"
                style={{
                  width: "100%",
                  border: `1px solid ${READER_TOKENS.rule}`,
                  borderRadius: 6,
                  padding: "9px 12px",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12.5,
                  color: READER_TOKENS.ink,
                  background: "#fffdf7",
                  outline: "none",
                }}
              />
            </>
          )}
        </div>
      )}

      {provider === "openai" && (
        <div>
          <label style={label}>Method</label>
          <div style={{ display: "flex", gap: 6 }}>
            {(
              [
                { id: "key", label: "API key" },
                { id: "codex-oauth", label: "Codex token" },
              ] as const
            ).map((m) => {
              const active = authMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setAuthMethod(m.id);
                    setApiKey("");
                    setTest({ kind: "idle" });
                  }}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: `1px solid ${active ? READER_TOKENS.accent : READER_TOKENS.rule}`,
                    background: active ? READER_TOKENS.accentSoft : "#fffdf7",
                    color: READER_TOKENS.ink,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          {authMethod === "codex-oauth" && (
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                background: "rgba(184,135,61,.08)",
                border: `1px solid ${READER_TOKENS.rule}`,
                borderRadius: 6,
                fontSize: 11.5,
                lineHeight: 1.55,
                color: READER_TOKENS.ink2,
              }}
            >
              <strong style={{ color: READER_TOKENS.ink }}>
                Experimental — uses your ChatGPT subscription.
              </strong>
              <br />
              On your machine, install Codex CLI and run{" "}
              <code
                style={{
                  background: "#fffdf7",
                  padding: "0 4px",
                  borderRadius: 3,
                }}
              >
                codex login
              </code>
              . Then open{" "}
              <code
                style={{
                  background: "#fffdf7",
                  padding: "0 4px",
                  borderRadius: 3,
                }}
              >
                ~/.codex/auth.json
              </code>
              , copy the{" "}
              <code
                style={{
                  background: "#fffdf7",
                  padding: "0 4px",
                  borderRadius: 3,
                }}
              >
                access_token
              </code>{" "}
              value, and paste below. Responses may be in a coding-agent voice;
              OpenAI may revoke this path without notice.
            </div>
          )}
        </div>
      )}

      {!(provider === "google" && authMethod === "google-oauth") && (
      <div>
        <label style={label} htmlFor="ai-key">
          {provider === "openai" && authMethod === "codex-oauth"
            ? "Codex access token"
            : "API key"}
        </label>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            id="ai-key"
            type={show ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setTest({ kind: "idle" });
            }}
            placeholder={
              authMethod === "codex-oauth"
                ? "eyJhbGciOi... (from ~/.codex/auth.json)"
                : entry.keyPrefix
                  ? `${entry.keyPrefix}...`
                  : "paste your API key"
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onSave}
          disabled={!apiKey.trim()}
          style={{
            padding: "9px 18px",
            borderRadius: 6,
            border: "none",
            background: apiKey.trim()
              ? READER_TOKENS.accent
              : "rgba(60,45,30,.2)",
            color: "#fffdf7",
            fontSize: 13,
            fontWeight: 600,
            cursor: apiKey.trim() ? "pointer" : "not-allowed",
            fontFamily: "inherit",
          }}
        >
          {saved ? "Saved ✓" : "Save"}
        </button>
        <button
          type="button"
          onClick={runTest}
          disabled={!apiKey.trim() || test.kind === "running"}
          style={{
            padding: "9px 14px",
            borderRadius: 6,
            background: "transparent",
            border: `1px solid ${READER_TOKENS.ruleStrong}`,
            color: READER_TOKENS.ink2,
            fontSize: 13,
            fontWeight: 500,
            cursor: apiKey.trim() ? "pointer" : "not-allowed",
            fontFamily: "inherit",
          }}
        >
          {test.kind === "running" ? "Testing…" : "Test connection"}
        </button>
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
      </div>

      {test.kind === "ok" && (
        <TestLine tone="ok">Connection works.</TestLine>
      )}
      {test.kind === "bad_key" && (
        <TestLine tone="bad">
          The provider rejected that key. Check for typos or a revoked key.
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
