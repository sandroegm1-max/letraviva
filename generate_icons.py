"""
Genera iconos placeholder para la PWA.
Reemplazar con tu logo real antes de publicar.
"""
import os

os.makedirs("icons", exist_ok=True)

# Genera SVG que luego se puede convertir a PNG con cualquier herramienta
svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="32" fill="#1a1a2e"/>
  <rect x="20" y="60" width="44" height="44" rx="8" fill="#e94560"/>
  <rect x="74" y="60" width="44" height="44" rx="8" fill="#f5a623"/>
  <rect x="128" y="60" width="44" height="44" rx="8" fill="#0ea5e9"/>
  <text x="42" y="93" font-family="Arial Black" font-weight="900" font-size="28" fill="white" text-anchor="middle">L</text>
  <text x="96" y="93" font-family="Arial Black" font-weight="900" font-size="28" fill="white" text-anchor="middle">V</text>
  <text x="150" y="93" font-family="Arial Black" font-weight="900" font-size="28" fill="white" text-anchor="middle">A</text>
  <text x="96" y="140" font-family="Arial" font-size="14" fill="#8a8a9a" text-anchor="middle">LetraViva</text>
</svg>"""

with open("icons/icon.svg", "w") as f:
    f.write(svg)

# Intenta generar PNGs con cairosvg si está disponible
try:
    import cairosvg
    cairosvg.svg2png(bytestring=svg.encode(), write_to="icons/icon-192.png", output_width=192, output_height=192)
    cairosvg.svg2png(bytestring=svg.encode(), write_to="icons/icon-512.png", output_width=512, output_height=512)
    print("✓ Iconos PNG generados")
except ImportError:
    print("⚠ cairosvg no disponible. Usa el archivo icons/icon.svg")
    print("  Convierte manualmente en: https://cloudconvert.com/svg-to-png")
    # Crea archivos placeholder mínimos (1x1 PNG)
    import base64
    placeholder = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )
    with open("icons/icon-192.png", "wb") as f: f.write(placeholder)
    with open("icons/icon-512.png", "wb") as f: f.write(placeholder)
    print("  Iconos placeholder creados (reemplazar antes de publicar)")
