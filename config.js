// ═══════════════════════════════════════════════════════════
//  LetraViva – Configuración
//  Edita este archivo con tu clave de API de Anthropic
// ═══════════════════════════════════════════════════════════

const CONFIG = {

  // ── CLAVE DE API ─────────────────────────────────────────
  // 1. Ve a https://console.anthropic.com
  // 2. Crea una cuenta gratuita
  // 3. En "API Keys" genera una clave
  // 4. Pégala aquí entre las comillas
  ANTHROPIC_API_KEY: "",

  // ── CONFIGURACIÓN DEL JUEGO ───────────────────────────────
  DIFFICULTY: {
    Fácil:   { gridSize: 10, words: 6,  minLen: 4, maxLen: 7  },
    Medio:   { gridSize: 12, words: 8,  minLen: 5, maxLen: 9  },
    Difícil: { gridSize: 14, words: 10, minLen: 6, maxLen: 12 },
  },

  // ── MODELO ────────────────────────────────────────────────
  // No cambies esto a menos que tengas acceso a otro modelo
  AI_MODEL: "claude-sonnet-4-20250514",

  // ── ADSENSE (opcional, para monetizar) ───────────────────
  // Cuando tengas una cuenta de Google AdSense, pon tu ID aquí
  // y reemplaza el div ".ad-placeholder" en index.html
  ADSENSE_CLIENT: "",
  ADSENSE_SLOT: "",

};
