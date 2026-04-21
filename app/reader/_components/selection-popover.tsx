"use client";

import { useState } from "react";
import {
  PAPER,
  READER_TOKENS,
  type HighlightColor,
} from "@/lib/paper-data";
import { AskAI } from "./ask-ai";

export type SelectionState = {
  text: string;
  rect: DOMRect;
  sectionId: string | null;
};

export function SelectionPopover({
  selection,
  onClose,
  onSaveNote,
}: {
  selection: SelectionState;
  onClose: () => void;
  onSaveNote: (color: HighlightColor, text: string) => void;
}) {
  const [mode, setMode] = useState<"actions" | "note">("actions");
  const [noteColor, setNoteColor] = useState<HighlightColor>("yellow");
  const [noteText, setNoteText] = useState("");

  const r = selection.rect;
  const width = 360;
  const placeAbove = r.top > 260;
  const top = placeAbove
    ? Math.max(10, r.top - 12)
    : Math.min(window.innerHeight - 40, r.bottom + 10);
  const left = Math.min(
    Math.max(10, r.left + r.width / 2 - width / 2),
    window.innerWidth - width - 10,
  );

  const sec = selection.sectionId
    ? PAPER.sections.find((s) => s.id === selection.sectionId)
    : null;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left,
        top,
        width,
        transform: placeAbove ? "translateY(-100%)" : "none",
        zIndex: 70,
        background: "#fffdf7",
        border: `1px solid ${READER_TOKENS.ruleStrong}`,
        borderRadius: 8,
        boxShadow: "0 16px 40px rgba(60,40,20,.2)",
        padding: "12px 14px",
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
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Selection{sec ? ` · ${sec.title}` : ""}</span>
        <span style={{ color: READER_TOKENS.ink3, fontWeight: 400 }}>
          {selection.text.split(/\s+/).length} words
        </span>
      </div>
      <div
        style={{
          padding: "8px 10px",
          borderRadius: 5,
          background: READER_TOKENS.hl[noteColor],
          fontFamily: READER_TOKENS.serif,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: READER_TOKENS.ink,
          marginBottom: 10,
          maxHeight: 80,
          overflow: "auto",
        }}
      >
        &ldquo;
        {selection.text.length > 260
          ? selection.text.slice(0, 260) + "…"
          : selection.text}
        &rdquo;
      </div>

      {mode === "actions" && (
        <>
          <AskAI
            context={{
              paperTitle: PAPER.title,
              sectionTitle: sec?.title ?? "",
              quote: selection.text,
            }}
            placeholder="Ask about this selection…"
          />
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 10,
              paddingTop: 10,
              borderTop: `1px solid ${READER_TOKENS.rule}`,
            }}
          >
            <button
              onClick={() => setMode("note")}
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
              onClick={onClose}
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
          </div>
        </>
      )}

      {mode === "note" && (
        <div>
          <textarea
            autoFocus
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (
                (e.metaKey || e.ctrlKey) &&
                e.key === "Enter" &&
                noteText.trim()
              ) {
                onSaveNote(noteColor, noteText);
              }
              if (e.key === "Escape") setMode("actions");
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
                  onClick={() => setNoteColor(c)}
                  title={c}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    cursor: "pointer",
                    background: READER_TOKENS.hl[c],
                    border:
                      noteColor === c
                        ? `2px solid ${READER_TOKENS.ink}`
                        : `1px solid ${READER_TOKENS.rule}`,
                  }}
                />
              ))}
            </div>
            <span style={{ flex: 1 }} />
            <button
              onClick={() => setMode("actions")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 11.5,
                color: READER_TOKENS.ink3,
                fontFamily: "inherit",
              }}
            >
              Back
            </button>
            <button
              onClick={() =>
                noteText.trim() && onSaveNote(noteColor, noteText)
              }
              disabled={!noteText.trim()}
              style={{
                padding: "5px 10px",
                borderRadius: 5,
                border: "none",
                background: noteText.trim()
                  ? READER_TOKENS.accent
                  : "rgba(60,45,30,.15)",
                color: "#fffdf7",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: noteText.trim() ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              Save note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
