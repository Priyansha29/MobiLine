# IVGuard — Live IV Tubing Safety Monitor

A single-screen, non-interactive **patient-side display** for an academic
engineering prototype. It polls a real ESP32 sensor node over Wi-Fi and shows
tubing tension, drip rate, structure angle and movement —
readable from across a room, with plain-language status at the top.

> **Prototype — not a medical device.**
> Every threshold is a demonstration value chosen to exercise the alert
> behaviour. Nothing here is clinically validated and nothing here should be
> used for diagnosis or treatment decisions.

The dashboard is deliberately **one fixed screen**: no navigation, tabs,
buttons, search, filters or forms. It is authored at 1920×1080 and then scaled
to fit the display, so the whole screen is always visible at once (no scrolling)
on any monitor, framed by black where the screen's shape differs.

---

## What it shows

| Panel | Reading | Unit | Notes |
| --- | --- | --- | --- |
| **Tubing Tension** | Load-cell force | N | Prototype warning 0.70 N, critical 1.00 N |
| **Drip Rate** | Drop-counter rate | drops/min | Drop count only; **not** calibrated to mL/hour |
| **Structure Angle** | MPU6500 tilt | ° | Label matches the MPU6500 mounting |
| **Structure Movement** | MPU6500 motion flag | — | `STABLE` / `MOVEMENT DETECTED` |

Plus two rolling **120-second trend charts** (tension and drip rate) with clear
axes, units and gaps where samples are missing, a **recent events** feed built
only from real readings and connection changes, and a compact link/diagnostics
strip.

### Status is never colour-only

Every status is carried by an **icon + a word + colour**, so it is legible to
colour-blind viewers and in poor lighting. The vocabulary is:

`NORMAL` · `WARNING` · `CRITICAL` · `DATA STALE` · `CONNECTION LOST` · `NOT CONFIGURED`

A `CRITICAL` assessment stays on screen until the condition clears.

### Missing data is never faked

A sensor field that is missing or unparseable becomes `null` and renders as
`—`. The dashboard **never fabricates a zero** and **never falls back to mock
data**. If the device stops answering it keeps the last known values but marks
them stale ("On-screen values are the last known readings, not live data").

---

## Data source

The dashboard polls:

```
GET <API_BASE>/data
```

every **750 ms** (inside the 500–1000 ms range the brief asks for), aborting any
request that has not answered within **2.5 s**. If no successful sample arrives
for **3.5 s** the status becomes `DATA STALE`; if the endpoint was never
reachable, repeated failures become `CONNECTION LOST`.

### Endpoint configuration

The base URL is resolved at runtime, in this order:

1. **`window.IVGUARD_API_BASE`** — set in `public/config.js`. Lets an
   already-built kiosk install be pointed at a device **without rebuilding**.
2. **`VITE_API_BASE`** — Vite build-time environment variable (`.env.local`).

If neither is set, the screen shows **`NOT CONFIGURED`** and does nothing else —
it never pretends to be live.

```js
// public/config.js
window.IVGUARD_API_BASE = 'http://192.168.4.1'   // http://host or http://host/data
```

```bash
# .env.local
VITE_API_BASE=http://192.168.4.1
```

The base may be `http://host`, `http://host/` or a full `http://host/data` URL;
`/data` is appended when it is missing.

### Payload contract

One JSON object per request. Field aliases are accepted in brackets:

```json
{
  "timestamp": 183421,
  "tension": 0.42,
  "bed_angle": 1.1,
  "drip_rate": 18,
  "movement": false,
  "acceleration": 1.002,
  "accel_x": 0.021,
  "accel_y": -0.014,
  "accel_z": 1.001,
  "status": "NORMAL"
}
```

