# HT TRADES

A third-party Deriv trading workspace. Upload the folder to any HTTPS web host and open `index.html`.
Flow: loading screen → landing page → log in → workspace.

## Workspace tabs
Overview: Dashboard | Bots: Quick Bot · Bot Builder · Free Bots · Premium Bots · Auto Trader |
Trade: Manual Trader · Bulk Trader · Copy Trading | Market: Charts · Analysis Tools · Signals · Signal AI | Risk: Risk Calculator.
Theme: Midnight Emerald & Gold (css/theme.css).
The menu button (left of the tabs) also opens Speed Lab, Reports and Tutorials.
Every tab has its own link, e.g. `index.html#/auto-trader`.

| Tab | What it does |
|---|---|
| Dashboard | Greeting, load a bot (computer: .json, .xml, .txt, .bot, .dbot / Drive), Bot Builder, Quick strategy, King of Matches, Speed Lab, help cards |
| Bot Builder | Block workspace: trade parameters, purchase, sell (optional), restart conditions, analysis and utility blocks. Drag blocks, drop optional ones on the bin, zoom, undo/redo, save/load, Quick strategy |
| Free Bots | 34 ready bots with search and filters (Premium, Popular, Automated, New, Normal) |
| Premium Bots | 6 advanced bots, unlocked after Deriv login |
| Quick Bot | Panel layout you can drag and reset, live analysis toggle |
| Signal AI | Scans markets for the contract with the best observed edge; live watch mode |
| Bulk Trader | Digit circles, E/O stream, buy N contracts at once, AI Scanner, auto trader |
| Manual Trader | DTrader-style: Accumulators, Rise/Fall, Even/Odd, Over/Under, Matches/Differs, open positions with Sell, last-digit bubbles on the chart, win/lose pop-up when a contract closes |
| Copy Trading | API token enrollment (needs your backend, see below) |
| Charts | Area / candle chart, indicators, zoom, Summary · Transactions · Journal |
| Analysis Tools | Analysis Tools, Trading View, DP Tool, Smart Edge, Xenon Tick, Bot Analysis |
| Auto Trader | Six condition cards ("If the last 5 digits are Even then trade Even"), add conditions, per-card settings |
| Signals | Live signal cards for every market, refreshed every 10 s |
| Risk Calculator | Safe stake, stop-loss, take-profit, stake ladder and a plan; applies to Quick Bot |

Dock: Run (main bot), Execution SLOW/FAST (FAST lets a bot hold up to 3 contracts), live status.

## Login (same flow as VolaTrades)
User clicks **Log in** → Deriv's sign-in page (email + password) → Deriv redirects back to HT TRADES → signed in.

HT TRADES uses ONE Deriv app id for everything (sign-in page and trading connection), like VolaTrades:
1. In Deriv's API dashboard register an app for HT TRADES (scopes Read and Trade).
2. Set its redirect URL to HT TRADES' exact address, e.g. `https://httrades.com/`
   (https, same www-or-not, same trailing slash). Do NOT reuse VolaTrades' app id: its redirect URL points to VolaTrades.
3. Put the id in `js/config.js` → `APP_ID`.

If people stay on Deriv after signing in, the redirect URL saved in step 2 doesn't match the site address.

## Configuration (js/config.js)
`APP_ID` (your HT TRADES app id), `AFFILIATE` (optional), `SIGNUP_URL`, `API_BASE` (copy trading server).

## Copy trading backend
`GET /copy/status`, `POST /copy/enroll {token}`, `POST /copy/start`, `POST /copy/stop` → `{enrolled, active, account, count}`.

## Files
    index.html            markup
    css/base.css boot.css landing.css   base, loading screen, landing page
    css/app.css           header, tabs, ticker, dock, drawer, assistant, controls, spinners
    css/pages.css         every page + trading tile background
    css/theme.css         colour theme (edit here to restyle)
    js/config.js core.js  settings, markets (14), storage, spinners
    js/chart.js           charts (area, candles, indicators, accumulator band)
    js/engine.js          contracts, bots, stake modes, accumulators, execution speed
    js/deriv.js           Deriv login redirect + return, balance, buy, sell
    js/kit.js             shared controls, bot files, 34 free + 6 premium bots
    js/p1.js .. p4.js     pages
    js/account.js ui.js help.js feed.js   account menu, shell, assistant, market data

Guests trade a simulated demo. Signals and analysis describe past ticks; Deriv's synthetic indices are random.
