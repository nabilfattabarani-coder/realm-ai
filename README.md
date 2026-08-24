# Realm

Ask anything, in any language. Realm is a minimal, single-page AI search
front end — ask a question, get an answer with cited sources.

Formerly "biosinc.ai". This repo now contains only two files by design:

```
index.html   – the entire front end (markup, styles, and script in one file)
README.md    – this file
```

Your existing backend/API script (the one that calls Gemini) is separate
from these two files and is not touched by this README.

## What changed from the previous version

- **Rebrand:** name changed from "biosinc.ai" to "Realm"; the wordmark now
  uses the "R" mark you provided, embedded directly in `index.html` as a
  base64 image (so there's still only one HTML file and no extra asset
  files to host).
- **Palette:** green/mint accents replaced with a pure black-and-white
  theme (`#000000` background, `#ffffff` accent). No other layout changes —
  spacing, structure, and components are the same as before.
- **Language:** all UI copy is now in English by default. The app itself
  places no restriction on the *question* language — since your backend
  calls a general-purpose model, it will naturally answer in whichever
  language the user asks in. If you want the model to always reply in the
  same language the user typed in, add a line to your backend's system
  prompt such as "Always answer in the same language as the user's
  question."
- **Conversation memory:** every question and answer is now saved to the
  browser's `localStorage` (key `realm_conversations`, capped at the last
  30 conversations). A history icon in the header opens a panel listing
  past conversations — click one to reopen it instantly without calling
  the API again. This is per-browser, client-side storage: it is not sent
  anywhere, is not shared across devices, and a visitor can clear it at
  any time with the "Clear" button in the history panel.
- **Security hardening (front end):**
  - All API response data (answer text, source titles, source URLs) is
    HTML-escaped before being inserted into the page, closing the
    reflected-XSS gap in the previous version, which inserted the API
    response directly into the page.
  - Source links are only rendered if the URL uses `http:` or `https:` —
    this blocks `javascript:` and other unsafe URL schemes from being
    made clickable.
  - A `Content-Security-Policy` meta tag restricts where scripts, styles,
    fonts, and network requests can come from.
  - Requests time out after 30 seconds (`AbortController`) instead of
    hanging indefinitely, and a simple client-side cooldown/lock prevents
    duplicate or rapid-fire submissions.
  - The input field has a `maxlength` and the query is also trimmed and
    length-capped in JavaScript before it's sent.

## Backend security — please review

The front end can only do so much; the meaningful security boundary for
an AI app like this is your API route. Since you already have your own
script for that, a few things worth double-checking there:

1. **Never expose your Gemini/API key to the browser.** It should only
   ever be read from a server-side environment variable inside your API
   route, never sent to or referenced from `index.html`.
2. **Treat the user's query as untrusted input to the model, not as an
   instruction to your system.** Keep the system prompt and the user's
   question in separate, clearly delineated roles (e.g. Gemini's
   `system_instruction` field vs. the user turn), and avoid string-
   concatenating raw user text into a single prompt blob — this is your
   main defense against prompt injection.
3. **Validate and cap input server-side too** (length, type, rate per
   IP/session) — client-side checks in `index.html` are a convenience,
   not a security boundary, since they can be bypassed by calling the API
   directly.
4. **Rate-limit and log abuse** at the API route level (e.g. Vercel Edge
   Config, Upstash Redis, or a similar lightweight store) to prevent
   scraping or cost-draining abuse.
5. **Set CORS narrowly** on the API route (only your own domain) if it's
   ever callable cross-origin.
6. **Sanitize before you trust search results**, if your script feeds
   live web search results back into the model's context — a malicious
   page could otherwise embed instructions aimed at the model.

## Configuration

Open `index.html` and check the top of the `<script>` block:

```js
const API_URL = "/api/search";
```

This assumes your API route is deployed on the same domain as this page
(the normal setup for a Vercel project with both a static page and an
`/api` route). If your API lives on a different domain, change this to
the full URL and also update the `connect-src` value inside the
`Content-Security-Policy` `<meta>` tag near the top of `<head>` to match,
otherwise the browser will block the request.

## Deploying

Same as before — push `index.html` (and your API route/script) to your
Vercel project. No build step is required for the front end; it's a
single static HTML file.

## Notes / possible next steps

- Conversation history currently lives only in `localStorage`. If you
  later want history to sync across devices, that would require your own
  backend storage (e.g. a database keyed by a user/session ID) rather
  than the browser alone.
- Right-to-left language display (Arabic, Hebrew, etc.) isn't specifically
  handled yet — the layout is LTR-only for now.