| Field | Alias(es) | Meaning |
| --- | --- | --- |
| `timestamp` | — | ms since ESP32 boot (uptime) |
| `tension` | `tension_n` | newtons |
| `bed_angle` | `angle` | MPU6500 tilt, degrees |
| `drip_rate` | `drips` | drops per minute |
| `movement` | — | boolean motion flag |
| `acceleration` / `accel_x` / `accel_y` / `accel_z` | — | g |
| `status` | — | `NORMAL` \| `WARNING` \| `CRITICAL` (advisory input) |

A response may also be wrapped as `{ "data": { … } }`. A payload containing none
of the known telemetry fields is treated as unusable (so a stray HTML error page
is never mistaken for a reading).

### CORS requirement

The dashboard runs in a browser, so the ESP32's HTTP server **must send CORS
headers** on `GET /data`, otherwise the request is blocked before any data
arrives. Add at minimum:

```
Access-Control-Allow-Origin: *
```

and handle the `OPTIONS` preflight (return `204`). The test simulator in
`scripts/mock-esp32.mjs` sends exactly the headers the firmware should send and
is a good reference.

---

## Thresholds and status rules

All thresholds live in one place — `src/lib/thresholds.ts` — and are labelled
**"prototype"** wherever they appear.

| Rule | Value |
| --- | --- |
| Tension warning | ≥ 0.70 N |
| Tension critical | ≥ 1.00 N |
| Drip rate low (advisory) | < 10 drops/min |
| Drip change (advisory) | ±50% from the recent baseline |
| No drops (advisory) | 0 drops sustained 5 s |
| Structure tilt elevated | ≥ 45° |

Tension mirrors the firmware's demonstration limits. Drip and tilt
warnings are **frontend-only advisories**, not firmware thresholds.

Status is assessed in a fixed precedence — not configured → connection →
staleness → tension → movement-with-elevated-tension → drip → the
device's own `status` field — so the banner never contradicts itself. **Movement
alone is not a system warning**; only movement combined with elevated tension
escalates. The wording "movement detected" deliberately avoids claiming
a confirmed patient event, which the prototype cannot distinguish.

---

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · lucide-react · oxlint

Fetching and processing are kept separate from presentation: `src/hooks/useDeviceData.ts`
owns the polling, history, link state, assessment and event generation; the
components receive only plain values.

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

On Windows, use `npm.cmd` / `npx.cmd` if PowerShell blocks `npm.ps1`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check, then production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | oxlint |
| `npm run mock:esp32` | Start the **test-only** ESP32 simulator on `:8099` |
| `npm run qa:smoke` | Browser smoke test (needs a running dev server) |

### Running against the real prototype

The ESP32 runs its own Wi-Fi access point (or joins a phone hotspot). Read the
IP address from the ESP32 Serial Monitor, then either:

```bash
# build-time (dev or build)
VITE_API_BASE=http://192.168.4.1 npm run dev
```

or set it at runtime for an installed build by editing `public/config.js`:

```js
window.IVGUARD_API_BASE = 'http://192.168.4.1'
```

Make sure the machine running the browser is on the **same network** as the
ESP32 and that the firmware sends the CORS header above.

---

## Test-only simulator

`scripts/mock-esp32.mjs` is **not part of the dashboard** and is never used at
runtime. It exists only so the UI can be exercised without hardware, sending the
same payload shape and CORS headers the firmware should send:

```bash
npm run mock:esp32            # http://localhost:8099/data
MOCK_PORT=9000 npm run mock:esp32
VITE_API_BASE=http://localhost:8099 npm run dev
```

It rotates through normal → movement → tension warning → critical → recovery →
drip change every 20 s so every on-screen state can be observed.

---

## QA scripts

Development-only Puppeteer audits in `scripts/`. They drive real Chrome, so set
`CHROME_PATH` if Chrome is not at the default location, and start the relevant
server first.

| npm script | File | What it checks |
| --- | --- | --- |
| `npm run qa:smoke` | `scripts/qa-smoke.mjs` | Title, panels, live values update, no scroll at 1920×1080, no console errors |
| `npm run qa:layout` | `scripts/qa-layout.mjs` | Panel geometry, clipped text and overflow at several sizes |
| `npm run qa:states` | `scripts/qa-states.mjs` | `LIVE → DATA STALE → reconnect` (stops, then restarts the simulator) and `NOT CONFIGURED` |
| `npm run qa:shots` | `scripts/qa-shots.mjs` | Captures `preview/*.png` at chosen phases/sizes |

