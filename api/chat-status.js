export const config = {
  runtime: 'edge',
};

const ALLOWED_ORIGINS = new Set([
  'https://ana.is-a.dev',
  'https://a104437ana.github.io',
]);

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://ana.is-a.dev';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/key', {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ available: true }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const remaining = data?.data?.limit_remaining;
    const available = typeof remaining === 'number' ? remaining > 0 : true;

    return new Response(JSON.stringify({ available }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ available: true }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
