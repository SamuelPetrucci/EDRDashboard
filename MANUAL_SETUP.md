# Manual setup for Intelligence features

These optional steps enable **3D globe**, **real AIS ships**, **weather**, **news**, and **live camera feeds**. The app always works with **DRIS local/catalog data** (scorecards, trainings, contacts) and **Supabase** when configured. **Third-party intel and overview feeds** (OpenSky, GDACS, USGS, Nominatim, Open-Meteo, Windy, news URL, webcams, AISHub when keys are set) are **off by default** — set `VITE_ENABLE_EXTERNAL_INTEL_FEEDS=true` when keys and endpoints are ready (see the table below). Use the **2D Map** / **3D Globe** toggle on the Intelligence page; the 3D view uses Mapbox satellite imagery and terrain.

---

## 1. Environment variables

Create a `.env` file in the project root (and optionally `.env.local` for local overrides). **Do not commit `.env` or `.env.local`** if they contain secrets; they are already in `.gitignore`.

The root **`.env.example` lists only Supabase + Mapbox** (auth and the main map). Add the variables below **only when you turn on that feature**; leaving them unset is normal.

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL (Auth; `/app` gate when paired with a client key) | No – leave empty for local UI without login |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase **publishable** key (`sb_publishable_…`) — preferred for new projects | No |
| `VITE_SUPABASE_ANON_KEY` | Legacy **anon** JWT public key — still read by the app if publishable is unset | No |
| `SUPABASE_SECRET_KEY` | **Secret** key (`sb_secret_…`) — `npm run seed:demo`, CI, server only; never `VITE_*` or browser | No — not used by this SPA bundle |
| `SUPABASE_SERVICE_ROLE_KEY` | Same service-role secret if your team uses this name (seed script accepts either) | No |
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox **default public** access token (3D globe + map) | No – 3D Globe shows setup message if missing |
| `VITE_MAPBOX_TOKEN` | Legacy alias — used only if `VITE_MAPBOX_ACCESS_TOKEN` is unset | No |
| `VITE_ENABLE_EXTERNAL_INTEL_FEEDS` | Set to `true` to enable **all** third-party intel/overview HTTP feeds (OpenSky, GDACS, USGS, Nominatim, Open-Meteo, Windy, `VITE_NEWS_API_URL`, webcams, AISHub when keys set). When unset or not `true`, Intel and Overview **do not call** those services. | No – **recommended off** until keys are configured |
| `VITE_AISHUB_USERNAME` | AISHub account username (for real ship/AIS data) | No – mock ships used if missing |
| `VITE_AISHUB_KEY` | AISHub API key | No – mock ships used if missing |
| `VITE_RAINVIEWER_TILE_URL` | Weather radar tile URL (e.g. RainViewer or OpenWeatherMap radar) | No – radar overlay hidden if missing |
| `VITE_WINDY_FORECAST_API_KEY` | Windy **Point Forecast** API key (weather on Overview + Intel) | No – weather card shows placeholder if missing |
| `VITE_WINDY_WEBCAM_API_KEY` | Windy **Webcams** API key (live cameras on Intel map) | No – try OpenWebcamDB or leave empty |
| `VITE_WINDY_API_KEY` | Legacy: used as fallback for both forecast and webcams if the keys above are not set | No |
| `VITE_OPENWEBCAMDB_API_KEY` | OpenWebcamDB API key for cameras near a point | No – demo camera list if missing |
| `VITE_NEWS_API_URL` | Backend endpoint for news/articles API (expects bbox + limit) | No – News tab shows placeholder if missing |
| `VITE_NEWS_API_KEY` | Token sent as Bearer token to news backend | No |
| `NEWS_BACKEND_TOKEN` | Server-side token to protect `/api/news` | No (recommended for production) |
| `WINDY_WEBCAM_API_KEY` | Server-only (e.g. Vercel) for `/api/windy-webcams` — avoids browser CORS to Windy | No |
| `VITE_WINDY_WEBCAM_PROXY_URL` | Set to `0` to force direct Windy webcam API (dev only; prod usually uses `/api/windy-webcams`) | No |

Example `.env`:

