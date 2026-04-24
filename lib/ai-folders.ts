import type { LibraryPaper } from "@/lib/paper-data";

export type AiFolder = {
  id: string;
  name: string;
  why: string;
  keywords: string[];
};

export function suggestionMatches(
  paper: LibraryPaper,
  folder: AiFolder,
): boolean {
  if (!folder.keywords.length) return false;
  const hay = [
    paper.title,
    paper.authors,
    paper.folder,
    ...(paper.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return folder.keywords.some((k) => hay.includes(k.toLowerCase()));
}
