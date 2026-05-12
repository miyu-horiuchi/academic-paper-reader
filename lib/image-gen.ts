const FAL_ENDPOINT = "https://fal.run/fal-ai/flux/schnell";

type FalImage = { url: string; width: number; height: number };
type FalResponse = { images?: FalImage[] };

export type GeneratedVisual = {
  url: string;
  width: number;
  height: number;
  prompt: string;
};

export function buildIsometricPrompt(opts: {
  title: string;
  abstract?: string | null;
}): string {
  const seed = [opts.title, opts.abstract ?? ""].join(". ").slice(0, 600);
  return [
    "Isometric 3D technical illustration of:",
    seed,
    "Axonometric projection, soft pastel colors on cream background, clean geometric shapes, labelled blocks and arrows showing data flow, educational diagram style, no text labels, no people.",
  ].join(" ");
}

export async function generateIsometricVisual(opts: {
  title: string;
  abstract?: string | null;
}): Promise<GeneratedVisual | null> {
  const key = process.env.FAL_KEY;
  if (!key) return null;
  const prompt = buildIsometricPrompt(opts);
  const res = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 4,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as FalResponse;
  const img = data.images?.[0];
  if (!img?.url) return null;
  return { url: img.url, width: img.width, height: img.height, prompt };
}
