# PRINCIPIA Google Gemini setup

The browser never receives the Gemini API key. Cloudflare Pages Functions proxies authenticated requests to Google Gemini.

## Required Cloudflare Pages environment

Set these as **Production** and **Preview** environment variables where applicable:

- `GEMINI_API_KEY`: secret from Google AI Studio. Add with Cloudflare Pages > Settings > Variables and Secrets as an encrypted secret.
- `FIREBASE_WEB_API_KEY`: the Firebase Web API key already used by `window.PRINCIPIA_FIREBASE_CONFIG.apiKey`. This key identifies the Firebase project; it is not a service-account credential.

For Wrangler, from the repository root:

```sh
npx wrangler pages secret put GEMINI_API_KEY
npx wrangler pages secret put FIREBASE_WEB_API_KEY
```

Enter each value when prompted. Do not commit either value to Git.

## Firebase requirements

1. Enable Firebase Authentication (Email/Password and/or Google).
2. Add the production `pages.dev` domain to Firebase Authentication authorized domains.
3. Keep the Firebase Web API key restricted to the required Firebase APIs and authorized domains where supported.

## Request flow

1. The signed-in Firebase user obtains an ID token.
2. `POST /api/ai` verifies that token through Firebase Identity Toolkit.
3. Cloudflare Pages Function sends the prompt to `gemini-2.5-flash` using the server-side `GEMINI_API_KEY`.
4. The response is returned to the browser. The key is never sent to the client.

The API rejects anonymous requests, cross-origin browser requests, oversized payloads, malformed messages and unsupported roles. Apply Cloudflare rate limiting/WAF rules to `/api/ai` before opening broad public usage. Monitor Google AI Studio quotas and billing.

## Features routed through the shared provider

- Main PRINCIPIA assistant chat.
- PRO MASTERY AI Coach.
- Virtual classroom AI Student.
- Adaptive Learning retry hints.
- Existing calls to `principiaLocalAI.open` are redirected to the same Gemini-backed UI after the provider script loads.

Prompts launched by a feature are automatically submitted to Gemini. The ordinary chat sends only when the learner presses Send. No background conversation or lesson data is transmitted without a user action.
