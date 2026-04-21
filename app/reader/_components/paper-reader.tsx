"use client";

import { useEffect, useRef, useState } from "react";
import {
  LEVELS,
  LIBRARY,
  PAPER,
  READER_TOKENS,
  TERMS,
  type HighlightColor,
  type Level,
  type LibraryPaper,
  type Section,
} from "@/lib/paper-data";
import type { UserNote } from "./tab-views";
import { AskAI } from "./ask-ai";
import { SelectionPopover, type SelectionState } from "./selection-popover";

type SentenceLocus = { sectionId: string; sentenceIdx: number };

type HoverState =
  | { kind: "section"; sectionId: string; rect: DOMRect }
  | { kind: "sentence"; sectionId: string; sentenceIdx: number; rect: DOMRect }
  | { kind: "term"; term: string; rect: DOMRect };

type PinnedState =
  | { kind: "sentence"; sectionId: string; sentenceIdx: number; rect: DOMRect };

type NoteDraft = {
  sectionId: string;
  sentenceIdx: number;
  color: HighlightColor;
  text: string;
};

function parseSentence(text: string): Array<{ type: "text" | "term"; value: string }> {
  const parts: Array<{ type: "text" | "term"; value: string }> = [];
  const matches = [...text.matchAll(/\[\[([^\]]+)\]\]/g)];
  let last = 0;
  for (const m of matches) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ type: "text", value: text.slice(last, idx) });
    parts.push({ type: "term", value: m[1] });
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

function SentenceText({
  text,
  onTermEnter,
  onTermLeave,
}: {
  text: string;
  onTermEnter: (term: string, el: HTMLElement) => void;
  onTermLeave: () => void;
}) {
  const parts = parseSentence(text);
  return (
    <>
      {parts.map((p, i) =>
        p.type === "term" ? (
          <span
            key={i}
            onMouseEnter={(e) => onTermEnter(p.value, e.currentTarget)}
            onMouseLeave={onTermLeave}
            style={{
              borderBottom: `1px dotted ${READER_TOKENS.accent}`,
              cursor: "help",
              color: READER_TOKENS.ink,
            }}
          >
            {p.value}
          </span>
        ) : (
          <span key={i}>{p.value}</span>
        ),
      )}
    </>
  );
}

function isSameSentence(
  a: SentenceLocus | null,
  b: SentenceLocus | null,
): boolean {
  if (!a || !b) return false;
  return a.sectionId === b.sectionId && a.sentenceIdx === b.sentenceIdx;
}

