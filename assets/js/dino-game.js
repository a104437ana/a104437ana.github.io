document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("dino-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  function currentColor() {
    return document.documentElement.classList.contains("dark-mode") ? "#fff" : "#000";
  }

  const GRAVITY = 0.9;
  const JUMP_VELOCITY = -16;
  const GROUND_MARGIN = 4;
  // Sized to match the real game's proportions (dino 44x47 in a 600x150
  // canvas), scaled up for our taller 180px canvas.
  const PLAYER_H = 56;
  const PLAYER_W = 52;

  const HIGH_SCORE_API_URL = "https://a104437ana-github-io.vercel.app/api/dino-score";
  let highScore = 0;
  let gameStartTime = 0;
  let submittingScore = false;

  fetch(HIGH_SCORE_API_URL)
    .then(r => r.json())
    .then(data => {
      if (Number.isFinite(data.highScore)) highScore = data.highScore;
    })
    .catch(() => {});

  function submitScoreIfRecord(finalScore) {
    if (finalScore <= highScore || submittingScore) return;
    submittingScore = true;
    const elapsedMs = Date.now() - gameStartTime;
    fetch(HIGH_SCORE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: finalScore, elapsedMs }),
    })
      .then(r => r.json())
      .then(data => {
        if (Number.isFinite(data.highScore)) {
          highScore = data.highScore;
          if (!running) draw();
        }
      })
      .catch(() => {})
      .finally(() => {
        submittingScore = false;
      });
  }

  const spriteImg = new Image();
  let spriteReady = false;
  spriteImg.onload = () => {
    spriteReady = true;
    draw();
  };
  spriteImg.src = "/assets/icons/spritesheet.png";

  // Frames cropped from the sprite sheet: two alternating running poses,
  // and a distinct pose (hollow eye) used when the dino dies. No ducking,
  // no bird frames.
  const DINO_IDLE = { sx: 850, sy: 4, sw: 40, sh: 43 };
  const DINO_RUN_A = { sx: 938, sy: 4, sw: 40, sh: 43 };
  const DINO_RUN_B = { sx: 982, sy: 4, sw: 40, sh: 43 };
  const DINO_DEAD = { sx: 1070, sy: 4, sw: 40, sh: 43 };
  const CACTUS_FRAME = { sx: 229, sy: 3, sw: 15, sh: 33 };

  const CACTUS_WIDTH = 27;
  const CACTUS_HEIGHT = 60;

  let dpr = window.devicePixelRatio || 1;
  let width = 600;
  let height = 150;
  let groundY = height - GROUND_MARGIN;

  let player = { y: 0, vy: 0, jumping: false };
  let obstacles = [];
  let speed = 6;
  let score = 0;
  let frame = 0;
  let nextObstacleFrame = 0;
  let running = false;
  let started = false;
  let rafId = null;

  function resize() {
    const cssWidth = canvas.clientWidth || 600;
    width = cssWidth;
    height = canvas.clientHeight || 150;
    groundY = height - GROUND_MARGIN;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetGame() {
    player = { y: groundY - PLAYER_H, vy: 0, jumping: false };
    obstacles = [];
    speed = 6;
    score = 0;
    frame = 0;
    nextObstacleFrame = 60;
  }

  function spawnObstacle() {
    obstacles.push({ x: width + 10, width: CACTUS_WIDTH, height: CACTUS_HEIGHT });
    const gap = Math.max(45, 80 - speed * 2) + Math.random() * 40;
    nextObstacleFrame = frame + gap;
  }

  function jump() {
    if (!started) {
      started = true;
      running = true;
      resetGame();
      gameStartTime = Date.now();
      loop();
      return;
    }
    if (!running) {
      resetGame();
      running = true;
      gameStartTime = Date.now();
      loop();
      return;
    }
    if (!player.jumping) {
      player.vy = JUMP_VELOCITY;
      player.jumping = true;
    }
  }

  function update() {
    frame++;
    score += 1;

    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= groundY - PLAYER_H) {
      player.y = groundY - PLAYER_H;
      player.vy = 0;
      player.jumping = false;
    }

    if (frame >= nextObstacleFrame) spawnObstacle();

    for (const o of obstacles) o.x -= speed;
    obstacles = obstacles.filter(o => o.x + o.width > -5);

    speed += 0.0025;

    const px = 30;
    for (const o of obstacles) {
      const playerBottom = player.y + PLAYER_H;
      const playerTop = player.y;
      const obstacleTop = groundY - o.height;
      const hitX = px + PLAYER_W - 6 > o.x && px + 2 < o.x + o.width;
      const hitY = playerBottom > obstacleTop && playerTop < groundY;
      if (hitX && hitY) {
        running = false;
        submitScoreIfRecord(Math.floor(score / 5));
      }
    }
  }

  function drawSprite(f, x, y, w, h) {
    const isDark = document.documentElement.classList.contains("dark-mode");
    ctx.save();
    ctx.filter = isDark ? "brightness(0) invert(1)" : "brightness(0)";
    ctx.drawImage(spriteImg, f.sx, f.sy, f.sw, f.sh, x, y, w, h);
    ctx.restore();
  }

  function drawDino(x, y) {
    if (!spriteReady) return;

    if (!started) {
      drawSprite(DINO_IDLE, x, y, PLAYER_W, PLAYER_H);
    } else if (!running) {
      drawSprite(DINO_DEAD, x, y, PLAYER_W, PLAYER_H);
    } else if (!player.jumping) {
      const f = Math.floor(frame / 6) % 2 === 0 ? DINO_RUN_A : DINO_RUN_B;
      drawSprite(f, x, y, PLAYER_W, PLAYER_H);
    } else {
      drawSprite(DINO_RUN_A, x, y, PLAYER_W, PLAYER_H);
    }
  }

  function drawCactus(o) {
    if (!spriteReady) return;
    drawSprite(CACTUS_FRAME, o.x, groundY - o.height, o.width, o.height);
  }

  function drawScore() {
    ctx.fillStyle = currentColor();
    ctx.font = "14px monospace";
    ctx.textAlign = "right";
    const shown = Math.floor(score / 5) % 100000;
    const hi = highScore % 100000;
    const label = document.documentElement.lang === "pt" ? "RECORDE" : "RECORD";
    const text = `${label} ${String(hi).padStart(5, "0")}  ${String(shown).padStart(5, "0")}`;
    ctx.fillText(text, width - 6, 18);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    drawScore();

    ctx.strokeStyle = currentColor();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 1);
    ctx.lineTo(width, groundY + 1);
    ctx.stroke();

    drawDino(30, player.y);

    for (const o of obstacles) drawCactus(o);

    const isPt = document.documentElement.lang === "pt";
    if (!started) {
      drawCenteredText(isPt ? "Toca para começar" : "Tap to start", width / 2, height / 2);
    } else if (!running) {
      drawCenteredText(isPt ? "Fim de jogo, toca ou carrega em espaço para repetir" : "Game over, tap or press space to retry", width / 2, height / 2);
    }
  }

  function drawCenteredText(text, x, y) {
    ctx.fillStyle = currentColor();
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";

    const maxWidth = width - 24;
    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);

    const lineHeight = 22;
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  }

  function loop() {
    if (running) {
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    } else {
      draw();
      if (rafId) cancelAnimationFrame(rafId);
    }
  }

  resize();
  resetGame();
  draw();

  // Redraw immediately on theme or language toggle, so an idle canvas (not
  // started, or showing "game over") never gets stuck with the wrong color
  // or language.
  new MutationObserver(() => {
    if (!running) draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class", "lang"] });

  canvas.addEventListener("click", jump);
  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    jump();
  }, { passive: false });
  canvas.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    }
  });

  window.addEventListener("resize", () => {
    resize();
    draw();
  });
});