```env
# 3D Globe (Mapbox) – https://account.mapbox.com/access-tokens/
# VITE_MAPBOX_ACCESS_TOKEN=pk....

# Real maritime (AIS) – get keys from https://www.aishub.net/
VITE_AISHUB_USERNAME=your_username
VITE_AISHUB_KEY=your_key

# Weather radar overlay – e.g. OpenWeatherMap: https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=YOUR_OWM_KEY
# VITE_RAINVIEWER_TILE_URL=https://...

# Windy – use separate keys for forecast vs webcams (or one key for both): https://api.windy.com/keys
# VITE_WINDY_FORECAST_API_KEY=your_forecast_key
# VITE_WINDY_WEBCAM_API_KEY=your_webcam_key
# Or legacy (single key for both): VITE_WINDY_API_KEY=your_key

# Or OpenWebcamDB – https://openwebcamdb.com/
# VITE_OPENWEBCAMDB_API_KEY=your_key

# News aggregation endpoint (Vercel serverless function)
# Production: leave as /api/news when same domain
# VITE_NEWS_API_URL=/api/news
# Optional auth token (client -> backend)
# VITE_NEWS_API_KEY=replace_with_random_token
# Backend token (set on server only, do NOT prefix with VITE_)
# NEWS_BACKEND_TOKEN=replace_with_same_random_token
```

Restart the dev server after changing `.env` (`npm run dev`).

### Vercel

