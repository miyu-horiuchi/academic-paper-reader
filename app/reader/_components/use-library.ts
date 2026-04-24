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
  };
}
