const API_URL = "PEGA_AQUI_TU_URL_APPS_SCRIPT";

async function loadSonando() {

try {

```
const response = await fetch(API_URL);
const data = await response.json();

renderTop10(data.top10);
renderNuevos(data.nuevos);
```

} catch (error) {

```
console.error("Error cargando SONANDO:", error);
```

}

}

function renderTop10(tracks) {

const container = document.querySelector("#top10-list");

tracks
.sort((a, b) => b.votos - a.votos)
.forEach((track, index) => {

```
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
    </div>
  `;

  container.appendChild(item);

});
```

}

function renderNuevos(tracks) {

const container = document.querySelector("#new-list");

tracks.forEach(track => {

```
const item = document.createElement("div");

item.className = "new-track";

item.innerHTML = `
  <div class="new-badge">NEW SIGNAL</div>

  <div class="track-title">${track.cancion}</div>
  <div class="track-artist">${track.artista}</div>
`;

container.appendChild(item);
```

});

}

loadSonando();
