# Træningsmester Website

Pre-launch website for Træningsmester with a Danish waitlist signup flow.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The site is static and Vercel-ready. No private runtime credentials are shipped in the client.

## Waitlist

The signup form posts to `/api/waitlist` on Vercel. Configure these environment
variables in Vercel to persist or forward signups:

- `WAITLIST_WEBHOOK_URL`: required for server-side signup capture. The API posts
  validated signup payloads to this URL.
- `WAITLIST_WEBHOOK_SECRET`: optional shared secret sent as `X-Waitlist-Secret`.
- `VITE_WAITLIST_FALLBACK_EMAIL`: optional public fallback email used when the
  webhook is not configured or unavailable. Defaults to `kontakt@traeningsmester.dk`.

If `WAITLIST_WEBHOOK_URL` is missing, the frontend opens a prefilled email
instead of showing a fake success state.

## Domains

The canonical public URL is `https://www.traeningsmester.dk/`.

`træningsmester.dk` must be configured in DNS and Vercel with its punycode name:

- `træningsmester.dk` -> `xn--trningsmester-4fb.dk`
- `www.træningsmester.dk` -> `www.xn--trningsmester-4fb.dk`

Add both punycode domains to the same Vercel project as `traeningsmester.dk`.
In Nordicway DNS, point the apex punycode domain to Vercel's required A record
and the `www` punycode subdomain to Vercel's required CNAME. Use the exact DNS
values shown by Vercel for the project.

`vercel.json` redirects both punycode hosts to `https://www.traeningsmester.dk/`,
so browser visits to `https://træningsmester.dk` and
`https://www.træningsmester.dk` land on the same website after DNS is changed.
