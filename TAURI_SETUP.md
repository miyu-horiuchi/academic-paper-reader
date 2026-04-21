# Tauri desktop app

This repo ships a Tauri 2 wrapper that turns the Next.js paper reader into a native macOS app.

## Prerequisites

1. **Rust** — `rustup` toolchain. Install:
   ```
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **Xcode Command Line Tools** — needed for macOS bundles.
   ```
   xcode-select --install
   ```
3. **Node deps** already installed via `pnpm install`.

## Run the desktop app in dev

```
pnpm tauri:dev
```

This:
- Starts `pnpm dev` (Next.js dev server on `http://localhost:3000`)
- Launches a native Tauri window pointing at that URL
- Hot-reloads the Next.js frontend when you edit `app/`

The `/reader` route still requires Google sign-in. Sign-in works in dev because `http://localhost:3000/api/auth/callback/google` is already registered as an authorized redirect URI in the Google OAuth client.

## Build a `.dmg` / `.app`

```
pnpm tauri:build
```

Takes 5–10 minutes on first run (Rust compiles everything). Outputs land in:
- `src-tauri/target/release/bundle/macos/Papers.app`
- `src-tauri/target/release/bundle/dmg/Papers_0.1.0_aarch64.dmg`

## Notes & caveats

- **Auth in the packaged app:** the packaged app loads `http://localhost:3000` (hard-coded via `frontendDist` in `tauri.conf.json`) — it won't work standalone. To ship a real standalone app, switch `frontendDist` to the production URL (`https://academic-paper-reader-chi.vercel.app`) AND register a `tauri://` scheme (or the app's custom domain) as an authorized Google redirect URI.
- **Window chrome:** `titleBarStyle: "Overlay"` + `hiddenTitle: true` lets the Next.js `/desktop` route (see `feat/desktop-shell-route` branch) paint its own macOS-style title bar.
- **Icons:** using the default Tauri placeholder icons for now. Swap `src-tauri/icons/*` with real assets before publishing.
- **Identifier:** `com.miyu.papers` — change before shipping if you want a different bundle ID.

## File layout

- `src-tauri/tauri.conf.json` — window/bundle config
- `src-tauri/Cargo.toml` — Rust crate manifest (`papers`)
- `src-tauri/src/main.rs` + `lib.rs` — Rust entry (default)
- `src-tauri/icons/` — app icons
- `src-tauri/capabilities/` — Tauri 2 permission manifests
