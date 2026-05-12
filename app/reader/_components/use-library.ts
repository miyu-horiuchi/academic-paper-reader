"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FOLDER_DROP,
  LIBRARY,
  type FolderKey,
  type LibraryPaper,
  type Paper,
} from "@/lib/paper-data";
import type { AiFolder } from "@/lib/ai-folders";
import type { AiSettings } from "@/lib/ai-settings";

type IngestStatus = "loading" | "error";

type IngestPayload = {
  title: string;
  authors: string;
  year: string | null;
  venue: string | null;
  abstract: string | null;
  url: string;
  source: "arxiv" | "biorxiv" | "medrxiv" | "doi" | "url";
};

export function useLibrary(
  initialPaperId = "attention",
  initialFolderId: FolderKey = "pinned",
) {
  const [library, setLibrary] = useState<LibraryPaper[]>(LIBRARY);
  const [paperId, setPaperId] = useState(initialPaperId);
  const [folderId, setFolderId] = useState<FolderKey | string>(initialFolderId);
  const [dragging, setDragging] = useState(false);
  const [flashFolder, setFlashFolder] = useState<FolderKey | null>(null);
  const [aiFolders, setAiFolders] = useState<AiFolder[]>([]);
  const [aiHydrated, setAiHydrated] = useState(false);
  const [paperContent, setPaperContent] = useState<Record<string, Paper>>({});
  const [ingestStatus, setIngestStatus] = useState<Record<string, IngestStatus>>(
    {},
  );
  const [pendingIngest, setPendingIngest] = useState<
    Record<string, IngestPayload>
  >({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai-folders")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.folders)) {
          setAiFolders(data.folders);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAiHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!aiHydrated) return;
    const t = setTimeout(() => {
      fetch("/api/ai-folders", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ folders: aiFolders }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [aiFolders, aiHydrated]);

  const handleDrop = useCallback((pid: string, fid: FolderKey) => {
    const transform = FOLDER_DROP[fid];
    if (!transform) return;
    setLibrary((lib) => lib.map((p) => (p.id === pid ? transform(p) : p)));
    setFlashFolder(fid);
    setTimeout(
      () => setFlashFolder((f) => (f === fid ? null : f)),
      700,
    );
  }, []);

  const acceptAiFolder = useCallback((folder: AiFolder) => {
    setAiFolders((prev) =>
      prev.some((f) => f.name === folder.name) ? prev : [...prev, folder],
    );
  }, []);

  const removeAiFolder = useCallback((id: string) => {
    setAiFolders((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const removePaper = useCallback((id: string) => {
    setLibrary((lib) => {
      const next = lib.filter((p) => p.id !== id);
      setPaperId((current) => {
        if (current !== id) return current;
        return next[0]?.id ?? "";
      });
      return next;
    });
    setPaperContent((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setIngestStatus((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPendingIngest((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const addPaper = useCallback(
    (
      payload: IngestPayload,
    ): { id: string; payload: IngestPayload } => {
      const id = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const yearNum = Number.parseInt(payload.year ?? "", 10);
      const tagBySource: Record<typeof payload.source, string> = {
        arxiv: "arxiv",
        biorxiv: "preprint",
        medrxiv: "preprint",
        doi: "journal",
        url: "web",
      };
      const entry: LibraryPaper = {
        id,
        title: payload.title || "Untitled",
        authors: payload.authors || "Unknown authors",
        year: Number.isFinite(yearNum) ? yearNum : new Date().getFullYear(),
        folder: "ML Foundations",
        pinned: false,
        updated: "just now",
        tags: [tagBySource[payload.source]],
        url: payload.url,
        source: payload.source,
        venue: payload.venue ?? undefined,
      };
      setLibrary((lib) => [entry, ...lib]);
      setPaperId(id);
      setFolderId("recent");
      setPendingIngest((prev) => ({ ...prev, [id]: payload }));
      return { id, payload };
    },
    [],
  );

  const ingestPaper = useCallback(
    async (
      id: string,
      payload: IngestPayload,
      settings: AiSettings | null,
    ) => {
      if (!settings) {
        setIngestStatus((prev) => ({ ...prev, [id]: "error" }));
        return;
      }
      setIngestStatus((prev) => ({ ...prev, [id]: "loading" }));
      try {
        const res = await fetch("/api/ingest-paper", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            paperId: id,
            title: payload.title,
            authors: payload.authors,
            venue: payload.venue,
            year: payload.year,
            abstract: payload.abstract,
            url: payload.url,
            source: payload.source,
            folder: "ML Foundations",
            provider: settings.provider,
            apiKey: settings.apiKey,
            authMethod: settings.authMethod ?? "key",
          }),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as { paper?: Paper };
        if (!data.paper) throw new Error("no_paper");
        setPaperContent((prev) => ({ ...prev, [id]: data.paper as Paper }));
        setIngestStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setPendingIngest((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } catch {
        setIngestStatus((prev) => ({ ...prev, [id]: "error" }));
      }
    },
    [],
  );

  const paper = library.find((p) => p.id === paperId) ?? library[0];
  return {
    library,
    paperId,
    setPaperId,
    folderId,
    setFolderId,
    dragging,
    setDragging,
    flashFolder,
    handleDrop,
    paper,
    aiFolders,
    acceptAiFolder,
    removeAiFolder,
    addPaper,
    removePaper,
    paperContent,
    ingestStatus,
    pendingIngest,
    ingestPaper,
  };
}
