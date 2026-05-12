"use client";

import { Fragment, useRef, useState } from "react";
import { AskAI } from "./ask-ai";

const AIV = {
  paper: "#f6efde",
  ink: "#2a241c",
  ink2: "#5a4c3a",
  ink3: "#8a7a64",
  rule: "#c8b894",
  ruleSoft: "#e0d5bc",
  callout: "#fbf6ec",
  accent: "#b8873d",
  serif: '"Iowan Old Style","Georgia",serif',
  sans: '-apple-system,system-ui,sans-serif',
} as const;

type Hotspot = {
  id: string;
  x: number;
  y: number;
  label: string;
  title: string;
  summary: string;
  sectionId?: string;
};

type IconKind = "doc" | "phone" | "walk" | "shield" | "tee" | "clock";

type CardItem =
  | { kind: "text"; body: string }
  | { kind: "kv"; k: string; v: string }
  | { icon: IconKind; title: string; body: string };

type Card = { id: string; title: string; items: CardItem[] };

type Visual = {
  pageTitle: string;
  crumbs: string[];
  image: string;
  cards: Card[];
  hotspots: Hotspot[];
  info: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=85";

const PAPER_VISUALS: Record<string, Visual> = {
  attention: {
    pageTitle: "Visiting the Transformer",
    crumbs: ["ML Foundations", "Attention Is All You Need"],
    image:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1600&q=85",
    cards: [
      {
        id: "overview",
        title: "Overview",
        items: [
          {
            kind: "text",
            body: "Vaswani et al., 2017 · NeurIPS\nA new architecture built on attention alone\nML Foundations",
          },
        ],
      },
      {
        id: "components",
        title: "Key components",
        items: [
          {
            icon: "doc",
            title: "Encoder",
            body: "Stack of 6 layers. Reads the input sentence and produces context-aware vectors.",
          },
          {
            icon: "phone",
            title: "Decoder",
            body: "Stack of 6 layers. Generates the output, attending to encoder + its own past.",
          },
          {
            icon: "walk",
            title: "Attention",
            body: "The mechanism that lets every word look at every other word in parallel.",
          },
        ],
      },
      {
        id: "reading",
        title: "Reading time",
        items: [
          { kind: "kv", k: "Full paper", v: "45 min" },
          { kind: "kv", k: "Skim", v: "12 min" },
          { kind: "kv", k: "Just attention", v: "8 min" },
        ],
      },
      {
        id: "difficulty",
        title: "Difficulty",
        items: [
          {
            icon: "shield",
            title: "Math",
            body: "Linear algebra + softmax. No calculus needed.",
          },
          {
            icon: "tee",
            title: "Prereqs",
            body: "Embeddings, softmax, basic MLP. RNN context helpful but not required.",
          },
        ],
      },
    ],
    hotspots: [
      {
        id: "tokens",
        x: 18,
        y: 70,
        label: "Tokens",
        title: "Tokenization",
        summary:
          "The sentence is chopped into small word-pieces the model treats as atoms.",
        sectionId: "intro",
      },
      {
        id: "embed",
        x: 30,
        y: 60,
        label: "Embedding",
        title: "Embeddings + position",
        summary:
          "Each token becomes a vector. Position info is added so word order matters.",
        sectionId: "intro",
      },
      {
        id: "attention",
        x: 50,
        y: 38,
        label: "Self-attention",
        title: "Self-attention",
        summary:
          "Every word looks at every other word and decides which ones matter for understanding it.",
        sectionId: "attention",
      },
      {
        id: "multihead",
        x: 60,
        y: 50,
        label: "Multi-head",
        title: "Multi-head attention",
        summary:
          "Eight heads run in parallel — each tracks a different kind of relationship.",
        sectionId: "attention",
      },
      {
        id: "ffn",
        x: 72,
        y: 56,
        label: "Feed-forward",
        title: "Feed-forward network",
        summary:
          "A small MLP refines each position individually after attention has mixed information across positions.",
        sectionId: "attention",
      },
      {
        id: "output",
        x: 86,
        y: 68,
        label: "Output",
        title: "Decoder output",
        summary:
          "The decoder generates the target sentence one word at a time, attending to the encoder along the way.",
        sectionId: "attention",
      },
    ],
    info: "Concepts current as of 2017 publication. Architecture has since evolved (BERT, GPT, etc.).",
  },
};

const FAL_PROXY_URL = process.env.NEXT_PUBLIC_FAL_PROXY_URL ?? "";

function buildPrompt(paperTitle: string): string {
  return [
    `3D isometric hand-drawn illustration of the academic paper "${paperTitle}",`,
    "travel guidebook style, warm cream paper background,",
    "soft watercolor + pen-and-ink, gentle shading,",
    "small labeled buildings and objects representing the core concepts,",
    "leader lines pointing to elements, educational infographic,",
    "high detail, no text labels in the image itself",
  ].join(" ");
}

async function generateVisual({
  paperId,
  paperTitle,
  signal,
}: {
  paperId: string;
  paperTitle: string;
  signal: AbortSignal;
}): Promise<string> {
  if (!FAL_PROXY_URL) {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 1400);
      signal.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new Error("aborted"));
      });
    });
    return PAPER_VISUALS[paperId]?.image ?? FALLBACK_IMAGE;
  }

  const res = await fetch(FAL_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: buildPrompt(paperTitle),
      image_size: "landscape_16_9",
    }),
    signal,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: string;
      detail?: string;
    };
    throw new Error(err.detail || err.error || `proxy ${res.status}`);
  }
  const data = (await res.json()) as { image_url?: string };
  if (!data.image_url) throw new Error("no image returned");
  return data.image_url;
}

