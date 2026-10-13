document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("dino-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("dino-status");
  const scoreEl = document.getElementById("dino-score");

  // No point mentioning the space bar on a touch device — there isn't one.
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  // Space only works while the canvas actually has keyboard focus right
  // now (its keydown listener is on the canvas itself, not the whole
  // page). Tracked live via focus/blur below — if focus moves away
  // before the game is started, the hint should go back to tap-only.
  let canvasFocused = false;

  // Instructions + score live in the header above the canvas, never on
  // the canvas itself, so they're never covered by the rickroll video.
  function updateStatusText() {
    if (!statusEl) return;
    const isPt = document.documentElement.lang === "pt";
    if (rickrolling) {
      // Pink specifically for the "you lost" part, to grab attention
      // right as it happens — the rest of the header stays theme-colored
      // black/white, including the "continue" hint once it shows up.
      const lostText = isPt ? "Perdeste e levaste rickroll haha" : "You lost and got rickrolled haha";
      if (Date.now() - rickrollStartTime >= MIN_RICKROLL_WATCH_MS) {
        const continueText = !isTouchDevice && canvasFocused
          ? (isPt ? "Toca ou carrega em espaço para continuar" : "Tap or press space to continue")
          : (isPt ? "Toca para continuar" : "Tap to continue");
        statusEl.innerHTML = `<span style="color:#e91e63">${lostText}</span> ${continueText}`;
      } else {
        statusEl.innerHTML = `<span style="color:#e91e63">${lostText}</span>`;
      }
    } else if (!started) {
      statusEl.textContent = !isTouchDevice && canvasFocused
        ? (isPt ? "Toca ou carrega em espaço para começar" : "Tap or press space to start")
        : (isPt ? "Toca para começar" : "Tap to start");
    } else {
      statusEl.textContent = !isTouchDevice
        ? (isPt ? "Toca ou carrega em espaço para saltar" : "Tap or press space to jump")
        : (isPt ? "Toca para saltar" : "Tap to jump");
    }
  }

  function updateScoreText() {
    if (!scoreEl) return;
    const shown = Math.floor(score / 5) % 100000;
    scoreEl.textContent = String(shown).padStart(5, "0");
  }

  function currentColor() {
    return document.documentElement.classList.contains("dark-mode") ? "#fff" : "#000";
  }

  const GRAVITY = 0.9;
  const JUMP_VELOCITY = -16;
  const GROUND_MARGIN = 0;
  // Sized to match the real game's proportions (dino 44x47 in a 600x150
  // canvas), scaled up for our taller 180px canvas.
  const PLAYER_H = 56;
  const PLAYER_W = 52;

  const HIGH_SCORE_API_URL = "https://a104437ana-github-io.vercel.app/api/dino-score";
  let highScore = 0;
  let gameStartTime = 0;
  let submittingScore = false;

  // The intro paragraph mentions the live record; its text gets fully
  // replaced on every language toggle (see main.js setLanguage), so this
  // needs to be re-applied each time rather than set once.
  function updateRecordText() {
    const el = document.getElementById("dino-record-count");
    if (el) el.textContent = String(highScore);
  }

  fetch(HIGH_SCORE_API_URL)
    .then(r => r.json())
    .then(data => {
      if (Number.isFinite(data.highScore)) highScore = data.highScore;
      updateRecordText();
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
          updateRecordText();
          if (!running && !rickrolling) draw();
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

  // Frames cropped from the sprite sheet: idle pose and two alternating
  // running poses. No ducking, no bird frames.
  const DINO_IDLE = { sx: 850, sy: 4, sw: 40, sh: 43 };
  const DINO_RUN_A = { sx: 938, sy: 4, sw: 40, sh: 43 };
  const DINO_RUN_B = { sx: 982, sy: 4, sw: 40, sh: 43 };
  const CACTUS_FRAME = { sx: 229, sy: 3, sw: 15, sh: 33 };

  const CACTUS_WIDTH = 27;
  const CACTUS_HEIGHT = 60;

  // Hidden easter egg: every time you lose, the rickroll plays right
  // inside the game canvas instead of the usual "game over" screen.
  const rickrollVideo = document.createElement("video");
  rickrollVideo.src = "/assets/video/video.mp4";
  rickrollVideo.playsInline = true;
  // Don't fetch anything until the game actually starts — most visitors
  // who load the page never play, and this is a 30MB file.
  rickrollVideo.preload = "none";
  let rickrolling = false;

  // Must run synchronously inside a real user gesture (the tap/click that
  // starts the game) — browsers only allow play() with sound as a direct
  // result of a gesture. Losing happens later, inside the game loop (not
  // a gesture), so without priming here the rickroll would play muted or
  // not at all. Playing (and immediately pausing) right now, inside this
  // real tap, lets this same element play with sound later in the session.
  // This also kicks off the actual download, deferred until the game is
  // actually played (most visitors never are).
  function primeVideo() {
    rickrollVideo.preload = "auto";
    rickrollVideo.play().then(() => rickrollVideo.pause()).catch(() => {});
  }

  // Minimum time the rickroll must play before a tap/space can skip it —
  // otherwise mashing space right after losing would skip it instantly.
  const MIN_RICKROLL_WATCH_MS = 5000;
  let rickrollStartTime = 0;

  function startRickroll() {
    rickrolling = true;
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rickrollStartTime = Date.now();
    rickrollVideo.currentTime = 0;
    rickrollVideo.play().catch(() => {});
    rickrollLoop();
  }

  function stopRickroll() {
    rickrolling = false;
    rickrollVideo.pause();
    started = false;
    resetGame();
    draw();
  }

  function rickrollLoop() {
    if (!rickrolling) return;
    ctx.clearRect(0, 0, width, height);
    if (rickrollVideo.readyState >= 2) {
      // The source video has black pillarbox bars baked into the frame
      // itself (content only spans the middle ~75% of the frame width,
      // measured as fractions of the original 1280-wide video so this
      // still lines up after the file gets re-compressed to a different
      // resolution). Crop those out before fitting, so no black bars
      // show up even in light mode.
      const sx = rickrollVideo.videoWidth * (159 / 1280);
      const sw = rickrollVideo.videoWidth * ((1120 - 159) / 1280);
      const sh = rickrollVideo.videoHeight;
      const scale = Math.min(width / sw, height / sh);
      const vw = sw * scale;
      const vh = sh * scale;
      ctx.drawImage(rickrollVideo, sx, 0, sw, sh, (width - vw) / 2, (height - vh) / 2, vw, vh);
    }
    updateStatusText();

    if (rickrollVideo.ended) {
      stopRickroll();
      return;
    }
    rafId = requestAnimationFrame(rickrollLoop);
  }

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
    if (rickrolling) {
      if (Date.now() - rickrollStartTime >= MIN_RICKROLL_WATCH_MS) stopRickroll();
      return;
    }
    if (!started) {
      started = true;
      running = true;
      resetGame();
      gameStartTime = Date.now();
      primeVideo();
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
        submitScoreIfRecord(Math.floor(score / 5));
        startRickroll();
        return;
      }
    }
  }

  // Recolor a sprite frame on an isolated offscreen canvas first, then
  // paste the result with a plain drawImage. Doing the recolor directly
  // on the main canvas would use globalCompositeOperation across the
  // *entire* canvas, erasing anything already drawn (the dino, other
  // obstacles) outside this sprite's bounding box.
  const spriteBuffer = document.createElement("canvas");
  const spriteBufferCtx = spriteBuffer.getContext("2d");

  function drawSpriteColored(f, x, y, w, h, color) {
    spriteBuffer.width = w;
    spriteBuffer.height = h;
    spriteBufferCtx.filter = "brightness(0)";
    spriteBufferCtx.drawImage(spriteImg, f.sx, f.sy, f.sw, f.sh, 0, 0, w, h);
    spriteBufferCtx.filter = "none";
    spriteBufferCtx.globalCompositeOperation = "source-in";
    spriteBufferCtx.fillStyle = color;
    spriteBufferCtx.fillRect(0, 0, w, h);
    spriteBufferCtx.globalCompositeOperation = "source-over";
    ctx.drawImage(spriteBuffer, x, y);
  }

  function drawSprite(f, x, y, w, h) {
    drawSpriteColored(f, x, y, w, h, currentColor());
  }

  function drawDino(x, y) {
    if (!spriteReady) return;

    if (!started) {
      drawSprite(DINO_IDLE, x, y, PLAYER_W, PLAYER_H);
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

  function draw() {
    ctx.clearRect(0, 0, width, height);

    updateScoreText();
    updateStatusText();

    drawDino(30, player.y);

    for (const o of obstacles) drawCactus(o);
  }

  function loop() {
    if (running) {
      update();
      if (rickrolling) return; // startRickroll() already took over the render loop
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
    updateRecordText();
    if (!running && !rickrolling) draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class", "lang"] });

  canvas.addEventListener("focus", () => {
    canvasFocused = true;
    if (!running && !rickrolling) updateStatusText();
  });
  canvas.addEventListener("blur", () => {
    canvasFocused = false;
    if (!running && !rickrolling) updateStatusText();
  });

  // mousedown instead of click: click only fires after a full press+release,
  // so if the very first press on an unfocused canvas gets consumed just for
  // focusing, the actual jump would only land on a second tap. mousedown (like
  // touchstart) fires immediately on the initial press, every time.
  canvas.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    jump();
  });
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

  // Tapping the header (instructions or score) jumps/starts/continues
  // too, not just the canvas itself. Also focus the canvas so the space
  // bar keeps working afterward, same as tapping the canvas directly.
  const headerEl = document.getElementById("dino-header");
  if (headerEl) {
    headerEl.addEventListener("mousedown", e => {
      if (e.button !== 0) return;
      canvas.focus();
      jump();
    });
    headerEl.addEventListener("touchstart", e => {
      e.preventDefault();
      canvas.focus();
      jump();
    }, { passive: false });
  }

  window.addEventListener("resize", () => {
    resize();
    if (!rickrolling) draw();
  });
});
