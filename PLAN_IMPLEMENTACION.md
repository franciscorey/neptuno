# Plan de Implementación: Rediseño del Widget de Reproducción de Radio

## Resumen
Implementar un widget de radio flotante moderno que reemplace el reproductor sticky actual, manteniendo los colores y estilos originales del sitio (verde #4CAF50, púrpura #FF5CFF) y preservando la configuración ZENO_CONFIG existente.

---

## Cambios a Realizar

### 1. MODIFICACIÓN: `index.html`

#### 1.1 Reemplazar el reproductor sticky actual (líneas 218-249)
**Eliminar:**
```html
<!-- Reproductor Sticky (fuera del sistema SPA, siempre visible) -->
<div id="reproductor-anchor" class="player-sticky-zone">
    <section class="player-container" id="playerContainer">
        ...contenido actual...
    </section>
</div>
```

**Reemplazar con:**
```html
<!-- Widget Flotante de Radio (Reemplaza reproductor sticky) -->
<div id="neptuno-widget" class="fixed top-6 right-6 bg-surface-color backdrop-blur-md border border-primary-color/40 minimized z-50 flex items-center justify-center">
    
    <!-- VISTA MINIMIZADA (Rectángulo redondeado 80x60px) -->
    <div id="widget-trigger-expand" class="mini-view hidden w-full h-full flex-col items-center justify-center gap-1 hover:bg-surface-light rounded-2xl transition-colors relative" title="Expandir reproductor">
        <i class="fas fa-radio text-primary-color text-xl"></i>
        <span class="text-[9px] font-bold tracking-widest text-text-muted uppercase">NEPTUNO</span>
        <!-- Indicador en vivo miniatura -->
        <span id="mini-live-indicator" class="absolute top-2 right-2 w-2.5 h-2.5 bg-accent-color rounded-full border border-surface-color hidden"></span>
    </div>

    <!-- VISTA EXPANDIDA -->
    <div class="expanded-view hidden w-full p-5 flex-col">
        <!-- Header del Widget -->
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-light border border-border-color">
                <span id="live-indicator-dot" class="w-2.5 h-2.5 rounded-full bg-text-muted"></span>
                <span class="text-[10px] font-bold tracking-wider uppercase text-text-muted">Señal en Vivo</span>
            </div>
            <!-- Botón de Minimizar -->
            <button id="widget-trigger-minimize" class="w-8 h-8 rounded-lg bg-surface-light hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text-color border border-border-color transition-colors" title="Minimizar">
                <i class="fas fa-chevron-down text-xs"></i>
            </button>
        </div>

        <!-- Información de Programación -->
        <div class="flex items-center gap-4 mb-5">
            <!-- Carátula representativa -->
            <div class="w-12 h-12 rounded-lg bg-surface-light border border-border-color flex items-center justify-center shrink-0">
                <i class="fas fa-compact-disc text-xl text-primary-color/60 animate-[spin_8s_linear_infinite]"></i>
            </div>
            <!-- Textos e Info del Programa -->
            <div class="overflow-hidden w-full">
                <div class="marquee-wrapper" id="marquee-holder">
                    <p id="widget-status-text" class="text-sm font-semibold text-color truncate">
                        (Transmisión pausada) Radio Neptuno - Online
                    </p>
                </div>
                <p id="widget-subtitle-text" class="text-xs text-primary-color mt-1 font-medium">Señal Neptuno</p>
            </div>
        </div>

        <!-- Controles integrados -->
        <div class="flex items-center justify-between gap-4 mt-1 bg-surface-light/60 p-3 rounded-xl border border-surface-light">
            <!-- Mute / Unmute -->
            <button id="widget-btn-mute" class="text-text-muted hover:text-primary-color transition-colors p-1" title="Silenciar">
                <i id="widget-vol-icon" class="fas fa-volume-high text-lg"></i>
            </button>

            <!-- Botón Play/Pause Principal -->
            <button id="widget-btn-play" class="w-12 h-12 rounded-full bg-primary-color hover:bg-primary-hover text-bg-color flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary-color/20" title="Reproducir">
                <i id="widget-play-icon" class="fas fa-play text-lg ml-1"></i>
            </button>

            <!-- Spacer decorativo para centrar visualmente el Play -->
            <div class="w-7"></div>
        </div>
    </div>
</div>

<!-- AUDIO CORE DE ZENO (preservando el ID original para compatibilidad) -->
<audio id="zenoAudio" preload="none"></audio>
```

#### 1.2 Agregar IDs únicos para elementos de programación en la sección de parrilla
**Modificar** las tarjetas de programación en la sección `#programacion` (líneas 101-142) para agregar la clase `schedule-item`:
```html
<div class="schedule-card schedule-item" data-start="06:00" data-end="09:00">
```
*(Repetir para cada schedule-card)*

---

### 2. MODIFICACIÓN: `styles.css`

#### 2.1 Agregar nuevas variables CSS para el widget (después de línea 21)
```css
/* Variables adicionales para widget flotante */
--surface-hover: #253025;
--widget-shadow: 0 4px 20px rgba(0,0,0,0.4);
--widget-transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

#### 2.2 Eliminar estilos del reproductor sticky antiguo (líneas 234-321)
**Eliminar completamente:**
```css
/* REPRODUCTOR FIXO / STICKY */
.player-sticky-zone { ... }
.player-container { ... }
.player-info { ... }
.player-album-art { ... }
.player-title { ... }
.player-subtitle { ... }
.player-controls { ... }
.btn-play { ... }
.volume-container { ... }
```

#### 2.3 Agregar nuevos estilos para el widget flotante (después de eliminar lo anterior)
```css
/* ========================================== */
/* WIDGET FLOTANTE DE RADIO                   */
/* ========================================== */

/* Estado base del widget */
#neptuno-widget {
    background-color: var(--surface-color);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(76, 175, 80, 0.4);
    box-shadow: var(--widget-shadow);
    transition: var(--widget-transition);
}

