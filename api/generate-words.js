// ═══════════════════════════════════════════════════════════
//  LetraViva – Función de servidor (Vercel) · v2
//  Mejoras: anti-repetición, validación estricta de palabras,
//  prohibido truncar, más variedad (temperature).
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { topic, words, minLen, maxLen, exclude } = req.body || {};

  if (!topic || !words) {
    return res.status(400).json({ error: "Faltan parámetros: topic y words" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "API Key no configurada. Agrégala en Vercel → Settings → Environment Variables"
    });
  }

  // Lista de palabras a evitar (las que el jugador ya vio)
  const excludeList = Array.isArray(exclude) ? exclude.slice(0, 60) : [];
  const excludeText = excludeList.length
    ? `\n- PROHIBIDO usar estas palabras (ya salieron antes): ${excludeList.join(", ")}`
    : "";

  // Pedimos el doble de palabras para poder filtrar y variar
  const requested = Math.min(words * 2, 20);

  const prompt = `Genera exactamente ${requested} palabras en ESPAÑOL relacionadas con el tema "${topic}".
Reglas ESTRICTAS:
- Cada palabra debe tener entre ${minLen} y ${maxLen} caracteres
- NUNCA cortes ni abrevies una palabra para que quepa en el límite. Si una palabra es muy larga, elige OTRA palabra distinta que sí cumpla el límite
- Solo palabras completas, reales y de uso común en TODO el mundo hispanohablante (España y Latinoamérica), no regionalismos
- Solo letras del alfabeto español (sin números, guiones ni espacios)
- Busca VARIEDAD: mezcla palabras comunes con otras menos obvias del tema${excludeText}
- Responde ÚNICAMENTE con un array JSON sin explicaciones ni texto adicional
- Formato exacto: ["PALABRA1","PALABRA2","PALABRA3",...]
- Todo en MAYÚSCULAS`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        temperature: 1,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || `Error de la API: ${response.status}`
      });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({ error: "La IA no devolvió un formato válido" });
    }

    let wordList = JSON.parse(match[0]);
    if (!Array.isArray(wordList)) {
      return res.status(500).json({ error: "Formato de palabras inválido" });
    }

    // ── VALIDACIÓN ESTRICTA EN EL SERVIDOR ──────────────────
    const excludeSet = new Set(excludeList.map(w => normalizeForCompare(w)));
    const seen = new Set();
    const valid = [];

    for (const raw of wordList) {
      const w = String(raw).trim().toUpperCase();

      // Solo letras del español
      if (!/^[A-ZÁÉÍÓÚÑÜ]+$/.test(w)) continue;

      // Longitud dentro del rango (sin contar tildes)
      const norm = normalizeForCompare(w);
      if (norm.length < minLen || norm.length > maxLen) continue;

      // Sin duplicados ni palabras excluidas
      if (seen.has(norm) || excludeSet.has(norm)) continue;

      // Una palabra no puede ser prefijo truncado de otra de la lista
      seen.add(norm);
      valid.push(w);
    }

    // Mezcla aleatoria para más variedad partida a partida
    valid.sort(() => Math.random() - 0.5);

    if (valid.length < 3) {
      return res.status(500).json({ error: "No se generaron suficientes palabras válidas. Intenta de nuevo." });
    }

    return res.status(200).json({ words: valid });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Error interno" });
  }
}

// Quita tildes y deja solo A-Z para comparar longitudes y duplicados
function normalizeForCompare(str) {
  return String(str)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ñ/g, "N")
    .replace(/[^A-Z]/g, "");
}
