"use client";

import type {
  PDFDocumentProxy,
  TextItem,
} from "pdfjs-dist/types/src/display/api";

export type ExtractedPdf = {
  title: string;
  authors: string;
  year: string | null;
  abstract: string | null;
  fullText: string;
};

let workerConfigured = false;

async function loadPdfjs() {
  const lib = await import("pdfjs-dist");
  if (!workerConfigured && typeof window !== "undefined") {
    lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
    workerConfigured = true;
  }
  return lib;
}

async function pageText(pdf: PDFDocumentProxy, pageNum: number) {
  const page = await pdf.getPage(pageNum);
  const content = await page.getTextContent();
  return content.items
    .map((it) => ("str" in it ? (it as TextItem).str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveTitleAuthors(firstPage: string, metaTitle?: string, metaAuthor?: string) {
  const title = (metaTitle ?? "").trim();
  const authors = (metaAuthor ?? "").trim();
  if (title && authors) return { title, authors };

  const lines = firstPage.split(/(?<=[.!?])\s+|\s{3,}/).slice(0, 10);
  const candidateTitle =
    title ||
    lines.find((l) => l.length > 20 && l.length < 200 && /[A-Z]/.test(l)) ||
    lines[0] ||
    "Untitled PDF";

  const authorCandidate =
    authors ||
    lines
      .slice(lines.indexOf(candidateTitle) + 1, lines.indexOf(candidateTitle) + 4)
      .find((l) =>
        /^[A-Z][\w.\s,\-–]{5,200}$/.test(l) && (l.match(/,/g)?.length ?? 0) >= 1,
      ) ||
    "Unknown authors";

  return {
    title: candidateTitle.replace(/\s+/g, " ").trim().slice(0, 240),
    authors: authorCandidate.replace(/\s+/g, " ").trim().slice(0, 240),
  };
}

function deriveAbstract(text: string): string | null {
  const m = text.match(/abstract[\s.:—-]+([\s\S]{200,2400}?)(?:\n[A-Z]|introduction|background|keywords|I\. )/i);
  if (m) return m[1].replace(/\s+/g, " ").trim();
  const intro = text.slice(0, 1800).replace(/\s+/g, " ").trim();
  return intro.length > 200 ? intro : null;
}

export async function extractPdf(file: File): Promise<ExtractedPdf> {
  const pdfjsLib = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  const pageCount = Math.min(pdf.numPages, 6);
  const pageTexts: string[] = [];
  for (let i = 1; i <= pageCount; i++) {
    pageTexts.push(await pageText(pdf, i));
  }
  const firstPage = pageTexts[0] ?? "";
  const fullText = pageTexts.join("\n\n");

  let metaTitle: string | undefined;
  let metaAuthor: string | undefined;
  try {
    const meta = await pdf.getMetadata();
    const info = meta.info as Record<string, unknown> | undefined;
    if (info) {
      const t = info["Title"];
      const a = info["Author"];
      if (typeof t === "string") metaTitle = t;
      if (typeof a === "string") metaAuthor = a;
    }
  } catch {}

  const { title, authors } = deriveTitleAuthors(firstPage, metaTitle, metaAuthor);
  const yearMatch = firstPage.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : null;
  const abstract = deriveAbstract(fullText);

  return { title, authors, year, abstract, fullText };
}
