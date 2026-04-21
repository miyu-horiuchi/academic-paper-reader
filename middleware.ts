export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/reader/:path*", "/desktop/:path*"],
};
