# Mullaney Magic: daily game stats

How many people finish each daily game, every day:

| Game | What's counted |
|---|---|
| Mulldle | Played · Solved · Not solved |
| Six Degrees | Played · Completed · Out for a duck |
| The Missing Link | Played · Correct · Out for a duck |
| Better Than Mull? | Played · Average score out of 10 |

It runs on a free Cloudflare Worker in your own Cloudflare account, with Cloudflare's KV storage. The free plan allows 1,000 storage writes a day. Each finished game uses one or two, so it covers several hundred finished games a day.

Visitor numbers (visits, countries, devices) are separate. They're in **Cloudflare → Analytics & Logs → Web Analytics**, which is already set up.

## Setup (about 10 minutes)

Cloudflare renames menus from time to time. If a label doesn't match exactly, look for the closest one.

### 1. Create the storage
1. Log in at **dash.cloudflare.com**.
2. Go to **Storage & Databases → KV**. On some accounts it's under **Workers & Pages → KV**.
3. Click **Create**, name it `mullaney-counts`, and save.

### 2. Create the Worker
1. Go to **Workers & Pages → Create → Create Worker**. The "Hello World" starter is fine.
2. Name it `mullaney-counter` and click **Deploy**.
3. Click **Edit code**, delete everything in the editor, and paste in the whole of `worker.js` (in the `tools` folder of the GitHub repository, next to this guide).
4. Click **Deploy**.

### 3. Connect the storage to the Worker
1. Open the Worker, then **Settings → Bindings → Add → KV namespace**.
2. **Variable name:** `COUNTS` (capitals, exactly like that).
3. **KV namespace:** `mullaney-counts`.
4. **Save** (and **Deploy** if asked).

### 4. Check it works
Open the Worker's address with `/stats` on the end, for example:
`https://mullaney-counter.yourname.workers.dev/stats`

You should see a table saying **No plays yet**.

### 5. Switch counting on in the site
Send the Worker's address (without `/stats`) to Claude, or edit it yourself:
in `site/template.html`, set `const COUNTER_URL="https://mullaney-counter.yourname.workers.dev";`, rebuild with `python build_site.py`, and push the `pages` folder.

## Checking the stats

Bookmark `https://mullaney-counter.yourname.workers.dev/stats`. It shows one row per day (UK date), newest first, for all four games.

### Good to know
- **It counts finished games, not people.** Someone who plays on their phone and their laptop counts twice. Each device counts once per game per day.
- **It doesn't count games already finished before counting was switched on.** Numbers start from the day it goes live.
- **No personal details are sent.** Only the game, the date, solved or not, and (for Better Than Mull?) the score.
- **The stats page is public** to anyone who knows its address. It shows only totals, but don't post the link anywhere.