function GuideIcon({ kind, size = 14 }: { kind: IconKind; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 14 14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (kind) {
    case "doc":
      return (
        <svg {...props}>
          <path d="M3 1.5h6l2 2v9H3z" />
          <path d="M9 1.5v2h2" />
          <path d="M5 7h4M5 9.5h4" />
        </svg>
      );
    case "phone":
      return (
        <svg {...props}>
          <rect x="4" y="1.5" width="6" height="11" rx="1" />
          <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
        </svg>
      );
    case "walk":
      return (
        <svg {...props}>
          <circle cx="7.5" cy="2.5" r="1" />
          <path d="M5 7l2.5-2 2 2-1 3M5 7l-1 3M9.5 10l1 2.5M5 7v3l-1 2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M7 1.5L3 3v4c0 3 4 5.5 4 5.5S11 10 11 7V3z" />
        </svg>
      );
    case "tee":
      return (
        <svg {...props}>
          <path d="M3.5 4l1.5-1.5h4L10.5 4l-1.5 1v6.5h-4V5z" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="7" cy="7" r="5" />
          <path d="M7 4v3l2 1.5" />
        </svg>
      );
  }
}

function SideCardView({ card }: { card: Card }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontFamily: AIV.serif,
          fontSize: 18,
          fontWeight: 700,
          color: AIV.ink,
          letterSpacing: -0.1,
          marginBottom: 8,
        }}
      >
        {card.title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {card.items.map((it, i) => {
          if ("kind" in it && it.kind === "text") {
            return (
              <div
                key={i}
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.55,
                  color: AIV.ink2,
                  fontFamily: AIV.sans,
                  whiteSpace: "pre-line",
                }}
              >
                {it.body}
              </div>
            );
          }
          if ("kind" in it && it.kind === "kv") {
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  borderBottom: `1px dotted ${AIV.ruleSoft}`,
                  paddingBottom: 4,
                }}
              >
                <span style={{ fontSize: 11.5, color: AIV.ink2 }}>{it.k}</span>
                <span
                  style={{
                    fontSize: 12,
                    color: AIV.ink,
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                  }}
                >
                  {it.v}
                </span>
              </div>
            );
          }
          if ("icon" in it) {
            return (
              <div
                key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    background: AIV.callout,
                    border: `1px solid ${AIV.rule}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: AIV.ink,
                    marginTop: 1,
                  }}
                >
                  <GuideIcon kind={it.icon} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: AIV.ink,
                      marginBottom: 1,
                    }}
                  >
                    {it.title}
                  </div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.5, color: AIV.ink2 }}>
                    {it.body}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function HotspotDot({
  h,
  num,
  hovered,
  onHover,
  onClick,
}: {
  h: Hotspot;
  num: number;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onClick: (h: Hotspot) => void;
}) {
  const isOn = hovered === h.id;
  return (
    <button
      onMouseEnter={() => onHover(h.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(h)}
      aria-label={h.label}
      style={{
        position: "absolute",
        left: `${h.x}%`,
        top: `${h.y}%`,
        transform: "translate(-50%, -50%)",
        width: isOn ? 30 : 22,
        height: isOn ? 30 : 22,
        borderRadius: "50%",
        background: isOn ? AIV.accent : "rgba(255,253,247,.95)",
        border: `2px solid ${AIV.accent}`,
        boxShadow: isOn
          ? "0 0 0 6px rgba(184,135,61,.22), 0 4px 12px rgba(60,40,20,.3)"
          : "0 2px 6px rgba(60,40,20,.25)",
        color: isOn ? "#fffdf7" : AIV.accent,
        fontFamily: AIV.sans,
        fontSize: isOn ? 12 : 10.5,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all .14s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      {num}
      {isOn && (
        <span
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: AIV.ink,
            color: "#fffdf7",
            padding: "4px 9px",
            borderRadius: 3,
            whiteSpace: "nowrap",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: 0.2,
            pointerEvents: "none",
          }}
        >
          {h.label}
        </span>
      )}
    </button>
  );
}

function HotspotPanel({
  hotspot,
  paperTitle,
  onClose,
  onJump,
}: {
  hotspot: Hotspot;
  paperTitle: string;
  onClose: () => void;
  onJump?: (sectionId: string) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        width: 300,
        background: "#fffdf7",
        border: `1px solid ${AIV.rule}`,
        borderRadius: 6,
        boxShadow: "0 8px 28px rgba(60,40,20,.16)",
        fontFamily: AIV.sans,
        zIndex: 5,
        animation: "aivPop .14s ease-out",
      }}
    >
      <style>{`@keyframes aivPop { from{transform:scale(.96); opacity:0} to{transform:scale(1); opacity:1} }`}</style>
      <div
        style={{
          padding: "12px 14px 10px",
          borderBottom: `1px solid ${AIV.ruleSoft}`,
          background: AIV.callout,
          borderRadius: "6px 6px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              letterSpacing: 0.7,
              textTransform: "uppercase",
              fontWeight: 600,
              color: AIV.accent,
            }}
          >
            {hotspot.label}
          </span>
          <span style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: AIV.ink3,
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: "0 2px",
            }}
          >
            ×
          </button>
        </div>
        <h3
          style={{
            margin: "6px 0 0",
            fontFamily: AIV.serif,
            fontSize: 17,
            fontWeight: 700,
            color: AIV.ink,
          }}
        >
          {hotspot.title}
        </h3>
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.55,
            color: AIV.ink,
            marginBottom: 12,
            fontFamily: AIV.serif,
          }}
        >
          {hotspot.summary}
        </div>
        <AskAI
          context={{
            paperTitle,
            sectionTitle: hotspot.title,
            quote: hotspot.summary,
          }}
          placeholder={`Ask about ${hotspot.title.toLowerCase()}…`}
        />
        {hotspot.sectionId && onJump && (
          <button
            onClick={() => onJump(hotspot.sectionId!)}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "7px 11px",
              borderRadius: 4,
              border: `1px solid ${AIV.accent}`,
              background: "transparent",
              color: AIV.accent,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 11 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M2 5.5h7M6 2.5l3 3-3 3" />
            </svg>
            Jump to section
          </button>
        )}
      </div>
    </div>
  );
}

function GeneratingPlaceholder() {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16 / 10",
        position: "relative",
        background: AIV.paper,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 800 500"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <pattern
            id="aivIso"
            width="60"
            height="35"
            patternUnits="userSpaceOnUse"
            patternTransform="skewX(-30)"
          >
            <path
              d="M 60 0 L 0 0 0 35"
              fill="none"
              stroke={AIV.rule}
              strokeWidth="0.5"
              opacity="0.5"
            />
          </pattern>
        </defs>
        <rect width="800" height="500" fill="url(#aivIso)" />
        {[
          "M 200 350 L 350 280 L 500 350 L 500 420 L 350 490 L 200 420 Z",
          "M 350 280 L 350 200 L 500 270 L 500 350",
          "M 350 200 L 425 165 L 500 270",
          "M 540 320 L 640 270 L 720 310 L 720 380 L 640 420 L 540 380 Z",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={AIV.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="900"
            strokeDashoffset="900"
            style={{
              animation: `aivDraw 1.6s ${i * 0.22}s ease-out forwards`,
              opacity: 0.7,
            }}
          />
        ))}
        {[
          [350, 200],
          [640, 270],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="5"
            fill={AIV.accent}
            style={{
              animation: `aivPulse 1.2s ${i * 0.3}s ease-in-out infinite`,
              transformOrigin: `${x}px ${y}px`,
            }}
          />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 28,
          transform: "translateX(-50%)",
          fontFamily: AIV.sans,
          color: AIV.ink,
          background: "rgba(255,253,247,.94)",
          padding: "10px 18px",
          borderRadius: 6,
          border: `1px solid ${AIV.rule}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ display: "inline-flex", gap: 3 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: AIV.accent,
                animation: `aivBounce 1s ${i * 0.15}s ease-in-out infinite`,
              }}
            />
          ))}
        </span>
        <span
          style={{
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            color: AIV.accent,
          }}
        >
          Drawing your visual
        </span>
      </div>
      <style>{`
        @keyframes aivDraw { to { stroke-dashoffset: 0 } }
        @keyframes aivPulse { 0%,100%{transform:scale(.6); opacity:.4} 50%{transform:scale(1.1); opacity:1} }
        @keyframes aivBounce { 0%,80%,100%{opacity:.3; transform:translateY(0)} 40%{opacity:1; transform:translateY(-3px)} }
        @keyframes aivPulseBg { 0%,100%{opacity:.4} 50%{opacity:.8} }
      `}</style>
    </div>
  );
}

