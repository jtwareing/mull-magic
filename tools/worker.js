// Mullaney Magic play counter (Cloudflare Worker + KV namespace bound as COUNTS)
// POST /hit  {"game":"mulldle","date":"2026-10-28","result":"won"|"lost","score":7}  -> adds 1 (and the score, if sent)
// GET  /stats -> table of daily counts for every game
const SITE = "https://mullaneymagic.co.uk";
const GAMES = ["mulldle", "six", "link", "avg"];

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = { "Access-Control-Allow-Origin": SITE, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    if (req.method === "POST" && url.pathname === "/hit") {
      const { game, date, result, score } = await req.json().catch(() => ({}));
      if (!GAMES.includes(game) || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
        return new Response('{"ok":false}', { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      }
      const add = { [`${game}:${date}:played`]: 1 };
      if (result === "won" || result === "lost") add[`${game}:${date}:${result}`] = 1;
      if (Number.isInteger(score) && score >= 0 && score <= 10) add[`${game}:${date}:score`] = score;
      for (const [k, n] of Object.entries(add)) {
        const cur = parseInt((await env.COUNTS.get(k)) || "0", 10);
        await env.COUNTS.put(k, String(cur + n));
      }
      return new Response('{"ok":true}', { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (url.pathname === "/stats") {
      const rows = {};
      let cursor;
      do {
        const page = await env.COUNTS.list({ cursor });
        for (const { name } of page.keys) {
          const [game, date, kind] = name.split(":");
          rows[date] ??= {};
          rows[date][`${game}:${kind}`] = parseInt((await env.COUNTS.get(name)) || "0", 10);
        }
        cursor = page.list_complete ? null : page.cursor;
      } while (cursor);
      const dates = Object.keys(rows).sort().reverse();
      const c = (d, k) => rows[d][k] ?? 0;
      const avg = d => c(d, "avg:played") ? (c(d, "avg:score") / c(d, "avg:played")).toFixed(1) + "/10" : "–";
      const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mullaney Magic plays</title>
<style>body{font-family:system-ui,sans-serif;margin:24px;color:#0d2a1d}table{border-collapse:collapse;font-variant-numeric:tabular-nums}th,td{padding:6px 10px;border-bottom:1px solid #cfdcd2;text-align:right;white-space:nowrap}th:first-child,td:first-child{text-align:left}thead th{background:#00573f;color:#fff}thead tr:first-child th{background:#0d2a1d}.wrap{overflow-x:auto}</style>
<h1>Mullaney Magic: daily plays</h1>
<p>Finished games per day (UK date). One count per game per device per day.</p>
<div class="wrap"><table><thead>
<tr><th></th><th colspan="3">Mulldle</th><th colspan="3">Six Degrees</th><th colspan="3">The Missing Link</th><th colspan="2">Better Than Mull?</th></tr>
<tr><th>Date</th><th>Played</th><th>Solved</th><th>Not solved</th><th>Played</th><th>Completed</th><th>Duck</th><th>Played</th><th>Correct</th><th>Duck</th><th>Played</th><th>Avg score</th></tr>
</thead><tbody>
${dates.map(d => `<tr><td>${d}</td><td>${c(d,"mulldle:played")}</td><td>${c(d,"mulldle:won")}</td><td>${c(d,"mulldle:lost")}</td><td>${c(d,"six:played")}</td><td>${c(d,"six:won")}</td><td>${c(d,"six:lost")}</td><td>${c(d,"link:played")}</td><td>${c(d,"link:won")}</td><td>${c(d,"link:lost")}</td><td>${c(d,"avg:played")}</td><td>${avg(d)}</td></tr>`).join("") || '<tr><td colspan="12">No plays yet</td></tr>'}
</tbody></table></div>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new Response("Mullaney Magic counter", { headers: cors });
  },
};