function ExplainPopover({
  hover,
  level,
  pinned,
  noteDraft,
  onDismissPin,
  onStartNote,
  onUpdateDraft,
  onCancelNote,
  onSaveNote,
}: {
  hover: HoverState;
  level: Level;
  pinned: PinnedState | null;
  noteDraft: NoteDraft | null;
  onDismissPin: () => void;
  onStartNote: (draft: NoteDraft) => void;
  onUpdateDraft: (draft: NoteDraft) => void;
  onCancelNote: () => void;
  onSaveNote: (draft: NoteDraft) => void;
}): React.JSX.Element | null {
  if (hover.kind === "term") {
    const term =
      TERMS[hover.term] ?? { short: "Definition not available.", full: "" };
    return (
      <div
        style={{
          position: "fixed",
          left: Math.min(hover.rect.left, window.innerWidth - 280),
          top: hover.rect.bottom + 8,
          zIndex: 50,
          width: 260,
          background: "#1f1a15",
          color: "#f6f1e8",
          padding: "12px 14px",
          borderRadius: 8,
          boxShadow: "0 10px 30px rgba(0,0,0,.22)",
          fontFamily: READER_TOKENS.sans,
          fontSize: 12.5,
          lineHeight: 1.5,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: "#e8c78a",
            fontSize: 12,
            marginBottom: 4,
            letterSpacing: 0.2,
          }}
        >
          {hover.term}
        </div>
        <div>{term.short}</div>
      </div>
    );
  }

  if (hover.kind === "sentence") {
    const sec = PAPER.sections.find((s) => s.id === hover.sectionId);
    if (!sec) return null;
    const sent = sec.body[hover.sentenceIdx];
    const hoverLocus = { sectionId: hover.sectionId, sentenceIdx: hover.sentenceIdx };
    const isPinned =
      pinned?.kind === "sentence" && isSameSentence(pinned, hoverLocus);
    const isEditing =
      isPinned && noteDraft !== null && isSameSentence(noteDraft, hoverLocus);

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: Math.min(hover.rect.left, window.innerWidth - 360),
          top: hover.rect.bottom + 10,
          zIndex: 60,
          width: 340,
          background: "#fffdf7",
          border: `1px solid ${READER_TOKENS.ruleStrong}`,
          padding: "14px 16px",
          borderRadius: 6,
          boxShadow: "0 12px 36px rgba(60,40,20,.18)",
          fontFamily: READER_TOKENS.sans,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: READER_TOKENS.accent,
            fontWeight: 600,
            marginBottom: 6,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{isEditing ? "New note" : `In plain words · ${level}`}</span>
          <span style={{ color: READER_TOKENS.ink3, fontWeight: 400 }}>sentence</span>
        </div>
        <div
          style={{
            fontSize: 13.5,
            lineHeight: 1.55,
            color: READER_TOKENS.ink,
          }}
        >
          {sent.rephrase[level]}
        </div>

        {!isEditing && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: `1px solid ${READER_TOKENS.rule}`,
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            {isPinned ? (
              <>
                <button
                  onClick={() =>
                    onStartNote({
                      sectionId: hover.sectionId,
                      sentenceIdx: hover.sentenceIdx,
                      color: "yellow",
                      text: "",
                    })
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 5,
                    border: "none",
                    background: READER_TOKENS.accent,
                    color: "#fffdf7",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 11 11"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <path d="M2 9h7M7 2l2 2-5 5H2V7z" />
                  </svg>
                  Take note
                </button>
                <span style={{ flex: 1 }} />
                <button
                  onClick={onDismissPin}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 11.5,
                    color: READER_TOKENS.ink3,
                    fontFamily: "inherit",
                  }}
                >
                  Dismiss
                </button>
              </>
            ) : (
              <span style={{ fontSize: 11, color: READER_TOKENS.ink3 }}>
                Click the sentence to pin and take a note
              </span>
            )}
          </div>
        )}

        {isEditing && noteDraft && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                padding: "8px 10px",
                borderRadius: 5,
                background: READER_TOKENS.hl[noteDraft.color],
                fontFamily: READER_TOKENS.serif,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: READER_TOKENS.ink,
                marginBottom: 10,
              }}
            >
              &ldquo;
              {sent.text
                .replace(/\[\[([^\]]+)\]\]/g, "$1")
                .slice(0, 140)}
              {sent.text.length > 140 ? "…" : ""}
              &rdquo;
            </div>
            <textarea
              autoFocus
              value={noteDraft.text}
              onChange={(e) =>
                onUpdateDraft({ ...noteDraft, text: e.target.value })
              }
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  if (noteDraft.text.trim()) onSaveNote(noteDraft);
                }
                if (e.key === "Escape") onCancelNote();
              }}
              placeholder="Write a note… (⌘+Return to save)"
              style={{
                width: "100%",
                minHeight: 72,
                resize: "vertical",
                border: `1px solid ${READER_TOKENS.rule}`,
                borderRadius: 5,
                padding: "8px 10px",
                fontFamily: "inherit",
                fontSize: 13,
                color: READER_TOKENS.ink,
                background: "#faf7f2",
                outline: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 10,
              }}
            >
              <div style={{ display: "flex", gap: 4 }}>
                {(Object.keys(READER_TOKENS.hl) as HighlightColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateDraft({ ...noteDraft, color: c })}
                    title={c}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      cursor: "pointer",
                      background: READER_TOKENS.hl[c],
                      border:
                        noteDraft.color === c
                          ? `2px solid ${READER_TOKENS.ink}`
                          : `1px solid ${READER_TOKENS.rule}`,
                    }}
                  />
                ))}
              </div>
              <span style={{ flex: 1 }} />
              <button
                onClick={onCancelNote}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 11.5,
                  color: READER_TOKENS.ink3,
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  noteDraft.text.trim() && onSaveNote(noteDraft)
                }
                disabled={!noteDraft.text.trim()}
                style={{
                  padding: "5px 10px",
                  borderRadius: 5,
                  border: "none",
                  background: noteDraft.text.trim()
                    ? READER_TOKENS.accent
                    : "rgba(60,45,30,.15)",
                  color: "#fffdf7",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: noteDraft.text.trim() ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                }}
              >
                Save note
              </button>
            </div>
          </div>
        )}

        {isPinned && !isEditing && (
          <AskAI
            context={{
              paperTitle: PAPER.title,
              sectionTitle: sec.title,
              quote: sent.text.replace(/\[\[([^\]]+)\]\]/g, "$1"),
            }}
            placeholder="Ask about this sentence…"
          />
        )}
      </div>
    );
  }

  const sec = PAPER.sections.find((s) => s.id === hover.sectionId);
  if (!sec) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 40,
        width: 340,
        background: "#1f1a15",
        color: "#f6f1e8",
        padding: "16px 18px",
        borderRadius: 10,
        boxShadow: "0 20px 40px rgba(0,0,0,.28)",
        fontFamily: READER_TOKENS.sans,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "#e8c78a",
          fontWeight: 600,
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>What&rsquo;s this section about?</span>
        <span
          style={{
            padding: "2px 7px",
            background: "rgba(232,199,138,.18)",
            borderRadius: 10,
            fontSize: 9.5,
            letterSpacing: 0.5,
          }}
        >
          {level}
        </span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.55 }}>
        {sec.explain[level]}
      </div>
    </div>
  );
}

