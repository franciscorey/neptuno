const API_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSyvZ4WXJ5krEDMnYKCswrtdd9AZYr_cG6oQNi4UMbdjtgyyx_o0gs8_lx7m_OhQ2ReXjotJd35ICsDejUx5IyCzUSRoJISv2clyyREO1OmcPBN6sar8bIHuYLUjT4xc97LtnUXYA2x0IRPCdtmksacQpo2dh1jcsJnZV8F6lkntwQXhFxQtWVI1H71-4j-nTOvRjUVXpG8meYFP43eACLryPludi_bO1WDaNYAYBsoHBTYOGpVNFFw9guO8jF1DZKsAJqZgtLTusFNZ5g88SNQMjlOcA&lib=Mi5mKru-wWOkeVgG0tHFxFWXJ7hljrEEe";

// Configuración de caché (12 horas)
const CACHE_DURATION = 12 * 60 * 60 * 1000;

let sonandoData = null;
let formOpenedAt = null;

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

// Función para guardar en caché
function saveToCache(data) {
    localStorage.setItem('sonando_cache', JSON.stringify(data));
    localStorage.setItem('sonando_cache_time', Date.now().toString());
}

// Función para verificar si ya votó por un track
function hasVoted(trackId) {
    const voted = localStorage.getItem(`voted_track_${trackId}`);
    if (voted) {
        const voteTime = parseInt(voted);
        const now = Date.now();
        // Cooldown de 24 horas
        if (now - voteTime < 24 * 60 * 60 * 1000) {
            return true;
        }
    }
    return false;
}

// Función para registrar voto
function registerVote(trackId) {
    localStorage.setItem(`voted_track_${trackId}`, Date.now().toString());
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
    
    feedbackEl.textContent = message;
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
        sonandoData = data;
        
        // Guardar en caché
        saveToCache(data);
        
        // Renderizar solo si estamos en la vista sonando
        const sonandoSection = document.querySelector('#sonando');
        if (sonandoSection && sonandoSection.classList.contains('active')) {
            renderTop10(data.top10);
            renderNuevos(data.nuevos);
        }
    } catch (error) {
        console.error("Error obteniendo datos frescos:", error);
        // Si hay caché, mantenerlo, sino mostrar error
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
            
            // Verificar si ya votó por este track
            const alreadyVoted = hasVoted(track.id);
            const voteButtonText = alreadyVoted ? '✓ Señalizado' : '📻 Señalizar';
            const voteButtonDisabled = alreadyVoted ? 'disabled' : '';
            
            item.innerHTML = `
                <div class="track-rank">
                    ${(index + 1).toString().padStart(2, "0")}
                </div>
                <div class="track-info">
                    <div class="track-title">${track.cancion}</div>
                    <div class="track-artist">${track.artista}</div>
                </div>
                <div class="track-votes">
                    <span class="vote-count">📻 ${track.votos}</span>
                    <button class="vote-btn ${alreadyVoted ? 'voted' : ''}" onclick="voteTrack(event, '${track.id}')" ${voteButtonDisabled}>${voteButtonText}</button>
                </div>
            `;
            container.appendChild(item);
        });
}

function renderNuevos(tracks) {
    const container = document.querySelector("#new-list");
    
    // Limpiar contenedor antes de renderizar para evitar duplicados
    container.innerHTML = "";

    if (!tracks || tracks.length === 0) {
        container.innerHTML = '<p class="no-data">No hay nuevos lanzamientos</p>';
        return;
    }

    tracks.forEach(track => {
        const item = document.createElement("div");
        item.className = "new-track";
        item.innerHTML = `
            <div class="new-badge">NEW SIGNAL</div>
            <div class="track-title">${track.cancion}</div>
            <div class="track-artist">${track.artista}</div>
        `;
        container.appendChild(item);
    });
}

// Función para votar por un track (con evento pasado como parámetro)
async function voteTrack(event, trackId) {
    event.preventDefault();
    event.stopPropagation();
    
    const voteBtn = event.target;
    
    // Verificar cooldown
    if (hasVoted(trackId)) {
        showFeedback('Ya señalaste esta canción', 'info');
        return;
    }
    
    const originalText = voteBtn.innerHTML;
    
    // Deshabilitar botón temporalmente para evitar múltiples clicks
    voteBtn.disabled = true;
    voteBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Transmitiendo...';
    
    try {
        // Usar POST con body JSON para compatibilidad con Google Apps Script
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'vote',
                trackId: trackId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Registrar voto en localStorage para cooldown
            registerVote(trackId);
            
            // Actualizar el contador de votos sin recargar toda la lista
            const trackItem = voteBtn.closest('.track-item');
            const voteCount = trackItem.querySelector('.vote-count');
            const currentVotes = parseInt(voteCount.textContent.replace('📻 ', ''));
            voteCount.textContent = `📻 ${currentVotes + 1}`;
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
        // Registrar momento de apertura del formulario
        formOpenedAt = Date.now();
        
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = requestForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // Validar tiempo mínimo de envío (3 segundos)
            const timeSinceOpen = Date.now() - formOpenedAt;
            if (timeSinceOpen < 3000) {
                showFeedback('Por favor espera unos segundos antes de enviar', 'error');
                return;
            }
            
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
                // Enviar a Google Apps Script
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'request',
                        artist: artist,
                        song: song,
                        message: message,
                        email: email,
                        name: name,
                        timestamp: new Date().toISOString()
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showFeedback('<i class="fas fa-check-circle"></i> Señal recibida correctamente', 'success');
                    requestForm.reset();
                    // Resetear tiempo de apertura
                    formOpenedAt = Date.now();
                    
                    // Cerrar formulario después de 2 segundos
                    setTimeout(() => {
                        requestForm.style.display = 'none';
                        const openSuggestBtn = document.getElementById('open-suggest-btn');
                        if (openSuggestBtn) {
                            openSuggestBtn.style.display = 'inline-block';
                        }
                    }, 2000);
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
    
    // Manejar botón de abrir/cerrar formulario
    const openSuggestBtn = document.getElementById('open-suggest-btn');
    const closeSuggestBtn = document.getElementById('close-suggest-btn');
    const requestForm = document.getElementById('request-form');
    
    if (openSuggestBtn && requestForm) {
        openSuggestBtn.addEventListener('click', () => {
            // Registrar momento de apertura
            formOpenedAt = Date.now();
            
            // Mostrar formulario y ocultar botón
            requestForm.style.display = 'flex';
            openSuggestBtn.style.display = 'none';
            
            // Scroll suave hacia el formulario
            requestForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
    
    // Manejar botón de cerrar formulario
    if (closeSuggestBtn && requestForm && openSuggestBtn) {
        closeSuggestBtn.addEventListener('click', () => {
            // Ocultar formulario y mostrar botón
            requestForm.style.display = 'none';
            openSuggestBtn.style.display = 'inline-block';
            
            // Limpiar formulario
            requestForm.reset();
        });
    }
});

// Exportar para uso externo
window.loadSonando = loadSonando;
window.voteTrack = voteTrack;
window.initRequestForm = initRequestForm;
window.showFeedback = showFeedback;
