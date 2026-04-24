import { auth } from "@/auth";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function randomState(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.redirect(new URL("/", req.url).toString(), 302);
  }
  const clientId = process.env.AUTH_GOOGLE_ID;
  if (!clientId) {
    return new Response("Google OAuth not configured", { status: 500 });
  }

  const state = randomState();
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/google-gemini/callback`;

  const auth_url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth_url.searchParams.set("client_id", clientId);
  auth_url.searchParams.set("redirect_uri", redirectUri);
  auth_url.searchParams.set("response_type", "code");
  auth_url.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/cloud-platform openid email",
  );
  auth_url.searchParams.set("access_type", "offline");
  auth_url.searchParams.set("prompt", "consent");
  auth_url.searchParams.set("state", state);

  const store = await cookies();
  store.set("gemini_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  return Response.redirect(auth_url.toString(), 302);
}
