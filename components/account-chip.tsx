"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { READER_TOKENS } from "@/lib/paper-data";

export function AccountChip({
  name,
  email,
  onSignOut,
}: {
  name?: string | null;
  email?: string | null;
  onSignOut?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const displayName = name?.trim() || email?.split("@")[0] || "Signed in";
  const displayEmail = email ?? "";
  const firstName = displayName.split(" ")[0];
  const initial = (displayName[0] ?? "U").toUpperCase();

  return (
    <div style={{ position: "relative" }} ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px 4px 4px",
          border: `1px solid ${READER_TOKENS.rule}`,
          background: "#fffdf7",
          borderRadius: 18,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 1px 1px rgba(60,40,20,.04)",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              background: "linear-gradient(135deg, #c99a4a, #8a6a3a)",
              color: "#fffdf7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            {initial}
          </div>
          <div
            style={{
              position: "absolute",
              right: -1,
              bottom: -1,
              width: 9,
              height: 9,
              borderRadius: 5,
              background: "#2fb172",
              border: "2px solid #fffdf7",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            lineHeight: 1.1,
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: READER_TOKENS.ink,
            }}
          >
            {firstName}
          </span>
          <span
            style={{
              fontSize: 9.5,
              color: "#2fb172",
              fontWeight: 600,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            Signed in
          </span>
        </div>
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          fill="none"
          stroke={READER_TOKENS.ink3}
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M2 3.5 4.5 6 7 3.5" />
        </svg>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 50 }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 6px)",
              zIndex: 60,
              width: 260,
              background: "#fffdf7",
              border: `1px solid ${READER_TOKENS.ruleStrong}`,
              borderRadius: 8,
              boxShadow: "0 16px 40px rgba(60,40,20,.18)",
              padding: 6,
              fontFamily: READER_TOKENS.sans,
            }}
          >
            <div
              style={{
                padding: "10px 12px 12px",
                borderBottom: `1px solid ${READER_TOKENS.rule}`,
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: READER_TOKENS.ink,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </div>
              {displayEmail && (
                <div
                  style={{
                    fontSize: 11,
                    color: READER_TOKENS.ink3,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayEmail}
                </div>
              )}
              <div
                style={{
                  marginTop: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "rgba(47,177,114,.12)",
                  color: "#207d50",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: "#2fb172",
                  }}
                />
                Synced
              </div>
            </div>

            <MenuLink href="/settings" onClick={() => setOpen(false)}>
              Settings
            </MenuLink>
            <MenuItem
              onClick={() => {
                setOpen(false);
                alert(
                  "Keyboard shortcuts:\n\n⌘K — focus search\nEsc — clear search",
                );
              }}
            >
              Keyboard shortcuts
            </MenuItem>
            {onSignOut && (
              <MenuItem
                tone="danger"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
              >
                Sign out
              </MenuItem>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function itemStyle(tone: "default" | "danger" = "default"): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "8px 12px",
    fontSize: 12,
    color: tone === "danger" ? "#b04a3a" : READER_TOKENS.ink,
    borderRadius: 5,
    cursor: "pointer",
    background: "transparent",
    border: "none",
    fontFamily: "inherit",
    textDecoration: "none",
  };
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={onClick} style={itemStyle()}>
      {children}
    </Link>
  );
}

function MenuItem({
  onClick,
  tone,
  children,
}: {
  onClick: () => void;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={itemStyle(tone)}>
      {children}
    </button>
  );
}
