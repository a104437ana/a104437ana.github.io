import { getDinoHighScore, setDinoHighScoreIfHigher } from '../lib/redis.js';

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Scoring increments once per animation frame; no real display refreshes
// faster than this, so a score that implies a higher rate than that is
// not physically achievable and gets rejected.
const MIN_MS_PER_POINT = 15;
const MAX_SCORE = 99999;

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method === 'GET') {
    const highScore = await getDinoHighScore();
    return new Response(JSON.stringify({ highScore }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const score = Number(body.score);
  const elapsedMs = Number(body.elapsedMs);

  const valid =
    Number.isFinite(score) &&
    Number.isFinite(elapsedMs) &&
    score >= 0 &&
    score <= MAX_SCORE &&
    elapsedMs >= 0;

  if (!valid || elapsedMs < score * MIN_MS_PER_POINT) {
    return new Response(JSON.stringify({ error: 'invalid score' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const highScore = await setDinoHighScoreIfHigher(Math.floor(score));
  return new Response(JSON.stringify({ highScore }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
