import { performance } from "node:perf_hooks";

function normalizeUrl(value) {
  try {
    const parsed = new URL(value);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const normalizedUrl = normalizeUrl(body?.url);

    if (!normalizedUrl) {
      return Response.json({ error: "A valid public http(s) URL is required." }, { status: 400 });
    }

    const start = performance.now();

    try {
      const response = await fetch(normalizedUrl, {
        method: "GET",
        cache: "no-store",
        redirect: "follow",
        signal: AbortSignal.timeout(4500),
        headers: {
          "user-agent": "Statio/1.0"
        }
      });
      const responseTime = Math.round(performance.now() - start);

      return Response.json({
        status: response.status === 200 ? "UP" : "DOWN",
        responseTime
      });
    } catch {
      const responseTime = Math.round(performance.now() - start);

      return Response.json({
        status: "DOWN",
        responseTime
      });
    }
  } catch {
    return Response.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
