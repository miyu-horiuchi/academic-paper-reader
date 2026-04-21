"use client";

import { useCallback, useState } from "react";
import {
  FOLDER_DROP,
  LIBRARY,
  type FolderKey,
  type LibraryPaper,
} from "@/lib/paper-data";

export function useLibrary(
  initialPaperId = "attention",
  initialFolderId: FolderKey = "pinned",
) {
  const [library, setLibrary] = useState<LibraryPaper[]>(LIBRARY);
  const [paperId, setPaperId] = useState(initialPaperId);
  const [folderId, setFolderId] = useState<FolderKey>(initialFolderId);
  const [dragging, setDragging] = useState(false);
  const [flashFolder, setFlashFolder] = useState<FolderKey | null>(null);

  const handleDrop = useCallback(
    (pid: string, fid: FolderKey) => {
      const transform = FOLDER_DROP[fid];
      if (!transform) return;
      setLibrary((lib) => lib.map((p) => (p.id === pid ? transform(p) : p)));
      setFlashFolder(fid);
      setTimeout(
        () => setFlashFolder((f) => (f === fid ? null : f)),
        700,
      );
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
  };
}
