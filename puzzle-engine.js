// ═══════════════════════════════════════════════════════════
//  LetraViva – Motor de Puzzle
//  Genera el tablero de sopa de letras con palabras de la IA
// ═══════════════════════════════════════════════════════════

const PuzzleEngine = (() => {

  // Todas las direcciones posibles (horizontal, vertical, diagonal)
  const DIRS = [
    [0,1],[0,-1],[1,0],[-1,0],
    [1,1],[1,-1],[-1,1],[-1,-1]
  ];

  // ── NORMALIZA TEXTO ──────────────────────────────────────
  // Quita tildes, ñ → N, convierte a mayúsculas
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

      // Verifica que no haya conflictos
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
    return null; // No se pudo colocar
  }

  // ── RELLENA CASILLAS VACÍAS ──────────────────────────────
  const LETTERS = "ABCDEFGHIJKLMNOPRSTUVWYZ";
  function fillRandom(grid) {
    for (let r = 0; r < grid.length; r++)
      for (let c = 0; c < grid[r].length; c++)
        if (grid[r][c] === null)
          grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }

  // ── API: GENERA PALABRAS CON IA ──────────────────────────
  async function fetchWordsFromAI(topic, difficulty) {
    const cfg = CONFIG.DIFFICULTY[difficulty];
    const prompt = `Genera exactamente ${cfg.words} palabras en ESPAÑOL relacionadas con el tema "${topic}".
Reglas ESTRICTAS:
- Cada palabra debe tener entre ${cfg.minLen} y ${cfg.maxLen} caracteres
- Solo letras del alfabeto español (sin números, guiones ni espacios)
- Palabras reales y conocidas, no inventadas
- Responde ÚNICAMENTE con un array JSON sin explicaciones ni texto adicional
- Formato exacto: ["PALABRA1","PALABRA2","PALABRA3",...]
- Todo en MAYÚSCULAS`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CONFIG.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: CONFIG.AI_MODEL,
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    // Extrae el array JSON de la respuesta
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("La IA no devolvió un array válido");

    const words = JSON.parse(match[0]);
    if (!Array.isArray(words) || words.length === 0)
      throw new Error("Array de palabras vacío");

    return words.map(w => String(w).replace(/[^a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/g, ""));
  }

  // ── API PÚBLICA: CONSTRUYE EL PUZZLE COMPLETO ────────────
  async function build(topic, difficulty) {
    const cfg = CONFIG.DIFFICULTY[difficulty];
    const words = await fetchWordsFromAI(topic, difficulty);

    const grid = emptyGrid(cfg.gridSize);
    const placed = [];

    // Mezcla para priorizar aleatoriamente
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
