// ═══════════════════════════════════════════════════════════
//  LetraViva – App Principal
//  Gestión de UI, estados, eventos táctiles y estadísticas
// ═══════════════════════════════════════════════════════════

(() => {
  // ── ELEMENTOS ────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const screens = {
    home:    $("screen-home"),
    loading: $("screen-loading"),
    game:    $("screen-game"),
    win:     $("screen-win"),
    error:   $("screen-error")
  };

  // ── ESTADO DEL JUEGO ─────────────────────────────────────
  let state = {
    puzzle: null,
    foundWords: [],       // índices de palabras encontradas
    foundCells: {},       // "r,c" → colorIndex
    selecting: false,
    startCell: null,
    currentCells: [],
    timerSec: 0,
    timerInterval: null,
    topic: "Fútbol",
    difficulty: "Fácil"
  };

  // ── NAVEGACIÓN ───────────────────────────────────────────
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  // ── ESTADÍSTICAS (localStorage) ──────────────────────────
  function loadStats() {
    try {
      const s = JSON.parse(localStorage.getItem("letraviva_stats") || "{}");
      $("stat-jugados").textContent     = s.jugados     || 0;
      $("stat-completados").textContent = s.completados || 0;
      $("stat-racha").textContent       = s.racha       || 0;
    } catch(e) {}
  }

  function saveStats(completed) {
    try {
      const s = JSON.parse(localStorage.getItem("letraviva_stats") || "{}");
      s.jugados = (s.jugados || 0) + 1;
      if (completed) {
        s.completados = (s.completados || 0) + 1;
        s.racha = (s.racha || 0) + 1;
      } else {
        s.racha = 0;
      }
      localStorage.setItem("letraviva_stats", JSON.stringify(s));
      loadStats();
    } catch(e) {}
  }

  // ── TOAST ─────────────────────────────────────────────────
  let toastTimer;
  function showToast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ── TIMER ─────────────────────────────────────────────────
  function startTimer() {
    state.timerSec = 0;
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.timerSec++;
      const m = Math.floor(state.timerSec / 60);
      const s = String(state.timerSec % 60).padStart(2, "0");
      $("timer-display").textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() { clearInterval(state.timerInterval); }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  // ── GENERA Y COMIENZA PUZZLE ──────────────────────────────
  async function startGame() {
    showScreen("loading");
    $("loading-sub").textContent = `Buscando palabras sobre ${state.topic}...`;

    saveStats(false);

    try {
      const puzzle = await PuzzleEngine.build(state.topic, state.difficulty);
      state.puzzle = puzzle;
      state.foundWords = [];
      state.foundCells = {};

      renderGame();
      showScreen("game");
      startTimer();

    } catch (err) {
      console.error(err);
      $("error-msg").textContent = err.message || "Error desconocido.";
      const isKeyError = err.message && (
        err.message.includes("API") ||
        err.message.includes("key") ||
        err.message.includes("auth") ||
        err.message.includes("401")
      );
      $("error-key-hint").style.display = isKeyError ? "block" : "none";
      showScreen("error");
    }
  }

  // ── RENDERIZA EL TABLERO ──────────────────────────────────
  function renderGame() {
    const { puzzle } = state;

    // Header
    $("game-topic-badge").textContent = puzzle.topic;

    // Palabras
    const strip = $("words-strip");
    strip.innerHTML = "";
    puzzle.words.forEach((w, i) => {
      const chip = document.createElement("span");
      chip.className = "word-chip";
      chip.id = `chip-${i}`;
      chip.textContent = w.original;
      strip.appendChild(chip);
    });

    // Grid
    const grid = $("letter-grid");
    grid.style.gridTemplateColumns = `repeat(${puzzle.size}, var(--cell-size))`;
    grid.innerHTML = "";

    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.textContent = puzzle.grid[r][c];
        grid.appendChild(cell);
      }
    }

    updateProgress();
    setupGridEvents();
  }

  // ── EVENTOS TÁCTILES / MOUSE ──────────────────────────────
  function setupGridEvents() {
    const grid = $("letter-grid");

    function cellAt(e) {
      const touch = e.touches ? e.touches[0] : e;
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      return el && el.classList.contains("grid-cell") ? el : null;
    }

    function cellKey(el) { return `${el.dataset.r},${el.dataset.c}`; }

    function selectStart(e) {
      e.preventDefault();
      const cell = cellAt(e);
      if (!cell) return;
      state.selecting = true;
      state.startCell = cell;
      state.currentCells = [cell];
      clearSelecting();
      cell.classList.add("selecting");
    }

    function selectMove(e) {
      if (!state.selecting) return;
      e.preventDefault();
      const endCell = cellAt(e);
      if (!endCell || !state.startCell) return;

      const r1 = +state.startCell.dataset.r, c1 = +state.startCell.dataset.c;
      const r2 = +endCell.dataset.r,         c2 = +endCell.dataset.c;
      const dr = r2 - r1, dc = c2 - c1;

      // Solo permite líneas rectas o diagonales 45°
      const isLine = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
      if (!isLine) return;

      const len = Math.max(Math.abs(dr), Math.abs(dc));
      const stepR = len === 0 ? 0 : dr / len;
      const stepC = len === 0 ? 0 : dc / len;

      const cells = [];
      for (let i = 0; i <= len; i++) {
        const r = r1 + Math.round(stepR * i);
        const c = c1 + Math.round(stepC * i);
        const el = document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
        if (el) cells.push(el);
      }

      clearSelecting();
      state.currentCells = cells;
      cells.forEach(el => el.classList.add("selecting"));
    }

    function selectEnd(e) {
      if (!state.selecting) return;
      state.selecting = false;
      checkSelection();
      clearSelecting();
    }

    grid.addEventListener("mousedown",  selectStart, { passive: false });
    grid.addEventListener("mousemove",  selectMove,  { passive: false });
    grid.addEventListener("mouseup",    selectEnd);
    grid.addEventListener("touchstart", selectStart, { passive: false });
    grid.addEventListener("touchmove",  selectMove,  { passive: false });
    grid.addEventListener("touchend",   selectEnd,   { passive: false });
  }

  function clearSelecting() {
    document.querySelectorAll(".grid-cell.selecting")
      .forEach(el => el.classList.remove("selecting"));
  }

  // ── VERIFICA SELECCIÓN ────────────────────────────────────
  function checkSelection() {
    if (state.currentCells.length < 2) return;

    const selected = state.currentCells.map(el => ({
      r: +el.dataset.r,
      c: +el.dataset.c,
      letter: el.textContent
    }));

    const selectedWord = selected.map(c => c.letter).join("");
    const selectedRev  = [...selectedWord].reverse().join("");

    const { puzzle } = state;

    for (let i = 0; i < puzzle.words.length; i++) {
      if (state.foundWords.includes(i)) continue;

      const w = puzzle.words[i].normalized;
      if (selectedWord === w || selectedRev === w) {
        // Verifica posiciones exactas
        const positions = puzzle.words[i].positions;
        const selKeys = selected.map(c => `${c.r},${c.c}`);
        const posKeys = positions.map(([r,c]) => `${r},${c}`);
        const match = posKeys.every(k => selKeys.includes(k)) &&
                      selKeys.every(k => posKeys.includes(k));

        if (match) {
          const colorIdx = state.foundWords.length % 6;
          state.foundWords.push(i);

          // Marca celdas
          positions.forEach(([r,c]) => {
            state.foundCells[`${r},${c}`] = colorIdx;
            const el = document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
            if (el) {
              el.classList.remove(...[...el.classList].filter(c => c.startsWith("found-color-")));
              el.classList.add(`found-color-${colorIdx}`);
            }
          });

          // Marca chip
          const chip = $(`chip-${i}`);
          if (chip) {
            chip.classList.add("found", `found-${colorIdx}`);
          }

          showToast(`✓ ${puzzle.words[i].original}`);
          updateProgress();

          if (state.foundWords.length === puzzle.words.length) {
            setTimeout(showWin, 600);
          }
          return;
        }
      }
    }
  }

  // ── PROGRESO ──────────────────────────────────────────────
  function updateProgress() {
    if (!state.puzzle) return;
    const pct = (state.foundWords.length / state.puzzle.words.length) * 100;
    $("progress-fill").style.width = pct + "%";
  }

  // ── VICTORIA ──────────────────────────────────────────────
  function showWin() {
    stopTimer();
    saveStats(true);

    const sec = state.timerSec;
    $("win-time").textContent = "⏱ " + formatTime(sec);
    $("win-sub").textContent  = `Tema: ${state.puzzle.topic} · ${state.puzzle.difficulty}`;

    // Estrellas según tiempo
    let stars = "⭐";
    if (sec < 60)  stars = "⭐⭐⭐";
    else if (sec < 180) stars = "⭐⭐";
    $("win-stars").textContent = stars;

    showScreen("win");
  }

  // ── COMPARTIR ─────────────────────────────────────────────
  function shareResult() {
    const stars = $("win-stars").textContent;
    const time  = $("win-time").textContent;
    const text  = `LetraViva 🔤\n${stars}\n${time}\nTema: ${state.puzzle?.topic}\n¡Juega gratis!`;

    if (navigator.share) {
      navigator.share({ title: "LetraViva", text });
    } else {
      navigator.clipboard?.writeText(text);
      showToast("¡Copiado al portapapeles!");
    }
  }

  // ── DAILY BADGE ───────────────────────────────────────────
  function updateDailyBadge() {
    const today = new Date().toLocaleDateString("es-PE", {
      weekday: "short", day: "numeric", month: "short"
    });
    $("daily-badge").textContent = `🗓 ${today}`;
  }

  // ── INICIALIZA ────────────────────────────────────────────
  function init() {
    loadStats();
    updateDailyBadge();

    // Selección de tema
    document.querySelectorAll(".topic-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".topic-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.topic = btn.dataset.topic;
      });
    });

    // Selección de dificultad
    document.querySelectorAll(".diff-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.difficulty = btn.dataset.diff;
      });
    });

    // Botones principales
    $("play-btn").addEventListener("click", startGame);
    $("back-btn").addEventListener("click", () => {
      stopTimer();
      showScreen("home");
    });
    $("play-again-btn").addEventListener("click", startGame);
    $("home-btn").addEventListener("click", () => showScreen("home"));
    $("share-btn").addEventListener("click", shareResult);
    $("error-retry-btn").addEventListener("click", startGame);
    $("error-home-btn").addEventListener("click", () => showScreen("home"));
  }

  document.addEventListener("DOMContentLoaded", init);

})();