```bash
# terminal 1
npm run mock:esp32
# terminal 2
VITE_API_BASE=http://localhost:8099 npm run dev
# terminal 3
$env:DASH_URL='http://localhost:5173'; $env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run qa:states
```

Latest run: smoke 8/8 · states (live→stale→reconnect) 9/9 · states (not configured) 4/4 ·
lint 0 warnings / 0 errors · fits with no scroll at 2560×1440, 1920×1080,
1600×900, 1366×768, 1280×720 and 1024×600.

The dashboard is authored at a fixed 1920×1080 logical size and **scaled to fit**
the display as one unit (`src/components/layout/ScaledStage.tsx`). The entire
interface is therefore always visible at once — no scrolling and no clipped
panels at any resolution — and any leftover space becomes a black letterbox
frame around the screen. Because only the scale changes, the layout and its
animations are identical everywhere.

---

## Project structure

```
src/
  config.ts                 Endpoint resolution + polling configuration
  components/
    DashboardScreen.tsx     Composes the whole single screen
    StatusBanner.tsx        Dominant safety status
    MeasurementPanel.tsx    Shared measurement shell
    measurements/           Tension, Drip, Tilt, Movement panels
    trends/TrendChart.tsx   Rolling Recharts trend with null gaps
    RecentEvents.tsx        Non-interactive event feed
    DeviceLinkPanel.tsx     Link + threshold diagnostics strip
    layout/                 ScaledStage (scale-to-fit), Header, Footer, BrandMark
    ui/                     Gauge, AngleGauge, Sparkline, StatusPill, Switch
  hooks/useDeviceData.ts    Polling, history, link state, assessment, events
  lib/
    deviceClient.ts         /data fetch loop + payload normaliser
    status.ts               Prototype assessment rules
    thresholds.ts           All thresholds in one place
    events.ts               Reading/connection changes → event entries
    format.ts, statusVisuals.ts, charts/theme.ts
  types/reading.ts          Device reading contract
public/config.js            Runtime endpoint override
scripts/                    Test-only simulator + QA audits
```

---

## Design decisions worth knowing

- **Status first, plain language.** The banner answers "is the line okay?" in
  2–3 seconds; alerts say "Inspect the IV tubing", never a diagnosis.
- **Honest by construction.** No mock data, no fabricated zeros, and no "live"
  claim unless a valid response was recently received.
- **Calm hospital palette.** Light canvas, restrained cards, no gradients or
  glassmorphism, and red reserved strictly for critical so it always means
  "act now".
- **Accessibility.** Icon + word + colour for every state, a skip link, visible
  focus rings, `aria-live` announcements of the verdict (not every number), and
  `prefers-reduced-motion` respected.
- **Non-interactive.** Nothing to click, focus or configure on screen.
- **One screen, always.** The whole dashboard is rendered at a fixed logical size
  and scaled to fit, so it never scrolls or clips and looks identical on every
  display; leftover space is a black frame.

---

## Known limitations

- Thresholds are uncalibrated placeholders and have not been tested against real
  patients or a real load cell.
- The drip sensor counts drops; a partial occlusion can read as a changed rate,
  and a kinked line may not change the drop count at all. Flow is not reported
  in mL/hour.
- History and events are in memory only — a page refresh starts a new session.
- No authentication; the dashboard assumes a trusted local network.

---

## Prototype disclaimer

IVGuard is a student engineering prototype built to demonstrate a monitoring
interface and alert workflow. It is **not a medical device**, has not been
clinically validated, and must not be used for diagnosis or treatment decisions.
All thresholds shown are illustrative and require calibration and clinical
sign-off before any real-world use.
