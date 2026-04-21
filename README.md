# Academic Paper Reader

A web app for reading and annotating academic papers. Sign in with Google.

## Stack

- Next.js 15 (App Router, TypeScript, Turbopack)
- Tailwind CSS v4
- Auth.js v5 (Google provider)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create a Google OAuth client

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an OAuth client ID (type: Web application).
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy the Client ID and Client Secret.

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

```env
AUTH_SECRET=          # openssl rand -base64 32
AUTH_GOOGLE_ID=       # from Google Cloud Console
AUTH_GOOGLE_SECRET=   # from Google Cloud Console
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` — landing / sign-in
- `/reader` — authenticated reader (redirects to `/` if signed out)

## Deploy

Deploy to Vercel. Add the three env vars in the project settings, then add
`https://<your-domain>/api/auth/callback/google` as an authorized redirect URI
in the Google OAuth client.
