const API_URL = "https://script.google.com/macros/s/AKfycbxMmITY5Bf7euH5iYwFKFACLc_7Dt0GxLDtY_rc6cy_CVqAK1WJZ_ynM955qqWc9Sfl/exec";

// Configuración de caché (12 horas)
const CACHE_DURATION = 60000;

let sonandoData = null;

// Función para obtener caché válido
function getCachedData() {
    const cached = localStorage.getItem('sonando_cache');
    const cacheTime = localStorage.getItem('sonando_cache_time');
    
    if (cached && cacheTime) {
        const now = Date.now();
        if (now - parseInt(cacheTime) < CACHE_DURATION) {
            return JSON.parse(cached);
        }
    }
    return null;
}

// Función para guardar en caché incluyendo el ranking anterior
function saveToCache(data) {
    // Guardar ranking actual como "previous" para la próxima vez
    if (data.top10 && data.top10.length > 0) {
        const sortedTracks = [...data.top10].sort((a, b) => b.votos - a.votos);
        localStorage.setItem('sonando_previous_ranking', JSON.stringify(sortedTracks.map(t => ({ id: t.id, votos: t.votos }))));
    }
    
    localStorage.setItem('sonando_cache', JSON.stringify(data));
    localStorage.setItem('sonando_cache_time', Date.now().toString());
}

// Función para obtener ranking anterior
function getPreviousRanking() {
    const cached = localStorage.getItem('sonando_previous_ranking');
    if (cached) {
        return JSON.parse(cached);
    }
    return [];
}

// Función para calcular movimiento de un track
function getTrackMovement(trackId, currentIndex, currentVotes) {
    const previous = getPreviousRanking();
    
    if (previous.length === 0) {
        return null; // No hay datos previos
    }
    
    // Buscar track en ranking anterior
    const prevIndex = previous.findIndex(t => t.id === trackId);
    
    if (prevIndex === -1) {
        return 'new'; // Nuevo ingreso
    }
    
    const prevTrack = previous[prevIndex];
    
    // Comparar posiciones
    if (currentIndex < prevIndex) {
        return 'up'; // Subió
    } else if (currentIndex > prevIndex) {
        return 'down'; // Bajó
    } else {
        // Misma posición, comparar votos
        if (currentVotes > prevTrack.votos) {
            return 'up'; // Mismos puestos pero más votos
        } else if (currentVotes < prevTrack.votos) {
            return 'down';
        }
        return 'same'; // Igual
    }
}

// Función para verificar si ya votó por un track
function hasVoted(trackId, source) {

    const voted =
        localStorage.getItem(
            `voted_${source}_${trackId}`
        );

    if (voted) {

        const voteTime = parseInt(voted);
        const now = Date.now();

        if (now - voteTime < 24 * 60 * 60 * 1000) {
            return true;
        }
    }

    return false;
}

// Función para registrar voto
function registerVote(trackId, source) {

    localStorage.setItem(
        `voted_${source}_${trackId}`,
        Date.now().toString()
    );
}

// Función para escapar HTML y prevenir XSS
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Función para mostrar feedback no intrusivo
function showFeedback(message, type = 'success') {
    // Crear o reutilizar elemento de feedback
    let feedbackEl = document.getElementById('sonando-feedback');
    if (!feedbackEl) {
        feedbackEl = document.createElement('div');
        feedbackEl.id = 'sonando-feedback';
        feedbackEl.className = 'sonando-feedback';
        // Insertar después del banner de la sección sonando
        const sonandoSection = document.querySelector('#sonando .section-banner');
        if (sonandoSection && sonandoSection.parentNode) {
            sonandoSection.parentNode.insertBefore(feedbackEl, sonandoSection.nextSibling);
        }
    }
    
    feedbackEl.innerHTML = message;
    feedbackEl.className = `sonando-feedback ${type}`;
    feedbackEl.style.display = 'block';
    
    // Ocultar después de 4 segundos
    setTimeout(() => {
        feedbackEl.style.display = 'none';
    }, 4000);
}

async function loadSonando() {
    try {
        // Mostrar estado de loading
        const top10Container = document.querySelector("#top10-list");
        const newContainer = document.querySelector("#new-list");
        
        top10Container.innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> Sintonizando señal...</div>';
        newContainer.innerHTML = '<div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> Sintonizando señal...</div>';
        
        // Revisar caché primero
        const cachedData = getCachedData();
        if (cachedData) {
            sonandoData = cachedData;
            renderTop10(cachedData.top10);
            renderNuevos(cachedData.nuevos);
            // Cargar datos frescos en segundo plano
            fetchFreshData();
            return;
        }
        
        // Si no hay caché, hacer fetch
        await fetchFreshData();
    } catch (error) {
        console.error("Error cargando SONANDO:", error);
        document.querySelector("#top10-list").innerHTML = '<p class="error-message">Se perdió la transmisión. Intente más tarde.</p>';
        document.querySelector("#new-list").innerHTML = '<p class="error-message">Se perdió la transmisión. Intente más tarde.</p>';
    }
}

