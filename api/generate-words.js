// ═══════════════════════════════════════════════════════════
//  LetraViva – Función de servidor (Vercel)
//  Llama a la IA usando la clave secreta de forma PRIVADA.
//  La clave se lee de la variable de entorno ANTHROPIC_API_KEY
//  que configuraste en Vercel. Nadie puede verla.
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // Solo acepta POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { topic, words, minLen, maxLen } = req.body || {};

  if (!topic || !words) {
    return res.status(400).json({ error: "Faltan parámetros: topic y words" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "API Key no configurada. Agrégala en Vercel → Settings → Environment Variables"
    });
  }

  const prompt = `Genera exactamente ${words} palabras en ESPAÑOL relacionadas con el tema "${topic}".
Reglas ESTRICTAS:
- Cada palabra debe tener entre ${minLen} y ${maxLen} caracteres
- Solo letras del alfabeto español (sin números, guiones ni espacios)
- Palabras reales y conocidas, no inventadas
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
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
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

    // Extrae el array JSON
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({ error: "La IA no devolvió un formato válido" });
    }

    const wordList = JSON.parse(match[0]);
    return res.status(200).json({ words: wordList });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Error interno" });
  }
}