/* ESTADO MINIMIZADO - Rectángulo redondeado (NO círculo) */
#neptuno-widget.minimized {
    width: 80px;
    height: 60px;
    border-radius: 16px;
    cursor: pointer;
}

#neptuno-widget.minimized:hover {
    border-color: rgba(76, 175, 80, 0.8);
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
}

#neptuno-widget.minimized .expanded-view {
    display: none !important;
}

#neptuno-widget.minimized .mini-view {
    display: flex !important;
}

/* ESTADO EXPANDIDO */
#neptuno-widget.expanded {
    width: 320px;
    height: auto;
    border-radius: 16px;
}

#neptuno-widget.expanded .mini-view {
    display: none !important;
}

#neptuno-widget.expanded .expanded-view {
    display: flex !important;
}

/* Animación de pulso para estado En Vivo (usando accent-color) */
@keyframes pulse-live {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 92, 255, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 92, 255, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 92, 255, 0); }
}

.pulse-active {
    animation: pulse-live 1.8s infinite;
}

/* Marquesina para textos largos */
.marquee-wrapper {
    overflow: hidden;
    position: relative;
    white-space: nowrap;
    width: 100%;
}

.marquee-text {
    display: inline-block;
    will-change: transform;
}

.animate-marquee {
    animation: marquee-scroll 10s linear infinite;
}

@keyframes marquee-scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}

/* Responsive: Ajustar posición en móviles */
@media (max-width: 768px) {
    #neptuno-widget {
        right: 50%;
        transform: translateX(50%);
        bottom: 20px;
        top: auto;
    }
    
    #neptuno-widget.expanded {
        width: calc(100vw - 40px);
        max-width: 360px;
    }
}
```

---

### 3. MODIFICACIÓN: `app.js`

#### 3.1 Preservar ZENO_CONFIG sin modificaciones
Mantener intacto el objeto (líneas 412-421):
```javascript
const ZENO_CONFIG = {
    streamUrl: "https://stream.zeno.fm/lqnwrpclo7hvv",
    stationId: "lqnwrpclo7hvv",
    updateInterval: 15000 
};
```

#### 3.2 Agregar nueva lógica del widget flotante
**Insertar después de la línea 407** (después de `setInterval(updateLiveSchedule, 60000);`):

```javascript
// ==========================================
// WIDGET FLOTANTE DE RADIO
// ==========================================

// Datos de programación para sincronización
const widgetSchedule = [
    { start: "06:00", end: "09:00", name: "Amanecer Neptuno" },
    { start: "09:00", end: "11:00", name: "Marea Matinal" },
    { start: "11:00", end: "14:00", name: "Conexión Musical" },
    { start: "14:00", end: "16:00", name: "Corriente Continua" },
    { start: "16:00", end: "18:00", name: "Tarde de Vinilos" },
    { start: "18:00", end: "20:00", name: "La Fosa" },
    { start: "20:00", end: "22:00", name: "Radio Teatro Vivo" },
    { start: "22:00", end: "24:00", name: "Neptuno Nocturno" },
    { start: "00:00", end: "06:00", name: "Programación Nocturna" }
];

