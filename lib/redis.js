function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

export async function isChatLimitReached() {
  const { url, token } = redisConfig();
  if (!url || !token) return false;

  try {
    const res = await fetch(`${url}/get/chat_limit_reached`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.result === '1';
  } catch {
    return false;
  }
}

export async function markChatLimitReached() {
  const { url, token } = redisConfig();
  if (!url || !token) return;

  const now = new Date();
  const nextMidnightUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const secondsUntilMidnight = Math.max(60, Math.ceil((nextMidnightUTC - now.getTime()) / 1000));

  try {
    await fetch(`${url}/set/chat_limit_reached/1/EX/${secondsUntilMidnight}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // best-effort, safe to ignore
  }
}

export async function getDinoHighScore() {
  const { url, token } = redisConfig();
  if (!url || !token) return 0;

  try {
    const res = await fetch(`${url}/get/dino_high_score`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return parseInt(data.result, 10) || 0;
  } catch {
    return 0;
  }
}

export async function setDinoHighScoreIfHigher(score) {
  const { url, token } = redisConfig();
  if (!url || !token) return score;

  try {
    const current = await getDinoHighScore();
    if (score <= current) return current;

    await fetch(`${url}/set/dino_high_score/${score}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return score;
  } catch {
    return score;
  }
}
