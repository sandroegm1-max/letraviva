// ═══════════════════════════════════════════════════════════
//  LetraViva – Motor de Puzzle · v2
//  Mejoras: memoria de palabras usadas (anti-repetición) y
//  verificación final del tablero (cada palabra debe estar
//  completa y encontrable, letra por letra).
// ═══════════════════════════════════════════════════════════

const PuzzleEngine = (() => {

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

  // ── HISTORIAL DE PALABRAS USADAS (anti-repetición) ───────
  function getUsedWords(topic) {
    try {
      const all = JSON.parse(localStorage.getItem("letraviva_used") || "{}");
      return all[topic] || [];
    } catch(e) { return []; }
  }

  function saveUsedWords(topic, newWords) {
    try {
      const all = JSON.parse(localStorage.getItem("letraviva_used") || "{}");
      const prev = all[topic] || [];
      // Guarda las últimas 40 palabras por tema
      all[topic] = [...newWords, ...prev].slice(0, 40);
      localStorage.setItem("letraviva_used", JSON.stringify(all));
    } catch(e) {}
  }

  // ── GENERA TABLERO VACÍO ─────────────────────────────────
  function emptyGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(null));
  }

  // ── INTENTA COLOCAR UNA PALABRA ──────────────────────────
  function placeWord(grid, word, size) {
    const w = normalize(word);
    const shuffledDirs = [...DIRS].sort(() => Math.random() - 0.5);

    for (let attempt = 0; attempt < 80; attempt++) {
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
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  function fillRandom(grid) {
    for (let r = 0; r < grid.length; r++)
      for (let c = 0; c < grid[r].length; c++)
        if (grid[r][c] === null)
          grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }

  // ── VERIFICACIÓN FINAL ───────────────────────────────────
  // Relee el tablero y confirma que cada palabra colocada
  // realmente está completa, letra por letra, en sus posiciones.
  function verifyPlacement(grid, placedWord) {
    const { normalized, positions } = placedWord;
    if (positions.length !== normalized.length) return false;
    for (let i = 0; i < normalized.length; i++) {
      const [r, c] = positions[i];
      if (!grid[r] || grid[r][c] !== normalized[i]) return false;
    }
    return true;
  }

  // ── LLAMA AL SERVIDOR (con lista de exclusión) ───────────
  async function fetchWordsFromAI(topic, difficulty) {
    const cfg = CONFIG.DIFFICULTY[difficulty];
    const exclude = getUsedWords(topic);

    const response = await fetch("/api/generate-words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        words: cfg.words,
        minLen: cfg.minLen,
        maxLen: cfg.maxLen,
        exclude
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
      if (normalized.length < cfg.minLen || normalized.length > cfg.maxLen) continue;
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

    // ── VERIFICACIÓN FINAL: descarta cualquier palabra rota ──
    const verified = placed.filter(p => verifyPlacement(grid, p));
    if (verified.length < 3) throw new Error("Error de verificación del tablero. Intenta de nuevo.");

    // Guarda las palabras usadas para no repetirlas pronto
    saveUsedWords(topic, verified.map(p => p.original));

    return {
      grid,
      words: verified,
      size: cfg.gridSize,
      topic,
      difficulty
    };
  }

  return { build, normalize };
})();
