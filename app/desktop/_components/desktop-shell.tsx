"use client";

import { useState } from "react";
import {
  FOLDERS,
  LEVELS,
  READER_TOKENS,
  type FolderKey,
  type Level,
} from "@/lib/paper-data";
import { PaperReader } from "@/app/reader/_components/paper-reader";
import {
  Sidebar,
  LibraryList,
} from "@/app/reader/_components/library-panes";
import { PapersIcon } from "@/components/papers-icon";
import { AddPaperModal } from "@/app/reader/_components/add-paper-modal";
import { useLibrary } from "@/app/reader/_components/use-library";
import type { UserNote } from "@/app/reader/_components/tab-views";

function folderName(id: FolderKey): string {
  const f = FOLDERS.find((entry) => entry.type !== "divider" && entry.id === id);
  return f && f.type !== "divider" ? f.name : "Pinned";
}

function AddPaperIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <line x1="6.5" y1="2.5" x2="6.5" y2="10.5" />
      <line x1="2.5" y1="6.5" x2="10.5" y2="6.5" />
    </svg>
  );
}

function TrafficLight({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: 6,
        background: color,
        border: ".5px solid rgba(0,0,0,.15)",
      }}
    />
  );
}

function ToolbarIconButton({
  onClick,
  active = false,
  title,
  children,
}: {
  onClick?: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 26,
        border: "none",
        background: active ? "rgba(60,45,30,.1)" : "transparent",
        borderRadius: 5,
        cursor: "pointer",
        color: READER_TOKENS.ink2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!active)
          e.currentTarget.style.background = "rgba(60,45,30,.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active
          ? "rgba(60,45,30,.1)"
          : "transparent";
      }}
    >
      {children}
    </button>
  );
}

function SidebarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h8M2 6h8M2 9h6" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2.5" width="8" height="7" rx="1" />
      <path d="M4.5 2.5v7" />
    </svg>
  );
}

