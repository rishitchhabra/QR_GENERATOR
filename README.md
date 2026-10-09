# QR Studio

A permanent QR code generator for any URL — built with Next.js.

Every QR code is **static**: the URL is encoded directly into the pattern, so it
keeps working forever with no server, no short-link redirect, and no expiry.

## Features

- Encode any URL (auto-adds `https://` when omitted)
- Colours & gradients for the pattern, background and corners
- Module styles: square, rounded, dots, classy, classy-rounded, extra-rounded
- Drop a photo / icon / logo into the centre, with size + padding controls
- Export as **PNG, SVG, JPG or WEBP**, copy the image to the clipboard
- Live preview, contrast warnings, style presets, settings saved to `localStorage`
- 100% client-side — your URL and logo never leave the browser

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
npm run start
```

## Deploy to Vercel

No configuration or environment variables needed.

**Option A — Dashboard**

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset is detected as **Next.js** — click **Deploy**.

**Option B — CLI**

```bash
npm i -g vercel
vercel
```

Or drag-and-drop the project folder onto the Vercel dashboard.

## Tech

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- [`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling) for QR rendering
# QR_GENERATOR
