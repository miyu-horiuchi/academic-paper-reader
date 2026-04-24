"use client";

import { useEffect, useState } from "react";
import {
  PAPER,
  READER_TOKENS,
  type HighlightColor,
  type LibraryPaper,
} from "@/lib/paper-data";

export type UserNote = {
  id: string;
  sectionId: string;
  sentenceIdx: number;
  color: HighlightColor;
  text: string;
  createdAt: number;
};

type SeedHighlight = {
  id: string;
  paperId: string;
  sectionId: string;
  color: HighlightColor;
  text: string;
  note: string;
  time: string;
};

const HIGHLIGHTS: SeedHighlight[] = [
  {
    id: "h1",
    paperId: "attention",
    sectionId: "abstract",
    color: "yellow",
    text: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.",
    note: "Core claim.",
    time: "2 days ago",
  },
  {
    id: "h2",
    paperId: "attention",
    sectionId: "intro",
    color: "blue",
    text: "This inherently sequential nature precludes parallelization within training examples.",
    note: "Why RNNs don't scale.",
    time: "2 days ago",
  },
  {
    id: "h3",
    paperId: "attention",
    sectionId: "attention",
    color: "pink",
    text: "Scaled Dot-Product Attention.",
    note: "The key operation — understand the 1/√dₖ scaling.",
    time: "1 day ago",
  },
  {
    id: "h4",
    paperId: "attention",
    sectionId: "attention",
    color: "green",
    text: "Multi-Head Attention allows the model to jointly attend to information from different representation subspaces.",
    note: "",
    time: "1 day ago",
  },
  {
    id: "h5",
    paperId: "attention",
    sectionId: "results",
    color: "yellow",
    text: "a new state-of-the-art BLEU score of 28.4",
    note: "The headline result.",
    time: "5 hours ago",
  },
];

const HL_SWATCH: Record<HighlightColor, string> = {
  yellow: "rgba(247, 220, 111, 0.55)",
  blue: "rgba(139, 196, 222, 0.55)",
  pink: "rgba(232, 158, 170, 0.55)",
  green: "rgba(172, 204, 141, 0.55)",
};

function TabHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "24px 32px 16px",
        borderBottom: `1px solid ${READER_TOKENS.rule}`,
        display: "flex",
        alignItems: "flex-end",
        gap: 16,
        fontFamily: READER_TOKENS.sans,
        background: READER_TOKENS.paper,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: READER_TOKENS.serif,
            fontSize: 26,
            fontWeight: 600,
            color: READER_TOKENS.ink,
            letterSpacing: -0.3,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 12.5,
              color: READER_TOKENS.ink3,
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {right}
    </div>
  );
}