type State = "idle" | "loading" | "ready" | "error";

export function AIVisual({
  paperId = "attention",
  paperTitle,
  initialImageUrl,
  onJump,
}: {
  paperId?: string;
  paperTitle: string;
  initialImageUrl?: string;
  onJump?: (sectionId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [state, setState] = useState<State>(initialImageUrl ? "ready" : "idle");
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialImageUrl ?? null,
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<Hotspot | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const visual = PAPER_VISUALS[paperId];
  const hotspots = visual?.hotspots ?? [];
  const cards = visual?.cards ?? [];
  const crumbs = visual?.crumbs ?? [paperTitle];
  const pageTitle = visual?.pageTitle ?? `Visiting "${paperTitle}"`;

  const generate = async () => {
    setState("loading");
    setError("");
    setActive(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const url = await generateVisual({
        paperId,
        paperTitle,
        signal: ctrl.signal,
      });
      setImageUrl(url);
      setState("ready");
    } catch (e) {
      if ((e as Error).message !== "aborted") {
        setError("Generation failed. Try again.");
        setState("error");
      }
    }
  };

  return (
    <div
      style={{
        margin: "0 0 28px",
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${AIV.rule}`,
        background: AIV.paper,
        fontFamily: AIV.sans,
        boxShadow: "0 1px 3px rgba(60,40,20,.05)",
      }}
    >
      <div
        style={{
          background: AIV.paper,
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: `1px solid ${AIV.ruleSoft}`,
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: 5,
                background: "#d8c8a8",
              }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#fffdf7",
            border: `1px solid ${AIV.ruleSoft}`,
            padding: "5px 12px",
            borderRadius: 16,
            fontSize: 11.5,
            color: AIV.ink2,
            fontFamily: AIV.serif,
          }}
        >
          {crumbs.map((c, i, arr) => (
            <Fragment key={i}>
              <span
                style={{
                  fontWeight: i === arr.length - 1 ? 700 : 400,
                  color: i === arr.length - 1 ? AIV.ink : AIV.ink2,
                }}
              >
                {c}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: AIV.ink3, padding: "0 4px" }}>/</span>
              )}
            </Fragment>
          ))}
          <span style={{ flex: 1 }} />
          <span style={{ color: AIV.ink3, fontStyle: "italic" }}>
            Continue this session
          </span>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            background: AIV.ink,
            color: "#fffdf7",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={collapsed ? "Expand visual" : "Collapse visual"}
        >
          {collapsed ? "+" : "–"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: "20px 24px 24px" }}>
          <h2
            style={{
              margin: "0 0 16px",
              fontFamily: AIV.serif,
              fontSize: 28,
              fontWeight: 700,
              color: AIV.ink,
              letterSpacing: -0.4,
            }}
          >
            {pageTitle}
          </h2>

          {state === "idle" && (
            <div
              style={{
                padding: "36px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                minHeight: 280,
                background: "#fffdf7",
                borderRadius: 6,
                border: `1px dashed ${AIV.rule}`,
              }}
            >
              <div
                style={{
                  fontFamily: AIV.serif,
                  fontSize: 17,
                  color: AIV.ink,
                  textAlign: "center",
                  maxWidth: 480,
                  lineHeight: 1.45,
                  fontStyle: "italic",
                }}
              >
                Generate a 3D isometric guidebook view of this paper.
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: AIV.ink3,
                  textAlign: "center",
                  maxWidth: 460,
                  lineHeight: 1.5,
                }}
              >
                Components appear as buildings + objects in a hand-drawn scene.
                Numbered hotspots mark each idea — click any of them to learn more.
              </div>
              <button
                onClick={generate}
                style={{
                  marginTop: 6,
                  padding: "10px 22px",
                  borderRadius: 6,
                  border: "none",
                  background: AIV.accent,
                  color: "#fffdf7",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: 0.2,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(184,135,61,.3)",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6.5 1.5L9 4l-2.5 2.5L4 4z" />
                  <path d="M3 8L4.5 9.5M9.5 8L8 9.5M6.5 10v2" />
                </svg>
                Generate visual
              </button>
            </div>
          )}

          {state !== "idle" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                gap: 24,
              }}
            >
              <div>
                {state === "ready" &&
                  cards.map((c) => <SideCardView key={c.id} card={c} />)}
                {state === "loading" &&
                  [0, 1, 2].map((i) => (
                    <div key={i} style={{ marginBottom: 22 }}>
                      <div
                        style={{
                          height: 18,
                          width: "60%",
                          background: AIV.ruleSoft,
                          borderRadius: 3,
                          marginBottom: 10,
                          animation: `aivPulseBg 1.4s ${i * 0.1}s ease-in-out infinite`,
                        }}
                      />
                      <div
                        style={{
                          height: 11,
                          width: "90%",
                          background: AIV.ruleSoft,
                          borderRadius: 3,
                          marginBottom: 6,
                          animation: `aivPulseBg 1.4s ${i * 0.1 + 0.1}s ease-in-out infinite`,
                        }}
                      />
                      <div
                        style={{
                          height: 11,
                          width: "75%",
                          background: AIV.ruleSoft,
                          borderRadius: 3,
                          marginBottom: 6,
                          animation: `aivPulseBg 1.4s ${i * 0.1 + 0.2}s ease-in-out infinite`,
                        }}
                      />
                      <div
                        style={{
                          height: 11,
                          width: "85%",
                          background: AIV.ruleSoft,
                          borderRadius: 3,
                          animation: `aivPulseBg 1.4s ${i * 0.1 + 0.3}s ease-in-out infinite`,
                        }}
                      />
                    </div>
                  ))}
              </div>

              <div style={{ position: "relative", minHeight: 380 }}>
                {state === "loading" && <GeneratingPlaceholder />}
                {state === "ready" && imageUrl && (
                  <>
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "16 / 10",
                        position: "relative",
                        backgroundImage: `linear-gradient(rgba(246,239,222,.05), rgba(246,239,222,.18)), url(${imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        borderRadius: 4,
                        border: `1px solid ${AIV.ruleSoft}`,
                      }}
                    >
                      {hotspots.map((h, i) => (
                        <HotspotDot
                          key={h.id}
                          h={h}
                          num={i + 1}
                          hovered={hovered}
                          onHover={setHovered}
                          onClick={setActive}
                        />
                      ))}
                      {active && (
                        <HotspotPanel
                          hotspot={active}
                          paperTitle={paperTitle}
                          onClose={() => setActive(null)}
                          onJump={onJump}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 10.5,
                        color: AIV.ink3,
                        fontStyle: "italic",
                      }}
                    >
                      <span style={{ flex: 1 }}>{visual?.info}</span>
                      <button
                        onClick={generate}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 4,
                          border: `1px solid ${AIV.rule}`,
                          background: "transparent",
                          color: AIV.ink2,
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontStyle: "normal",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 11 11"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        >
                          <path d="M2 5.5a3.5 3.5 0 1 1 1 2.5M2 8V5.5h2.5" />
                        </svg>
                        Regenerate
                      </button>
                    </div>
                  </>
                )}
                {state === "error" && (
                  <div style={{ padding: 32, textAlign: "center", color: AIV.ink2 }}>
                    <div style={{ fontSize: 13, marginBottom: 12 }}>{error}</div>
                    <button
                      onClick={generate}
                      style={{
                        padding: "8px 18px",
                        borderRadius: 5,
                        border: "none",
                        background: AIV.accent,
                        color: "#fffdf7",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
