# Aurora

A local-first AI chat workspace built with Next.js 15 and React 19. Aurora streams answers from LiteRouter's free DeepSeek models, renders Markdown with custom syntax highlighting, exposes reasoning traces, and keeps conversation history in the browser.

## Routes

- `/` — animated landing page with features, models, and privacy sections.
- `/new` — fresh chat workspace. The first message creates `/c/<id>`.
- `/c/<id>` — a local conversation.
- `/terms` and `/privacy` — animated legal pages.
- `/api/chat` — NDJSON streaming proxy to LiteRouter with a deterministic demo fallback.
- `/api/models` — free model catalogue with curated fallback.

## Run locally

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5000`. Production uses `npm run build` then `npm start`, also on port 5000.

## Configuration

Add these values to `.env.local` (server-only):

```bash
LITEROUTER_API_KEY=your_key
LITEROUTER_BASE_URL=https://api.literouter.com/v1
LITEROUTER_MODEL=deepseek-v4.1-flash:free
```

Without a key, the app automatically switches to its local demo stream so the interface remains usable.

## Notes

- Chat history, theme, preferences, and the selected model live in `localStorage`; there is no account or server-side database.
- The API key is read only by the server route and is never sent to the browser.
- To clear local data, use the sidebar's clear-history action or remove the `aurora.*` keys from browser storage.
