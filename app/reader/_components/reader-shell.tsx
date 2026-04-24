"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  FOLDERS,
  READER_TOKENS,
  type FolderKey,
  type Level,
} from "@/lib/paper-data";
import Link from "next/link";
import { PapersIcon } from "@/components/papers-icon";
import { AccountChip } from "@/components/account-chip";
import { PaperReader } from "./paper-reader";
import { Sidebar, LibraryList } from "./library-panes";
import { AddPaperModal } from "./add-paper-modal";
import { useLibrary } from "./use-library";
import {
  DeadlinesView,
  GraphView,
  HighlightsView,
  NotesView,
  TodoView,
  type UserNote,
} from "./tab-views";

type TabKey =
  | "Library"
  | "Highlights"
  | "Notes"
  | "Graph"
  | "To-do"
  | "Deadlines";

function folderName(
  id: FolderKey | string,
  aiFolders: { id: string; name: string }[] = [],
): string {
  const f = FOLDERS.find(
    (entry) => entry.type !== "divider" && entry.id === id,
  );
  if (f && f.type !== "divider") return f.name;
  const ai = aiFolders.find((x) => x.id === id);
  return ai?.name ?? "Pinned";
}

function CollapseToggle({
  onClick,
  side = "left",
  label,
}: {
  collapsed: boolean;
  onClick: () => void;
  side?: "left" | "right";
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 26,
        height: 26,
        borderRadius: 5,
        border: "none",
        background: "transparent",
        color: READER_TOKENS.ink3,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background .12s, color .12s",
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
      <svg
        width="13"
        height="13"
        viewBox="0 0 13 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1.5" y="2.5" width="10" height="8" rx="1.2" />
        <line x1={side === "left" ? "4.5" : "8.5"} y1="2.5" x2={side === "left" ? "4.5" : "8.5"} y2="10.5" />
      </svg>
    </button>
  );
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


function TopBar({
  tab,
  setTab,
  onNewPaper,
  userName,
  userEmail,
  onSignOut,
  query,
  setQuery,
  searchInputRef,
}: {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  onNewPaper: () => void;
  userName?: string | null;
  userEmail?: string | null;
  onSignOut?: () => void;
  query: string;
  setQuery: (q: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}) {
  const tabs: TabKey[] = [
    "Library",
    "Highlights",
    "Notes",
    "Graph",
    "To-do",
    "Deadlines",
  ];
  return (
    <div
      style={{
        height: 52,
        flexShrink: 0,
        background: READER_TOKENS.paper,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 20px",
        borderBottom: `1px solid ${READER_TOKENS.rule}`,
        fontFamily: READER_TOKENS.sans,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: READER_TOKENS.serif,
          fontSize: 18,
          fontWeight: 600,
          color: READER_TOKENS.ink,
          letterSpacing: -0.3,
        }}
      >
        <PapersIcon size={20} />
        Papers
      </div>
      <nav style={{ display: "flex", gap: 2, marginLeft: 12 }}>
        {tabs.map((label) => {
          const active = tab === label;
          return (
            <button
              key={label}
              onClick={() => setTab(label)}
              style={{
                padding: "6px 12px",
                borderRadius: 5,
                fontSize: 12.5,
                fontWeight: active ? 600 : 500,
                color: active ? READER_TOKENS.ink : READER_TOKENS.ink2,
                background: active ? READER_TOKENS.accentSoft : "transparent",
                cursor: "pointer",
                border: "none",
                fontFamily: "inherit",
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(60,45,30,.06)",
          padding: "6px 12px",
          borderRadius: 18,
          fontSize: 12,
          color: READER_TOKENS.ink3,
          width: 260,
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="5" cy="5" r="3.5" />
          <path d="M10.5 10.5l-3-3" />
        </svg>
        <input
          ref={searchInputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your library"
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12,
            color: READER_TOKENS.ink,
            fontFamily: "inherit",
            padding: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            padding: "1px 5px",
            background: "rgba(60,45,30,.06)",
            borderRadius: 3,
            color: READER_TOKENS.ink3,
          }}
        >
          ⌘K
        </span>
      </label>
      <button
        onClick={onNewPaper}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          background: READER_TOKENS.accent,
          border: "none",
          color: "#fffdf7",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "inherit",
        }}
      >
        <AddPaperIcon /> New
      </button>
      <Link
        href="/settings"
        title="AI provider settings"
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: READER_TOKENS.ink3,
          textDecoration: "none",
          border: `1px solid ${READER_TOKENS.rule}`,
          background: "transparent",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="7" cy="7" r="2" />
          <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.76 2.76l1.41 1.41M9.83 9.83l1.41 1.41M2.76 11.24l1.41-1.41M9.83 4.17l1.41-1.41" />
        </svg>
      </Link>
      <AccountChip
        name={userName}
        email={userEmail}
        onSignOut={onSignOut}
      />
    </div>
  );
}

export function ReaderShell({
  userName,
  userEmail,
  signOutAction,
}: {
  userName?: string | null;
  userEmail?: string | null;
  signOutAction?: () => Promise<void>;
}) {
  const lib = useLibrary();
  const level: Level = "beginner";
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [listOpen, setListOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("Library");
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setQuery("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openInReader = (paperId: string) => {
    lib.setPaperId(paperId);
    setTab("Library");
  };

  const cols = [
    foldersOpen ? "220px" : "0px",
    listOpen ? "280px" : "0px",
    "1fr",
  ].join(" ");

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: READER_TOKENS.paper,
      }}
    >
      <TopBar
        tab={tab}
        setTab={setTab}
        onNewPaper={() => setAddOpen(true)}
        userName={userName}
        userEmail={userEmail}
        onSignOut={signOutAction ? () => void signOutAction() : undefined}
        query={query}
        setQuery={setQuery}
        searchInputRef={searchInputRef}
      />

      {tab === "Library" && (
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: cols,
            transition: "grid-template-columns .28s cubic-bezier(.2,.7,.3,1)",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ overflow: "hidden", minHeight: 0 }}>
            <div style={{ width: 220, height: "100%" }}>
              <Sidebar
                library={lib.library}
                selected={lib.folderId}
                onSelect={(id) => lib.setFolderId(id)}
                dragging={lib.dragging}
                flashFolder={lib.flashFolder}
                onDropOnFolder={(pid, fid) => lib.handleDrop(pid, fid)}
                aiFolders={lib.aiFolders}
                onAcceptAiFolder={lib.acceptAiFolder}
                onRemoveAiFolder={lib.removeAiFolder}
              />
            </div>
          </div>

          <div
            style={{
              overflow: "hidden",
              minHeight: 0,
              borderRight: listOpen ? `1px solid ${READER_TOKENS.rule}` : "none",
            }}
          >
            <div
              style={{
                width: 280,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: READER_TOKENS.paperDeep,
              }}
            >
              <div
                style={{
                  height: 40,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 10px",
                  fontFamily: READER_TOKENS.sans,
                  borderBottom: `1px solid ${READER_TOKENS.rule}`,
                }}
              >
                <CollapseToggle
                  collapsed={!foldersOpen}
                  onClick={() => setFoldersOpen((o) => !o)}
                  side="left"
                  label={foldersOpen ? "Hide sidebar" : "Show sidebar"}
                />
                <div
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: READER_TOKENS.ink,
                    letterSpacing: -0.1,
                  }}
                >
                  {folderName(lib.folderId, lib.aiFolders)}
                </div>
                <button
                  onClick={() => setAddOpen(true)}
                  title="New paper"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 5,
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
                  query={query}
                  aiFolders={lib.aiFolders}
                />
              </div>
            </div>
          </div>

          <div style={{ position: "relative", overflow: "hidden", minHeight: 0 }}>
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 12,
                zIndex: 20,
                display: "flex",
                gap: 4,
                background: "rgba(250,247,242,.75)",
                backdropFilter: "blur(8px)",
                padding: 3,
                borderRadius: 7,
              }}
            >
              {!foldersOpen && !listOpen && (
                <CollapseToggle
                  collapsed
                  onClick={() => setFoldersOpen(true)}
                  side="left"
                  label="Show folders"
                />
              )}
              <CollapseToggle
                collapsed={!listOpen}
                onClick={() => setListOpen((o) => !o)}
                side="left"
                label={listOpen ? "Hide papers list" : "Show papers list"}
              />
            </div>
            <PaperReader
              level={level}
              paperId={lib.paperId}
              onImport={() => setAddOpen(true)}
              onSaveNote={(note) => setUserNotes((prev) => [...prev, note])}
            />
            <AddPaperModal open={addOpen} onClose={() => setAddOpen(false)} />
          </div>
        </div>
      )}

      {tab === "Highlights" && (
        <HighlightsView library={lib.library} onOpen={openInReader} />
      )}
      {tab === "Notes" && (
        <NotesView userNotes={userNotes} onOpen={openInReader} />
      )}
      {tab === "Graph" && (
        <GraphView
          library={lib.library}
          paperId={lib.paperId}
          onOpen={openInReader}
        />
      )}
      {tab === "To-do" && (
        <TodoView library={lib.library} onOpen={openInReader} />
      )}
      {tab === "Deadlines" && <DeadlinesView />}
    </div>
  );
}
