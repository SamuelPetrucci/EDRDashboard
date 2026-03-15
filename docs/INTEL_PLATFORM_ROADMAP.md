# Intelligence Platform Roadmap: Global Feeds, Weather, Cameras & Search-by-Area

This document outlines how to extend the EDR Dashboard into a world-scale intelligence view with **real global flights**, **real maritime (AIS)**, **weather radar**, **other intel layers** (disasters, earthquakes), **worldwide camera feeds**, and **search or click on the map** to see feeds for that area.

---

## 1. Full World Real Flights

**Current:** OpenSky API with Jamaica-only bounding box.

**Options:**

| Approach | Pros | Cons |
|----------|------|------|
| **A) Global request** | One call, all flights. | OpenSky `/states/all` with *no* bbox returns global data but is **rate-limited** (e.g. ~1 req/10s anonymous). Heavy payload. |
| **B) Map-bounds request** | Only fetch what’s visible; pan/zoom anywhere = “world” coverage. Lighter payload, respects rate limits. | Need to pass current map bounds into the feed. |

**Recommendation:** **B) Dynamic bbox from map bounds.**  
- When the user pans/zooms, use the current Leaflet map bounds (`map.getBounds()`) as the bbox for `fetchFlightsInBounds(bbox)`.  
- Default start remains Jamaica; user can pan to any region and see live flights there.  
- Optional: add a “World” mode that calls `/states/all` with no bbox (and throttle to e.g. every 30s) for a global view.

**Implementation:**  
- Add a ref to the map or use `useMap()` in a child component to read `getBounds()` and derive `{ lamin, lomin, lamax, lomax }`.  
- Pass that bbox into the flight fetch (and optionally ship fetch).  
- Debounce bounds changes (e.g. 500ms) so we don’t refetch on every tiny pan.

---

## 2. Real Boat / Ship Radar (AIS)

**Current:** Mock ship data in Jamaica.

**Options:**

| Source | Type | Auth | Coverage | Notes |
|--------|------|------|----------|--------|
| **AIS Stream** | WebSocket | API key (free signup) | Global | Real-time stream; filter by bbox. Good for live “radar”. |
| **AISHub** | REST | Username/key (free, share AIS to get access) | Global | 1 request/min; bbox filter. |
| **Marinesia** | REST | API key | Global | Free tier very limited (e.g. 1/30min). |

**Recommendation:**  
- **Primary:** **AIS Stream** (WebSocket) for real-time ship positions; filter by current map bbox.  
- **Fallback:** AISHub REST if you prefer request/response and can respect 1 req/min (e.g. for “Ships” overlay refresh).

**Implementation:**  
- Store API key in env (e.g. `VITE_AISSTREAM_API_KEY` or backend-only and proxy).  
- **If CORS blocks:** add a small backend (e.g. Vercel serverless) that opens the AIS Stream WebSocket or calls AISHub and proxies results to the frontend.  
- Normalize AIS positions to the same movement shape as flights (`id`, `lat`, `lng`, `type: 'ship'`, `speed`, `heading`, `meta: { name, shipType, mmsi }`).  
- Reuse existing ship markers and anomaly logic; switch `maritimeFeed.js` from mock to real API (or feature-flag).

---

## 3. Weather Radar & Weather Intel

**Options:**

| Layer | Source | Auth | Notes |
|-------|--------|------|--------|
| **RainViewer** | `https://tile.rainviewer.com/...` | Free (check ToS) | Radar overlay tiles; often used as overlay on Leaflet. |
| **OpenWeatherMap** | Radar tile URL | API key | `tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=KEY` |
| **Open-Meteo** | No radar tiles; API only | Free | Good for “weather at clicked point” (temp, wind, conditions). |

**Recommendation:**  
- Add **RainViewer** (or OpenWeatherMap if you already have a key) as a **LayerControl overlay** “Weather radar” so users can toggle it on the map.  
- Optional: when user **clicks** a point or **searches** a place, show a small “Weather” card (e.g. Open-Meteo one-call) for that location.

**Implementation:**  
- New entry in overlay config (e.g. in `intelSources.js`): radar tile URL + attribution.  
- In Intel map, add `LayersControl.Overlay` “Weather radar” with a `TileLayer` for the radar tiles.  
- Optional: geocode search or click → call Open-Meteo for lat/lng → show weather in side panel or popup.

---

## 4. Other Intelligence Layers

| Layer | Source | Data | Auth |
|-------|--------|------|------|
| **Disaster alerts** | GDACS | GeoJSON; EQ, TC, FL, VO, WF, DR | Free |
| **Earthquakes** | USGS | GeoJSON feed / FDSN event API | Free |
| **Wildfires** | NIFC / NASA FIRM | GeoJSON or tiles | Free (some need key) |

**GDACS:**  
- API: `https://www.gdacs.org/gdacsapi/api/Events/geteventlist/SEARCH` (with query params for event type, date, alert level).  
- Returns GeoJSON; add as a Leaflet GeoJSON layer or cluster of markers.

**USGS Earthquakes:**  
- `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4&starttime=...`  
- Optional bbox: `minlatitude`, `maxlatitude`, `minlongitude`, `maxlongitude`.

**Recommendation:**  
- Add **GDACS** and **USGS earthquakes** as overlay layers (markers or GeoJSON).  
- Toggles in Layers control: “Disaster alerts (GDACS)”, “Earthquakes (USGS)”.  
- Fetch on interval (e.g. 5–10 min); optional filter by current map bbox to reduce payload.

**Implementation:**  
- `src/data/gdacsFeed.js` (or `alertsFeed.js`): fetch GDACS API, normalize to GeoJSON or `{ lat, lng, type, severity, label }`.  
- `src/data/earthquakeFeed.js`: fetch USGS, normalize.  
- In Intel map, add overlay layers that render markers or `GeoJSON` layer from these feeds.

