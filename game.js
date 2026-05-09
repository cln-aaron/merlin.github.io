(() => {
  "use strict";

  const LOGICAL_W = 1280;
  const LOGICAL_H = 720;
  const GRAVITY = 1780;
  const MOVE_SPEED = 385;
  const JUMP_SPEED = 720;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayContent = document.getElementById("overlayContent");
  const toastEl = document.getElementById("toast");
  const hudLevel = document.getElementById("hudLevel");
  const hudTime = document.getElementById("hudTime");
  const hudScore = document.getElementById("hudScore");
  const hudGoal = document.getElementById("hudGoal");
  const pauseButton = document.getElementById("pauseButton");

  const input = {
    left: false,
    right: false,
    jump: false,
    action: false,
    jumpQueued: false,
    actionQueued: false
  };

  const LEVEL_SPECS = [
    {
      id: "prompt-plaza",
      name: "Prompt Plaza",
      short: "Prompting",
      puzzle: "promptForge",
      color: "#53c95f",
      sky: ["#62c8ff", "#cdf7ff"],
      worldW: 4700,
      required: 5,
      goal: "Collect 5 prompt sparks and forge a useful AI prompt",
      focus: "How to ask AI for help with context, limits, and verification.",
      stationLabel: "Prompt Forge",
      lesson: [
        "Great AI prompts include a goal, context, constraints, and a format.",
        "Ask AI to explain uncertainty instead of pretending it knows everything.",
        "Treat AI like a helper, not the final authority.",
        "Give examples when you want a certain style or level.",
        "Ask for a checklist before using AI output in real life.",
        "Use AI to learn, revise, and compare ideas, not to outsource your judgment."
      ]
    },
    {
      id: "source-springs",
      name: "Source Springs",
      short: "Sources",
      puzzle: "sourceBridge",
      color: "#2878ff",
      sky: ["#7dd9ff", "#e9fbff"],
      worldW: 5000,
      required: 5,
      goal: "Collect 5 evidence sparks and repair the source bridge",
      focus: "How to verify AI output, claims, links, and screenshots before sharing.",
      stationLabel: "Source Bridge",
      lesson: [
        "Open cited links before trusting them. A citation can be wrong or fake.",
        "Check author, date, evidence, and whether other reliable sources agree.",
        "Screenshots travel fast because they feel real. Verify where they came from.",
        "AI can hallucinate confident details. Confidence is not proof.",
        "Strong claims need strong sources.",
        "When you are unsure, slow the share."
      ]
    },
    {
      id: "deepfake-drift",
      name: "Deepfake Drift",
      short: "Deepfakes",
      puzzle: "deepfakeLab",
      color: "#8a5cff",
      sky: ["#74d2ff", "#f7eeff"],
      worldW: 5200,
      required: 5,
      goal: "Collect 5 media sparks and inspect video plus audio clues",
      focus: "How to spot manipulated media without over-trusting your first impression.",
      stationLabel: "Forensics Lab",
      lesson: [
        "Look for mismatched mouth timing, odd blinking, and unstable edges.",
        "Listen for flat emotion, unnatural breaths, and repeated background noise.",
        "Deepfake clues are stronger when several clues point the same way.",
        "Use reverse search, original uploads, and trusted reporting before accusing.",
        "Do not amplify suspicious media while you investigate it.",
        "Responsible detection protects people from both fakes and false accusations."
      ]
    },
    {
      id: "privacy-peak",
      name: "Privacy Peak",
      short: "Privacy",
      puzzle: "privacyVault",
      color: "#ff9f1c",
      sky: ["#77d5ff", "#fff1c4"],
      worldW: 5100,
      required: 5,
      goal: "Collect 5 privacy sparks and redact risky details",
      focus: "How to use AI without leaking personal, school, health, or account data.",
      stationLabel: "Privacy Vault",
      lesson: [
        "Remove names, phone numbers, addresses, logins, and health details from prompts.",
        "Use placeholders like [student], [school], or [city] when exact identity is not needed.",
        "Never paste passwords, private keys, or class login codes into AI tools.",
        "Ask permission before uploading someone else's image, voice, or work.",
        "Assume anything pasted into an online tool may be stored or reviewed.",
        "Helpful AI use starts with data minimization."
      ]
    },
    {
      id: "focus-forest",
      name: "Focus Forest",
      short: "Wellbeing",
      puzzle: "wellbeingFlow",
      color: "#37d6a2",
      sky: ["#73d7ff", "#dcffdc"],
      worldW: 5000,
      required: 5,
      goal: "Collect 5 wellbeing sparks and build a calm tech rhythm",
      focus: "How AI and feeds can support mental health without taking over your attention.",
      stationLabel: "Calm Circuit",
      lesson: [
        "AI can brainstorm coping ideas, but it cannot replace trusted people or professionals.",
        "When a tool makes you spiral, step away before asking for more answers.",
        "Use time boxes, breaks, and notification boundaries to protect focus.",
        "Comparing yourself to AI-perfect content can distort reality.",
        "If you feel unsafe or overwhelmed, contact a trusted adult or local support now.",
        "The healthiest tool is the one you can put down."
      ]
    },
    {
      id: "creator-castle",
      name: "Creator Castle",
      short: "Responsible AI",
      puzzle: "finalBoss",
      color: "#ff5c6c",
      sky: ["#78d5ff", "#ffe7eb"],
      worldW: 5600,
      required: 6,
      goal: "Collect 6 creator sparks and defeat the misinformation boss",
      focus: "How to combine effective AI use, media literacy, privacy, fairness, and wellbeing.",
      stationLabel: "Trust Boss",
      lesson: [
        "Label AI-generated media when people could mistake it for reality.",
        "Ask who might be missing from your dataset, prompt, or design.",
        "A fair AI workflow includes testing, feedback, and a human decision point.",
        "Use AI to expand possibilities, then choose responsibly.",
        "Speed matters less than harm prevention when sharing public content.",
        "Your final power-up is good judgment."
      ]
    }
  ];

  const PUZZLE_TITLES = {
    promptForge: "Prompt Forge",
    sourceBridge: "Source Bridge",
    deepfakeLab: "Forensics Lab",
    privacyVault: "Privacy Vault",
    wellbeingFlow: "Calm Circuit",
    finalBoss: "Trust Boss"
  };

  const BEST_KEY = "promptParkourBestTime";
  const PROGRESS_KEY = "promptParkourProgress";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Storage can be unavailable in private browsing. The game still plays.
    }
  }

  function drawBox(context, x, y, w, h, r = 6) {
    context.beginPath();
    if (context.roundRect) {
      context.roundRect(x, y, w, h, r);
    } else {
      context.rect(x, y, w, h);
    }
  }

  function fillBox(context, x, y, w, h, fill, stroke = null, lineWidth = 0) {
    drawBox(context, x, y, w, h);
    context.fillStyle = fill;
    context.fill();
    if (stroke) {
      context.lineWidth = lineWidth || 2;
      context.strokeStyle = stroke;
      context.stroke();
    }
  }

  function setCanvasScale() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(LOGICAL_W * dpr);
    canvas.height = Math.floor(LOGICAL_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setOverlay(html) {
    overlayContent.innerHTML = html;
    overlay.classList.add("visible");
  }

  function clearOverlay() {
    overlay.classList.remove("visible");
    overlayContent.innerHTML = "";
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toastEl.classList.remove("visible");
    }, 3600);
  }

  function updateButtonState(button, active) {
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }

  class Game {
    constructor() {
      this.levelIndex = 0;
      this.started = false;
      this.finished = false;
      this.paused = true;
      this.lastTs = 0;
      this.startTs = 0;
      this.finishMs = 0;
      this.score = 0;
      this.totalCollectibles = 0;
      this.collectedTotal = 0;
      this.hints = 0;
      this.damage = 0;
      this.puzzlesSolved = new Set();
      this.cleanup = null;
      this.labPreview = false;
      this.cameraX = 0;
      this.level = null;
      this.player = null;
      this.audioContext = null;
      this.loadProgress();
      this.bindControls();
      this.showStartScreen();
      this.openRequestedLab();
      requestAnimationFrame((ts) => this.loop(ts));
    }

    bindControls() {
      window.addEventListener("keydown", (event) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) {
          event.preventDefault();
        }
        if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = true;
        if (event.code === "ArrowRight" || event.code === "KeyD") input.right = true;
        if ((event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Space") && !input.jump) {
          input.jumpQueued = true;
        }
        if (event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Space") input.jump = true;
        if ((event.code === "KeyE" || event.code === "Enter") && !input.action) {
          input.actionQueued = true;
        }
        if (event.code === "KeyE" || event.code === "Enter") input.action = true;
        if (event.code === "Escape" && this.started && !this.finished) this.togglePause();
      });

      window.addEventListener("keyup", (event) => {
        if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = false;
        if (event.code === "ArrowRight" || event.code === "KeyD") input.right = false;
        if (event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Space") input.jump = false;
        if (event.code === "KeyE" || event.code === "Enter") input.action = false;
      });

      this.bindTouchButton("touchLeft", "left");
      this.bindTouchButton("touchRight", "right");
      this.bindTouchButton("touchJump", "jump");
      this.bindTouchButton("touchAction", "action");

      pauseButton.addEventListener("click", () => this.togglePause());
    }

    bindTouchButton(id, key) {
      const button = document.getElementById(id);
      const down = (event) => {
        event.preventDefault();
        input[key] = true;
        if (key === "jump") input.jumpQueued = true;
        if (key === "action") input.actionQueued = true;
        updateButtonState(button, true);
      };
      const up = (event) => {
        event.preventDefault();
        input[key] = false;
        updateButtonState(button, false);
      };
      button.addEventListener("pointerdown", down);
      button.addEventListener("pointerup", up);
      button.addEventListener("pointercancel", up);
      button.addEventListener("pointerleave", up);
    }

    showStartScreen() {
      this.paused = true;
      const bestRaw = safeStorageGet(BEST_KEY);
      const bestLine = bestRaw ? `<li>Best completion time: ${formatTime(Number(bestRaw))}</li>` : "<li>Best completion time: not set yet</li>";
      setOverlay(`
        <div class="screen-grid">
          <div>
            <p class="screen-kicker">30-minute browser quest</p>
            <h1 class="screen-title">Prompt Parkour</h1>
            <p class="lead">A blocky side-scrolling adventure about using AI well, spotting synthetic media, protecting privacy, and keeping digital life mentally healthy.</p>
            <ul class="feature-list">
              <li>Six worlds with platforming, collectibles, hazards, puzzles, audio/video forensics, and a final responsible-AI boss.</li>
              <li>Scored mainly by completion time, with bonuses for sparks and penalties for damage or hint use.</li>
              <li>Keyboard: arrows/WASD, Space to jump, E or Enter to interact. Touch controls appear on mobile.</li>
              ${bestLine}
            </ul>
            <div class="button-row">
              <button class="primary" id="startGame">Start Quest</button>
              <button class="secondary" id="startFresh">Reset Run</button>
            </div>
          </div>
          <div class="mission-map" aria-hidden="true">
            <div class="map-avatar"></div>
            <div class="map-block" style="left: 180px; bottom: 118px;"></div>
            <div class="map-block" style="left: 270px; bottom: 168px; background:#37d6a2;"></div>
            <div class="map-block" style="left: 365px; bottom: 126px; background:#8a5cff;"></div>
            <div class="map-block" style="left: 460px; bottom: 205px; background:#ff5c6c;"></div>
            <div class="map-block" style="left: 560px; bottom: 144px; background:#ffd166;"></div>
          </div>
        </div>
      `);
      document.getElementById("startGame").addEventListener("click", () => this.startRun(false));
      document.getElementById("startFresh").addEventListener("click", () => this.startRun(true));
    }

    loadProgress() {
      const saved = safeStorageGet(PROGRESS_KEY);
      if (!saved) return;
      try {
        const data = JSON.parse(saved);
        if (Number.isInteger(data.levelIndex)) {
          this.levelIndex = clamp(data.levelIndex, 0, LEVEL_SPECS.length - 1);
        }
      } catch (error) {
        // Corrupt progress is ignored.
      }
    }

    saveProgress() {
      safeStorageSet(PROGRESS_KEY, JSON.stringify({ levelIndex: this.levelIndex }));
    }

    startRun(fresh) {
      this.labPreview = false;
      if (fresh) {
        this.levelIndex = 0;
        this.puzzlesSolved.clear();
        safeStorageSet(PROGRESS_KEY, JSON.stringify({ levelIndex: 0 }));
      }
      this.started = true;
      this.finished = false;
      this.score = 0;
      this.collectedTotal = 0;
      this.totalCollectibles = 0;
      this.damage = 0;
      this.hints = 0;
      this.startTs = performance.now();
      this.finishMs = 0;
      this.initLevel(this.levelIndex);
      this.showLevelBrief();
    }

    showLevelBrief() {
      const spec = LEVEL_SPECS[this.levelIndex];
      this.paused = true;
      setOverlay(`
        <div class="level-brief">
          <p class="screen-kicker">World ${this.levelIndex + 1} of ${LEVEL_SPECS.length}</p>
          <h2 class="level-title">${spec.name}</h2>
          <p class="lead">${spec.focus}</p>
          <div class="brief-stats">
            <div class="stat-tile"><span>Mission</span><strong>${spec.goal}</strong></div>
            <div class="stat-tile"><span>Challenge</span><strong>${PUZZLE_TITLES[spec.puzzle]}</strong></div>
            <div class="stat-tile"><span>Pace</span><strong>About 4-5 min</strong></div>
          </div>
          <div class="button-row">
            <button class="primary" id="enterLevel">Enter World</button>
            <button class="secondary" id="backToTitle">Title</button>
          </div>
        </div>
      `);
      document.getElementById("enterLevel").addEventListener("click", () => {
        clearOverlay();
        this.paused = false;
        showToast(`${spec.name}: ${spec.goal}. Press E/Enter near the ${spec.stationLabel}.`);
      });
      document.getElementById("backToTitle").addEventListener("click", () => this.showStartScreen());
    }

    initLevel(index) {
      const spec = LEVEL_SPECS[index];
      const level = buildLevel(spec, index);
      this.level = level;
      this.cameraX = 0;
      this.player = {
        x: level.spawn.x,
        y: level.spawn.y,
        w: 48,
        h: 82,
        vx: 0,
        vy: 0,
        grounded: false,
        facing: 1,
        checkpointX: level.spawn.x,
        checkpointY: level.spawn.y,
        invuln: 0
      };
      this.totalCollectibles += level.sparks.length;
      hudGoal.textContent = spec.goal;
      this.updateHud();
      if (!this.labPreview) this.saveProgress();
    }

    openRequestedLab() {
      const params = new URLSearchParams(window.location.search);
      const lab = params.get("lab");
      if (!lab || !Object.prototype.hasOwnProperty.call(PUZZLE_TITLES, lab)) return;
      const index = LEVEL_SPECS.findIndex((spec) => spec.puzzle === lab);
      if (index < 0) return;
      this.labPreview = true;
      this.started = true;
      this.finished = false;
      this.score = 0;
      this.collectedTotal = 0;
      this.totalCollectibles = 0;
      this.damage = 0;
      this.hints = 0;
      this.startTs = performance.now();
      this.levelIndex = index;
      this.initLevel(index);
      this.openPuzzle(lab);
    }

    loop(ts) {
      const dt = Math.min(0.033, (ts - (this.lastTs || ts)) / 1000);
      this.lastTs = ts;
      if (this.started && !this.finished) this.updateHud();
      if (!this.paused && this.started && !this.finished) this.update(dt);
      this.draw();
      requestAnimationFrame((next) => this.loop(next));
    }

    elapsedMs() {
      if (!this.started) return 0;
      if (this.finished) return this.finishMs;
      return performance.now() - this.startTs;
    }

    calculateScore() {
      const timeSeconds = Math.floor(this.elapsedMs() / 1000);
      const raw = 120000 - timeSeconds * 55 + this.collectedTotal * 240 - this.damage * 500 - this.hints * 250;
      return Math.max(0, Math.round(raw));
    }

    updateHud() {
      hudLevel.textContent = `${this.levelIndex + 1}/${LEVEL_SPECS.length}`;
      hudTime.textContent = formatTime(this.elapsedMs());
      hudScore.textContent = String(this.calculateScore());
      if (this.level) {
        const collected = this.level.sparks.filter((spark) => spark.collected).length;
        const puzzleDone = this.level.puzzleSolved ? "puzzle solved" : "puzzle open";
        hudGoal.textContent = `${collected}/${this.level.required} sparks, ${puzzleDone}`;
      }
    }

    update(dt) {
      const player = this.player;
      const level = this.level;
      const actionNow = input.actionQueued;
      const jumpNow = input.jumpQueued;
      input.actionQueued = false;
      input.jumpQueued = false;

      player.invuln = Math.max(0, player.invuln - dt);

      let targetVx = 0;
      if (input.left) targetVx -= MOVE_SPEED;
      if (input.right) targetVx += MOVE_SPEED;
      player.vx += (targetVx - player.vx) * Math.min(1, dt * 12);
      if (Math.abs(player.vx) < 4) player.vx = 0;
      if (player.vx !== 0) player.facing = player.vx > 0 ? 1 : -1;

      if (jumpNow && player.grounded) {
        player.vy = -JUMP_SPEED;
        player.grounded = false;
      }

      player.vy += GRAVITY * dt;
      this.movePlayer(player.vx * dt, 0);
      this.movePlayer(0, player.vy * dt);

      if (player.y > LOGICAL_H + 260) {
        this.hurtPlayer("Falling into a scroll hole costs momentum. Back to your checkpoint.");
      }

      this.updateBots(dt);
      this.checkCollectibles();
      this.checkHazards();
      this.handleNearbyInteractions(actionNow);

      this.cameraX = clamp(player.x + player.w / 2 - LOGICAL_W * 0.42, 0, level.worldW - LOGICAL_W);
    }

    movePlayer(dx, dy) {
      const player = this.player;
      const platforms = this.level.platforms;
      player.x += dx;
      player.x = clamp(player.x, 0, this.level.worldW - player.w);
      for (const platform of platforms) {
        if (!rectsOverlap(player, platform)) continue;
        if (dx > 0) player.x = platform.x - player.w;
        if (dx < 0) player.x = platform.x + platform.w;
        player.vx = 0;
      }

      player.y += dy;
      player.grounded = false;
      for (const platform of platforms) {
        if (!rectsOverlap(player, platform)) continue;
        if (dy > 0) {
          player.y = platform.y - player.h;
          player.vy = 0;
          player.grounded = true;
        } else if (dy < 0) {
          player.y = platform.y + platform.h;
          player.vy = 0;
        }
      }
    }

    updateBots(dt) {
      for (const bot of this.level.bots) {
        bot.x += bot.vx * dt;
        if (bot.x < bot.min || bot.x > bot.max) {
          bot.vx *= -1;
          bot.x = clamp(bot.x, bot.min, bot.max);
        }
      }
    }

    checkCollectibles() {
      const player = this.player;
      for (const spark of this.level.sparks) {
        if (!spark.collected && rectsOverlap(player, spark)) {
          spark.collected = true;
          this.collectedTotal += 1;
          this.score += 250;
          showToast(spark.text);
        }
      }
      for (const coin of this.level.coins) {
        if (!coin.collected && rectsOverlap(player, coin)) {
          coin.collected = true;
          this.score += 50;
        }
      }
    }

    checkHazards() {
      if (this.player.invuln > 0) return;
      for (const hazard of this.level.hazards) {
        if (rectsOverlap(this.player, hazard)) {
          this.hurtPlayer(hazard.message);
          return;
        }
      }
      for (const bot of this.level.bots) {
        if (rectsOverlap(this.player, bot)) {
          this.hurtPlayer(bot.message);
          return;
        }
      }
    }

    hurtPlayer(message) {
      const player = this.player;
      this.damage += 1;
      player.invuln = 1.35;
      player.vy = -460;
      player.x = clamp(player.checkpointX, 0, this.level.worldW - player.w);
      player.y = player.checkpointY;
      showToast(message);
    }

    handleNearbyInteractions(actionNow) {
      const level = this.level;
      const player = this.player;
      const stationNear = Math.abs((player.x + player.w / 2) - level.station.x) < 90 && Math.abs(player.y - level.station.y) < 120;
      const exitNear = Math.abs((player.x + player.w / 2) - level.exit.x) < 100 && Math.abs(player.y - level.exit.y) < 130;
      const sparkCount = level.sparks.filter((spark) => spark.collected).length;
      const unlocked = sparkCount >= level.required && level.puzzleSolved;

      if (stationNear && !actionNow) {
        this.level.prompt = `Press E to open ${LEVEL_SPECS[this.levelIndex].stationLabel}`;
      } else if (exitNear && !actionNow) {
        this.level.prompt = unlocked ? "Press E to enter the next world" : `Need ${level.required} sparks and the puzzle`;
      } else {
        this.level.prompt = "";
      }

      if (!actionNow) return;

      if (stationNear) {
        this.openPuzzle(level.spec.puzzle);
        return;
      }

      if (exitNear) {
        if (unlocked) {
          this.advanceLevel();
        } else {
          const remaining = Math.max(0, level.required - sparkCount);
          showToast(`Portal locked. Collect ${remaining} more spark${remaining === 1 ? "" : "s"} and clear the ${level.spec.stationLabel}.`);
        }
      }
    }

    openPuzzle(type) {
      if (this.cleanup) {
        this.cleanup();
        this.cleanup = null;
      }
      this.paused = true;
      if (this.level.puzzleSolved) {
        setOverlay(`
          <div class="puzzle-head">
            <h2>${PUZZLE_TITLES[type]} cleared</h2>
            <p>You already unlocked this station. Keep moving to the portal.</p>
          </div>
          <div class="button-row"><button class="primary" id="closeSolved">Back to world</button></div>
        `);
        document.getElementById("closeSolved").addEventListener("click", () => {
          clearOverlay();
          this.paused = false;
        });
        return;
      }

      const handlers = {
        promptForge: () => this.renderPromptForge(),
        sourceBridge: () => this.renderSourceBridge(),
        deepfakeLab: () => this.renderDeepfakeLab(),
        privacyVault: () => this.renderPrivacyVault(),
        wellbeingFlow: () => this.renderWellbeingFlow(),
        finalBoss: () => this.renderFinalBoss()
      };
      handlers[type]();
    }

    solvePuzzle(message) {
      if (this.cleanup) {
        this.cleanup();
        this.cleanup = null;
      }
      this.level.puzzleSolved = true;
      this.puzzlesSolved.add(this.level.spec.puzzle);
      this.player.checkpointX = this.level.station.x + 90;
      this.player.checkpointY = this.level.station.y - this.player.h;
      this.score += 1800;
      clearOverlay();
      this.paused = false;
      showToast(message);
    }

    advanceLevel() {
      if (this.levelIndex >= LEVEL_SPECS.length - 1) {
        this.completeGame();
        return;
      }
      this.levelIndex += 1;
      this.initLevel(this.levelIndex);
      this.showLevelBrief();
    }

    completeGame() {
      this.finished = true;
      this.paused = true;
      this.finishMs = performance.now() - this.startTs;
      const finalScore = this.calculateScore();
      const bestRaw = safeStorageGet(BEST_KEY);
      const best = bestRaw ? Number(bestRaw) : null;
      const isBest = !best || this.finishMs < best;
      if (isBest) safeStorageSet(BEST_KEY, String(Math.round(this.finishMs)));
      safeStorageSet(PROGRESS_KEY, JSON.stringify({ levelIndex: 0 }));
      const rank = this.finishMs <= 30 * 60 * 1000 ? "S-Rank Safe AI Sprinter" :
        this.finishMs <= 38 * 60 * 1000 ? "A-Rank Trust Builder" :
        this.finishMs <= 48 * 60 * 1000 ? "B-Rank Careful Creator" : "Steady Learner";
      setOverlay(`
        <p class="screen-kicker">Quest complete</p>
        <h2 class="screen-title">${rank}</h2>
        <p class="lead">You finished all six worlds and cleared the responsible-AI boss.</p>
        <div class="result-card">
          <div class="stat-tile"><span>Time</span><strong>${formatTime(this.finishMs)}</strong></div>
          <div class="stat-tile"><span>Score</span><strong>${finalScore}</strong></div>
          <div class="stat-tile"><span>Sparks</span><strong>${this.collectedTotal}</strong></div>
          <div class="stat-tile"><span>Best</span><strong>${isBest ? "New best" : formatTime(best)}</strong></div>
        </div>
        <ul class="feature-list" style="margin-top:18px">
          <li>Use AI with context, constraints, and verification.</li>
          <li>Check multiple clues before calling media synthetic.</li>
          <li>Redact private data before prompting.</li>
          <li>Protect attention, sleep, and support networks.</li>
        </ul>
        <div class="button-row">
          <button class="primary" id="playAgain">Play Again</button>
          <button class="secondary" id="titleAgain">Title</button>
        </div>
      `);
      document.getElementById("playAgain").addEventListener("click", () => this.startRun(true));
      document.getElementById("titleAgain").addEventListener("click", () => this.showStartScreen());
    }

    togglePause() {
      if (!this.started || this.finished) return;
      if (overlay.classList.contains("visible") && this.paused) {
        return;
      }
      if (this.paused) {
        clearOverlay();
        this.paused = false;
      } else {
        this.paused = true;
        setOverlay(`
          <p class="screen-kicker">Paused</p>
          <h2 class="level-title">${this.level.spec.name}</h2>
          <p class="lead">${this.level.spec.goal}</p>
          <div class="button-row">
            <button class="primary" id="resumeGame">Resume</button>
            <button class="secondary" id="restartLevel">Restart Level</button>
            <button class="danger" id="quitTitle">Quit to Title</button>
          </div>
        `);
        document.getElementById("resumeGame").addEventListener("click", () => {
          clearOverlay();
          this.paused = false;
        });
        document.getElementById("restartLevel").addEventListener("click", () => {
          this.initLevel(this.levelIndex);
          clearOverlay();
          this.paused = false;
        });
        document.getElementById("quitTitle").addEventListener("click", () => this.showStartScreen());
      }
    }

    draw() {
      if (!this.level) {
        drawAttractMode();
        return;
      }
      const level = this.level;
      const spec = level.spec;
      const cam = this.cameraX;

      const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
      sky.addColorStop(0, spec.sky[0]);
      sky.addColorStop(1, spec.sky[1]);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      drawParallax(spec, cam);

      ctx.save();
      ctx.translate(-cam, 0);
      drawLevelGeometry(level);
      drawCollectibles(level);
      drawStation(level);
      drawExit(level);
      drawHazards(level);
      drawPlayer(this.player, performance.now() / 1000);
      ctx.restore();

      drawMiniHud(level, cam);
    }

    renderPromptForge() {
      const slots = [
        { id: "goal", title: "Goal" },
        { id: "context", title: "Context" },
        { id: "constraints", title: "Boundaries" },
        { id: "format", title: "Output Format" },
        { id: "verify", title: "Verification" }
      ];
      const chips = [
        { id: "c1", type: "goal", text: "Help me plan a 90-second explainer on AI wellbeing for 13-year-olds." },
        { id: "c2", type: "context", text: "My audience uses short videos, group chats, games, and school devices." },
        { id: "c3", type: "constraints", text: "Keep it respectful, privacy-safe, and avoid diagnosing mental health." },
        { id: "c4", type: "format", text: "Return a hook, 3 scenes, captions, and a checklist." },
        { id: "c5", type: "verify", text: "List assumptions and what I should verify with reliable sources." },
        { id: "d1", type: "decoy", text: "Make it sound true even if the facts are missing." },
        { id: "d2", type: "decoy", text: "Use private class names and phone numbers for realism." },
        { id: "d3", type: "decoy", text: "Give only the final answer. I do not want limitations." }
      ];
      const placed = {};
      let selected = null;

      setOverlay(`
        <div class="puzzle-head">
          <h2>Prompt Forge</h2>
          <p>Tap a prompt block, then tap the slot where it belongs. Build a prompt that is useful, safe, and checkable.</p>
        </div>
        <div class="chip-board">
          <div class="chip-bank" id="chipBank"></div>
          <div class="slot-board" id="slotBoard"></div>
          <p class="puzzle-note" id="forgeFeedback">Good prompts make the job clear and leave room to verify.</p>
        </div>
        <div class="button-row">
          <button class="primary" id="forgeSubmit">Forge Prompt</button>
          <button class="secondary" id="forgeHint">Hint</button>
          <button class="secondary" id="forgeClose">Back</button>
        </div>
      `);

      const render = () => {
        const bank = document.getElementById("chipBank");
        const board = document.getElementById("slotBoard");
        bank.innerHTML = chips.map((chip) => `
          <button class="chip ${selected === chip.id ? "selected" : ""} ${Object.values(placed).includes(chip.id) ? "used" : ""}" data-chip="${chip.id}">
            ${chip.text}
          </button>
        `).join("");
        board.innerHTML = slots.map((slot) => {
          const chip = chips.find((item) => item.id === placed[slot.id]);
          return `
            <button class="slot ${chip ? "filled" : ""}" data-slot="${slot.id}">
              <strong>${slot.title}</strong>
              <span>${chip ? chip.text : "Tap to place a block"}</span>
            </button>
          `;
        }).join("");
        bank.querySelectorAll("[data-chip]").forEach((button) => {
          button.addEventListener("click", () => {
            const id = button.dataset.chip;
            if (Object.values(placed).includes(id)) return;
            selected = selected === id ? null : id;
            render();
          });
        });
        board.querySelectorAll("[data-slot]").forEach((button) => {
          button.addEventListener("click", () => {
            const slot = button.dataset.slot;
            if (!selected) {
              delete placed[slot];
            } else {
              for (const key of Object.keys(placed)) {
                if (placed[key] === selected) delete placed[key];
              }
              placed[slot] = selected;
              selected = null;
            }
            render();
          });
        });
      };
      render();

      document.getElementById("forgeSubmit").addEventListener("click", () => {
        const complete = slots.every((slot) => {
          const chip = chips.find((item) => item.id === placed[slot.id]);
          return chip && chip.type === slot.id;
        });
        if (complete) {
          this.solvePuzzle("Prompt forged. The portal now trusts your instructions.");
        } else {
          document.getElementById("forgeFeedback").textContent = "Some blocks are misplaced. Decoys sound fast, but they remove safety or verification.";
        }
      });
      document.getElementById("forgeHint").addEventListener("click", () => {
        this.hints += 1;
        document.getElementById("forgeFeedback").textContent = "Aim for: goal, audience context, safety boundary, output format, verification step.";
      });
      document.getElementById("forgeClose").addEventListener("click", () => {
        clearOverlay();
        this.paused = false;
      });
    }

    renderSourceBridge() {
      const zones = [
        { id: "use", title: "Use after reading" },
        { id: "caution", title: "Use with caution" },
        { id: "reject", title: "Do not use" }
      ];
      const sources = [
        { id: "s1", zone: "use", title: "Official digital safety guide", detail: "Clear author, updated date, and references." },
        { id: "s2", zone: "use", title: "School library article", detail: "Named author, evidence, and balanced discussion." },
        { id: "s3", zone: "caution", title: "AI summary with links", detail: "Helpful start, but links have not been opened yet." },
        { id: "s4", zone: "caution", title: "Creator demo clip", detail: "Interesting, but sponsored and missing sources." },
        { id: "s5", zone: "reject", title: "Anonymous group chat screenshot", detail: "No origin, date, or way to verify." },
        { id: "s6", zone: "reject", title: "Miracle study meme", detail: "Big claim, no source, emotional bait." }
      ];
      const order = ["bank", "use", "caution", "reject"];
      const assignments = Object.fromEntries(sources.map((source) => [source.id, "bank"]));

      setOverlay(`
        <div class="puzzle-head">
          <h2>Source Bridge</h2>
          <p>Tap each source card to move it across the bridge. Reliable work means matching claim strength to source strength.</p>
        </div>
        <div class="sort-board">
          <div class="source-bank" id="sourceBank"></div>
          <div class="sort-zones" id="sortZones"></div>
          <p class="puzzle-note" id="sourceFeedback">Open sources, compare evidence, and slow down before sharing.</p>
        </div>
        <div class="button-row">
          <button class="primary" id="sourceSubmit">Repair Bridge</button>
          <button class="secondary" id="sourceHint">Hint</button>
          <button class="secondary" id="sourceClose">Back</button>
        </div>
      `);

      const cardHtml = (source) => `
        <button class="source-card" data-source="${source.id}">
          ${source.title}
          <small>${source.detail}</small>
        </button>
      `;

      const render = () => {
        const bank = document.getElementById("sourceBank");
        const zoneEl = document.getElementById("sortZones");
        bank.innerHTML = sources.filter((source) => assignments[source.id] === "bank").map(cardHtml).join("");
        zoneEl.innerHTML = zones.map((zone) => `
          <div class="sort-zone" data-zone="${zone.id}">
            <h3>${zone.title}</h3>
            ${sources.filter((source) => assignments[source.id] === zone.id).map(cardHtml).join("")}
          </div>
        `).join("");
        overlayContent.querySelectorAll("[data-source]").forEach((button) => {
          button.addEventListener("click", () => {
            const source = button.dataset.source;
            const currentIndex = order.indexOf(assignments[source]);
            assignments[source] = order[(currentIndex + 1) % order.length];
            render();
          });
        });
      };
      render();

      document.getElementById("sourceSubmit").addEventListener("click", () => {
        const complete = sources.every((source) => assignments[source.id] === source.zone);
        if (complete) {
          this.solvePuzzle("Bridge repaired. Your claims now have evidence rails.");
        } else {
          document.getElementById("sourceFeedback").textContent = "A few cards are still risky. Official or author-backed sources can be used after reading; untraceable screenshots should stay off the bridge.";
        }
      });
      document.getElementById("sourceHint").addEventListener("click", () => {
        this.hints += 1;
        document.getElementById("sourceFeedback").textContent = "Use: clear author/date/evidence. Caution: useful but unchecked or biased. Reject: untraceable or manipulative.";
      });
      document.getElementById("sourceClose").addEventListener("click", () => {
        clearOverlay();
        this.paused = false;
      });
    }

    renderDeepfakeLab() {
      const found = new Set();
      const audioMarks = { clipA: false, clipB: false, clipC: false };
      let t = 0;
      let playing = true;
      let raf = 0;

      setOverlay(`
        <div class="puzzle-head">
          <h2>Forensics Lab</h2>
          <p>Watch the generated video, scrub frames, listen to audio clips, and mark suspicious clues. You need 3 video clues and the correct audio tags.</p>
        </div>
        <div class="video-lab">
          <div class="video-stage">
            <canvas id="forensicsCanvas" width="960" height="540" aria-label="Generated synthetic video sample"></canvas>
            <button class="hotspot" data-hotspot="mouth" style="left:42%; top:44%;" aria-label="Mark mouth timing clue"></button>
            <button class="hotspot" data-hotspot="edge" style="left:30%; top:22%;" aria-label="Mark edge flicker clue"></button>
            <button class="hotspot" data-hotspot="shadow" style="left:58%; top:68%;" aria-label="Mark shadow clue"></button>
            <button class="hotspot" data-hotspot="background" style="left:70%; top:18%;" aria-label="Mark background warp clue"></button>
          </div>
          <div class="video-controls">
            <button class="secondary" id="videoPlay">Pause Video</button>
            <label class="range-row">Scrub <input id="videoScrub" type="range" min="0" max="100" value="0"></label>
            <p class="puzzle-note" id="videoFeedback">Found 0/3 video clues. Several clues together are stronger than one weird frame.</p>
          </div>
        </div>
        <div class="clip-board" style="margin-top:14px">
          <div class="clip-grid">
            <div class="audio-card" data-clip="clipA">
              Clip A: urgent voice note
              <small>Listen for cadence, breaths, and repeated noise.</small>
              <div class="wave" style="--wave:linear-gradient(90deg,#ff5c6c,#ffd166)"></div>
              <div class="button-row">
                <button class="secondary play-clip" data-play="clipA">Play</button>
                <button class="secondary mark-clip" data-mark="clipA">Mark suspicious</button>
              </div>
            </div>
            <div class="audio-card" data-clip="clipB">
              Clip B: normal reminder
              <small>Natural pacing and small variation are expected.</small>
              <div class="wave" style="--wave:linear-gradient(90deg,#37d6a2,#2878ff)"></div>
              <div class="button-row">
                <button class="secondary play-clip" data-play="clipB">Play</button>
                <button class="secondary mark-clip" data-mark="clipB">Mark suspicious</button>
              </div>
            </div>
            <div class="audio-card" data-clip="clipC">
              Clip C: celebrity fundraiser
              <small>Listen for clipped breaths and robotic emphasis.</small>
              <div class="wave" style="--wave:linear-gradient(90deg,#8a5cff,#ff5c6c)"></div>
              <div class="button-row">
                <button class="secondary play-clip" data-play="clipC">Play</button>
                <button class="secondary mark-clip" data-mark="clipC">Mark suspicious</button>
              </div>
            </div>
          </div>
          <p class="puzzle-note" id="audioFeedback">Audio tags: suspicious clips are not always the loudest ones.</p>
        </div>
        <div class="button-row">
          <button class="primary" id="deepfakeSubmit">Submit Findings</button>
          <button class="secondary" id="deepfakeHint">Hint</button>
          <button class="secondary" id="deepfakeClose">Back</button>
        </div>
      `);

      const labCanvas = document.getElementById("forensicsCanvas");
      const labCtx = labCanvas.getContext("2d");
      const scrub = document.getElementById("videoScrub");
      const feedback = document.getElementById("videoFeedback");

      const drawLab = () => {
        t = playing ? (t + 0.012) % 1 : Number(scrub.value) / 100;
        scrub.value = String(Math.round(t * 100));
        drawForensicsFrame(labCtx, t);
        raf = requestAnimationFrame(drawLab);
      };
      drawLab();
      this.cleanup = () => {
        cancelAnimationFrame(raf);
        speechSynthesis.cancel();
      };

      document.getElementById("videoPlay").addEventListener("click", (event) => {
        playing = !playing;
        event.currentTarget.textContent = playing ? "Pause Video" : "Play Video";
      });
      scrub.addEventListener("input", () => {
        playing = false;
        document.getElementById("videoPlay").textContent = "Play Video";
        t = Number(scrub.value) / 100;
        drawForensicsFrame(labCtx, t);
      });
      overlayContent.querySelectorAll("[data-hotspot]").forEach((button) => {
        button.addEventListener("click", () => {
          found.add(button.dataset.hotspot);
          button.classList.add("found");
          feedback.textContent = `Found ${Math.min(3, found.size)}/3 video clues. ${deepfakeVideoMessage(button.dataset.hotspot)}`;
        });
      });
      overlayContent.querySelectorAll("[data-play]").forEach((button) => {
        button.addEventListener("click", () => this.playAudioClip(button.dataset.play));
      });
      overlayContent.querySelectorAll("[data-mark]").forEach((button) => {
        const clip = button.dataset.mark;
        button.addEventListener("click", () => {
          audioMarks[clip] = !audioMarks[clip];
          button.textContent = audioMarks[clip] ? "Marked suspicious" : "Mark suspicious";
          button.classList.toggle("selected", audioMarks[clip]);
        });
      });
      document.getElementById("deepfakeSubmit").addEventListener("click", () => {
        const audioCorrect = audioMarks.clipA && !audioMarks.clipB && audioMarks.clipC;
        if (found.size >= 3 && audioCorrect) {
          this.solvePuzzle("Forensics cleared. You checked video, audio, and context before sharing.");
        } else {
          const videoMissing = Math.max(0, 3 - found.size);
          document.getElementById("audioFeedback").textContent = `Need ${videoMissing} more video clue${videoMissing === 1 ? "" : "s"} or cleaner audio tags. Clip A and C are suspicious; Clip B is the control.`;
        }
      });
      document.getElementById("deepfakeHint").addEventListener("click", () => {
        this.hints += 1;
        feedback.textContent = "Check the mouth, face edge, shoulder shadow, and background poster. Then compare audio clips for flat cadence or clipped breaths.";
      });
      document.getElementById("deepfakeClose").addEventListener("click", () => {
        if (this.cleanup) this.cleanup();
        this.cleanup = null;
        clearOverlay();
        this.paused = false;
      });
    }

    playAudioClip(clip) {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioCtx = this.audioContext;
      audioCtx.resume();
      speechSynthesis.cancel();
      const phrases = {
        clipA: "Urgent update. Send the class login code now so I can fix your account.",
        clipB: "Reminder. Bring your charger tomorrow and check the project document.",
        clipC: "This is a celebrity message. Donate now before the link closes."
      };
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(phrases[clip]);
        utterance.rate = clip === "clipB" ? 1 : 0.92;
        utterance.pitch = clip === "clipB" ? 1.02 : 0.72;
        utterance.volume = 0.74;
        speechSynthesis.speak(utterance);
      }
      const start = audioCtx.currentTime + 0.03;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.connect(audioCtx.destination);
      const pattern = clip === "clipB" ? [220, 246, 261, 293, 330, 293, 246] :
        clip === "clipA" ? [210, 210, 210, 360, 210, 360, 210] :
        [180, 420, 180, 420, 180, 420, 600];
      pattern.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        osc.type = clip === "clipB" ? "sine" : "square";
        osc.frequency.setValueAtTime(freq, start + index * 0.13);
        noteGain.gain.setValueAtTime(clip === "clipB" ? 0.035 : 0.028, start + index * 0.13);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.13 + 0.1);
        osc.connect(noteGain);
        noteGain.connect(gain);
        osc.start(start + index * 0.13);
        osc.stop(start + index * 0.13 + 0.11);
      });
    }

    renderPrivacyVault() {
      const tokens = [
        ["I", false], ["am", false], ["Kai Tan", true], ["from", false], ["Riverside Secondary", true],
        ["class 2A.", true], ["My", false], ["phone", true], ["is", false], ["9123-8844,", true],
        ["home", true], ["is", false], ["18 Palm Street,", true], ["school login", true], ["is", false],
        ["kai.ai@school.sg", true], ["and", false], ["password", true], ["PandaSun77.", true],
        ["I feel anxious", true], ["after", false], ["my clinic visit.", true], ["Can AI", false],
        ["write a message", false], ["asking for homework help?", false]
      ];
      const selected = new Set();

      setOverlay(`
        <div class="puzzle-head">
          <h2>Privacy Vault</h2>
          <p>Tap the details that should be redacted before this prompt goes into an AI tool. Leave safe task context visible.</p>
        </div>
        <div class="redact-board">
          <div class="token-row" id="tokenRow"></div>
        </div>
        <p class="puzzle-note" id="privacyFeedback">Redact identity, contact, location, account, and sensitive wellbeing or health details.</p>
        <div class="button-row">
          <button class="primary" id="privacySubmit">Lock Vault</button>
          <button class="secondary" id="privacyHint">Hint</button>
          <button class="secondary" id="privacyClose">Back</button>
        </div>
      `);

      const render = () => {
        document.getElementById("tokenRow").innerHTML = tokens.map((token, index) => `
          <button class="token ${selected.has(index) ? "selected" : ""}" data-token="${index}">
            ${token[0]}
          </button>
        `).join("");
        overlayContent.querySelectorAll("[data-token]").forEach((button) => {
          button.addEventListener("click", () => {
            const index = Number(button.dataset.token);
            if (selected.has(index)) selected.delete(index);
            else selected.add(index);
            render();
          });
        });
      };
      render();

      document.getElementById("privacySubmit").addEventListener("click", () => {
        const missed = tokens.some((token, index) => token[1] && !selected.has(index));
        const falsePositives = tokens.filter((token, index) => !token[1] && selected.has(index)).length;
        if (!missed && falsePositives <= 2) {
          this.solvePuzzle("Vault locked. You kept the useful task and removed private details.");
        } else {
          document.getElementById("privacyFeedback").textContent = "The vault still sees too much private data, or too much safe task context got removed. Keep the purpose, redact identity.";
        }
      });
      document.getElementById("privacyHint").addEventListener("click", () => {
        this.hints += 1;
        document.getElementById("privacyFeedback").textContent = "Names, school, class, phone, address, login, password, and health or anxiety details should be replaced with placeholders.";
      });
      document.getElementById("privacyClose").addEventListener("click", () => {
        clearOverlay();
        this.paused = false;
      });
    }

    renderWellbeingFlow() {
      const habits = [
        { id: "h1", good: true, text: "Set a 25-minute focus timer before asking AI for more ideas." },
        { id: "h2", good: true, text: "Ask AI for three coping options, then choose one offline action." },
        { id: "h3", good: true, text: "Mute late-night notifications during sleep hours." },
        { id: "h4", good: true, text: "Tell a trusted person when online content makes you feel unsafe." },
        { id: "h5", good: false, text: "Keep refreshing until the AI gives an answer that feels perfect." },
        { id: "h6", good: false, text: "Compare your real day to AI-polished images and feeds." },
        { id: "h7", good: false, text: "Use AI as the only support when you feel in crisis." },
        { id: "h8", good: true, text: "Use AI to make a study plan with breaks and a shutdown time." }
      ];
      const chosen = new Set();
      let hits = 0;
      let misses = 0;
      let raf = 0;
      let started = performance.now();

      setOverlay(`
        <div class="puzzle-head">
          <h2>Calm Circuit</h2>
          <p>Build a healthier tech rhythm, then tap the breathing orb when it reaches the calm ring. Score 5 calm taps.</p>
        </div>
        <div class="wellbeing-board">
          <div class="habit-grid" id="habitGrid"></div>
          <div class="breath-stage">
            <button class="breath-orb" id="breathOrb" aria-label="Tap calm breathing orb"></button>
            <div>
              <div class="meter"><span id="breathMeter"></span></div>
              <p class="puzzle-note" id="wellbeingFeedback">Tap when the orb feels steady near the middle size. Hits: 0/5.</p>
            </div>
          </div>
        </div>
        <div class="button-row">
          <button class="primary" id="wellbeingSubmit">Open Forest Gate</button>
          <button class="secondary" id="wellbeingHint">Hint</button>
          <button class="secondary" id="wellbeingClose">Back</button>
        </div>
      `);

      const renderHabits = () => {
        document.getElementById("habitGrid").innerHTML = habits.map((habit) => `
          <button class="habit-card ${chosen.has(habit.id) ? "selected" : ""}" data-habit="${habit.id}">
            ${habit.text}
          </button>
        `).join("");
        overlayContent.querySelectorAll("[data-habit]").forEach((button) => {
          button.addEventListener("click", () => {
            const id = button.dataset.habit;
            if (chosen.has(id)) chosen.delete(id);
            else chosen.add(id);
            renderHabits();
          });
        });
      };
      renderHabits();

      const orb = document.getElementById("breathOrb");
      const meter = document.getElementById("breathMeter");
      const feedback = document.getElementById("wellbeingFeedback");
      const tick = () => {
        const phase = ((performance.now() - started) % 4200) / 4200;
        const scale = 0.72 + Math.sin(phase * Math.PI) * 0.28;
        orb.style.setProperty("--orb-scale", String(scale));
        meter.style.setProperty("--meter", `${(hits / 5) * 100}%`);
        raf = requestAnimationFrame(tick);
      };
      tick();
      this.cleanup = () => cancelAnimationFrame(raf);

      orb.addEventListener("click", () => {
        const phase = ((performance.now() - started) % 4200) / 4200;
        if (phase > 0.38 && phase < 0.68) {
          hits = Math.min(5, hits + 1);
          feedback.textContent = `Calm tap. Hits: ${hits}/5.`;
        } else {
          misses += 1;
          feedback.textContent = `Too early or too late. Misses: ${misses}. Wait for the steady middle.`;
        }
        meter.style.setProperty("--meter", `${(hits / 5) * 100}%`);
      });

      document.getElementById("wellbeingSubmit").addEventListener("click", () => {
        const habitsCorrect = habits.every((habit) => habit.good === chosen.has(habit.id));
        if (hits >= 5 && habitsCorrect) {
          this.solvePuzzle("Forest gate opened. You balanced AI help with human care and breaks.");
        } else {
          feedback.textContent = "Need 5 calm taps and only healthy habit cards selected. AI can help, but support and boundaries matter.";
        }
      });
      document.getElementById("wellbeingHint").addEventListener("click", () => {
        this.hints += 1;
        feedback.textContent = "Choose habits that add boundaries, sleep, trusted support, and breaks. Avoid spiral-refreshing or AI-only crisis support.";
      });
      document.getElementById("wellbeingClose").addEventListener("click", () => {
        if (this.cleanup) this.cleanup();
        this.cleanup = null;
        clearOverlay();
        this.paused = false;
      });
    }

    renderFinalBoss() {
      const claims = [
        { id: "claim1", text: "Our AI wellbeing video is safe for all students.", source: "test" },
        { id: "claim2", text: "This clip of a principal announcing a rule change is real.", source: "origin" },
        { id: "claim3", text: "The advice in our AI guide matches school policy.", source: "policy" }
      ];
      const sources = [
        { id: "policy", text: "School policy and teacher review" },
        { id: "origin", text: "Original upload plus trusted news confirmation" },
        { id: "test", text: "Student feedback, accessibility test, and harm check" }
      ];
      const assigned = {};
      let selectedSource = null;

      setOverlay(`
        <div class="puzzle-head">
          <h2>Trust Boss</h2>
          <p>Balance perspectives, connect claims to evidence, and activate responsible release shields.</p>
        </div>
        <div class="boss-board">
          <div>
            <h3>Perspective Balance</h3>
            <div class="slider-row"><label for="teenSlider">Students</label><input id="teenSlider" type="range" min="0" max="100" value="55"><strong id="teenValue">55</strong></div>
            <div class="slider-row"><label for="parentSlider">Caregivers</label><input id="parentSlider" type="range" min="0" max="100" value="25"><strong id="parentValue">25</strong></div>
            <div class="slider-row"><label for="teacherSlider">Educators</label><input id="teacherSlider" type="range" min="0" max="100" value="20"><strong id="teacherValue">20</strong></div>
            <p class="puzzle-note" id="balanceFeedback">Keep total near 100 and each group between 25 and 40 so one voice does not dominate.</p>
          </div>
          <div>
            <h3>Evidence Links</h3>
            <div class="source-bank" id="bossSources"></div>
            <div class="claim-board" id="bossClaims"></div>
          </div>
          <div>
            <h3>Release Shields</h3>
            <div class="habit-grid" id="shieldGrid">
              <button class="habit-card" data-shield="label" data-good="true">Label AI-generated media clearly.</button>
              <button class="habit-card" data-shield="consent" data-good="true">Get consent before using voices or faces.</button>
              <button class="habit-card" data-shield="verify" data-good="true">Verify facts before posting.</button>
              <button class="habit-card" data-shield="crisis" data-good="true">Escalate serious wellbeing concerns to trusted humans.</button>
              <button class="habit-card" data-shield="speed" data-good="false">Post first so nobody else gets the views.</button>
              <button class="habit-card" data-shield="hide" data-good="false">Hide AI use if the result looks real enough.</button>
            </div>
          </div>
          <p class="puzzle-note" id="bossFeedback">Boss shield: waiting for balanced sliders, evidence links, and release shields.</p>
        </div>
        <div class="button-row">
          <button class="primary" id="bossSubmit">Defeat Boss</button>
          <button class="secondary" id="bossHint">Hint</button>
          <button class="secondary" id="bossClose">Back</button>
        </div>
      `);

      const shieldChosen = new Set();
      const renderBossSources = () => {
        document.getElementById("bossSources").innerHTML = sources.map((source) => `
          <button class="source-chip ${selectedSource === source.id ? "selected" : ""}" data-boss-source="${source.id}">
            ${source.text}
          </button>
        `).join("");
        document.getElementById("bossClaims").innerHTML = claims.map((claim) => {
          const source = sources.find((item) => item.id === assigned[claim.id]);
          return `
            <button class="claim-card" data-claim="${claim.id}">
              ${claim.text}
              <small>${source ? `Linked: ${source.text}` : "Tap after selecting evidence"}</small>
            </button>
          `;
        }).join("");
        overlayContent.querySelectorAll("[data-boss-source]").forEach((button) => {
          button.addEventListener("click", () => {
            selectedSource = selectedSource === button.dataset.bossSource ? null : button.dataset.bossSource;
            renderBossSources();
          });
        });
        overlayContent.querySelectorAll("[data-claim]").forEach((button) => {
          button.addEventListener("click", () => {
            if (selectedSource) {
              assigned[button.dataset.claim] = selectedSource;
              selectedSource = null;
              renderBossSources();
            }
          });
        });
      };
      renderBossSources();

      const updateSliderLabels = () => {
        ["teen", "parent", "teacher"].forEach((id) => {
          document.getElementById(`${id}Value`).textContent = document.getElementById(`${id}Slider`).value;
        });
      };
      overlayContent.querySelectorAll("input[type='range']").forEach((slider) => {
        slider.addEventListener("input", updateSliderLabels);
      });

      overlayContent.querySelectorAll("[data-shield]").forEach((button) => {
        button.addEventListener("click", () => {
          const id = button.dataset.shield;
          if (shieldChosen.has(id)) shieldChosen.delete(id);
          else shieldChosen.add(id);
          button.classList.toggle("selected", shieldChosen.has(id));
        });
      });

      document.getElementById("bossSubmit").addEventListener("click", () => {
        const values = ["teen", "parent", "teacher"].map((id) => Number(document.getElementById(`${id}Slider`).value));
        const total = values.reduce((sum, value) => sum + value, 0);
        const balanced = Math.abs(total - 100) <= 5 && Math.min(...values) >= 25 && Math.max(...values) <= 40;
        const sourcesCorrect = claims.every((claim) => assigned[claim.id] === claim.source);
        const shieldsCorrect = Array.from(overlayContent.querySelectorAll("[data-shield]")).every((button) => {
          const should = button.dataset.good === "true";
          return should === shieldChosen.has(button.dataset.shield);
        });
        if (balanced && sourcesCorrect && shieldsCorrect) {
          this.solvePuzzle("Boss defeated. Your AI workflow is fast, fair, verified, private, and humane.");
        } else {
          const feedback = document.getElementById("bossFeedback");
          feedback.textContent = "Boss shield still active. Balance every group between 25 and 40, link each claim to the right evidence, and choose only responsible release shields.";
        }
      });
      document.getElementById("bossHint").addEventListener("click", () => {
        this.hints += 1;
        document.getElementById("bossFeedback").textContent = "A good release checks fairness with feedback, verifies real-world claims at the origin, follows policy, labels AI media, gets consent, and protects people in distress.";
      });
      document.getElementById("bossClose").addEventListener("click", () => {
        clearOverlay();
        this.paused = false;
      });
    }
  }

  function buildLevel(spec, index) {
    const worldW = spec.worldW;
    const gaps = [
      { x: 820 + index * 22, w: 118 + index * 8 },
      { x: 1660 + index * 35, w: 135 },
      { x: 2580 + index * 18, w: 150 },
      { x: 3740 + index * 24, w: 128 }
    ];
    const platforms = [];
    let cursor = 0;
    for (const gap of gaps) {
      platforms.push({ x: cursor, y: 640, w: gap.x - cursor, h: 90, kind: "ground" });
      cursor = gap.x + gap.w;
    }
    platforms.push({ x: cursor, y: 640, w: worldW - cursor, h: 90, kind: "ground" });

    const floating = [
      [420, 515, 180], [700, 430, 170], [1080, 525, 170], [1300, 430, 190],
      [1850, 530, 200], [2160, 455, 180], [2380, 380, 160], [2920, 520, 190],
      [3220, 445, 170], [3470, 365, 170], [3970, 520, 180], [4300, 445, 170]
    ];
    for (const [x, y, w] of floating) {
      if (x < worldW - 420) platforms.push({ x: x + index * 12, y, w, h: 30, kind: "block" });
    }

    const sparks = spec.lesson.map((text, i) => {
      const positions = [
        { x: 520, y: 460 }, { x: 1220, y: 374 }, { x: 2050, y: 470 },
        { x: 2475, y: 320 }, { x: 3350, y: 382 }, { x: worldW - 680, y: 465 }
      ];
      const pos = positions[i] || positions[positions.length - 1];
      return { x: pos.x + index * 10, y: pos.y, w: 36, h: 36, text, collected: false };
    });

    const coins = [];
    for (let i = 0; i < 34; i += 1) {
      coins.push({
        x: 260 + i * 130 + (i % 3) * 24,
        y: i % 4 === 0 ? 465 : i % 4 === 1 ? 360 : 570,
        w: 22,
        h: 22,
        collected: false
      });
    }

    const hazards = gaps.map((gap, i) => ({
      x: gap.x + 8,
      y: 622,
      w: Math.max(70, gap.w - 16),
      h: 28,
      message: i % 2 === 0 ? "Doomscroll pit. Reset and breathe before you leap." : "Data leak pit. Keep private details out of the drop."
    }));
    hazards.push(
      { x: 1450 + index * 20, y: 604, w: 92, h: 36, message: "Clickbait slime hit. Verify before you chase the shiny claim." },
      { x: 3060 + index * 18, y: 604, w: 120, h: 36, message: "Over-sharing spill. Redact before you proceed." }
    );

    const bots = [
      {
        x: 1740 + index * 10,
        y: 588,
        w: 54,
        h: 52,
        min: 1680 + index * 10,
        max: 1980 + index * 10,
        vx: 95 + index * 8,
        message: "Hallucination bot bumped you. Ask for sources, then check them."
      },
      {
        x: 3320 + index * 15,
        y: 588,
        w: 54,
        h: 52,
        min: 3240 + index * 15,
        max: 3570 + index * 15,
        vx: -110 - index * 8,
        message: "Deepfake drone clipped you. Look for more than one clue."
      }
    ];

    return {
      spec,
      worldW,
      required: spec.required,
      spawn: { x: 80, y: 520 },
      station: { x: Math.floor(worldW * 0.58), y: 558, w: 86, h: 82 },
      exit: { x: worldW - 210, y: 558, w: 74, h: 92 },
      platforms,
      sparks,
      coins,
      hazards,
      bots,
      puzzleSolved: false,
      prompt: ""
    };
  }

  function drawAttractMode() {
    const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    sky.addColorStop(0, "#62c8ff");
    sky.addColorStop(1, "#eaffcf");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = "#53c95f";
    ctx.fillRect(0, 620, LOGICAL_W, 100);
    for (let i = 0; i < 8; i += 1) {
      fillBox(ctx, 120 + i * 130, 520 - (i % 3) * 60, 72, 42, i % 2 ? "#ffd166" : "#ff9f1c", "rgba(20,33,61,.25)", 3);
    }
  }

  function drawParallax(spec, cam) {
    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 12; i += 1) {
      const x = ((i * 230 - cam * 0.2) % 1500 + 1500) % 1500 - 120;
      const y = 70 + (i % 4) * 46;
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.arc(x + 34, y - 9, 36, 0, Math.PI * 2);
      ctx.arc(x + 74, y + 4, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 9; i += 1) {
      const x = ((i * 310 - cam * 0.35) % 1800 + 1800) % 1800 - 160;
      const h = 95 + (i % 3) * 44;
      fillBox(ctx, x, 640 - h, 110, h, i % 2 ? "#9be36a" : "#64c85f");
      fillBox(ctx, x + 18, 640 - h - 32, 74, 42, spec.color);
    }
    ctx.restore();
  }

  function drawLevelGeometry(level) {
    for (const platform of level.platforms) {
      const fill = platform.kind === "ground" ? "#53c95f" : "#ffb84d";
      fillBox(ctx, platform.x, platform.y, platform.w, platform.h, fill, "rgba(20,33,61,.24)", 3);
      ctx.fillStyle = platform.kind === "ground" ? "#2d9f49" : "#db832f";
      ctx.fillRect(platform.x, platform.y + platform.h - 12, platform.w, 12);
      if (platform.kind === "ground") {
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(platform.x, platform.y + 34, platform.w, platform.h - 34);
      }
      const tileW = 58;
      for (let x = platform.x; x < platform.x + platform.w; x += tileW) {
        ctx.strokeStyle = "rgba(20,33,61,.08)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, platform.y, Math.min(tileW, platform.x + platform.w - x), platform.h);
      }
    }
  }

  function drawCollectibles(level) {
    const time = performance.now() / 600;
    for (const coin of level.coins) {
      if (coin.collected) continue;
      ctx.save();
      ctx.translate(coin.x + 11, coin.y + 11 + Math.sin(time + coin.x) * 3);
      ctx.rotate(time * 0.04);
      fillBox(ctx, -11, -11, 22, 22, "#ffd166", "rgba(20,33,61,.24)", 2);
      ctx.fillStyle = "#fff9bc";
      ctx.fillRect(-3, -8, 6, 16);
      ctx.restore();
    }
    for (const spark of level.sparks) {
      if (spark.collected) continue;
      ctx.save();
      ctx.translate(spark.x + 18, spark.y + 18 + Math.sin(time + spark.x * 0.02) * 5);
      ctx.rotate(Math.PI / 4 + time * 0.025);
      fillBox(ctx, -16, -16, 32, 32, "#ffffff", level.spec.color, 4);
      ctx.fillStyle = level.spec.color;
      ctx.fillRect(-5, -18, 10, 36);
      ctx.fillRect(-18, -5, 36, 10);
      ctx.restore();
    }
  }

  function drawStation(level) {
    const s = level.station;
    const spec = level.spec;
    fillBox(ctx, s.x - 32, s.y + 38, 150, 22, "#8b5a2b", "rgba(20,33,61,.22)", 3);
    fillBox(ctx, s.x, s.y, s.w, s.h, spec.color, "rgba(20,33,61,.3)", 4);
    fillBox(ctx, s.x + 16, s.y - 34, 54, 44, "#fff9ec", "rgba(20,33,61,.28)", 3);
    ctx.fillStyle = "#14213d";
    ctx.font = "900 16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("AI", s.x + 43, s.y - 7);
    ctx.textAlign = "left";
    if (level.puzzleSolved) {
      ctx.fillStyle = "#37d6a2";
      ctx.beginPath();
      ctx.arc(s.x + 43, s.y + 42, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#14213d";
      ctx.font = "900 24px system-ui";
      ctx.fillText("OK", s.x + 26, s.y + 50);
    }
  }

  function drawExit(level) {
    const e = level.exit;
    const sparkCount = level.sparks.filter((spark) => spark.collected).length;
    const unlocked = sparkCount >= level.required && level.puzzleSolved;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.strokeStyle = unlocked ? "#37d6a2" : "#5c6682";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(36, 42, 36, 54, 0, 0, Math.PI * 2);
    ctx.stroke();
    const gradient = ctx.createRadialGradient(36, 42, 6, 36, 42, 52);
    gradient.addColorStop(0, unlocked ? "#ffffff" : "#d9e0ec");
    gradient.addColorStop(1, unlocked ? "#2878ff" : "#8290a8");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(36, 42, 28, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#14213d";
    ctx.font = "900 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(unlocked ? "GO" : "LOCK", 36, 48);
    ctx.restore();
  }

  function drawHazards(level) {
    for (const hazard of level.hazards) {
      fillBox(ctx, hazard.x, hazard.y, hazard.w, hazard.h, "#ff5c6c", "rgba(20,33,61,.28)", 3);
      ctx.fillStyle = "#ffffff";
      for (let x = hazard.x + 8; x < hazard.x + hazard.w - 8; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, hazard.y + 5);
        ctx.lineTo(x + 8, hazard.y + 22);
        ctx.lineTo(x - 8, hazard.y + 22);
        ctx.fill();
      }
    }
    for (const bot of level.bots) {
      fillBox(ctx, bot.x, bot.y, bot.w, bot.h, "#ffffff", "#14213d", 3);
      fillBox(ctx, bot.x + 8, bot.y + 10, bot.w - 16, 16, "#8a5cff");
      ctx.fillStyle = "#14213d";
      ctx.fillRect(bot.x + 13, bot.y + 30, 8, 8);
      ctx.fillRect(bot.x + bot.w - 21, bot.y + 30, 8, 8);
      ctx.strokeStyle = "#14213d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bot.x + 14, bot.y);
      ctx.lineTo(bot.x + 6, bot.y - 14);
      ctx.moveTo(bot.x + bot.w - 14, bot.y);
      ctx.lineTo(bot.x + bot.w - 6, bot.y - 14);
      ctx.stroke();
    }
  }

  function drawPlayer(player, time) {
    if (!player) return;
    if (player.invuln > 0 && Math.floor(time * 16) % 2 === 0) return;
    const x = player.x;
    const y = player.y;
    const bob = player.grounded ? Math.sin(time * 11) * Math.min(4, Math.abs(player.vx) / 90) : 0;
    ctx.save();
    ctx.translate(x + player.w / 2, y + bob);
    ctx.scale(player.facing, 1);
    fillBox(ctx, -18, 28, 36, 42, "#2878ff", "#14213d", 3);
    fillBox(ctx, -24, 18, 16, 38, "#ffdc9f", "#14213d", 3);
    fillBox(ctx, 8, 18, 16, 38, "#ffdc9f", "#14213d", 3);
    fillBox(ctx, -17, 68, 14, 28, "#14213d", "#14213d", 2);
    fillBox(ctx, 3, 68, 14, 28, "#14213d", "#14213d", 2);
    fillBox(ctx, -22, -18, 44, 42, "#ffdc9f", "#14213d", 3);
    fillBox(ctx, -25, -30, 50, 18, "#ff5c6c", "#14213d", 3);
    fillBox(ctx, 3, -8, 7, 7, "#14213d");
    fillBox(ctx, -14, -8, 7, 7, "#14213d");
    ctx.fillStyle = "#14213d";
    ctx.fillRect(-7, 10, 16, 4);
    fillBox(ctx, -30, 36, 12, 24, "#ffd166", "#14213d", 2);
    ctx.restore();
  }

  function drawMiniHud(level, cam) {
    if (level.prompt) {
      fillBox(ctx, 360, 584, 560, 48, "rgba(255,249,236,.92)", "rgba(20,33,61,.24)", 3);
      ctx.fillStyle = "#14213d";
      ctx.font = "900 20px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(level.prompt, 640, 616);
      ctx.textAlign = "left";
    }
    const progressX = 24;
    const progressY = 672;
    fillBox(ctx, progressX, progressY, 220, 18, "rgba(255,255,255,.72)", "rgba(20,33,61,.18)", 2);
    const playerCenter = game && game.player ? game.player.x + game.player.w / 2 : 0;
    const ratio = clamp(playerCenter / level.worldW, 0, 1);
    ctx.fillStyle = level.spec.color;
    ctx.fillRect(progressX + 3, progressY + 3, (220 - 6) * ratio, 12);
    ctx.fillStyle = "#14213d";
    ctx.font = "800 12px system-ui";
    ctx.fillText(level.spec.name, progressX, progressY - 8);
  }

  function drawForensicsFrame(context, t) {
    const w = context.canvas.width;
    const h = context.canvas.height;
    context.fillStyle = "#22345b";
    context.fillRect(0, 0, w, h);
    context.fillStyle = "#6ecbff";
    context.fillRect(0, 0, w, h * 0.52);
    context.fillStyle = "#ffcf66";
    context.fillRect(0, h * 0.52, w, h * 0.48);
    context.save();
    context.translate(w * 0.74 + Math.sin(t * Math.PI * 6) * 5, h * 0.2);
    context.rotate(Math.sin(t * Math.PI * 8) * 0.08);
    fillBox(context, -44, -18, 88, 36, "#ffffff", "#14213d", 3);
    context.fillStyle = "#14213d";
    context.font = "900 18px system-ui";
    context.textAlign = "center";
    context.fillText("REAL?", 0, 7);
    context.restore();
    context.textAlign = "left";

    context.fillStyle = "rgba(20,33,61,.26)";
    context.beginPath();
    context.ellipse(w * 0.57 + Math.sin(t * Math.PI * 4) * 38, h * 0.81, 120, 30, 0.2, 0, Math.PI * 2);
    context.fill();

    const cx = w * 0.46;
    const cy = h * 0.43;
    fillBox(context, cx - 120, cy - 128, 240, 250, "#ffdc9f", "#14213d", 6);
    fillBox(context, cx - 140, cy - 154, 280, 52, "#1b2344", "#14213d", 6);
    fillBox(context, cx - 88, cy - 26, 42, 34, "#ffffff", "#14213d", 4);
    fillBox(context, cx + 46, cy - 26, 42, 34, "#ffffff", "#14213d", 4);
    context.fillStyle = "#14213d";
    context.fillRect(cx - 70 + Math.sin(t * 40) * 3, cy - 14, 10, 10);
    context.fillRect(cx + 64 + Math.sin(t * 40) * 3, cy - 14, 10, 10);

    const blinkGlitch = Math.sin(t * Math.PI * 18) > 0.92;
    if (blinkGlitch) {
      context.fillStyle = "#ff5c6c";
      context.fillRect(cx - 90, cy - 28, 48, 6);
      context.fillRect(cx + 42, cy - 13, 48, 6);
    }

    const mouthLag = Math.sin((t + 0.18) * Math.PI * 8);
    fillBox(context, cx - 46, cy + 64, 92, 18 + Math.abs(mouthLag) * 32, "#7a1f2b", "#14213d", 4);
    context.fillStyle = "#ffffff";
    context.fillRect(cx - 32, cy + 70, 64, 6);

    if (Math.sin(t * Math.PI * 15) > 0.68) {
      context.strokeStyle = "rgba(255,255,255,.85)";
      context.lineWidth = 8;
      context.strokeRect(cx - 126, cy - 134, 252, 264);
    }

    context.fillStyle = Math.sin(t * Math.PI * 20) > 0.4 ? "#ffd166" : "#8a5cff";
    context.beginPath();
    context.arc(cx - 116, cy + 10, 12, 0, Math.PI * 2);
    context.arc(cx + 116, cy + 10, 12, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#2878ff";
    fillBox(context, cx - 142, cy + 122, 284, 150, "#2878ff", "#14213d", 5);
    context.fillStyle = "#ffd166";
    context.fillRect(cx - 82, cy + 144, 164, 30);
  }

  function deepfakeVideoMessage(id) {
    const messages = {
      mouth: "Mouth timing does not match the speech rhythm.",
      edge: "Face edges shimmer against the background.",
      shadow: "The shadow drifts in a different direction than the light.",
      background: "Background text warps while the face moves."
    };
    return messages[id] || "Good clue.";
  }

  function setupGlobalErrorGuard() {
    window.addEventListener("error", (event) => {
      console.error(event.error || event.message);
      showToast("A game script error happened. Open the console for details.");
    });
  }

  setCanvasScale();
  setupGlobalErrorGuard();
  window.addEventListener("resize", setCanvasScale);
  const game = new Game();
})();
