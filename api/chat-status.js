import { isChatLimitReached, markChatLimitReached } from '../lib/redis.js';

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

  const url = new URL(req.url);
  if (url.searchParams.get('debug_set') === '1') {
    await markChatLimitReached();
  }

  const limitReached = await isChatLimitReached();

  return new Response(JSON.stringify({ available: !limitReached }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