---

## 5. Worldwide Camera Feeds

**Options:**

| Source | Query | Auth | Notes |
|-------|--------|------|--------|
| **Helios** | Point + radius or bbox (GeoJSON) | Likely key | Cameras by location. |
| **OpenWebcamDB** | By country / region | Free tier 50 req/day | List of cams; can filter by area. |

**Recommendation:**  
- Use **Helios** (or OpenWebcamDB) to “**cameras near this point**” when user **clicks** the map or **searches** a place.  
- Show results in a side panel: “Cameras near [place]” with thumbnails/links to live streams.

**Implementation:**  
- **Search:** Geocode search string (e.g. Nominatim) → get lat/lng → call camera API for that point (radius e.g. 20 km).  
- **Click:** Map click → get lat/lng → same camera API.  
- New component or panel: “Feeds for this area” that lists cameras (and optionally weather, flight count, ship count) for the selected point or bbox.

---

## 6. Search or Click on Area to See Feeds

**Requirements:**  
- **Search:** User types a place name (e.g. “Montego Bay”, “Tokyo”) → map flies to that location; optionally show a “Feeds for this area” panel.  
- **Click:** User clicks the map → set “area of interest” (point or small bbox) → show panel with feeds for that area: flights count, ships count, cameras list, weather snippet, alerts.

**Geocoding:**  
- **Nominatim (OSM):** `https://nominatim.openstreetmap.org/search?q=...&format=json` — free, no key; use responsibly (rate limit, User-Agent).  
- Alternative: Mapbox/Google Geocoding (API key).

**Implementation outline:**  
1. **Search box** in Intel header or sidebar:  
   - On submit → Nominatim geocode → get `lat`, `lon`, `boundingbox`.  
   - `map.flyTo([lat, lon], zoom)` (and optionally set a “selected point” or “selected bbox” state).  
2. **Map click handler:**  
   - On map click → get `latlng` → set state `selectedPoint = { lat, lng }` (or bbox around point).  
3. **“Feeds for this area” panel:**  
   - Shows when `selectedPoint` or search result is set.  
   - Content:  
     - **Flights:** Count (or list) in current map bounds (or in radius around point).  
     - **Ships:** Same.  
     - **Cameras:** List from Helios/OpenWebcamDB for that point.  
     - **Weather:** Open-Meteo (or similar) for that point.  
     - **Alerts:** GDACS / USGS events in bbox (optional).  
   - “Clear” or clicking elsewhere clears the panel.

**Data flow:**  
- Feeds (flights, ships) can already be driven by **map bounds** (see §1). So “feeds for this area” is consistent with the current view when the user has panned to that area.  
- For **click**, we can define “area” as either (a) current map bounds, or (b) a radius (e.g. 50 km) around the clicked point.  
- Camera and weather APIs are point-based, so use clicked point or search result lat/lng.

---

## 7. Suggested Implementation Order

1. **Map-bounds–driven feeds**  
   - Use current map bounds for flight (and ship) fetch so pan/zoom gives “world” coverage.  
   - Keeps one code path; no separate “global” mode yet.

2. **Search + flyTo**  
   - Geocoding (Nominatim) + search box; map flies to result; set `selectedPoint` for the panel.

3. **Click-to-area + “Feeds for this area” panel**  
   - Map click → set selected point/bbox → show panel with counts (flights, ships), weather for point, placeholder for cams.

4. **Weather radar overlay**  
   - Add RainViewer (or OWM) as overlay layer.

5. **Real AIS**  
   - Replace mock with AIS Stream or AISHub; backend proxy if needed; env for API key.

6. **GDACS + USGS earthquakes**  
   - New overlay layers; fetch and show markers/GeoJSON.

7. **Camera feed integration**  
   - Helios or OpenWebcamDB for “cameras near this point”; show in “Feeds for this area” panel.

8. **(Optional) Global flight mode**  
   - Toggle “World” that calls OpenSky with no bbox, throttled.

---

## 8. File / Config Summary

| Item | Action |
|------|--------|
| **intelSources.js** | Add radar overlay config; optional GDACS/USGS endpoints. |
| **flightFeed.js** | Support optional bbox (null = global); caller passes map bounds. |
| **maritimeFeed.js** | Replace mock with AIS Stream or AISHub; env key; optional proxy. |
| **gdacsFeed.js** (new) | Fetch GDACS API; return events as GeoJSON or marker list. |
| **earthquakeFeed.js** (new) | Fetch USGS; return events. |
| **cameraFeed.js** (new) | Fetch Helios/OpenWebcamDB for point/radius. |
| **geocode.js** (new) | Nominatim search; return lat, lon, bbox. |
| **Intel.jsx** | Map ref or useMap; bounds → fetch; search box; map click → selected point; “Feeds for this area” panel; overlay layers (radar, GDACS, earthquakes). |
| **Backend** (optional) | Vercel serverless: proxy AIS (and optionally geocode or camera) to hide keys and avoid CORS. |

---

## 9. Environment Variables

- `VITE_AISSTREAM_API_KEY` or `VITE_AISHUB_KEY` — for real AIS.  
- `VITE_OPENWEATHERMAP_KEY` — if using OWM radar.  
- Backend-only (if using proxy): `AISSTREAM_API_KEY`, `HELIOS_API_KEY`, etc.

This roadmap keeps the existing Jamaica-focused dashboard intact while extending the Intel map into a **worldwide**, **searchable**, **click-to-area** intelligence and weather radar platform with real flights, real ships, disasters, earthquakes, and camera feeds.
