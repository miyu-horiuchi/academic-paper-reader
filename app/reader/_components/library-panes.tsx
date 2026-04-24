"use client";

import { useState } from "react";
import {
  FOLDERS,
  FOLDER_MATCH,
  FOLDER_DROP,
  READER_TOKENS,
  type FolderEntry,
  type FolderKey,
  type LibraryPaper,
} from "@/lib/paper-data";
import { suggestionMatches, type AiFolder } from "@/lib/ai-folders";
import { SuggestFolders } from "./suggest-folders";

function FolderIcon({ kind }: { kind: "library" | "clock" | "pin" | "bookmark" | "folder" }) {
  const s = {
    width: 13,
    height: 13,
    viewBox: "0 0 13 13",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "library":
      return (
        <svg {...s}>
          <path d="M2 3v9M6.5 3v9M11 3v9M4 3h1M8.5 3h1" />
        </svg>
      );
    case "clock":
      return (
        <svg {...s}>
          <circle cx="6.5" cy="6.5" r="5" />
          <path d="M6.5 3.5V6.5L8.5 7.5" />
        </svg>
      );
    case "pin":
      return (
        <svg {...s}>
          <path d="M6.5 8v3.5M3.5 8h6L8 5V2H5v3z" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...s}>
          <path d="M3 2v9l3.5-2.5L10 11V2z" />
        </svg>
      );
    case "folder":
      return (
        <svg {...s}>
          <path d="M2 4v7h9V5H6.5L5.5 4z" />
        </svg>
      );
  }
}