export function HighlightsView({
  library,
  onOpen,
}: {
  library: LibraryPaper[];
  onOpen?: (paperId: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | HighlightColor>("all");
  const filtered = HIGHLIGHTS.filter(
    (h) => filter === "all" || h.color === filter,
  );
  const counts: Record<HighlightColor, number> = (
    Object.keys(HL_SWATCH) as HighlightColor[]
  ).reduce(
    (acc, c) => {
      acc[c] = HIGHLIGHTS.filter((h) => h.color === c).length;
      return acc;
    },
    { yellow: 0, blue: 0, pink: 0, green: 0 } as Record<HighlightColor, number>,
  );

  const colors = Object.keys(HL_SWATCH) as HighlightColor[];
  const options: Array<{
    id: "all" | HighlightColor;
    label: string;
    n: number;
  }> = [
    { id: "all", label: "All", n: HIGHLIGHTS.length },
    ...colors.map((c) => ({
      id: c,
      label: c[0].toUpperCase() + c.slice(1),
      n: counts[c],
    })),
  ];

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: READER_TOKENS.paper,
      }}
    >
      <TabHeader
        title="Highlights"
        subtitle={`${HIGHLIGHTS.length} highlights across ${new Set(HIGHLIGHTS.map((h) => h.paperId)).size} paper`}
        right={
          <div
            style={{
              display: "flex",
              gap: 6,
              fontFamily: READER_TOKENS.sans,
            }}
          >
            {options.map((opt) => {
              const active = filter === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 5,
                    border: `1px solid ${active ? READER_TOKENS.ruleStrong : READER_TOKENS.rule}`,
                    background: active ? "#fffdf7" : "transparent",
                    cursor: "pointer",
                    fontSize: 11.5,
                    color: READER_TOKENS.ink,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "inherit",
                  }}
                >
                  {opt.id !== "all" && (
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: HL_SWATCH[opt.id],
                      }}
                    />
                  )}
                  {opt.label}
                  <span
                    style={{
                      color: READER_TOKENS.ink3,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {opt.n}
                  </span>
                </button>
              );
            })}
          </div>
        }
      />
      <div style={{ flex: 1, overflow: "auto", padding: "20px 32px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((h) => {
            const p = library.find((x) => x.id === h.paperId);
            const sec = PAPER.sections.find((s) => s.id === h.sectionId);
            return (
              <div
                key={h.id}
                onClick={() => onOpen?.(h.paperId)}
                style={{
                  background: "#fffdf7",
                  border: `1px solid ${READER_TOKENS.rule}`,
                  borderRadius: 8,
                  padding: 16,
                  cursor: "pointer",
                  fontFamily: READER_TOKENS.serif,
                  color: READER_TOKENS.ink,
                  boxShadow: "0 1px 2px rgba(60,40,20,.04)",
                }}
              >
                <div
                  style={{
                    fontFamily: READER_TOKENS.sans,
                    fontSize: 10.5,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: READER_TOKENS.ink3,
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {sec?.title ?? h.sectionId} · {p?.authors}
                  </span>
                  <span>{h.time}</span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.55 }}>
                  <span
                    style={{
                      background: HL_SWATCH[h.color],
                      padding: "1px 3px",
                      borderRadius: 2,
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                    }}
                  >
                    {h.text}
                  </span>
                </div>
                {h.note && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingLeft: 10,
                      borderLeft: `2px solid ${READER_TOKENS.accent}`,
                      fontFamily: READER_TOKENS.sans,
                      fontSize: 12,
                      color: READER_TOKENS.ink2,
                      fontStyle: "italic",
                    }}
                  >
                    {h.note}
                  </div>
                )}
                <div
                  style={{
                    marginTop: 12,
                    fontFamily: READER_TOKENS.sans,
                    fontSize: 11.5,
                    color: READER_TOKENS.ink3,
                  }}
                >
                  {p?.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type NotesEntry = {
  id: string;
  sectionId: string;
  anchorSentence?: number;
  sentenceIdx?: number;
  color: HighlightColor;
  text: string;
  seed?: boolean;
};

const SEED_NOTES: NotesEntry[] = [
  {
    id: "n1",
    sectionId: "abstract",
    anchorSentence: 2,
    color: "yellow",
    text: 'This is THE claim — "solely attention." Everything else derives from this.',
    seed: true,
  },
  {
    id: "n2",
    sectionId: "intro",
    anchorSentence: 2,
    color: "blue",
    text: "Key bottleneck = can't parallelize. Remember this when explaining to the team.",
    seed: true,
  },
  {
    id: "n3",
    sectionId: "attention",
    anchorSentence: 0,
    color: "pink",
    text: "Q/K/V mental model: dictionary lookup with fuzzy matching.",
    seed: true,
  },
];

export function NotesView({
  userNotes,
  onOpen,
}: {
  userNotes: UserNote[];
  onOpen?: (paperId: string) => void;
}) {
  const merged: NotesEntry[] = [
    ...SEED_NOTES,
    ...userNotes.map((n) => ({
      id: n.id,
      sectionId: n.sectionId,
      sentenceIdx: n.sentenceIdx,
      color: n.color,
      text: n.text,
    })),
  ];
  const [selId, setSelId] = useState(merged[0]?.id);
  const sel = merged.find((n) => n.id === selId) ?? merged[0];
  const selSec = sel
    ? PAPER.sections.find((s) => s.id === sel.sectionId)
    : null;
  const anchorIdx = sel
    ? (sel.anchorSentence ?? sel.sentenceIdx ?? 0)
    : 0;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        background: READER_TOKENS.paper,
      }}
    >
      <div
        style={{
          background: READER_TOKENS.paperDeep,
          borderRight: `1px solid ${READER_TOKENS.rule}`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: "18px 20px 10px",
            fontFamily: READER_TOKENS.sans,
            fontSize: 13,
            fontWeight: 600,
            color: READER_TOKENS.ink,
          }}
        >
          Notes{" "}
          <span
            style={{
              color: READER_TOKENS.ink3,
              fontWeight: 400,
              marginLeft: 6,
            }}
          >
            {merged.length}
          </span>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 10px 16px" }}>
          {merged.map((n) => {
            const isSel = n.id === (sel?.id ?? selId);
            const sec = PAPER.sections.find((s) => s.id === n.sectionId);
            return (
              <div
                key={n.id}
                onClick={() => setSelId(n.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: isSel ? "#fffcf4" : "transparent",
                  boxShadow: isSel ? "0 1px 2px rgba(60,40,20,.08)" : "none",
                  marginBottom: 2,
                  fontFamily: READER_TOKENS.sans,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: READER_TOKENS.ink,
                    fontWeight: 600,
                    lineHeight: 1.45,
                    marginBottom: 3,
                  }}
                >
                  {n.text.slice(0, 60)}
                  {n.text.length > 60 ? "…" : ""}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: READER_TOKENS.ink3,
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: HL_SWATCH[n.color],
                    }}
                  />
                  {sec?.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {sel && (
        <div style={{ overflow: "auto", padding: "32px 48px 48px" }}>
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
            {PAPER.title} · {selSec?.title}
          </div>
          <div
            style={{
              background: HL_SWATCH[sel.color],
              padding: "10px 14px",
              borderRadius: 6,
              fontFamily: READER_TOKENS.serif,
              fontSize: 14,
              color: READER_TOKENS.ink,
              lineHeight: 1.55,
              marginBottom: 18,
            }}
          >
            &ldquo;
            {selSec?.body[anchorIdx]?.text.replace(
              /\[\[([^\]]+)\]\]/g,
              "$1",
            )}
            &rdquo;
          </div>
          <div
            style={{
              fontFamily: READER_TOKENS.serif,
              fontSize: 16,
              lineHeight: 1.6,
              color: READER_TOKENS.ink,
              whiteSpace: "pre-wrap",
            }}
          >
            {sel.text}
          </div>
          <button
            onClick={() => onOpen?.("attention")}
            style={{
              marginTop: 28,
              padding: "7px 14px",
              borderRadius: 6,
              border: `1px solid ${READER_TOKENS.ruleStrong}`,
              background: "#fffdf7",
              cursor: "pointer",
              fontFamily: READER_TOKENS.sans,
              fontSize: 12,
              color: READER_TOKENS.ink,
            }}
          >
            Open in reader →
          </button>
        </div>
      )}
    </div>
  );
}