// Referencias del DOM del Widget
const widget = document.getElementById('neptuno-widget');
const btnExpand = document.getElementById('widget-trigger-expand');
const btnMinimize = document.getElementById('widget-trigger-minimize');
const audio = document.getElementById('zenoAudio');
const btnPlayWidget = document.getElementById('widget-btn-play');
const playIconWidget = document.getElementById('widget-play-icon');
const btnMuteWidget = document.getElementById('widget-btn-mute');
const volIconWidget = document.getElementById('widget-vol-icon');
const statusTextWidget = document.getElementById('widget-status-text');
const subtitleTextWidget = document.getElementById('widget-subtitle-text');
const marqueeHolder = document.getElementById('marquee-holder');
const liveIndicatorDot = document.getElementById('live-indicator-dot');
const miniLiveIndicator = document.getElementById('mini-live-indicator');

// Estados del widget
let isPlaying = false;
let isMuted = false;
let currentVolume = 0.8;
audio.volume = currentVolume;

// Función para obtener hora de Chile
function getChileTime() {
    const now = new Date();
    const options = { 
        timeZone: 'America/Santiago', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    return formatter.format(now);
}

// Obtener programa actual según parrilla
function getCurrentProgram() {
    const timeString = getChileTime().slice(0, 5);
    for (let prog of widgetSchedule) {
        if (timeString >= prog.start && timeString < prog.end) {
            return prog.name;
        }
    }
    return "Programación Habitual";
}

// Actualizar metadata del widget
function updateWidgetMetadata() {
    const activeProgram = getCurrentProgram();
    
    if (isPlaying) {
        statusTextWidget.textContent = `(Transmisión actual: ${activeProgram}) Radio Neptuno - Online`;
        subtitleTextWidget.textContent = "Escuchando en vivo";
    } else {
        statusTextWidget.textContent = `(Transmisión pausada) Radio Neptuno - Online`;
        subtitleTextWidget.textContent = "Señal Neptuno";
    }
    handleMarquee();
}

// Control de marquesina
function handleMarquee() {
    statusTextWidget.classList.remove('marquee-text', 'animate-marquee');
    
    if (statusTextWidget.scrollWidth > marqueeHolder.clientWidth) {
        statusTextWidget.innerHTML = `${statusTextWidget.textContent} &nbsp;&nbsp;&nbsp;&nbsp; ${statusTextWidget.textContent} &nbsp;&nbsp;&nbsp;&nbsp;`;
        statusTextWidget.classList.add('marquee-text', 'animate-marquee');
    } else {
        statusTextWidget.innerHTML = statusTextWidget.textContent;
    }
}

// Eventos de expansión/minimización
btnMinimize.addEventListener('click', (e) => {
    e.stopPropagation();
    widget.classList.remove('expanded');
    widget.classList.add('minimized');
});

btnExpand.addEventListener('click', () => {
    widget.classList.remove('minimized');
    widget.classList.add('expanded');
    setTimeout(handleMarquee, 100);
});

// Control de reproducción (integrado con ZENO_CONFIG)
btnPlayWidget.addEventListener('click', () => {
    if (!isPlaying) {
        // PLAY
        audio.src = ZENO_CONFIG.streamUrl;
        audio.play().catch(err => {
            console.error("Fallo de reproducción:", err);
        });

        playIconWidget.className = "fas fa-pause text-lg";
        liveIndicatorDot.className = "w-2.5 h-2.5 rounded-full bg-accent-color pulse-active";
        miniLiveIndicator.classList.remove('hidden');
        
        const activeProg = getCurrentProgram();
        statusTextWidget.textContent = `(Transmisión actual: ${activeProg}) Radio Neptuno - Online`;
        subtitleTextWidget.textContent = "Escuchando en vivo";
    } else {
        // PAUSE
        audio.pause();
        audio.src = ""; // Liberar memoria

        playIconWidget.className = "fas fa-play text-lg ml-1";
        liveIndicatorDot.className = "w-2.5 h-2.5 rounded-full bg-text-muted";
        miniLiveIndicator.classList.add('hidden');
        
        statusTextWidget.textContent = "(Transmisión pausada) Radio Neptuno - Online";
        subtitleTextWidget.textContent = "Señal Neptuno";
    }

    isPlaying = !isPlaying;
    handleMarquee();
});

// Control de mute
btnMuteWidget.addEventListener('click', () => {
    if (isMuted) {
        audio.volume = currentVolume;
        volIconWidget.className = "fas fa-volume-high text-lg";
        isMuted = false;
    } else {
        currentVolume = audio.volume > 0 ? audio.volume : 0.8;
        audio.volume = 0;
        volIconWidget.className = "fas fa-volume-xmark text-lg text-accent-color";
        isMuted = true;
    }
});

// Inicializar widget
updateWidgetMetadata();
setInterval(updateWidgetMetadata, 1000);
window.addEventListener('resize', handleMarquee);

// Integración con metadatos de Zeno existentes
// Sobrescribir fetchZenoMetadata para actualizar también el widget
const originalFetchZenoMetadata = fetchZenoMetadata;
fetchZenoMetadata = function() {
    if (!ZENO_CONFIG.stationId || ZENO_CONFIG.stationId.includes("TU_STATION_ID")) return;

    const zenoApiUrl = `https://api.zeno.fm/public/v2/store/station/${ZENO_CONFIG.stationId}/current-track`;

    fetch(zenoApiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Error al conectar con API de Zeno');
            return response.json();
        })
        .then(data => {
            if (data && (data.title || data.artist)) {
                const songTitle = data.title || "Radio Neptuno";
                const songArtist = data.artist || "Señal Online";

                // Actualizar UI original
                if (trackTitle && trackArtist) {
                    if (trackTitle.textContent !== songTitle || trackArtist.textContent !== songArtist) {
                        trackTitle.textContent = songTitle;
                        trackArtist.textContent = songArtist;
                        fetchAlbumArt(songArtist, songTitle);
                    }
                }
                
                // Actualizar widget si está reproduciendo
                if (isPlaying && statusTextWidget) {
                    const activeProgram = getCurrentProgram();
                    statusTextWidget.textContent = `${songTitle} - ${songArtist} | ${activeProgram}`;
                    handleMarquee();
                }
            }
        })
        .catch(err => {
            console.warn("No se pudieron obtener metadatos de Zeno:", err);
        });
};
```

#### 3.3 Modificar función de control de volumen existente
**En la línea 508-511**, modificar para sincronizar ambos controles:
```javascript
// Control de volumen (sincronizado con widget)
volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
    currentVolume = e.target.value;
    if (e.target.value === 0) {
        isMuted = true;
        if (volIconWidget) volIconWidget.className = "fas fa-volume-xmark text-lg text-accent-color";
    } else {
        isMuted = false;
        if (volIconWidget) volIconWidget.className = "fas fa-volume-high text-lg";
    }
});
```

---

## Consideraciones Importantes

### ✅ Lo que SÍ se modifica:
1. Estructura HTML del reproductor (sticky → flotante)
2. Estilos CSS específicos del reproductor
3. Lógica JavaScript de control de reproducción
4. Integración de sincronización con programación

### ❌ Lo que NO se modifica:
1. Paleta de colores original (verde #4CAF50, púrpura #FF5CFF)
2. Objeto ZENO_CONFIG
3. Contenido del sitio (noticias, productos, programación)
4. Sistema de navegación SPA
5. Funcionalidades de metadatos de Zeno/API Deezer
6. Estilos generales del sitio (header, footer, secciones)

### 🔧 Puntos Clave de Integración:
1. El widget consume ZENO_CONFIG.streamUrl pasivamente
2. Los event listeners de metadatos existentes se integran con la nueva UI
3. El elemento `<audio id="zenoAudio">` se preserva para compatibilidad
4. La zona horaria de Chile se usa para sincronización de programación

---

## Pruebas Requeridas

1. **Funcionalidad básica:**
   - [ ] Play/Pause funciona correctamente
   - [ ] Control de volumen/mute opera sin problemas
   - [ ] Expansión/minimización tiene transición suave

2. **Sincronización:**
   - [ ] El widget muestra el programa correcto según hora chilena
   - [ ] Metadata de Zeno se refleja en el widget
   - [ ] El indicador "En vivo" pulsa durante reproducción

3. **Responsividad:**
   - [ ] Widget se adapta a pantallas móviles
   - [ ] Controles son táctiles en dispositivos pequeños

4. **Persistencia:**
   - [ ] Audio continúa al minimizar
   - [ ] Estado se mantiene al navegar entre secciones SPA

---

## Archivos a Modificar

| Archivo | Líneas aproximadas | Tipo de cambio |
|---------|-------------------|----------------|
| `index.html` | 218-249 | Reemplazo completo del reproductor |
| `styles.css` | 234-321 + nuevas secciones | Eliminar viejo CSS, agregar nuevo |
| `app.js` | 407-520 | Agregar lógica del widget + integrar con existente |

---

*Documento generado como guía de implementación - Solo cambios en el reproductor, sin afectar otros aspectos del sitio.*
