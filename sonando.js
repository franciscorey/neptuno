const API_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSyvZ4WXJ5krEDMnYKCswrtdd9AZYr_cG6oQNi4UMbdjtgyyx_o0gs8_lx7m_OhQ2ReXjotJd35ICsDejUx5IyCzUSRoJISv2clyyREO1OmcPBN6sar8bIHuYLUjT4xc97LtnUXYA2x0IRPCdtmksacQpo2dh1jcsJnZV8F6lkntwQXhFxQtWVI1H71-4j-nTOvRjUVXpG8meYFP43eACLryPludi_bO1WDaNYAYBsoHBTYOGpVNFFw9guO8jF1DZKsAJqZgtLTusFNZ5g88SNQMjlOcA&lib=Mi5mKru-wWOkeVgG0tHFxFWXJ7hljrEEe";

async function loadSonando() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        renderTop10(data.top10);
        renderNuevos(data.nuevos);
    } catch (error) {
        console.error("Error cargando SONANDO:", error);
    }
}

function renderTop10(tracks) {
    const container = document.querySelector("#top10-list");
    
    // Limpiar contenedor antes de renderizar para evitar duplicados
    container.innerHTML = "";

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
                    📻 ${track.votos}
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
    try {
        const response = await fetch(`${API_URL}&action=vote&trackId=${trackId}`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            // Recargar la lista para mostrar votos actualizados
            await loadSonando();
        }
    } catch (error) {
        console.error("Error al votar:", error);
    }
}

// Manejar envío del formulario de solicitud
document.addEventListener('DOMContentLoaded', () => {
    const requestForm = document.getElementById('request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const artist = document.getElementById('request-artist').value;
            const song = document.getElementById('request-song').value;
            const message = document.getElementById('request-message').value;
            
            try {
                const response = await fetch(`${API_URL}&action=request`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ artist, song, message })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('¡Gracias! Tu solicitud ha sido enviada.');
                    requestForm.reset();
                } else {
                    alert('Hubo un error al enviar tu solicitud. Inténtalo de nuevo.');
                }
            } catch (error) {
                console.error("Error al enviar solicitud:", error);
                alert('Hubo un error al enviar tu solicitud. Inténtalo de nuevo.');
            }
        });
    }
});

// Exportar para uso externo
window.loadSonando = loadSonando;
window.voteTrack = voteTrack;
