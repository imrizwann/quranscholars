# Portable frontend deployment

The application is a static Vite build, served from `dist/`. It does not require a
particular hosting provider. Use Node 22+ to install/build and a production static
server or hosting service to serve the result. Vite dev/preview are local tools.

## Build environment

Set these **before** `npm run build`; changing runtime variables on a static host
does not change an already generated bundle. Rebuild after URL changes.

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production`; custom Vite modes must also use production |
| `VITE_API_URL` | `/` with a same-origin API proxy, or a complete HTTPS origin without `/api` |
| `VITE_PUBLIC_SITE_URL` | Required canonical HTTPS website origin, without a trailing slash; match backend `APP_PUBLIC_URL` |
| `VITE_COURSE_MEDIA_BASE_URL` | Optional public HTTPS media URL/prefix; no signed URLs or private credentials |
| `VITE_REALTIME_URL` | Optional HTTPS/WSS origin; blank uses the API URL |
| `VITE_CATALOGUE_LAYOUT` | Optional `featured` or `full` |

`VITE_USER_NODE_ENV` is Vite's internal mode marker, not an application setting.
Other `VITE_*` names are rejected by production builds. Every allowed value is
public: never put secrets in them. The payment public key comes from the backend
checkout response; no frontend merchant secret or test-key variable is required.
Keep server credentials out of the frontend build environment altogether.

## Routing and HTTPS contract

1. Serve HTTPS and redirect HTTP at the public edge. Redirect alternate domains
   to the configured canonical website domain there; the app never constructs a
   redirect from untrusted `Host` or forwarded-host headers.
2. With `VITE_API_URL=/`, forward **both `/api` and `/api/*`** to the API, retaining
   the path, method, body, cookies, Origin and CSRF header. Preserve API status and
   JSON errors; disable proxy error-page replacement and shared API caching.
3. Forward `/share/courses/:slug` to `/api/public/recorded-courses/:slug/share`
   for server-generated social metadata. This is an intentional HTML endpoint.
4. Serve real files first, then `index.html` for frontend deep links such as
   `/courses/example`, `/profile`, `/instructor/courses` and `/learn/...`.
   Never apply that fallback to `/api`, `/api/*`, or missing `/assets/*` files.
5. Revalidate HTML on every navigation; keep API responses `no-store`. Versioned
   assets may be cached immutably only when filenames contain content hashes.
6. Proxy WebSocket upgrades at `/api/realtime` only when the backend runtime
   supports them. The websocket endpoint must receive the API's host-only cookie;
   a different hostname alone cannot share authentication. Polling remains usable
   with backend `REALTIME_ENABLED=false`.

The existing `vercel.json` is an **optional deployment adapter**, not application
logic. Its two upstream URLs must be changed when that adapter targets another
API. Other platforms ignore it and implement the contract above in their router.
No application code needs changing.

## nginx example for a VPS/container

`deployment/nginx.conf.template` supplies deep-link, API, social-preview and
WebSocket routing with conservative caching. It is a template, not a running or
validated configuration on your production server. Set:

`APP_HOST`, `API_UPSTREAM`, `FRONTEND_ROOT`, `TLS_CERT_PATH`, `TLS_KEY_PATH`, and
`CA_BUNDLE_PATH`. Example public topology: `APP_HOST=learn.example.com`,
`API_UPSTREAM=http://127.0.0.1:3000`, `FRONTEND_ROOT=/srv/lms/dist`.
The certificate/CA paths depend on your TLS setup and OS. Require a valid
certificate when proxying to HTTPS; never disable upstream verification.

Render only those names so nginx's own variables survive:

```sh
envsubst '${APP_HOST} ${API_UPSTREAM} ${FRONTEND_ROOT} ${TLS_CERT_PATH} ${TLS_KEY_PATH} ${CA_BUNDLE_PATH}' < deployment/nginx.conf.template > /etc/nginx/conf.d/lms.conf
nginx -t
```

This template assumes nginx is the public edge. If a CDN/proxy precedes it,
configure nginx's real-IP trust list from that proxy's documented addresses;
never accept arbitrary forwarded IPs. Restrict backend ingress to nginx and set
backend `TRUST_PROXY` to nginx's actual source IP/CIDR. Set a default virtual host
that rejects unknown hostnames, and separate redirects for any canonical aliases.
Review upload/body/time limits against the API's configured limits before reload.

After deployment, verify deep links on a fresh navigation, API 404 JSON responses,
missing-asset 404s, login/refresh/logout, cookie flags, CORS rejection, and cache
headers through the **public** proxy. A unit test cannot establish your host's
TLS, firewall, cookie forwarding or CDN cache behavior.
