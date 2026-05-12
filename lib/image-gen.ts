const FAL_ENDPOINT = "https://fal.run/fal-ai/gemini-3-pro-image-preview";

type FalImage = {
  url: string;
  width?: number | null;
  height?: number | null;
};
type FalResponse = { images?: FalImage[] };

export type GeneratedVisual = {
  url: string;
  width: number;
  height: number;
  prompt: string;
};

const STYLE_GUIDE =
  "Render as an isometric 3D educational diagram. Axonometric projection, soft pastel palette on a cream background, clean geometric blocks with subtle drop shadows, labelled arrows showing data flow, vector illustration style, no readable text, no people, no logos.";

export function buildIsometricPrompt(opts: {
  title: string;
  summary?: string | null;
  abstract?: string | null;
}): string {
  const seed = (opts.summary ?? opts.abstract ?? opts.title).trim();
  const subject = seed.length > 0 ? seed : opts.title;
  return `Educational diagram illustrating: ${subject.slice(0, 700)}. ${STYLE_GUIDE}`;
}

export async function generateIsometricVisual(opts: {
  title: string;
  summary?: string | null;
  abstract?: string | null;
}): Promise<GeneratedVisual | { error: string }> {
  const key = process.env.FAL_KEY;
  if (!key) return { error: "FAL_KEY not configured" };
  const prompt = buildIsometricPrompt(opts);
  try {
    const res = await fetch(FAL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: "16:9",
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        error: `fal ${res.status}: ${detail.slice(0, 200)}`,
      };
    }
    const data = (await res.json()) as FalResponse;
    const img = data.images?.[0];
    if (!img?.url) {
      return { error: "fal returned no image" };
    }
    return {
      url: img.url,
      width: img.width ?? 1024,
      height: img.height ?? 576,
      prompt,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
