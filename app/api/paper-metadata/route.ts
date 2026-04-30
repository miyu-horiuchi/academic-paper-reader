export const runtime = "nodejs";

type Metadata = {
  source: "arxiv" | "biorxiv" | "medrxiv" | "doi" | "url";
  title: string;
  authors: string;
  venue: string | null;
  year: string | null;
};

const UA = "PaperReader/0.1 (mailto:miyuhpenn@gmail.com)";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function joinAuthors(names: string[]): string {
  const trimmed = names.map((n) => n.trim()).filter(Boolean);
  if (trimmed.length === 0) return "";
  if (trimmed.length <= 3) return trimmed.join(", ");
  return `${trimmed[0]} et al.`;
}

function extractArxivId(input: string): string | null {
  const cleaned = input.replace(/^arxiv:/i, "");
  const m =
    cleaned.match(
      /arxiv\.org\/(?:abs|pdf|html)\/([0-9]{4}\.[0-9]{4,5})(?:v\d+)?/i,
    ) || cleaned.match(/^([0-9]{4}\.[0-9]{4,5})(?:v\d+)?$/);
  return m ? m[1] : null;
}

function extractDoi(input: string): string | null {
  const m =
    input.match(/(?:doi\.org\/|doi:\s*)(10\.[0-9]{4,9}\/[^\s?#]+)/i) ||
    input.match(/^(10\.[0-9]{4,9}\/[^\s?#]+)$/i);
  if (!m) return null;
  return m[1].replace(/[).,;]+$/, "");
}

function extractBiorxivDoi(input: string): {
  server: "biorxiv" | "medrxiv";
  doi: string;
} | null {
  const m = input.match(
    /(biorxiv|medrxiv)\.org\/content\/(10\.[0-9]{4,9}\/[^\s?#/]+?)(?:v\d+)?(?:\.full|\.abstract|\.pdf)?(?:[?#].*)?$/i,
  );
  if (!m) return null;
  return {
    server: m[1].toLowerCase() as "biorxiv" | "medrxiv",
    doi: m[2],
  };
}

async function fetchArxiv(id: string): Promise<Metadata> {
  const res = await fetch(
    `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(id)}`,
    { headers: { "user-agent": UA } },
  );
  if (!res.ok) throw new Error(`arxiv ${res.status}`);
  const xml = await res.text();
  const entry = xml.split("<entry>")[1]?.split("</entry>")[0] ?? "";
  const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
  const authors = Array.from(
    entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g),
  ).map((m) => decodeEntities(m[1]));
  const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
  const year = publishedMatch ? publishedMatch[1].slice(0, 4) : null;
  return {
    source: "arxiv",
    title: titleMatch ? decodeEntities(titleMatch[1]) : "",
    authors: joinAuthors(authors),
    venue: `arXiv:${id}`,
    year,
  };
}

async function fetchBiorxiv(
  server: "biorxiv" | "medrxiv",
  doi: string,
): Promise<Metadata> {
  const res = await fetch(
    `https://api.biorxiv.org/details/${server}/${doi}/na/json`,
    { headers: { "user-agent": UA } },
  );
  if (!res.ok) throw new Error(`${server} ${res.status}`);
  const data = (await res.json()) as {
    collection?: Array<{
      title?: string;
      authors?: string;
      date?: string;
      published?: string;
    }>;
  };
  const latest = data.collection?.[data.collection.length - 1];
  if (!latest) throw new Error(`${server} no entry`);
  const authorList = (latest.authors ?? "")
    .split(/;\s*/)
    .map((a) => a.trim())
    .filter(Boolean);
  return {
    source: server,
    title: latest.title ? decodeEntities(latest.title) : "",
    authors: joinAuthors(authorList),
    venue: server === "biorxiv" ? "bioRxiv" : "medRxiv",
    year: (latest.date ?? "").slice(0, 4) || null,
  };
}

async function fetchCrossref(doi: string): Promise<Metadata> {
  const res = await fetch(
    `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
    { headers: { "user-agent": UA } },
  );
  if (!res.ok) throw new Error(`crossref ${res.status}`);
  const data = (await res.json()) as {
    message?: {
      title?: string[];
      author?: Array<{ given?: string; family?: string; name?: string }>;
      "container-title"?: string[];
      issued?: { "date-parts"?: number[][] };
      published?: { "date-parts"?: number[][] };
    };
  };
  const m = data.message;
  if (!m) throw new Error("crossref empty");
  const authors = (m.author ?? []).map((a) =>
    a.name ?? [a.given, a.family].filter(Boolean).join(" "),
  );
  const year =
    m.issued?.["date-parts"]?.[0]?.[0] ??
    m.published?.["date-parts"]?.[0]?.[0];
  return {
    source: "doi",
    title: decodeEntities(m.title?.[0] ?? ""),
    authors: joinAuthors(authors),
    venue: m["container-title"]?.[0] ?? null,
    year: year ? String(year) : null,
  };
}

async function fetchGenericUrl(url: string): Promise<Metadata> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,*/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const html = (await res.text()).slice(0, 200_000);
  const meta = (name: string) => {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    return html.match(re)?.[1];
  };
  const altMeta = (name: string) => {
    const re = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
      "i",
    );
    return html.match(re)?.[1];
  };
  const pick = (name: string) => meta(name) ?? altMeta(name);

  const citationAuthors = Array.from(
    html.matchAll(
      /<meta[^>]+name=["']citation_author["'][^>]+content=["']([^"']+)["']/gi,
    ),
  ).map((m) => decodeEntities(m[1]));

  const title =
    pick("citation_title") ??
    pick("og:title") ??
    pick("twitter:title") ??
    html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ??
    "";
  const venue = pick("citation_journal_title") ?? pick("og:site_name") ?? null;
  const year =
    (pick("citation_publication_date") ?? pick("citation_date") ?? "").slice(
      0,
      4,
    ) || null;
  const description = pick("og:description") ?? pick("description");
  const authors =
    citationAuthors.length > 0
      ? joinAuthors(citationAuthors)
      : pick("author") ?? pick("article:author") ?? "";

  if (!title) throw new Error("no title");
  return {
    source: "url",
    title: decodeEntities(title),
    authors: authors ? decodeEntities(authors) : "",
    venue: venue ? decodeEntities(venue) : description ? null : null,
    year,
  };
}

async function resolve(input: string): Promise<Metadata> {
  const trimmed = input.trim();

  const arxivId = extractArxivId(trimmed);
  if (arxivId) return fetchArxiv(arxivId);

  const bio = extractBiorxivDoi(trimmed);
  if (bio) return fetchBiorxiv(bio.server, bio.doi);

  const doi = extractDoi(trimmed);
  if (doi) return fetchCrossref(doi);

  if (/^https?:\/\//i.test(trimmed)) return fetchGenericUrl(trimmed);

  throw new Error("unrecognized input");
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url || url.length < 4) {
    return Response.json({ error: "url required" }, { status: 400 });
  }
  if (url.length > 2000) {
    return Response.json({ error: "url too long" }, { status: 400 });
  }
  try {
    const data = await resolve(url);
    return Response.json(data, {
      headers: { "cache-control": "public, max-age=3600" },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "lookup failed" },
      { status: 502 },
    );
  }
}
