export default async function handler(req, res) {
  // CORS + preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const token = "a39d766cdca37f795ec108d8f6a3bb6935cbb6bd6f13b26078ca9f8b590a";

  const { path = "matches", ...q } = req.query;

  const upstream = new URL(`https://widgets.oddspedia.com/api/${path}`);
  upstream.searchParams.set("api_token", token);

  for (const [k, v] of Object.entries(q)) {
    if (v == null) continue;
    upstream.searchParams.set(k, Array.isArray(v) ? v.join(",") : v);
  }

  try {
    const r = await fetch(upstream.toString(), {
      headers: {
        "Accept": "application/json,text/plain,*/*",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://widgets.oddspedia.com/",
      },
    });

    const text = await r.text();

    // кэш на стороне Vercel edge (чуть разгрузит)
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(502).json({ error: String(e?.message || e) });
  }
}
