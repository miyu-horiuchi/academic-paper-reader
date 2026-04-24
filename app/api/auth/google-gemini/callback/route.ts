import { auth } from "@/auth";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.redirect(new URL("/", req.url).toString(), 302);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const store = await cookies();
  const stored = store.get("gemini_oauth_state")?.value;
  store.delete("gemini_oauth_state");

  const redirectBack = new URL("/settings", req.url);

  if (error) {
    redirectBack.searchParams.set("gemini_error", error);
    return Response.redirect(redirectBack.toString(), 302);
  }
  if (!code || !state || !stored || state !== stored) {
    redirectBack.searchParams.set("gemini_error", "state_mismatch");
    return Response.redirect(redirectBack.toString(), 302);
  }

  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) {
    redirectBack.searchParams.set("gemini_error", "not_configured");
    return Response.redirect(redirectBack.toString(), 302);
  }

  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/google-gemini/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    redirectBack.searchParams.set("gemini_error", "exchange_failed");
    redirectBack.searchParams.set("gemini_detail", detail.slice(0, 200));
    return Response.redirect(redirectBack.toString(), 302);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const expiresAt = Date.now() + (tokens.expires_in - 60) * 1000;
  const fragment = new URLSearchParams({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? "",
    expires_at: String(expiresAt),
  });

  const target = new URL("/settings/gemini-callback", req.url);
  return Response.redirect(`${target.toString()}#${fragment.toString()}`, 302);
}