const GRAPH_NODES: Record<
  string,
  { x: number; y: number; r: number; label: string }
> = {
  attention: { x: 500, y: 280, r: 38, label: "Attention Is All\nYou Need" },
  bert: { x: 720, y: 160, r: 28, label: "BERT" },
  gpt3: { x: 780, y: 330, r: 30, label: "GPT-3" },
  clip: { x: 630, y: 470, r: 24, label: "CLIP" },
  diffusion: { x: 310, y: 460, r: 26, label: "Diffusion" },
  alphafold: { x: 250, y: 180, r: 24, label: "AlphaFold" },
  dqn: { x: 110, y: 330, r: 22, label: "DQN" },
  adam: { x: 390, y: 110, r: 22, label: "Adam" },
  resnet: { x: 540, y: 540, r: 24, label: "ResNet" },
};

const GRAPH_EDGES: Array<[string, string]> = [
  ["attention", "bert"],
  ["attention", "gpt3"],
  ["attention", "clip"],
  ["attention", "alphafold"],
  ["attention", "diffusion"],
  ["bert", "gpt3"],
  ["clip", "gpt3"],
  ["adam", "attention"],
  ["resnet", "clip"],
  ["dqn", "diffusion"],
];

export function GraphView({
  library,
  paperId,
  onOpen,
}: {
  library: LibraryPaper[];
  paperId: string;
  onOpen?: (paperId: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: READER_TOKENS.paper,
      }}
    >
      <TabHeader
        title="Citation graph"
        subtitle={`${library.length} papers · ${GRAPH_EDGES.length} connections`}
        right={
          <div
            style={{
              fontFamily: READER_TOKENS.sans,
              fontSize: 11.5,
              color: READER_TOKENS.ink3,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: READER_TOKENS.accent,
                }}
              />
              Current
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: "rgba(60,45,30,.35)",
                }}
              />
              In library
            </span>
          </div>
        }
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <svg
          viewBox="0 0 900 620"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <defs>
            <pattern
              id="gr-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(60,45,30,.06)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="900" height="620" fill="url(#gr-grid)" />
          {GRAPH_EDGES.map(([a, b], i) => {
            const A = GRAPH_NODES[a];
            const B = GRAPH_NODES[b];
            if (!A || !B) return null;
            const isActive =
              paperId === a ||
              paperId === b ||
              hover === a ||
              hover === b;
            return (
              <line
                key={i}
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke={isActive ? READER_TOKENS.accent : "rgba(60,45,30,.22)"}
                strokeWidth={isActive ? 1.8 : 1}
              />
            );
          })}
          {Object.entries(GRAPH_NODES).map(([id, n]) => {
            const p = library.find((x) => x.id === id);
            const isCurrent = paperId === id;
            const isHover = hover === id;
            return (
              <g
                key={id}
                onMouseEnter={() => setHover(id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onOpen?.(id)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill={isCurrent ? READER_TOKENS.accent : "#fffdf7"}
                  stroke={
                    isCurrent
                      ? READER_TOKENS.accent
                      : isHover
                        ? READER_TOKENS.accent
                        : "rgba(60,45,30,.35)"
                  }
                  strokeWidth={isHover ? 2 : 1.2}
                />
                {n.label.split("\n").map((line, i, arr) => (
                  <text
                    key={i}
                    x={n.x}
                    y={n.y + (i - (arr.length - 1) / 2) * 12 + 4}
                    textAnchor="middle"
                    fontFamily={READER_TOKENS.sans}
                    fontSize="10.5"
                    fontWeight="600"
                    fill={isCurrent ? "#fffdf7" : READER_TOKENS.ink}
                  >
                    {line}
                  </text>
                ))}
                {p && (isHover || isCurrent) && (
                  <text
                    x={n.x}
                    y={n.y + n.r + 14}
                    textAnchor="middle"
                    fontFamily={READER_TOKENS.sans}
                    fontSize="10"
                    fill={READER_TOKENS.ink3}
                  >
                    {p.authors} · {p.year}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

type TodoItem = {
  id: string;
  paperId: string | null;
  text: string;
  done: boolean;
  due: "Today" | "Tomorrow" | "This week" | "Next week" | "Someday";
};

type TodoFilter = "open" | "done" | "all";

const SEED_TODOS: TodoItem[] = [
  {
    id: "t1",
    paperId: "attention",
    text: "Re-read §3.2 Scaled Dot-Product Attention — work through the √dₖ derivation",
    done: true,
    due: "Today",
  },
  {
    id: "t2",
    paperId: "attention",
    text: "Sketch the multi-head block on paper before reading §3.2.2",
    done: false,
    due: "Today",
  },
  {
    id: "t3",
    paperId: "attention",
    text: "Compare positional encoding (§3.5) to learned embeddings — what breaks?",
    done: false,
    due: "Tomorrow",
  },
  {
    id: "t4",
    paperId: "attention",
    text: "BLEU 28.4 result (§6.1) — which baselines, which dataset?",
    done: false,
    due: "This week",
  },
  {
    id: "t5",
    paperId: "bert",
    text: "Read BERT §3: Pre-training objectives vs. Transformer",
    done: false,
    due: "This week",
  },
  {
    id: "t6",
    paperId: null,
    text: "Write a 200-word summary tying together Attention → BERT → GPT for study notes",
    done: false,
    due: "Next week",
  },
];

const BUCKETS: TodoItem["due"][] = [
  "Today",
  "Tomorrow",
  "This week",
  "Next week",
  "Someday",
];

const TODOS_STORAGE_KEY = "papers.todos.v1";
const SCRATCH_STORAGE_KEY = "papers.scratchpad.v1";

export function TodoView({
  library,
  onOpen,
}: {
  library: LibraryPaper[];
  onOpen?: (paperId: string) => void;
}) {
  const [todos, setTodos] = useState<TodoItem[]>(SEED_TODOS);
  const [filter, setFilter] = useState<TodoFilter>("open");
  const [input, setInput] = useState("");
  const [scratch, setScratch] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    try {
      const rawTodos = window.localStorage.getItem(TODOS_STORAGE_KEY);
      if (rawTodos) {
        const parsed = JSON.parse(rawTodos) as TodoItem[];
        if (Array.isArray(parsed)) setTodos(parsed);
      }
      const rawScratch = window.localStorage.getItem(SCRATCH_STORAGE_KEY);
      if (rawScratch !== null) setScratch(rawScratch);
    } catch {}

    Promise.all([
      fetch("/api/todos").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/scratchpad").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([todosRes, scratchRes]) => {
        if (cancelled) return;
        if (todosRes && Array.isArray(todosRes.todos)) {
          setTodos(todosRes.todos);
        } else if (todosRes && todosRes.todos === null) {
          setTodos(SEED_TODOS);
        }
        if (scratchRes && typeof scratchRes.text === "string") {
          setScratch(scratchRes.text);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
    } catch {}
    const t = setTimeout(() => {
      fetch("/api/todos", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ todos }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [todos, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(SCRATCH_STORAGE_KEY, scratch);
    } catch {}
    const t = setTimeout(() => {
      fetch("/api/scratchpad", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: scratch }),
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [scratch, hydrated]);

  const toggle = (id: string) =>
    setTodos((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  const remove = (id: string) =>
    setTodos((ts) => ts.filter((t) => t.id !== id));
  const add = () => {
    const v = input.trim();
    if (!v) return;
    setTodos((ts) => [
      ...ts,
      {
        id: "u" + Date.now(),
        paperId: null,
        text: v,
        done: false,
        due: "Someday",
      },
    ]);
    setInput("");
  };

  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done,
  );
  const counts = {
    open: todos.filter((t) => !t.done).length,
    done: todos.filter((t) => t.done).length,
    all: todos.length,
  };

  const grouped = BUCKETS.map(
    (b) => [b, visible.filter((t) => t.due === b)] as const,
  ).filter(([, xs]) => xs.length > 0);

  const filterChips: Array<[TodoFilter, string, number]> = [
    ["open", "Open", counts.open],
    ["done", "Done", counts.done],
    ["all", "All", counts.all],
  ];

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        background: READER_TOKENS.paper,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          borderRight: `1px solid ${READER_TOKENS.rule}`,
        }}
      >
        <TabHeader
          title="To-do"
          subtitle={`${counts.open} open · ${counts.done} done`}
          right={
            <div
              style={{ display: "flex", gap: 6, fontFamily: READER_TOKENS.sans }}
            >
              {filterChips.map(([id, label, n]) => {
                const active = filter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setFilter(id)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 5,
                      border: `1px solid ${active ? READER_TOKENS.ruleStrong : READER_TOKENS.rule}`,
                      background: active ? "#fffdf7" : "transparent",
                      cursor: "pointer",
                      fontSize: 11.5,
                      color: READER_TOKENS.ink,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "inherit",
                    }}
                  >
                    {label}
                    <span
                      style={{
                        color: READER_TOKENS.ink3,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          }
        />

        <div
          style={{
            padding: "14px 32px",
            borderBottom: `1px solid ${READER_TOKENS.rule}`,
            display: "flex",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              border: `1.5px solid ${READER_TOKENS.ink3}`,
              marginTop: 7,
              flexShrink: 0,
            }}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="Add a task…  (Enter to save)"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: READER_TOKENS.serif,
              fontSize: 15.5,
              color: READER_TOKENS.ink,
              padding: "6px 0",
            }}
          />
          {input.trim() && (
            <button
              onClick={add}
              style={{
                padding: "4px 10px",
                borderRadius: 5,
                border: "none",
                background: READER_TOKENS.accent,
                color: "#fffdf7",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: READER_TOKENS.sans,
              }}
            >
              Add
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "8px 0 40px" }}>
          {grouped.length === 0 && (
            <div
              style={{
                padding: "80px 32px",
                textAlign: "center",
                color: READER_TOKENS.ink3,
                fontFamily: READER_TOKENS.sans,
                fontSize: 13,
              }}
            >
              Nothing{" "}
              {filter === "done"
                ? "done"
                : filter === "open"
                  ? "to do"
                  : "here yet"}
              .
            </div>
          )}
          {grouped.map(([bucket, items]) => (
            <div key={bucket} style={{ marginTop: 18 }}>
              <div
                style={{
                  padding: "0 32px 8px",
                  fontFamily: READER_TOKENS.sans,
                  fontSize: 10.5,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: READER_TOKENS.ink3,
                  fontWeight: 600,
                }}
              >
                {bucket}{" "}
                <span
                  style={{
                    color: READER_TOKENS.ink3,
                    fontWeight: 400,
                    marginLeft: 4,
                  }}
                >
                  {items.length}
                </span>
              </div>
              {items.map((t) => {
                const paper = t.paperId
                  ? library.find((p) => p.id === t.paperId)
                  : null;
                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "10px 32px",
                      borderBottom: `1px solid ${READER_TOKENS.rule}`,
                    }}
                  >
                    <button
                      onClick={() => toggle(t.id)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        marginTop: 3,
                        flexShrink: 0,
                        border: `1.5px solid ${t.done ? READER_TOKENS.accent : READER_TOKENS.ink3}`,
                        background: t.done
                          ? READER_TOKENS.accent
                          : "transparent",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {t.done && (
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 11 11"
                          fill="none"
                          stroke="#fffdf7"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M2 5.5 4.5 8 9 3" />
                        </svg>
                      )}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: READER_TOKENS.serif,
                          fontSize: 15,
                          lineHeight: 1.5,
                          color: t.done
                            ? READER_TOKENS.ink3
                            : READER_TOKENS.ink,
                          textDecoration: t.done ? "line-through" : "none",
                        }}
                      >
                        {t.text}
                      </div>
                      {paper && (
                        <button
                          onClick={() => onOpen?.(paper.id)}
                          style={{
                            marginTop: 4,
                            padding: 0,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            fontFamily: READER_TOKENS.sans,
                            fontSize: 11.5,
                            color: READER_TOKENS.accent,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 9 9"
                            fill="currentColor"
                          >
                            <path d="M2 1v7l3-2 3 2V1z" />
                          </svg>
                          {paper.title}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => remove(t.id)}
                      title="Delete"
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: READER_TOKENS.ink3,
                        fontSize: 16,
                        lineHeight: 1,
                        padding: "2px 4px",
                        marginTop: 1,
                        opacity: 0.6,
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: READER_TOKENS.paperDeep,
          minHeight: 0,
        }}
      >
        <div style={{ padding: "24px 24px 12px" }}>
          <div
            style={{
              fontFamily: READER_TOKENS.serif,
              fontSize: 20,
              fontWeight: 600,
              color: READER_TOKENS.ink,
              letterSpacing: -0.2,
            }}
          >
            Scratchpad
          </div>
          <div
            style={{
              fontFamily: READER_TOKENS.sans,
              fontSize: 11.5,
              color: READER_TOKENS.ink3,
              marginTop: 2,
            }}
          >
            Loose thoughts, questions, reminders — doesn&rsquo;t belong to any
            one paper.
          </div>
        </div>
        <textarea
          value={scratch}
          onChange={(e) => setScratch(e.target.value)}
          placeholder={
            "e.g. Questions to come back to\n- does causal masking apply to encoder?\n- why is d_model = 512?"
          }
          style={{
            flex: 1,
            margin: "0 24px 24px",
            border: `1px solid ${READER_TOKENS.rule}`,
            borderRadius: 6,
            padding: "14px 16px",
            resize: "none",
            outline: "none",
            background: "#fffdf7",
            color: READER_TOKENS.ink,
            fontFamily: READER_TOKENS.serif,
            fontSize: 14.5,
            lineHeight: 1.6,
          }}
        />
        <div
          style={{
            padding: "0 24px 20px",
            fontFamily: READER_TOKENS.sans,
            fontSize: 11,
            color: READER_TOKENS.ink3,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Autosaves locally</span>
          <span>{scratch.length} chars</span>
        </div>
      </div>
    </div>
  );
}

type Deadline = {
  id: string;
  name: string;
  date: string;
  link: string;
  note: string;
};

const SEED_DEADLINES: Deadline[] = [
  {
    id: "d1",
    name: "NeurIPS 2026 paper submission",
    date: "2026-05-15",
    link: "https://neurips.cc/Conferences/2026/CallForPapers",
    note: "Full paper + supplementary",
  },
  {
    id: "d2",
    name: "ICLR camera-ready",
    date: "2026-05-01",
    link: "https://openreview.net",
    note: "Address reviewer 3 comments",
  },
  {
    id: "d3",
    name: "Advisor meeting · Ch. 3 draft",
    date: "2026-04-28",
    link: "",
    note: "Bring attention analysis",
  },
  {
    id: "d4",
    name: "CVPR workshop proposal",
    date: "2026-06-10",
    link: "https://cvpr.thecvf.com",
    note: "",
  },
  {
    id: "d5",
    name: "Thesis proposal defense",
    date: "2026-07-22",
    link: "",
    note: "Committee: AS, LW, MK",
  },
];

type DateParts = { full: string; rel: string; days: number };

function fmtDateParts(iso: string): DateParts {
  if (!iso) return { full: "—", rel: "", days: Number.POSITIVE_INFINITY };
  const d = new Date(iso + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  const full = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  let rel = "";
  if (days < 0) rel = `${Math.abs(days)}d overdue`;
  else if (days === 0) rel = "Today";
  else if (days === 1) rel = "Tomorrow";
  else if (days < 14) rel = `in ${days} days`;
  else rel = `in ${Math.round(days / 7)} wk`;
  return { full, rel, days };
}

type SortKey = keyof Deadline;
type Editing = { id: string; field: keyof Deadline } | null;

const DEADLINES_STORAGE_KEY = "papers.deadlines.v1";

export function DeadlinesView() {
  const [rows, setRows] = useState<Deadline[]>(SEED_DEADLINES);
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editing, setEditing] = useState<Editing>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    try {
      const rawRows = window.localStorage.getItem(DEADLINES_STORAGE_KEY);
      if (rawRows) {
        const parsed = JSON.parse(rawRows) as Deadline[];
        if (Array.isArray(parsed)) setRows(parsed);
      }
    } catch {}

    fetch("/api/deadlines")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.rows)) {
          setRows(data.rows);
        } else if (data && data.rows === null) {
          setRows(SEED_DEADLINES);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(DEADLINES_STORAGE_KEY, JSON.stringify(rows));
    } catch {}
    const t = setTimeout(() => {
      fetch("/api/deadlines", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [rows, hydrated]);

  const toggleSort = (k: SortKey) => {
    if (sortBy === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(k);
      setSortDir("asc");
    }
  };

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortBy] ?? "";
    const bv = b[sortBy] ?? "";
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const update = (id: string, field: keyof Deadline, v: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: v } : r)));
  const remove = (id: string) =>
    setRows((rs) => rs.filter((r) => r.id !== id));
  const addRow = () => {
    const id = "d" + Date.now();
    setRows((rs) => [
      ...rs,
      { id, name: "", date: "", link: "", note: "" },
    ]);
    setEditing({ id, field: "name" });
  };

  const cols: { id: SortKey; label: string; width: string }[] = [
    { id: "name", label: "Name", width: "34%" },
    { id: "date", label: "Deadline", width: "22%" },
    { id: "link", label: "Link", width: "24%" },
    { id: "note", label: "Notes", width: "20%" },
  ];

  const withinWeek = rows.filter((r) => {
    const p = fmtDateParts(r.date);
    return p.days >= 0 && p.days <= 7;
  }).length;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: READER_TOKENS.paper,
      }}
    >
      <TabHeader
        title="Deadlines"
        subtitle={`${rows.length} tracked · ${withinWeek} within a week`}
        right={
          <button
            onClick={addRow}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              background: READER_TOKENS.accent,
              color: "#fffdf7",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: READER_TOKENS.sans,
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
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <line x1="5.5" y1="1.5" x2="5.5" y2="9.5" />
              <line x1="1.5" y1="5.5" x2="9.5" y2="5.5" />
            </svg>
            Add deadline
          </button>
        }
      />
      <div style={{ flex: 1, overflow: "auto", padding: "0 32px 40px" }}>
        <div
          style={{
            marginTop: 16,
            border: `1px solid ${READER_TOKENS.ruleStrong}`,
            borderRadius: 8,
            overflow: "hidden",
            background: "#fffdf7",
            boxShadow: "0 1px 2px rgba(60,40,20,.04)",
            fontFamily: READER_TOKENS.sans,
          }}
        >
          <div
            style={{
              display: "flex",
              background: READER_TOKENS.paperDeep,
              borderBottom: `1px solid ${READER_TOKENS.ruleStrong}`,
            }}
          >
            {cols.map((c) => (
              <div
                key={c.id}
                onClick={() => toggleSort(c.id)}
                style={{
                  width: c.width,
                  padding: "9px 14px",
                  borderRight: `1px solid ${READER_TOKENS.rule}`,
                  fontSize: 10.5,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: READER_TOKENS.ink3,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  userSelect: "none",
                }}
              >
                {c.label}
                {sortBy === c.id && (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    style={{ marginLeft: 3 }}
                    fill="currentColor"
                  >
                    <path
                      d={
                        sortDir === "asc"
                          ? "M4 1.5 L7 5.5 H1 Z"
                          : "M4 6.5 L1 2.5 H7 Z"
                      }
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {sorted.map((r, rowIdx) => {
            const parts = fmtDateParts(r.date);
            const isOverdue = parts.days < 0 && parts.days !== Number.POSITIVE_INFINITY;
            const isSoon = parts.days >= 0 && parts.days <= 7;
            const alt = rowIdx % 2 !== 0;
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  minHeight: 38,
                  borderBottom: `1px solid ${READER_TOKENS.rule}`,
                  background: alt ? "rgba(60,45,30,.02)" : "transparent",
                  position: "relative",
                }}
              >
                <DeadlineCell
                  width={cols[0].width}
                  editing={editing?.id === r.id && editing?.field === "name"}
                  value={r.name}
                  placeholder="Untitled"
                  onEdit={() => setEditing({ id: r.id, field: "name" })}
                  onSave={(v) => {
                    update(r.id, "name", v);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                  renderValue={(v) => (
                    <span
                      style={{
                        fontWeight: 500,
                        color: READER_TOKENS.ink,
                        fontFamily: READER_TOKENS.serif,
                        fontSize: 13.5,
                      }}
                    >
                      {v || (
                        <span
                          style={{
                            color: READER_TOKENS.ink3,
                            fontStyle: "italic",
                          }}
                        >
                          Untitled
                        </span>
                      )}
                    </span>
                  )}
                />
                <DeadlineCell
                  width={cols[1].width}
                  editing={editing?.id === r.id && editing?.field === "date"}
                  value={r.date}
                  type="date"
                  onEdit={() => setEditing({ id: r.id, field: "date" })}
                  onSave={(v) => {
                    update(r.id, "date", v);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                  renderValue={() => (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12.5,
                          color: READER_TOKENS.ink,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {parts.full}
                      </span>
                      {parts.rel && (
                        <span
                          style={{
                            padding: "1px 7px",
                            borderRadius: 9,
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: 0.3,
                            background: isOverdue
                              ? "rgba(176,74,58,.14)"
                              : isSoon
                                ? "rgba(201,154,74,.18)"
                                : "rgba(60,45,30,.08)",
                            color: isOverdue
                              ? "#b04a3a"
                              : isSoon
                                ? "#8a6a1a"
                                : READER_TOKENS.ink3,
                          }}
                        >
                          {parts.rel}
                        </span>
                      )}
                    </div>
                  )}
                />
                <DeadlineCell
                  width={cols[2].width}
                  editing={editing?.id === r.id && editing?.field === "link"}
                  value={r.link}
                  placeholder="https://…"
                  onEdit={() => setEditing({ id: r.id, field: "link" })}
                  onSave={(v) => {
                    update(r.id, "link", v);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                  renderValue={(v) =>
                    v ? (
                      <a
                        href={v}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: READER_TOKENS.accent,
                          fontSize: 12.5,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        >
                          <path d="M4.5 2.5H2v5.5h5.5V5.5M6 1.5h2.5V4M4.5 5.5 8.5 1.5" />
                        </svg>
                        {(() => {
                          try {
                            return new URL(v).hostname.replace(/^www\./, "");
                          } catch {
                            return v;
                          }
                        })()}
                      </a>
                    ) : (
                      <span
                        style={{
                          color: READER_TOKENS.ink3,
                          fontSize: 12,
                          fontStyle: "italic",
                        }}
                      >
                        —
                      </span>
                    )
                  }
                />
                <DeadlineCell
                  width={cols[3].width}
                  last
                  editing={editing?.id === r.id && editing?.field === "note"}
                  value={r.note}
                  placeholder="Add note"
                  onEdit={() => setEditing({ id: r.id, field: "note" })}
                  onSave={(v) => {
                    update(r.id, "note", v);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                  renderValue={(v) => (
                    <span
                      style={{
                        color: v ? READER_TOKENS.ink2 : READER_TOKENS.ink3,
                        fontSize: 12,
                        fontStyle: v ? "normal" : "italic",
                      }}
                    >
                      {v || "Add note"}
                    </span>
                  )}
                />
                <button
                  onClick={() => remove(r.id)}
                  title="Delete row"
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: READER_TOKENS.ink3,
                    fontSize: 15,
                    lineHeight: 1,
                    opacity: 0.45,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}

          <div
            onClick={addRow}
            style={{
              padding: "10px 14px",
              fontSize: 12,
              color: READER_TOKENS.ink3,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add deadline
          </div>
        </div>
      </div>
    </div>
  );
}

function DeadlineCell({
  width,
  editing,
  value,
  type = "text",
  placeholder,
  onEdit,
  onSave,
  onCancel,
  renderValue,
  last,
}: {
  width: string;
  editing: boolean;
  value: string;
  type?: string;
  placeholder?: string;
  onEdit: () => void;
  onSave: (v: string) => void;
  onCancel: () => void;
  renderValue: (v: string) => React.ReactNode;
  last?: boolean;
}) {
  const [draft, setDraft] = useState(value || "");
  useEffect(() => {
    if (editing) setDraft(value || "");
  }, [editing, value]);

  return (
    <div
      onClick={() => !editing && onEdit()}
      style={{
        width,
        padding: "8px 14px",
        borderRight: last ? "none" : `1px solid ${READER_TOKENS.rule}`,
        display: "flex",
        alignItems: "center",
        cursor: editing ? "text" : "cell",
        background: editing ? "#fffbf0" : "transparent",
        outline: editing ? `2px solid ${READER_TOKENS.accent}` : "none",
        outlineOffset: -2,
      }}
    >
      {editing ? (
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave(draft);
            if (e.key === "Escape") onCancel();
          }}
          onBlur={() => onSave(draft)}
          placeholder={placeholder}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            outline: "none",
            fontFamily: "inherit",
            fontSize: 13,
            color: READER_TOKENS.ink,
            padding: 0,
          }}
        />
      ) : (
        renderValue(value)
      )}
    </div>
  );
}
