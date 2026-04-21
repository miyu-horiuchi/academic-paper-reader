"use client";

import { useState } from "react";
import { READER_TOKENS } from "@/lib/paper-data";

type TabId = "upload" | "url" | "paste" | "blank";

const TABS: Array<{
  id: TabId;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: "upload",
    label: "Upload PDF",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9v1.5a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5V9" />
        <path d="M6.5 2v6M4 4.5l2.5-2.5L9 4.5" />
      </svg>
    ),
  },
  {
    id: "url",
    label: "From URL / DOI",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M5.5 7.5L7.5 5.5" />
        <path d="M6.5 3.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M6.5 9.5l-1 1a2.5 2.5 0 0 1-3.5-3.5l1-1" />
      </svg>
    ),
  },
  {
    id: "paste",
    label: "Paste text",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2.5h5M3 3.5v7a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-7M4.5 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1h-4z" />
      </svg>
    ),
  },
  {
    id: "blank",
    label: "Blank note",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2h5l2 2v7a.5.5 0 0 1-.5.5h-6.5a.5.5 0 0 1-.5-.5v-8.5a.5.5 0 0 1 .5-.5z" />
        <path d="M5 6h3M5 8h3" />
      </svg>
    ),
  },
];

export function AddPaperModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd?: () => void;
}) {
  const [tab, setTab] = useState<TabId>("upload");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(30,20,10,.28)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: READER_TOKENS.sans,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: "calc(100% - 48px)",
          background: "#fffdf7",
          borderRadius: 10,
          boxShadow: "0 30px 80px rgba(40,25,10,.28)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px 14px",
            borderBottom: `1px solid ${READER_TOKENS.rule}`,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: READER_TOKENS.ink,
                letterSpacing: -0.2,
              }}
            >
              Add a paper
            </div>
            <div
              style={{ fontSize: 12, color: READER_TOKENS.ink3, marginTop: 2 }}
            >
              Drop a PDF, paste a link, or start a blank note
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: READER_TOKENS.ink3,
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "10px 14px 0",
            borderBottom: `1px solid ${READER_TOKENS.rule}`,
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "none",
                  background: "transparent",
                  padding: "8px 12px 10px",
                  borderBottom: `2px solid ${active ? READER_TOKENS.accent : "transparent"}`,
                  color: active ? READER_TOKENS.ink : READER_TOKENS.ink3,
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  marginBottom: -1,
                }}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 20, minHeight: 240 }}>
          {tab === "upload" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              style={{
                border: `1.5px dashed ${dragOver ? READER_TOKENS.accent : READER_TOKENS.ruleStrong}`,
                borderRadius: 8,
                background: dragOver ? READER_TOKENS.accentSoft : "rgba(60,45,30,.02)",
                padding: "32px 20px",
                textAlign: "center",
                transition: "background .12s, border-color .12s",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: READER_TOKENS.accentSoft,
                  color: READER_TOKENS.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 3v10M6 7l4-4 4 4M4 15h12" />
                </svg>
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: READER_TOKENS.ink,
                  fontWeight: 500,
                }}
              >
                Drop PDFs here
              </div>
              <div
                style={{ fontSize: 12, color: READER_TOKENS.ink3, marginTop: 4 }}
              >
                or{" "}
                <span
                  style={{
                    color: READER_TOKENS.accent,
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  choose files
                </span>{" "}
                · arXiv, ACL, PubMed all supported
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: READER_TOKENS.ink3,
                  marginTop: 14,
                  padding: "8px 12px",
                  background: "rgba(60,45,30,.04)",
                  borderRadius: 5,
                  display: "inline-block",
                }}
              >
                Title &amp; authors auto-extracted · annotations carry over
              </div>
            </div>
          )}

          {tab === "url" && (
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: READER_TOKENS.ink2,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                arXiv, DOI, or URL
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="arxiv.org/abs/1706.03762"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: 13,
                  border: `1px solid ${READER_TOKENS.ruleStrong}`,
                  borderRadius: 6,
                  background: "#fffcf4",
                  fontFamily: "inherit",
                  color: READER_TOKENS.ink,
                  outline: "none",
                }}
              />
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  background: "rgba(60,45,30,.04)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: READER_TOKENS.ink2,
                  lineHeight: 1.5,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: READER_TOKENS.accent,
                    marginBottom: 4,
                  }}
                >
                  Preview
                </div>
                {url ? (
                  <>
                    <div
                      style={{
                        fontWeight: 600,
                        color: READER_TOKENS.ink,
                        marginBottom: 2,
                      }}
                    >
                      Attention Is All You Need
                    </div>
                    <div style={{ color: READER_TOKENS.ink3, fontSize: 11.5 }}>
                      Vaswani et al. · NeurIPS 2017 · 15 pages
                    </div>
                  </>
                ) : (
                  <div style={{ color: READER_TOKENS.ink3, fontStyle: "italic" }}>
                    Paste a link to preview metadata
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "paste" && (
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: READER_TOKENS.ink2,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Paper title"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: 13,
                  border: `1px solid ${READER_TOKENS.ruleStrong}`,
                  borderRadius: 6,
                  background: "#fffcf4",
                  fontFamily: "inherit",
                  color: READER_TOKENS.ink,
                  outline: "none",
                  marginBottom: 10,
                }}
              />
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: READER_TOKENS.ink2,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Body text
              </label>
              <textarea
                placeholder="Paste the paper body here…"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 13,
                  border: `1px solid ${READER_TOKENS.ruleStrong}`,
                  borderRadius: 6,
                  background: "#fffcf4",
                  fontFamily: READER_TOKENS.serif,
                  color: READER_TOKENS.ink,
                  outline: "none",
                  resize: "none",
                  minHeight: 120,
                  lineHeight: 1.5,
                }}
              />
            </div>
          )}

          {tab === "blank" && (
            <div>
              <input
                placeholder="Untitled note"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 18,
                  fontWeight: 600,
                  border: "none",
                  borderBottom: `1px solid ${READER_TOKENS.rule}`,
                  background: "transparent",
                  fontFamily: READER_TOKENS.serif,
                  color: READER_TOKENS.ink,
                  outline: "none",
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  fontSize: 12,
                  color: READER_TOKENS.ink3,
                  padding: "10px 0",
                }}
              >
                Start a blank note — still gets cursor-hover explanations once
                you paste text in.
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderTop: `1px solid ${READER_TOKENS.rule}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(60,45,30,.02)",
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              color: READER_TOKENS.ink3,
              flex: 1,
            }}
          >
            Adds to{" "}
            <span style={{ color: READER_TOKENS.ink, fontWeight: 500 }}>
              ML Foundations
            </span>{" "}
            · you can move it after
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${READER_TOKENS.ruleStrong}`,
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              color: READER_TOKENS.ink2,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onAdd?.();
              onClose();
            }}
            style={{
              background: READER_TOKENS.accent,
              border: "none",
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#fffdf7",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Add paper
          </button>
        </div>
      </div>
    </div>
  );
}
