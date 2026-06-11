# 🔤 LetraViva – Sopa de Letras con IA

Aplicación web progresiva (PWA) de Sopa de Letras con generación infinita
de puzzles usando Inteligencia Artificial. Funciona como app en el celular
sin necesidad de publicar en Google Play ni App Store.

---

## ✅ Características

- 🤖 Puzzles infinitos generados por IA (Claude de Anthropic)
- 📱 Funciona como app instalable en Android e iPhone
- 🌐 6 temas: Fútbol, Gastronomía, Animales, Historia, Ciencia, Música
- 🎯 3 niveles de dificultad
- ⏱ Timer y sistema de estrellas
- 📊 Estadísticas locales (partidas, racha)
- 📤 Compartir resultado por WhatsApp / redes
- 💰 Espacio para anuncio de AdSense
- ✈️ Funciona sin internet (modo offline) para la app base

---

## 🚀 PASO A PASO: Publicar gratis en internet

### PASO 1 – Obtener tu API Key de Anthropic (GRATIS)

1. Abre https://console.anthropic.com en tu navegador
2. Crea una cuenta (es gratis)
3. Ve a **"API Keys"** → **"Create Key"**
4. Copia la clave que empieza con `sk-ant-...`
5. Abre el archivo `config.js` y pégala aquí:
   ```
   ANTHROPIC_API_KEY: "sk-ant-TU-CLAVE-AQUI",
   ```

> 💡 La cuenta gratuita de Anthropic incluye créditos iniciales gratuitos.
> Para tráfico mayor, los costos son muy bajos (~$0.003 por puzzle generado).

---

### PASO 2 – Subir a Vercel (hosting gratis, el mejor)

#### Opción A: Sin instalar nada (más fácil)

1. Abre https://vercel.com y crea una cuenta gratis (con tu correo Gmail)
2. Ve a https://github.com y crea una cuenta
3. Crea un repositorio nuevo llamado `letraviva`
4. Sube todos los archivos de esta carpeta al repositorio
5. En Vercel: **"Add New Project"** → conecta tu GitHub → selecciona `letraviva`
6. Haz clic en **"Deploy"**
7. ¡Listo! Te da una URL como `https://letraviva.vercel.app`

#### Opción B: Con la terminal (si tienes Node.js instalado)

```bash
npm install -g vercel
cd letraviva
vercel
# Sigue las instrucciones en pantalla
```

---

### PASO 3 – Conectar un dominio propio (opcional, para dar imagen profesional)

Dominios baratos en Namecheap (~$10/año):
- `letraviva.com`
- `sopadeletras.app`
- `palabras.pe`

En Vercel: Settings → Domains → Add Domain → escribe tu dominio.

---

### PASO 4 – Registrar en Google AdSense (monetización)

1. Ve a https://adsense.google.com
2. Regístrate con tu cuenta Gmail
3. Ingresa la URL de tu app en Vercel
4. Espera aprobación (1-7 días)
5. Una vez aprobado, Google te da un código como este:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script>
   ```
6. En `index.html`, reemplaza el div `.ad-placeholder` con el código real

> 💰 Ingreso estimado: S/. 50–300/mes con 500–2,000 usuarios diarios

---

### PASO 5 – Que funcione como app en celulares (PWA)

#### En Android (Chrome):
1. Abre tu URL en Chrome
2. Chrome pregunta automáticamente "¿Agregar a pantalla de inicio?"
3. El usuario toca **Instalar** → ya aparece como app con ícono

#### En iPhone (Safari):
1. Abre tu URL en Safari
2. Toca el botón de **Compartir** (el cuadrado con flecha)
3. Toca **"Añadir a pantalla de inicio"**
4. Toca **Añadir** → ya aparece como app

---

### PASO 6 – Generar el ícono real de la app

1. Ve a https://cloudconvert.com/svg-to-png
2. Sube el archivo `icons/icon.svg`
3. Convierte a PNG en tamaño 192x192 y 512x512
4. Reemplaza los archivos en la carpeta `icons/`

O usa Canva / Adobe Express para diseñar un logo bonito.

---

## 📱 ¿Cómo publicar en Google Play? (costo único $25 USD)

Si quieres aparecer en Google Play Store:

1. Crea una cuenta de desarrollador en https://play.google.com/console ($25 único)
2. Instala **PWABuilder**: https://www.pwabuilder.com
3. Ingresa la URL de tu app
4. Descarga el paquete `.aab` para Android
5. Súbelo a Google Play Console
6. Completa el formulario de publicación (descripción, capturas, etc.)
7. Espera 2-7 días de revisión de Google

---

## 💡 Ideas para crecer y ganar más

| Estrategia | Costo | Potencial |
|---|---|---|
| TikTok con gameplay diario | Gratis | Alto |
| Modo "Reto del día" viral | Gratis | Muy alto |
| Grupos de WhatsApp en Perú | Gratis | Medio |
| Facebook Ads | S/. 10/día | Alto |
| Versión Premium sin anuncios | - | Pasivo |

---

## 📁 Estructura de archivos

```
letraviva/
├── index.html          ← App principal (UI completa)
├── config.js           ← Tu API Key y configuración
├── puzzle-engine.js    ← Motor que genera el tablero
├── app.js              ← Lógica del juego y eventos
├── manifest.json       ← Configuración PWA
├── sw.js               ← Service Worker (offline)
├── icons/
│   ├── icon.svg        ← Logo editable
│   ├── icon-192.png    ← Ícono para Android
│   └── icon-512.png    ← Ícono grande
└── README.md           ← Esta guía
```

---

## 🔧 Personalización rápida

### Cambiar el nombre de la app
En `index.html`: busca "LetraViva" y reemplaza por tu nombre.
En `manifest.json`: cambia `"name"` y `"short_name"`.

### Agregar más temas
En `index.html`, agrega un botón en `.topic-grid`:
```html
<button class="topic-btn" data-topic="Deportes Olímpicos">
  <span class="topic-icon">🥇</span>Olimpiadas
</button>
```

### Cambiar colores
En `index.html`, edita las variables CSS en `:root`:
```css
--gold: #e94560;   ← Color principal (rojo/coral)
--gold2: #f5a623;  ← Color secundario (amarillo)
```

---

## ❓ Problemas frecuentes

**"No se pudo generar el puzzle"**
→ Verifica que tu API Key en `config.js` sea correcta y empiece con `sk-ant-`

**"El puzzle sale en inglés"**
→ Raro, pero puede pasar. El prompt ya especifica español. Vuelve a intentar.

**"La app no se instala en iPhone"**
→ Asegúrate de abrirla en Safari (no Chrome) en iPhone.

**"AdSense rechazó mi sitio"**
→ Necesitas al menos 20-30 usuarios y que el contenido sea original. Espera unas semanas.

---

Desarrollado con ❤️ usando Claude AI (Anthropic)
