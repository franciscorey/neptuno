const API_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSyvZ4WXJ5krEDMnYKCswrtdd9AZYr_cG6oQNi4UMbdjtgyyx_o0gs8_lx7m_OhQ2ReXjotJd35ICsDejUx5IyCzUSRoJISv2clyyREO1OmcPBN6sar8bIHuYLUjT4xc97LtnUXYA2x0IRPCdtmksacQpo2dh1jcsJnZV8F6lkntwQXhFxQtWVI1H71-4j-nTOvRjUVXpG8meYFP43eACLryPludi_bO1WDaNYAYBsoHBTYOGpVNFFw9guO8jF1DZKsAJqZgtLTusFNZ5g88SNQMjlOcA&lib=Mi5mKru-wWOkeVgG0tHFxFWXJ7hljrEEe";

let sonandoData = null;

async function loadSonando() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        sonandoData = data;
        
        renderTop10(data.top10);
        renderNuevos(data.nuevos);
    } catch (error) {
        console.error("Error cargando SONANDO:", error);
        document.querySelector("#top10-list").innerHTML = '<p class="error-message">Error al cargar datos. Intente más tarde.</p>';
        document.querySelector("#new-list").innerHTML = '<p class="error-message">Error al cargar datos. Intente más tarde.</p>';
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
                    <button class="vote-btn" onclick="voteTrack('${track.id}')">👍 Votar</button>
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

// Función para votar por un track
async function voteTrack(trackId) {
    const voteBtn = event.target;
    const originalText = voteBtn.innerHTML;
    
    // Deshabilitar botón temporalmente para evitar múltiples clicks
    voteBtn.disabled = true;
    voteBtn.innerHTML = '⏳ Enviando...';
    
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
            // Actualizar el contador de votos sin recargar toda la lista
            const trackItem = voteBtn.closest('.track-item');
            const voteCount = trackItem.querySelector('.vote-count');
            const currentVotes = parseInt(voteCount.textContent.replace('📻 ', ''));
            voteCount.textContent = `📻 ${currentVotes + 1}`;
            voteBtn.innerHTML = '✓ Votado';
            voteBtn.classList.add('voted');
            
            // Recargar la lista completa después de 2 segundos para mostrar el ranking actualizado
            setTimeout(async () => {
                await loadSonando();
            }, 2000);
        } else {
            throw new Error(result.message || 'Error en la votación');
        }
    } catch (error) {
        console.error("Error al votar:", error);
        alert('Hubo un error al registrar tu voto. Por favor intenta nuevamente.');
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
            
            // Validaciones básicas
            if (!artist || !song) {
                alert('Por favor completa los campos obligatorios (Artista y Canción)');
                return;
            }
            
            // Deshabilitar botón durante el envío
            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ Enviando...';
            
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
                    alert('¡Gracias! Tu solicitud ha sido enviada correctamente.');
                    requestForm.reset();
                } else {
                    throw new Error(result.message || 'Error al enviar la solicitud');
                }
            } catch (error) {
                console.error("Error al enviar solicitud:", error);
                alert('Hubo un error al enviar tu solicitud. Por favor intenta nuevamente.');
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