// Función para obtener datos frescos
async function fetchFreshData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // 1. Primero renderizamos si la sección está activa.
        // Al hacerlo aquí, getTrackMovement() usará el "previous_ranking" de la ejecución anterior.
        const sonandoSection = document.querySelector('#sonando');
        if (sonandoSection && sonandoSection.classList.contains('active')) {
            renderTop10(data.top10);
            renderNuevos(data.nuevos);
        }
        
        // 2. AHORA guardamos en caché, actualizando el "previous_ranking" para la PRÓXIMA carga.
        sonandoData = data;
        saveToCache(data);
        
    } catch (error) {
        console.error("Error obteniendo datos frescos:", error);
        if (!getCachedData()) {
            document.querySelector("#top10-list").innerHTML = '<p class="error-message">Se perdió la transmisión. Intente más tarde.</p>';
            document.querySelector("#new-list").innerHTML = '<p class="error-message">Se perdió la transmisión. Intente más tarde.</p>';
        }
    }
}

function renderTop10(tracks) {
    const container = document.querySelector("#top10-list");
    
    // Limpiar contenedor antes de renderizar para evitar duplicados
    container.innerHTML = "";

    if (!tracks || tracks.length === 0) {
        container.innerHTML = '<p class="no-data">No hay tracks disponibles</p>';
        return;
    }

    tracks
        .sort((a, b) => b.votos - a.votos)
        .forEach((track, index) => {
            const item = document.createElement("div");
            item.className = "track-item";
            
            // Calcular movimiento
            const movement = getTrackMovement(track.id, index, track.votos);
            let movementIcon = '';
                if (movement === 'up') {
                    movementIcon = '<span class="movement-icon up"><i class="fas fa-arrow-up"></i></span>';
                } else if (movement === 'down') {
                    movementIcon = '<span class="movement-icon down"><i class="fas fa-arrow-down"></i></span>';
                } else if (movement === 'new') {
                    movementIcon = '<span class="movement-icon new">NEW</span>';
                } else if (movement === 'same') {
                    // Un guion o círculo sutil para indicar constancia
                    movementIcon = '<span class="movement-icon same"><i class="fas fa-minus"></i></span>';
                }
            
            // Verificar si ya votó por este track
            const alreadyVoted =     hasVoted(track.id, "TOP_10");
            const voteButtonText = alreadyVoted ? '✓ Enviado' : 'Votar';
            const voteButtonDisabled = alreadyVoted ? 'disabled' : '';
            
            item.innerHTML = `
                <div class="track-rank">
                    ${(index + 1).toString().padStart(2, "0")}
                    ${movementIcon}
                </div>

                <img
                    class="track-cover"
                    src="assets/covers/${track.cover}"
                    alt="${escapeHTML(track.cancion)}"
                    loading="lazy"
                    onerror="this.src='assets/covers/default.webp'"
                >
                
                <div class="track-info">
                    <div class="track-title">${escapeHTML(track.cancion)}</div>
                    <div class="track-artist">${escapeHTML(track.artista)}</div>
                </div>
                <div class="track-votes">
                    <span class="vote-count"><i class="fas fa-broadcast-tower"></i> ${track.votos}</span>
                    <button class="vote-btn ${alreadyVoted ? 'voted' : ''}" onclick="voteTrack(event, '${track.id}', 'TOP_10')" ${voteButtonDisabled}>${voteButtonText}</button>
                </div>
            `;
            container.appendChild(item);
        });
}

function renderNuevos(tracks) {

    const container = document.querySelector("#new-list");

    container.innerHTML = "";

    if (!tracks || tracks.length === 0) {
        container.innerHTML =
            '<p class="no-data">No hay nuevos lanzamientos</p>';
        return;
    }

    tracks.forEach(track => {

        const item = document.createElement("div");
        item.className = "new-track";

        const alreadyVoted =
    hasVoted(track.id, "NUEVOS");

        item.innerHTML = `
            <div class="new-badge">NUEVO</div>

            <div class="track-rank new-track-icon">
                    <i class="fas fa-bolt"></i> </div>
            <img
                class="track-cover"
                src="assets/covers/${track.cover}"
                alt="${escapeHTML(track.cancion)}"
                loading="lazy"
                onerror="this.src='assets/covers/default.webp'"
            >

            <div class="track-title">
                ${escapeHTML(track.cancion)}
            </div>

            <div class="track-artist">
                ${escapeHTML(track.artista)}
            </div>

            <div class="track-votes">

                <span class="vote-count">
                    <i class="fas fa-broadcast-tower"></i>
                    ${track.votos || 0}
                </span>

                <button
                    class="vote-btn ${alreadyVoted ? 'voted' : ''}"
                    onclick="voteTrack(event,'${track.id}','NUEVOS')"
                    ${alreadyVoted ? 'disabled' : ''}>
                    ${alreadyVoted ? '✓ Impulsado' : 'Impulsar'}
                </button>

            </div>
        `;

        container.appendChild(item);
    });
}

