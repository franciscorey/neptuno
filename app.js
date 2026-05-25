document.addEventListener('DOMContentLoaded', () => {

    // Coloca este bloque dentro de document.addEventListener('DOMContentLoaded', () => { ... });

function updateLiveSchedule() {
    const now = new Date();
    // Convertimos la hora actual del sistema a minutos totales transcurridos en el día
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const scheduleCards = document.querySelectorAll('.schedule-card');

    scheduleCards.forEach(card => {
        const startStr = card.getAttribute('data-start');
        const endStr = card.getAttribute('data-end');

        if (!startStr || !endStr) return;

        // Desestructuramos y convertimos "HH:MM" a números
        const [startHours, startSplitMinutes] = startStr.split(':').map(Number);
        let [endHours, endSplitMinutes] = endStr.split(':').map(Number);

        const startMinutes = startHours * 60 + startSplitMinutes;
        
        // Caso especial: Si el programa termina a las 00:00, equivale al final del día (minuto 1440)
        if (endHours === 0 && endSplitMinutes === 0) {
            endHours = 24;
        }
        const endMinutes = endHours * 60 + endSplitMinutes;

        // Buscamos si la tarjeta ya posee el badge de "Al Aire"
        const existingBadge = card.querySelector('.current-badge');

        // Evaluamos si la hora actual cae dentro del rango del bloque
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            // Activa el diseño destacado de la tarjeta
            card.classList.add('current');
            
            // Si el badge no existe, lo creamos e insertamos dinámicamente
            if (!existingBadge) {
                const badge = document.createElement('span');
                badge.classList.add('current-badge');
                badge.textContent = 'Al Aire';
                card.appendChild(badge);
            }
        } else {
            // Remueve el diseño destacado y el badge si el bloque ya pasó o no ha empezado
            card.classList.remove('current');
            if (existingBadge) {
                existingBadge.remove();
            }
        }
    });
}

// Inicializa la verificación inmediatamente al cargar la web
updateLiveSchedule();

// Configura un temporizador para comprobar el horario automáticamente cada 60 segundos (60000 ms)
setInterval(updateLiveSchedule, 60000);
    
    // ==========================================
    // PARÁMETROS DE CONFIGURACIÓN DE TU EMISORA
    // ==========================================
    const ZENO_CONFIG = {
        // 1. URL de tu stream de audio de Zeno (Asegúrate de incluir el ID de tu stream al final)
        streamUrl: "https://stream.zeno.fm/lqnwrpclo7hvv",
        
        // 2. ID de tu estación en Zeno (Se usa para consultar los metadatos en vivo)
        stationId: "lqnwrpclo7hvv",
        
        // Intervalo de actualización de metadatos en milisegundos (ej: 15000 = 15 segundos)
        updateInterval: 15000 
    };

    // Elementos del DOM del Menú
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    // Elementos del DOM del Reproductor
    const audio = document.getElementById('zenoAudio');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const streamStatus = document.getElementById('stream-status');
    const volumeSlider = document.getElementById('volumeSlider');
    
    // Elementos de Metadatos
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const playerCover = document.getElementById('playerCover');
    const playerDefaultIcon = document.getElementById('playerDefaultIcon');

    let isPlaying = false;
    let metadataTimer = null;

    // Asignar URL del stream al elemento de audio
    audio.src = ZENO_CONFIG.streamUrl;

    // Lógica del menú desplegable (Mobile)
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            const icon = menuToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    // ==========================================
    // LÓGICA DEL REPRODUCTOR AUDIO HTML5
    // ==========================================
    playBtn.addEventListener('click', () => {
        if (!isPlaying) {
            streamStatus.textContent = "Conectando...";
            
            audio.play()
                .then(() => {
                    isPlaying = true;
                    playIcon.classList.replace('fa-play', 'fa-pause');
                    streamStatus.textContent = "En vivo";
                    
                    // Iniciar la consulta de metadatos cuando empiece a sonar
                    fetchZenoMetadata();
                    metadataTimer = setInterval(fetchZenoMetadata, ZENO_CONFIG.updateInterval);
                })
                .catch(error => {
                    console.error("Error al reproducir el stream:", error);
                    streamStatus.textContent = "Error de conexión";
                });
        } else {
            // Detener por completo el buffer en streams en vivo para evitar delays al retomar
            audio.pause();
            audio.load(); 
            isPlaying = false;
            playIcon.classList.replace('fa-pause', 'fa-play');
            streamStatus.textContent = "Señal en pausa";
            
            // Detener las peticiones de metadatos para optimizar rendimiento
            clearInterval(metadataTimer);
            resetMetadataUI();
        }
    });

    // Control de volumen
    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
    });

    // Eventos del elemento de audio para feedback visual inmediato
    audio.addEventListener('waiting', () => {
        if (isPlaying) streamStatus.textContent = "Sincronizando...";
    });

    audio.addEventListener('playing', () => {
        if (isPlaying) streamStatus.textContent = "En vivo";
    });

    // ==========================================
    // EXTRACCIÓN DE METADATOS (API ZENO + DEEZER)
    // ==========================================
    function fetchZenoMetadata() {
        if (!ZENO_CONFIG.stationId || ZENO_CONFIG.stationId.includes("TU_STATION_ID")) return;

        // Endpoint público de metadatos de Zeno Radio
        const zenoApiUrl = `https://api.zeno.fm/public/v2/store/station/${ZENO_CONFIG.stationId}/current-track`;

        fetch(zenoApiUrl)
            .then(response => {
                if (!response.ok) throw new Error('Error al conectar con la API de Zeno');
                return response.json();
            })
            .then(data => {
                // Estructura típica de respuesta de Zeno: data.title y data.artist
                if (data && (data.title || data.artist)) {
                    const songTitle = data.title || "Radio Neptuno";
                    const songArtist = data.artist || "Señal Online";

                    // Si cambiaron los metadatos respecto a lo que se muestra, actualizamos e invocamos a Deezer
                    if (trackTitle.textContent !== songTitle || trackArtist.textContent !== songArtist) {
                        trackTitle.textContent = songTitle;
                        trackArtist.textContent = songArtist;
                        fetchAlbumArt(songArtist, songTitle);
                    }
                }
            })
            .catch(err => {
                console.warn("No se pudieron obtener metadatos de Zeno:", err);
            });
    }

    // Buscar carátula en la API pública de Deezer mediante JSONP/CORS Proxy alternativo incorporado por la API
    function fetchAlbumArt(artist, title) {
        const query = encodeURIComponent(`${artist} ${title}`);
        // Usamos la API de búsqueda pública de Deezer
        const deezerUrl = `https://api.deezer.com/search?q=${query}&limit=1&output=jsonp`;

        // Crear una petición JSONP nativa para saltar restricciones de CORS de la API de Deezer
        const scriptId = 'deezer_jsonp_callback';
        const oldScript = document.getElementById(scriptId);
        if (oldScript) oldScript.remove();

        window.deezerCallback = (data) => {
            if (data && data.data && data.data.length > 0) {
                const albumCover = data.data[0].album.cover_medium;
                displayCover(albumCover);
            } else {
                displayDefaultIcon();
            }
            delete window.deezerCallback;
        };

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `${deezerUrl}&callback=deezerCallback`;
        document.body.appendChild(script);
    }

    function displayCover(url) {
        playerCover.src = url;
        playerCover.style.display = 'block';
        playerDefaultIcon.style.display = 'none';
    }

    function displayDefaultIcon() {
        playerCover.style.display = 'none';
        playerDefaultIcon.style.display = 'block';
    }

    function resetMetadataUI() {
        trackTitle.textContent = "Radio Neptuno";
        trackArtist.textContent = "Señal Online";
        displayDefaultIcon();
    }

    // Highlight automático del menú basado en la sección visible durante el scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 110;
            const sectionId = current.getAttribute('id');
            const navLink = document.querySelector(`.main-nav a[href*=${sectionId}]`);

            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    document.querySelector('.main-nav a.active')?.classList.remove('active');
                    navLink.classList.add('active');
                }
            }
        });
    });
});