function ReadingLevelControl({
  level,
  setLevel,
}: {
  level: Level;
  setLevel: (l: Level) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "rgba(60,45,30,.06)",
        padding: 2,
        borderRadius: 6,
        fontFamily: READER_TOKENS.sans,
      }}
    >
      {LEVELS.map((l) => {
        const active = l === level;
        return (
          <button
            key={l}
            onClick={() => setLevel(l)}
            style={{
              border: "none",
              background: active ? "#fffdf7" : "transparent",
              color: active ? READER_TOKENS.ink : READER_TOKENS.ink2,
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: 10.5,
              fontWeight: active ? 600 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: active ? "0 1px 1px rgba(60,40,20,.06)" : "none",
              textTransform: "capitalize",
              letterSpacing: 0.1,
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

function SystemMenubar({ userEmail, onSignOut }: {
  userEmail?: string | null;
  onSignOut?: () => void;
}) {
  // Static clock like the design — this is a visual shell, not a real clock.
  const clock = "Tue 4:28 PM";
  return (
    <div
      style={{
        height: 22,
        flexShrink: 0,
        background: "rgba(250,247,242,.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 14px",
        fontFamily: READER_TOKENS.sans,
        fontSize: 12,
        color: READER_TOKENS.ink,
        borderBottom: "1px solid rgba(0,0,0,.04)",
      }}
    >
      <PapersIcon size={14} />
      <strong>Papers</strong>
      <span>File</span>
      <span>Edit</span>
      <span>View</span>
      <span>Paper</span>
      <span>Annotate</span>
      <span>Window</span>
      <span>Help</span>
      <div style={{ flex: 1 }} />
      {onSignOut && (
        <button
          onClick={onSignOut}
          title={userEmail ?? "Sign out"}
          style={{
            background: "transparent",
            border: "none",
            padding: "0 4px",
            color: READER_TOKENS.ink2,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {userEmail ?? "Sign out"}
        </button>
      )}
      <span style={{ color: READER_TOKENS.ink3 }}>{clock}</span>
    </div>
  );
}

export function DesktopShell({
  userEmail,
  signOutAction,
}: {
  userEmail?: string | null;
  signOutAction?: () => Promise<void>;
}) {
  const lib = useLibrary();
  const [level, setLevel] = useState<Level>("beginner");
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [listOpen, setListOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  // Collected but not rendered here — the desktop shell intentionally skips
  // the Notes/Highlights/Graph tab views that exist in the reader shell.
  const [, setUserNotes] = useState<UserNote[]>([]);

  const paper = lib.paper;
  // LibraryPaper has no page count field; derive a stable fake from id length
  // so the subtitle matches the design's "authors · page count · folder" shape.
  const pageCount = 8 + (paper.id.length % 16);

  const cols = [
    foldersOpen ? "200px" : "0px",
    listOpen ? "260px" : "0px",
    "1fr",
  ].join(" ");

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #e8e0d0 0%, #d8ccb4 100%)",
      }}
    >
      <SystemMenubar
        userEmail={userEmail}
        onSignOut={signOutAction ? () => void signOutAction() : undefined}
      />

      {/* Floating app window centered in the warm gradient */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: "28px 32px 40px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            maxWidth: 1180,
            height: "100%",
            borderRadius: 10,
            overflow: "hidden",
            background: READER_TOKENS.paper,
            display: "flex",
            flexDirection: "column",
            boxShadow:
              "0 0 0 1px rgba(0,0,0,.18), 0 20px 60px rgba(0,0,0,.22)",
          }}
        >
          {/* Unified title bar + toolbar */}
          <div
            style={{
              height: 52,
              flexShrink: 0,
              background: "linear-gradient(180deg, #f0e9db, #e8ddc8)",
              borderBottom: `1px solid ${READER_TOKENS.ruleStrong}`,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              gap: 12,
              fontFamily: READER_TOKENS.sans,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <TrafficLight color="#ff5f57" />
              <TrafficLight color="#febc2e" />
              <TrafficLight color="#28c840" />
            </div>

            <div style={{ display: "flex", gap: 2, marginLeft: 8 }}>
              <ToolbarIconButton
                title={foldersOpen ? "Hide sidebar" : "Show sidebar"}
                active={foldersOpen}
                onClick={() => setFoldersOpen((o) => !o)}
              >
                <SidebarIcon />
              </ToolbarIconButton>
              <ToolbarIconButton
                title={listOpen ? "Hide papers list" : "Show papers list"}
                active={listOpen}
                onClick={() => setListOpen((o) => !o)}
              >
                <ListIcon />
              </ToolbarIconButton>
            </div>

            <div
              style={{
                width: 1,
                height: 20,
                background: READER_TOKENS.ruleStrong,
                margin: "0 4px",
              }}
            />

            <button
              onClick={() => setAddOpen(true)}
              style={{
                padding: "5px 10px",
                border: `1px solid ${READER_TOKENS.ruleStrong}`,
                background: "#fffdf7",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 500,
                color: READER_TOKENS.ink,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 1px 1px rgba(0,0,0,.04)",
              }}
            >
              <AddPaperIcon /> New paper
            </button>

            <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: READER_TOKENS.ink,
                  letterSpacing: -0.1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {paper.title}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: READER_TOKENS.ink3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {paper.authors} · {pageCount} pp · {paper.folder}
              </div>
            </div>

            <ReadingLevelControl level={level} setLevel={setLevel} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#fffdf7",
                border: `1px solid ${READER_TOKENS.ruleStrong}`,
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: 11.5,
                color: READER_TOKENS.ink3,
                width: 200,
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <circle cx="4.5" cy="4.5" r="3" />
                <path d="M9.5 9.5l-2.5-2.5" />
              </svg>
              Search
              <div style={{ flex: 1 }} />
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 5px",
                  background: "rgba(60,45,30,.06)",
                  borderRadius: 3,
                  color: READER_TOKENS.ink3,
                }}
              >
                ⌘F
              </span>
            </div>
          </div>

          {/* Reader body: three-pane grid */}
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: cols,
              transition:
                "grid-template-columns .28s cubic-bezier(.2,.7,.3,1)",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div style={{ minHeight: 0, overflow: "hidden" }}>
              <div style={{ width: 200, height: "100%" }}>
                <Sidebar
                  library={lib.library}
                  selected={lib.folderId}
                  onSelect={(id) => lib.setFolderId(id)}
                  dragging={lib.dragging}
                  flashFolder={lib.flashFolder}
                  onDropOnFolder={(pid, fid) => lib.handleDrop(pid, fid)}
                  compact
                />
              </div>
            </div>

            <div
              style={{
                minHeight: 0,
                overflow: "hidden",
                borderRight: listOpen
                  ? `1px solid ${READER_TOKENS.rule}`
                  : "none",
                background: READER_TOKENS.paperDeep,
              }}
            >
              <div
                style={{
                  width: 260,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    height: 36,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 12px",
                    fontFamily: READER_TOKENS.sans,
                    borderBottom: `1px solid ${READER_TOKENS.rule}`,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: READER_TOKENS.ink,
                    letterSpacing: -0.1,
                  }}
                >
                  <span style={{ flex: 1 }}>{folderName(lib.folderId)}</span>
                  <button
                    onClick={() => setAddOpen(true)}
                    title="New paper"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      border: "none",
                      background: "transparent",
                      color: READER_TOKENS.ink3,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(60,45,30,.08)";
                      e.currentTarget.style.color = READER_TOKENS.ink;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = READER_TOKENS.ink3;
                    }}
                  >
                    <AddPaperIcon />
                  </button>
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <LibraryList
                    library={lib.library}
                    folderId={lib.folderId}
                    selected={lib.paperId}
                    onSelect={(id) => lib.setPaperId(id)}
                    onDragPaper={(_id, d) => lib.setDragging(d)}
                    compact
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                position: "relative",
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              <PaperReader
                level={level}
                paperId={lib.paperId}
                onImport={() => setAddOpen(true)}
                onSaveNote={(note) =>
                  setUserNotes((prev) => [...prev, note])
                }
              />
              <AddPaperModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