function StubReader({ entry, onImport }: { entry: LibraryPaper; onImport?: () => void }) {
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: READER_TOKENS.paper,
        color: READER_TOKENS.ink,
        fontFamily: READER_TOKENS.serif,
      }}
    >
      <div
        style={{
          padding: "40px 64px 8px",
          borderBottom: `1px solid ${READER_TOKENS.rule}`,
        }}
      >
        <div
          style={{
            fontFamily: READER_TOKENS.sans,
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: READER_TOKENS.ink3,
            marginBottom: 10,
          }}
        >
          {entry.folder}
        </div>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 600,
            margin: 0,
            letterSpacing: -0.4,
            lineHeight: 1.15,
          }}
        >
          {entry.title}
        </h1>
        <div
          style={{
            fontSize: 14,
            color: READER_TOKENS.ink2,
            marginTop: 10,
            fontStyle: "italic",
          }}
        >
          {entry.authors} · {entry.year}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            textAlign: "center",
            fontFamily: READER_TOKENS.sans,
          }}
        >
          <div
            style={{
              width: 56,
              height: 72,
              margin: "0 auto 20px",
              border: `1.5px dashed ${READER_TOKENS.ruleStrong}`,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: READER_TOKENS.ink3,
              fontSize: 10,
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >
            PDF
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: READER_TOKENS.ink,
              marginBottom: 6,
            }}
          >
            Not imported yet
          </div>
          <div
            style={{
              fontSize: 13,
              color: READER_TOKENS.ink2,
              lineHeight: 1.55,
              marginBottom: 20,
            }}
          >
            Drop the PDF or paste the arXiv link to parse this paper. Explanations, term definitions, and diagrams will be generated automatically.
          </div>
          <button
            onClick={onImport}
            style={{
              fontFamily: READER_TOKENS.sans,
              fontSize: 12.5,
              fontWeight: 500,
              padding: "7px 14px",
              borderRadius: 6,
              cursor: "pointer",
              background: READER_TOKENS.accent,
              color: "#fffdf7",
              border: "none",
            }}
          >
            Import paper
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaperReader({
  level,
  paperId = "attention",
  onImport,
  onSaveNote,
}: {
  level: Level;
  paperId?: string;
  onImport?: () => void;
  onSaveNote?: (note: UserNote) => void;
}) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [pinned, setPinned] = useState<PinnedState | null>(null);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection?.();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const text = sel.toString().trim();
      if (text.length < 2) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (
        !containerRef.current ||
        !containerRef.current.contains(range.commonAncestorContainer)
      ) {
        setSelection(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      let node: Node | null = range.commonAncestorContainer;
      if (node && node.nodeType === 3) node = node.parentElement;
      const secEl =
        node instanceof Element ? node.closest("[data-section]") : null;
      const sectionId = secEl ? secEl.getAttribute("data-section") : null;
      setSelection({ text, rect, sectionId });
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, []);

  const isFull = paperId === PAPER.id;
  const entry = LIBRARY.find((p) => p.id === paperId) ?? LIBRARY[0];

  if (!isFull) {
    return <StubReader entry={entry} onImport={onImport} />;
  }

  const onSectionEnter = (sec: Section, el: HTMLElement) => {
    if (pinned) return;
    setHover({ kind: "section", sectionId: sec.id, rect: el.getBoundingClientRect() });
  };
  const onSectionLeave = () => {
    if (!pinned) setHover(null);
  };

  const onSentenceEnter = (sec: Section, idx: number, el: HTMLElement) => {
    if (pinned) return;
    setHover({
      kind: "sentence",
      sectionId: sec.id,
      sentenceIdx: idx,
      rect: el.getBoundingClientRect(),
    });
  };

  const onSentenceClick = (sec: Section, idx: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setPinned({ kind: "sentence", sectionId: sec.id, sentenceIdx: idx, rect });
    setHover({ kind: "sentence", sectionId: sec.id, sentenceIdx: idx, rect });
  };

  const onTermEnter = (term: string, el: HTMLElement) => {
    if (pinned) return;
    setHover({ kind: "term", term, rect: el.getBoundingClientRect() });
  };
  const onTermLeave = () => {
    if (!pinned) setHover(null);
  };

  const dismissPin = () => {
    setPinned(null);
    setHover(null);
    setNoteDraft(null);
  };

  const saveNote = (draft: NoteDraft) => {
    const note: UserNote = {
      id: `u${Date.now()}`,
      sectionId: draft.sectionId,
      sentenceIdx: draft.sentenceIdx,
      color: draft.color,
      text: draft.text.trim(),
      createdAt: Date.now(),
    };
    onSaveNote?.(note);
    dismissPin();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: READER_TOKENS.paper,
        color: READER_TOKENS.ink,
        fontFamily: READER_TOKENS.serif,
      }}
    >
      <div
        style={{
          padding: "40px 64px 8px",
          borderBottom: `1px solid ${READER_TOKENS.rule}`,
        }}
      >
        <div
          style={{
            fontFamily: READER_TOKENS.sans,
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: READER_TOKENS.ink3,
            marginBottom: 10,
          }}
        >
          {PAPER.venue} · {PAPER.folder}
        </div>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 600,
            margin: 0,
            letterSpacing: -0.4,
            lineHeight: 1.15,
          }}
        >
          {PAPER.title}
        </h1>
        <div
          style={{
            fontSize: 14,
            color: READER_TOKENS.ink2,
            marginTop: 10,
            fontStyle: "italic",
          }}
        >
          {PAPER.authors}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "28px 64px 80px",
          position: "relative",
        }}
      >
        {PAPER.sections.map((sec) => (
          <section
            key={sec.id}
            data-section={sec.id}
            onMouseEnter={(e) => onSectionEnter(sec, e.currentTarget)}
            onMouseLeave={onSectionLeave}
            style={{ marginBottom: 36, position: "relative" }}
          >
            <h2
              style={{
                fontSize: 18,
                fontFamily: READER_TOKENS.sans,
                fontWeight: 600,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                color: READER_TOKENS.ink2,
                margin: "0 0 16px",
                paddingBottom: 6,
              }}
            >
              {sec.title}
            </h2>
            <div style={{ fontSize: 16.5, lineHeight: 1.7, color: READER_TOKENS.ink }}>
              {sec.body.map((s, i) => {
                const active =
                  hover?.kind === "sentence" &&
                  hover.sectionId === sec.id &&
                  hover.sentenceIdx === i;
                return (
                  <span
                    key={i}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      onSentenceEnter(sec, i, e.currentTarget);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSentenceClick(sec, i, e.currentTarget);
                    }}
                    style={{
                      background: active ? READER_TOKENS.hl.yellow : "transparent",
                      transition: "background .15s ease",
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                      padding: "1px 0",
                      cursor: "text",
                    }}
                  >
                    <SentenceText
                      text={s.text}
                      onTermEnter={onTermEnter}
                      onTermLeave={onTermLeave}
                    />
                    {i < sec.body.length - 1 ? " " : ""}
                  </span>
                );
              })}
            </div>
          </section>
        ))}

        <section style={{ opacity: 0.4, marginTop: 32 }}>
          <h2
            style={{
              fontSize: 18,
              fontFamily: READER_TOKENS.sans,
              fontWeight: 600,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              color: READER_TOKENS.ink2,
              margin: "0 0 16px",
            }}
          >
            3.3 · Position-wise Feed-Forward Networks
          </h2>
          <div style={{ fontSize: 16.5, lineHeight: 1.7 }}>
            In addition to attention sub-layers, each of the layers in our encoder and
            decoder contains a fully connected feed-forward network, which is applied to
            each position separately and identically&hellip;
          </div>
        </section>
      </div>

      {hover && (
        <ExplainPopover
          hover={hover}
          level={level}
          pinned={pinned}
          noteDraft={noteDraft}
          onDismissPin={dismissPin}
          onStartNote={(draft) => setNoteDraft(draft)}
          onUpdateDraft={(draft) => setNoteDraft(draft)}
          onCancelNote={() => setNoteDraft(null)}
          onSaveNote={saveNote}
        />
      )}

      {pinned && (
        <div
          onClick={dismissPin}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            cursor: "default",
          }}
        />
      )}

      {selection && !pinned && (
        <SelectionPopover
          selection={selection}
          onClose={() => {
            setSelection(null);
            window.getSelection?.()?.removeAllRanges();
          }}
          onSaveNote={(color, text) => {
            const sectionId = selection.sectionId ?? "abstract";
            onSaveNote?.({
              id: `u${Date.now()}`,
              sectionId,
              sentenceIdx: 0,
              color,
              text: text.trim(),
              createdAt: Date.now(),
            });
            setSelection(null);
            window.getSelection?.()?.removeAllRanges();
          }}
        />
      )}
    </div>
  );
}

export { LEVELS };