For deployments on [Vercel](https://vercel.com), add the same variables in **Project → Settings → Environment Variables**. Use the exact names above (e.g. `VITE_MAPBOX_ACCESS_TOKEN`). Add them for **Production**, and optionally for **Preview** and **Development**. Redeploy after adding or changing variables.

---

## 2. Mapbox (3D globe) and satellite imagery

- Create a free account at [Mapbox](https://account.mapbox.com/) and open [Access tokens](https://account.mapbox.com/access-tokens/).
- Create a default public token (or use an existing one) and set `VITE_MAPBOX_ACCESS_TOKEN` in `.env`.
- On the Intelligence page, use the **3D Globe** toggle to see the Earth with satellite imagery, 3D terrain, and atmosphere. **3D buildings** appear when you zoom in (around zoom 14+) in areas where the style provides building data. Flights and ships appear as points on the globe; click the map to set the selected area and view weather/cameras. **Traffic** (road congestion) can be toggled in the right panel when in 3D view; it uses Mapbox Traffic v1 and shows congestion levels (green → yellow → orange → red) on roads, updated about every 5–8 minutes.

### How often is satellite imagery updated?

- **Mapbox Satellite** (used in this app) is **not** updated on a fixed schedule (e.g. not daily). Mapbox refreshes imagery when new data is available; priorities depend on region, usage, and their own releases. You get the latest tiles automatically when you load the map; there is no way in this app to force more frequent refreshes.
- For **more frequently updated** or **daily** satellite imagery you would need a different provider (e.g. Planet, Maxar, or other commercial feeds that offer daily or near–real-time updates). Those typically require a separate subscription and integration; they are not included in the current Mapbox-based setup.

---

## 3. AISHub (real ship / AIS data)

- Sign up at [AISHub](https://www.aishub.net/). To get free API access you may need to share your own AIS feed; see their site for current terms.
- In the dashboard, get your **username** and **API key**.
- Set `VITE_AISHUB_USERNAME` and `VITE_AISHUB_KEY` in `.env`.
- **Rate limit:** free tier is typically **1 request per minute**. The app requests ships on an interval; keep the ships refresh at 60s or higher to avoid exceeding the limit.

---

## 4. Weather radar overlay

The map can show a radar tile layer if you provide a tile URL.

- **OpenWeatherMap:** Subscribe to a plan that includes radar tiles. Then use:
  `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=YOUR_OPENWEATHERMAP_KEY`
  Set `VITE_RAINVIEWER_TILE_URL` to that URL (with your key).
- **RainViewer:** They often require a dynamic timestamp in the URL (you’d need to fetch their API for the latest frame). For a static URL, use their docs; if no static URL is available, leave `VITE_RAINVIEWER_TILE_URL` unset.

---

## 5. Windy: Forecast and Webcams (separate keys)

Windy uses **different API products** for weather and cameras. You can set one key per product, or a single legacy key for both.

- **Weather (Overview + Intel):** Create a key at [api.windy.com/keys](https://api.windy.com/keys) with **Point Forecast API** enabled. Set `VITE_WINDY_FORECAST_API_KEY` in `.env`. If unset, the app falls back to `VITE_WINDY_API_KEY`.
- **Webcams (Intel map):** Create a key with **Webcams API** enabled. Set `VITE_WINDY_WEBCAM_API_KEY` in `.env`. If unset, the app falls back to `VITE_WINDY_API_KEY`.
- **Legacy:** Setting only `VITE_WINDY_API_KEY` still works for both forecast and webcams if that key has both products enabled.

### Windy Point Forecast (weather)

- Get a key at [api.windy.com/keys](https://api.windy.com/keys) with **Point Forecast API** enabled.
- Set `VITE_WINDY_FORECAST_API_KEY` in `.env`. The Overview page weather card and Intel “Feeds at this area” weather use this for current conditions, hourly and 7‑day forecast (Jamaica center). Restart the dev server after changing `.env`.

### Windy Webcams (global cameras)

- Get a Webcams API key at [api.windy.com/keys](https://api.windy.com/keys) (enable **Webcams** product).
- Set `VITE_WINDY_WEBCAM_API_KEY` in `.env` (no quotes; the app trims whitespace). The app uses **API v3** with the `x-windy-api-key` header and requests webcams near the clicked or searched point (radius up to 200 km). Windy has a large global repository; preview image URLs expire after 10 minutes (free tier), so thumbnails may need a refresh by re-clicking the map or searching again.
- **If live feeds don’t appear:** (1) Confirm the key is for **Webcams API** (not only Weather). (2) New keys can take a few minutes to work globally. (3) **CORS / production:** Browsers cannot call Windy’s API directly from most hosts (e.g. Vercel). This repo includes **`api/windy-webcams.js`**: in production builds the app calls **`/api/windy-webcams`** (same origin). In **Vercel → Project → Environment Variables**, set **`WINDY_WEBCAM_API_KEY`** (or reuse `VITE_WINDY_WEBCAM_API_KEY` / `VITE_WINDY_API_KEY`) so the serverless function can add `x-windy-api-key` server-side. Redeploy after adding variables. To disable the proxy and use direct API (e.g. local tests), set **`VITE_WINDY_WEBCAM_PROXY_URL`=`0`**. (4) Try a well-covered location (e.g. search “London” or “Tokyo”) and click the map there before opening the right panel.
- **Webcam locations on the map:** After you click a point (or search and go there), webcams near that location load in the right-hand “Feeds at this area” panel. They also appear as **orange camera markers (📹)** on the **2D map**. In the layer control (top-right), ensure the **Webcams** overlay is checked. Switch to **2D** (not 3D globe) to see the markers; click a marker’s popup to open “Watch live”.
- **Preferred for “real camera feeds from around the world”.**

---

## 6. OpenWebcamDB (cameras near point)

- Sign up at [OpenWebcamDB](https://openwebcamdb.com/) and create an API key (Account → API key).
- Set `VITE_OPENWEBCAMDB_API_KEY` in `.env` to your key (used as **Bearer** token; base URL is `https://openwebcamdb.com/api/v1`).
- **v1 API:** The list endpoint does **not** include `stream_url`. The app loads nearby cameras from the list (with coordinates), then calls `GET /webcams/{slug}` for each to obtain the stream URL (see [API docs](https://openwebcamdb.com/docs/api) — *Breaking Changes*).
- **Priority:** If `VITE_OPENWEBCAMDB_API_KEY` is set, the app uses **OpenWebcamDB first**, then falls back to Windy if no cameras are found in range.
- **Live webcams only load after you click the map or search for a place** – then open the right-hand “Feeds at this area” panel. If you see “No webcams here”, try a well-covered city (e.g. London, Tokyo) or add **Windy** (see §5). The app fetches **one** list page and filters by distance; detail requests are rate-limited (few cameras per area). Sparse regions may still return none.

---

## 7. Vercel (production) deployment

For production (e.g. Vercel):

1. In the Vercel project **Settings → Environment Variables**, add the same variables with the **VITE_** prefix.
2. Redeploy so the build picks them up.
3. **Do not** expose secret keys in client-side code except where intended (e.g. `VITE_*` are embedded in the build). For AISHub/OpenWebcamDB, the keys are used in the browser; for higher security you could add a small backend proxy that holds the key and forwards requests.

### Production News Aggregation (GDELT + RSS)

This project now includes a serverless endpoint at `api/news.js` for Vercel:

- Route: `GET /api/news?bbox=lamin,lomin,lamax,lomax&limit=24`
- Sources: **GDELT** + **Google News RSS fallback**
- Returns normalized list expected by `src/data/newsFeed.js`

Recommended production setup:

1. Set `VITE_NEWS_API_URL=/api/news` in Vercel environment variables.
2. Generate a random token (32+ chars).
3. Set:
   - `VITE_NEWS_API_KEY=<token>` (frontend sends Bearer)
   - `NEWS_BACKEND_TOKEN=<token>` (backend verifies Bearer)
4. Redeploy.

Notes:

- If you do not set `NEWS_BACKEND_TOKEN`, endpoint still works (open).
- In local `npm run dev`, `/api/news` is not served by Vercel functions. Use:
  - `vercel dev`, or
  - point `VITE_NEWS_API_URL` to your deployed URL.

---

## 8. No setup

If you skip all of the above:

- **Flights:** OpenSky (no key) – works worldwide for the visible map bounds.
- **Ships:** Mock data in the current map bounds.
- **Search:** Nominatim (no key) – geocode and fly to place.
- **Weather at point:** Open-Meteo (no key) – when you click or search.
- **Disasters / Earthquakes:** GDACS and USGS (no key).
- **Cameras:** Demo list when you click or search.
- **Radar:** Layer is hidden if `VITE_RAINVIEWER_TILE_URL` is not set.

No API keys are required for the core experience.

---

## 9. Demo users (Supabase)

Six **role-specific** demo accounts are defined in `src/constants/demoAccounts.js` (emails like `demo-executive@dris.local`). They share one password for walkthroughs:

- Default password: **`DRIS-Demo-2026!`** — override with **`VITE_DEMO_PASSWORD`** in `.env` if you like.

**Create users in your Supabase project** (one-time, from the repo root, with `.env` containing **`SUPABASE_SECRET_KEY`** or **`SUPABASE_SERVICE_ROLE_KEY`** (same service-role value from the dashboard) and **`VITE_SUPABASE_URL`** or **`SUPABASE_URL`**):

```bash
npm run seed:demo
```

The script creates confirmed Auth users (or resets their password if they already exist) and sets **`public.profiles.role`** for each.

**Sign-in page:** Whenever **Supabase** is configured, a **Demo logins** panel lists every role with a **Use** button (fills email + password) and **Copy** for the password — in dev and in production builds so evaluators can try flows quickly. To hide that panel (e.g. a live site with only invited users), set **`VITE_HIDE_DEMO_LOGIN=1`** in the deployment environment.

---

## 10. Roles, invitations, and “who can do what”

These roles live on **`public.profiles.role`** and in invitation metadata (`user_invitations.intended_role`). **Platform admin** is the global operator: use **`/app/platform-admin`** to invite users by email (Edge Function `invite-user`) and grant **`user_country_access`** (Jamaica / United States in v1). Invited users get scopes from **`user_invitation_scopes`** when they accept (`apply_pending_invitation` RPC after first sign-in).

| Role | Typical use |
|------|-------------|
| **platform_admin** | Create invitations for any supported role; grant country access; full catalog visibility. |
| **country_admin** | National “control tower” (`/app/admin`) — operational admin for a country (pair with country access rows). |
| **country_executive** | National dashboard + score heat map (`/app/executive`). |
| **parish_manager** | Subnational manager view (`/app/manager`). |
| **data_officer** | Scorecard / KPI validation workspace (`/app/workspace/data`) — connect to Supabase evidence tables as you build flows. |
| **field_user** | Field submissions (`/app/workspace/field`) — connect for capture and document uploads. |
| **auditor** | Read-focused audit surface (`/app/audit`). |

**“Admins per location” today:** invite **`country_admin`** (or **country_executive**) and restrict where they work using **`user_country_access`** and **`user_jurisdiction_access`** (parish / state rows in migrations). A future increment can let **country_admin** invite users only inside their country (RLS on `user_invitations`). **Evidence uploads** for inventory are intended around **`kpi_submission_evidence`** / Storage in migrations; wire the workspace UIs when ready.

**Executive map (Jamaica):** Parish outlines use **GADM 4.1** boundaries in `src/data/geo/jmGadm41Parishes.json` (see `jmParishBoundaryGeo.js`). US states still use centroid circles until a similar boundary layer is added.