export function Sidebar({
  library,
  selected = "pinned",
  onSelect,
  dragging = false,
  onDropOnFolder,
  flashFolder,
  compact = false,
  aiFolders = [],
  onAcceptAiFolder,
  onRemoveAiFolder,
}: {
  library: LibraryPaper[];
  selected?: FolderKey | string;
  onSelect?: (id: FolderKey | string) => void;
  dragging?: boolean;
  onDropOnFolder?: (paperId: string, folderId: FolderKey) => void;
  flashFolder?: FolderKey | null;
  compact?: boolean;
  aiFolders?: AiFolder[];
  onAcceptAiFolder?: (folder: AiFolder) => void;
  onRemoveAiFolder?: (id: string) => void;
}) {
  const [overId, setOverId] = useState<FolderKey | null>(null);

  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        background: READER_TOKENS.paperDeep,
        fontFamily: READER_TOKENS.sans,
        borderRight: `1px solid ${READER_TOKENS.rule}`,
        padding: compact ? "16px 8px" : "20px 12px",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: READER_TOKENS.ink,
          padding: "0 10px 14px",
          letterSpacing: -0.1,
        }}
      >
        Library
      </div>
      {FOLDERS.map((f: FolderEntry, i) => {
        if (f.type === "divider") {
          return (
            <div
              key={`d-${i}`}
              style={{
                height: 1,
                background: READER_TOKENS.rule,
                margin: "8px 10px",
              }}
            />
          );
        }
        const isSel = f.id === selected;
        const matcher = FOLDER_MATCH[f.id];
        const count = library.filter(matcher).length;
        const canDrop = dragging && Boolean(FOLDER_DROP[f.id]) && f.id !== "all";
        const isOver = overId === f.id;
        const flashing = flashFolder === f.id;
        return (
          <div
            key={f.id}
            onClick={() => onSelect?.(f.id)}
            onDragOver={(e) => {
              if (canDrop) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverId(f.id);
              }
            }}
            onDragLeave={() => {
              setOverId((prev) => (prev === f.id ? null : prev));
            }}
            onDrop={(e) => {
              if (!canDrop) return;
              e.preventDefault();
              const id = e.dataTransfer.getData("text/paper-id");
              if (id) onDropOnFolder?.(id, f.id);
              setOverId(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: compact ? "6px 10px" : "7px 10px",
              borderRadius: 5,
              cursor: "pointer",
              background: isOver || flashing
                ? READER_TOKENS.accent
                : canDrop
                  ? "rgba(184,135,61,.08)"
                  : isSel
                    ? READER_TOKENS.accentSoft
                    : "transparent",
              color: isOver || flashing
                ? "#fffdf7"
                : isSel
                  ? READER_TOKENS.ink
                  : READER_TOKENS.ink2,
              outline: canDrop && !isOver ? `1px dashed ${READER_TOKENS.accent}` : "none",
              outlineOffset: -2,
              fontSize: 12.5,
              fontWeight: isSel ? 600 : 400,
              marginBottom: 1,
              transition: "background .12s, color .12s",
            }}
          >
            <span
              style={{
                color: isOver || flashing
                  ? "#fffdf7"
                  : isSel
                    ? READER_TOKENS.accent
                    : READER_TOKENS.ink3,
                display: "flex",
              }}
            >
              <FolderIcon kind={f.icon} />
            </span>
            <span style={{ flex: 1 }}>{f.name}</span>
            <span
              style={{
                fontSize: 11,
                color: isOver || flashing
                  ? "rgba(255,253,247,.8)"
                  : READER_TOKENS.ink3,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {count}
            </span>
          </div>
        );
      })}

      {aiFolders.length > 0 && (
        <div
          style={{
            height: 1,
            background: READER_TOKENS.rule,
            margin: "8px 10px",
          }}
        />
      )}
      {aiFolders.map((f) => {
        const isSel = f.id === selected;
        const matched = library.filter((p) => suggestionMatches(p, f)).length;
        return (
          <div
            key={f.id}
            onClick={() => onSelect?.(f.id)}
            title={f.why}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: compact ? "6px 10px" : "7px 10px",
              borderRadius: 5,
              cursor: "pointer",
              background: isSel ? READER_TOKENS.accentSoft : "transparent",
              color: isSel ? READER_TOKENS.ink : READER_TOKENS.ink2,
              fontSize: 12.5,
              fontWeight: isSel ? 600 : 400,
              marginBottom: 1,
              position: "relative",
            }}
          >
            <span
              style={{
                color: isSel ? READER_TOKENS.accent : READER_TOKENS.ink3,
                display: "flex",
              }}
            >
              <FolderIcon kind="folder" />
            </span>
            <span
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {f.name}
              <span
                style={{
                  fontSize: 8.5,
                  color: READER_TOKENS.accent,
                  letterSpacing: 0.4,
                }}
              >
                ✦
              </span>
            </span>
            <span
              style={{
                fontSize: 11,
                color: READER_TOKENS.ink3,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {matched}
            </span>
            {onRemoveAiFolder && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveAiFolder(f.id);
                }}
                title="Remove folder"
                style={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  border: "none",
                  background: "transparent",
                  color: READER_TOKENS.ink3,
                  fontSize: 14,
                  lineHeight: 1,
                  cursor: "pointer",
                  opacity: 0,
                  transition: "opacity .12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {onAcceptAiFolder && (
        <SuggestFolders
          library={library}
          existing={aiFolders}
          onAccept={onAcceptAiFolder}
        />
      )}
    </div>
  );
}

export function LibraryList({
  library,
  folderId = "pinned",
  selected,
  onSelect,
  onDragPaper,
  compact = false,
  query = "",
  aiFolders = [],
}: {
  library: LibraryPaper[];
  folderId?: FolderKey | string;
  selected?: string;
  onSelect?: (id: string) => void;
  onDragPaper?: (paperId: string | null, dragging: boolean) => void;
  compact?: boolean;
  query?: string;
  aiFolders?: AiFolder[];
}) {
  const q = query.trim().toLowerCase();
  const activeAi = aiFolders.find((f) => f.id === folderId);
  const baseMatcher = activeAi
    ? (p: LibraryPaper) => suggestionMatches(p, activeAi)
    : (FOLDER_MATCH[folderId as FolderKey] ?? (() => true));
  const items = library
    .filter(baseMatcher)
    .filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q)
      );
    });

  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        background: READER_TOKENS.paperDeep,
        fontFamily: READER_TOKENS.sans,
      }}
    >
      <div
        style={{
          padding: compact ? "16px 18px 8px" : "20px 24px 10px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0,0,0,0.05)",
            padding: "7px 10px",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            stroke={READER_TOKENS.ink3}
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="5.5" cy="5.5" r="4" />
            <path d="m11.5 11.5-3-3" />
          </svg>
          <span style={{ color: READER_TOKENS.ink3 }}>Search papers</span>
        </div>
      </div>
      <div style={{ padding: compact ? "0 8px" : "0 12px" }}>
        {items.length === 0 && (
          <div
            style={{
              padding: "24px 14px",
              fontSize: 12,
              color: READER_TOKENS.ink3,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {q ? (
              <>
                No papers match <span style={{ color: READER_TOKENS.ink }}>&ldquo;{query}&rdquo;</span>.
              </>
            ) : (
              <>
                No papers in this folder yet.
                <br />
                <span style={{ fontSize: 11 }}>Drag a paper here to add it.</span>
              </>
            )}
          </div>
        )}
        {items.map((p) => {
          const isSel = selected === p.id;
          return (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/paper-id", p.id);
                e.dataTransfer.effectAllowed = "move";
                onDragPaper?.(p.id, true);
              }}
              onDragEnd={() => onDragPaper?.(null, false)}
              onClick={() => onSelect?.(p.id)}
              style={{
                padding: compact ? "10px 12px" : "12px 14px",
                borderRadius: 6,
                cursor: "grab",
                background: isSel ? "#fffcf4" : "transparent",
                boxShadow: isSel ? "0 1px 2px rgba(60,40,20,.08)" : "none",
                marginBottom: 2,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: READER_TOKENS.ink,
                    flex: 1,
                    lineHeight: 1.35,
                  }}
                >
                  {p.title}
                </div>
                {p.pinned && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill={READER_TOKENS.accent}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  >
                    <path d="M5 0L6 3.5L9.5 4L7 6.5L7.5 10L5 8L2.5 10L3 6.5L0.5 4L4 3.5Z" />
                  </svg>
                )}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: READER_TOKENS.ink3,
                  marginBottom: 4,
                }}
              >
                {p.authors} · {p.year}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: READER_TOKENS.ink3,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <span>{p.updated}</span>
                {p.unread && (
                  <span
                    style={{
                      background: READER_TOKENS.accent,
                      color: "#fffdf7",
                      fontSize: 9.5,
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: 8,
                    }}
                  >
                    {p.unread} new
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