// Función para votar por un track (con evento pasado como parámetro)
async function voteTrack(event, trackId, source) {
    event.preventDefault();
    event.stopPropagation();
    
    // Usar currentTarget en lugar de target para evitar problemas si se hace click en el icono
    const voteBtn = event.target.closest('button');
    
    // Verificar cooldown
    if (hasVoted(trackId, source)) {
        showFeedback('Ya señalaste esta canción', 'info');
        return;
    }
    
    const originalText = voteBtn.innerHTML;
    
    // Deshabilitar botón temporalmente para evitar múltiples clicks
    voteBtn.disabled = true;
    voteBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Transmitiendo...';
    
    try {
        // Usar GET con query params para compatibilidad con Google Apps Script
        const url =     `${API_URL}?action=vote`     + `&trackId=${encodeURIComponent(trackId)}`     + `&source=${encodeURIComponent(source)}`;
        const response = await fetch(url);
        
        const result = await response.json();
        
        if (result.success) {
            // Registrar voto en localStorage para cooldown
            registerVote(trackId, source);
            
            // Actualizar el contador de votos sin recargar toda la lista
            const trackItem =
    voteBtn.closest('.track-item') ||
    voteBtn.closest('.new-track');
            const voteCount = trackItem.querySelector('.vote-count');
            // Extraer número de forma más robusta
            const votesMatch = voteCount.textContent.match(/\d+/);
            const currentVotes = votesMatch ? parseInt(votesMatch[0]) : 0;
            voteCount.innerHTML = `<i class="fas fa-broadcast-tower"></i> ${currentVotes + 1}`;
            voteBtn.innerHTML = '<i class="fas fa-check"></i> Señal recibida';
            voteBtn.classList.add('voted');
            
            // Mostrar feedback no intrusivo
            showFeedback('<i class="fas fa-check-circle"></i> Señal recibida correctamente', 'success');
            
            // Recargar la lista completa después de 2 segundos para mostrar el ranking actualizado
            setTimeout(async () => {
                await loadSonando();
            }, 2000);
        } else {
            throw new Error(result.message || 'Error en la votación');
        }
    } catch (error) {
        console.error("Error al votar:", error);
        showFeedback('<i class="fas fa-exclamation-triangle"></i> Se perdió la transmisión. Intenta nuevamente.', 'error');
        voteBtn.disabled = false;
        voteBtn.innerHTML = originalText;
    }
}

// Manejar envío del formulario de solicitud
function initRequestForm() {
    const requestForm = document.getElementById('request-form');
    if (requestForm) {
        
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = requestForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Obtener valores del formulario
            const artist = document.getElementById('request-artist').value.trim();
            const song = document.getElementById('request-song').value.trim();
            const message = document.getElementById('request-message').value.trim();
            const email = document.getElementById('request-email') ? document.getElementById('request-email').value.trim() : '';
            const name = document.getElementById('request-name') ? document.getElementById('request-name').value.trim() : '';
            
            // Validar honeypot (campo oculto)
            const honeypotField = document.getElementById('honeypot-website');
            if (honeypotField && honeypotField.value.trim() !== '') {
                // Si el honeypot tiene valor, es un bot - silenciosamente rechazar
                console.log('Honeypot detectado - envío rechazado');
                return;
            }
            
            // Validaciones básicas
            if (!artist || !song) {
                showFeedback('Completa los campos obligatorios (Artista y Canción)', 'error');
                return;
            }
            
            // Deshabilitar botón durante el envío
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Transmitiendo...';
            
            try {
                // Enviar a Google Apps Script usando GET con query params
                const url =
                    `${API_URL}?action=request` +
                    `&artist=${encodeURIComponent(artist)}` +
                    `&song=${encodeURIComponent(song)}` +
                    `&message=${encodeURIComponent(message)}` +
                    `&email=${encodeURIComponent(email)}` +
                    `&name=${encodeURIComponent(name)}`;
                
                const response = await fetch(url);
                
                const result = await response.json();
                
                if (result.success) {
                    showFeedback(
                        '<i class="fas fa-check-circle"></i> Señal recibida correctamente',
                        'success'
                        );

                    setTimeout(() => {
                        requestForm.reset();
                    }, 1500);
                } else {
                    throw new Error(result.message || 'Error al enviar la solicitud');
                }
            } catch (error) {
                console.error("Error al enviar solicitud:", error);
                showFeedback('<i class="fas fa-exclamation-triangle"></i> Se perdió la transmisión. Intenta nuevamente.', 'error');
            } finally {
                // Restaurar botón
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initRequestForm();

});

// Exportar para uso externo
window.loadSonando = loadSonando;
window.voteTrack = voteTrack;
window.initRequestForm = initRequestForm;
window.showFeedback = showFeedback;
