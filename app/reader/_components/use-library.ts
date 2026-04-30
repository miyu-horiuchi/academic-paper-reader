"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FOLDER_DROP,
  LIBRARY,
  type FolderKey,
  type LibraryPaper,
} from "@/lib/paper-data";
import type { AiFolder } from "@/lib/ai-folders";

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

  const addPaper = useCallback(
    (payload: {
      title: string;
      authors: string;
      year: string | null;
      url: string;
      venue: string | null;
      source: "arxiv" | "biorxiv" | "medrxiv" | "doi" | "url";
    }): string => {
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
      return id;
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
  };
}
