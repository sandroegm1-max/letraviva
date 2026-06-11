// ═══════════════════════════════════════════════════════════
//  LetraViva – Motor de Puzzle (versión segura)
//  Ahora llama a /api/generate-words (tu servidor en Vercel)
//  en lugar de exponer la clave en el navegador.
// ═══════════════════════════════════════════════════════════

const PuzzleEngine = (() => {

  // Todas las direcciones posibles (horizontal, vertical, diagonal)
  const DIRS = [
    [0,1],[0,-1],[1,0],[-1,0],
    [1,1],[1,-1],[-1,1],[-1,-1]
  ];

  // ── NORMALIZA TEXTO ──────────────────────────────────────
  function normalize(str) {
    return str
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/Ñ/g, "N")
      .replace(/[^A-Z]/g, "");
  }

  // ── GENERA TABLERO VACÍO ─────────────────────────────────
  function emptyGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(null));
  }

  // ── INTENTA COLOCAR UNA PALABRA ──────────────────────────
  function placeWord(grid, word, size) {
    const w = normalize(word);
    const shuffledDirs = [...DIRS].sort(() => Math.random() - 0.5);

    for (let attempt = 0; attempt < 60; attempt++) {
      const [dr, dc] = shuffledDirs[attempt % shuffledDirs.length];
      const startR = Math.floor(Math.random() * size);
      const startC = Math.floor(Math.random() * size);
      const endR = startR + dr * (w.length - 1);
      const endC = startC + dc * (w.length - 1);

      if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;

      let ok = true;
      for (let i = 0; i < w.length; i++) {
        const r = startR + dr * i;
        const c = startC + dc * i;
        if (grid[r][c] !== null && grid[r][c] !== w[i]) { ok = false; break; }
      }

      if (ok) {
        const positions = [];
        for (let i = 0; i < w.length; i++) {
          const r = startR + dr * i;
          const c = startC + dc * i;
          grid[r][c] = w[i];
          positions.push([r, c]);
        }
        return positions;
      }
    }
    return null;
  }

  // ── RELLENA CASILLAS VACÍAS ──────────────────────────────
  const LETTERS = "ABCDEFGHIJKLMNOPRSTUVWYZ";
  function fillRandom(grid) {
    for (let r = 0; r < grid.length; r++)
      for (let c = 0; c < grid[r].length; c++)
        if (grid[r][c] === null)
          grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }

  // ── LLAMA A TU SERVIDOR EN VERCEL (no expone la clave) ───
  async function fetchWordsFromAI(topic, difficulty) {
    const cfg = CONFIG.DIFFICULTY[difficulty];

    const response = await fetch("/api/generate-words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        words: cfg.words,
        minLen: cfg.minLen,
        maxLen: cfg.maxLen
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Error HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.words) || data.words.length === 0)
      throw new Error("No se recibieron palabras del servidor");

    return data.words.map(w => String(w).replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/g, ""));
  }

  // ── API PÚBLICA: CONSTRUYE EL PUZZLE COMPLETO ────────────
  async function build(topic, difficulty) {
    const cfg = CONFIG.DIFFICULTY[difficulty];
    const words = await fetchWordsFromAI(topic, difficulty);

    const grid = emptyGrid(cfg.gridSize);
    const placed = [];

    const shuffled = [...words].sort(() => Math.random() - 0.5);

    for (const word of shuffled) {
      const normalized = normalize(word);
      if (normalized.length < cfg.minLen || normalized.length > cfg.maxLen + 2) continue;
      const positions = placeWord(grid, normalized, cfg.gridSize);
      if (positions) {
        placed.push({
          original: word.toUpperCase(),
          normalized,
          positions
        });
      }
      if (placed.length >= cfg.words) break;
    }

    if (placed.length < 3) throw new Error("No se pudieron colocar suficientes palabras");

    fillRandom(grid);

    return {
      grid,
      words: placed,
      size: cfg.gridSize,
      topic,
      difficulty
    };
  }

  return { build, normalize };
})();
