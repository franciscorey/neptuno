/**
 * RADIO NEPTUNO - Módulo Autónomo Copa Mundial FIFA 2026
 * Versión de Línea Temporal Extendida (Ayer, Hoy, Mañana) + Grid Layout.
 */
document.addEventListener('DOMContentLoaded', () => {

    const MUNDIAL_CONFIG = {
        apiUrl: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json',
        refreshInterval: 600000 
    };

    const mapaBanderas = {
        "Argentina": "ar", "Algeria": "dz", "Australia": "au", "Austria": "at",
        "Belgium": "be", "Bosnia & Herzegovina": "ba", "Brazil": "br",
        "Canada": "ca", "Cape Verde": "cv", "Colombia": "co", "Costa Rica": "cr", "Croatia": "hr", "Curaçao": "cw", "Czech Republic": "cz",
        "Denmark": "dk", "DR Congo": "cd", "Ecuador": "ec", "Egypt": "eg", "England": "gb-eng",
        "France": "fr", "Germany": "de", "Ghana": "gh", "Haiti": "ht", "Iran": "ir", "Iraq": "iq", 
        "Italy": "it", "Ivory Coast": "ci", "Japan": "jp", "Jordan": "jo", "Mexico": "mx", "Morocco": "ma",
        "Netherlands": "nl", "New Zealand": "nz", "Nigeria": "ng", "Norway": "no", "Panama": "pa", 
        "Paraguay": "py", "Peru": "pe", "Poland": "pl", "Portugal": "pt", "Qatar": "qa",
        "Saudi Arabia": "sa", "Scotland": "gb-sct", "Senegal": "sn", "Serbia": "rs", "South Africa": "za", 
        "South Korea": "kr", "Spain": "es", "Sweden": "se", "Switzerland": "ch", "Tunisia": "tn", 
        "Turkey": "tr", "USA": "us", "Uruguay": "uy", "Uzbekistan": "uz", "Wales": "gb-wls"
    };

    function obtenerBanderaHtml(nombreEquipo) {
        const codigo = mapaBanderas[nombreEquipo] || "un"; 
        return `<img src="https://flagcdn.com/${codigo}.svg" class="flag-icon" width="20" height="14" alt="${nombreEquipo}">`;
    }

    function formatearInas(golesArray) {
        if (!golesArray || golesArray.length === 0) return '';
        return golesArray.map(g => `${g.name.split(' ').pop()} ${g.minute}'`).join(', ');
    }

    async function renderWidgetMundial() {
        try {
            const res = await fetch(MUNDIAL_CONFIG.apiUrl);
            if (!res.ok) throw new Error("Señal interrumpida");
            const datos = await res.json();

            // Cálculos del tiempo Neptuno
            const hoyObj = new Date();
            const hoyStr = hoyObj.toLocaleDateString('sv-SE'); 

            const mananaObj = new Date();
            mananaObj.setDate(mananaObj.getDate() + 1);
            const mananaStr = mananaObj.toLocaleDateString('sv-SE');

            // NUEVO: Cálculo de la jornada previa
            const ayerObj = new Date();
            ayerObj.setDate(ayerObj.getDate() - 1);
            const ayerStr = ayerObj.toLocaleDateString('sv-SE');

            let partidosAyer = [];
            let partidosHoy = [];
            let partidosManana = [];
            let estructuraGrupos = {};

            if (datos.matches && Array.isArray(datos.matches)) {
                datos.matches.forEach(partido => {
                    const t1 = partido.team1;
                    const t2 = partido.team2;
                    if (!t1 || !t2) return;

                    let s1 = null, s2 = null;
                    if (partido.score && partido.score.ft && Array.isArray(partido.score.ft)) {
                        s1 = partido.score.ft[0] !== undefined ? Number(partido.score.ft[0]) : null;
                        s2 = partido.score.ft[1] !== undefined ? Number(partido.score.ft[1]) : null;
                    }

                    const partidoLimpio = { 
                        date: partido.date, 
                        team1: t1, 
                        team2: t2, 
                        score1: s1, 
                        score2: s2,
                        goals1: partido.goals1 || [],
                        goals2: partido.goals2 || []
                    };

                    // Enrutamiento temporal
                    if (partido.date === ayerStr) partidosAyer.push(partidoLimpio);
                    if (partido.date === hoyStr) partidosHoy.push(partidoLimpio);
                    if (partido.date === mananaStr) partidosManana.push(partidoLimpio);

                    const grupo = partido.group || "Fase de Grupos";
                    if (grupo.startsWith("Group")) {
                        if (!estructuraGrupos[grupo]) estructuraGrupos[grupo] = {};
                        
                        [t1, t2].forEach(eq => {
                            if (!estructuraGrupos[grupo][eq]) {
                                estructuraGrupos[grupo][eq] = { PJ: 0, GF: 0, GC: 0, Pts: 0 };
                            }
                        });

                        if (s1 !== null && s2 !== null) {
                            estructuraGrupos[grupo][t1].PJ++;
                            estructuraGrupos[grupo][t2].PJ++;
                            estructuraGrupos[grupo][t1].GF += s1;
                            estructuraGrupos[grupo][t1].GC += s2;
                            estructuraGrupos[grupo][t2].GF += s2;
                            estructuraGrupos[grupo][t2].GC += s1;

                            if (s1 > s2) { estructuraGrupos[grupo][t1].Pts += 3; }
                            else if (s1 < s2) { estructuraGrupos[grupo][t2].Pts += 3; }
                            else {
                                estructuraGrupos[grupo][t1].Pts += 1;
                                estructuraGrupos[grupo][t2].Pts += 1;
                            }
                        }
                    }
                });
            }

            // Inyección en el DOM
            pintarPartidos(partidosAyer, 'partidos-ayer', 'No hubo partidos ayer');
            pintarPartidos(partidosHoy, 'partidos-hoy', 'No hay partidos fijados para hoy');
            pintarPartidos(partidosManana, 'partidos-manana', 'No hay partidos fijados para mañana');
            pintarTablasCompactas(estructuraGrupos, 'tablas-grupos');

        } catch (error) {
            console.error("Error Módulo Copa Mundial:", error);
        }
    }

    function pintarPartidos(lista, contenedorId, mensajeVacio) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;
        contenedor.innerHTML = '';
        
        if (lista.length === 0) {
            contenedor.innerHTML = `<div class="no-data-mundial">${mensajeVacio}</div>`;
            return;
        }

        lista.forEach(partido => {
            const mar1 = partido.score1 !== null ? partido.score1 : '';
            const mar2 = partido.score2 !== null ? partido.score2 : '';
            const visualScore = (mar1 === '' && mar2 === '') ? `<span class="vs-badge">VS</span>` : `${mar1} - ${mar2}`;

            const txtGoles1 = formatearInas(partido.goals1);
            const txtGoles2 = formatearInas(partido.goals2);
            const renderizarGoles = txtGoles1 || txtGoles2;

            let bloqueGolesHtml = '';
            if (renderizarGoles) {
                bloqueGolesHtml = `
                    <div class="partido-goles-detalle">
                        <div class="goles-col text-mutado">${txtGoles1}</div>
                        <div class="goles-col-vacia"></div>
                        <div class="goles-col text-derecha text-mutado">${txtGoles2}</div>
                    </div>
                `;
            }

            contenedor.insertAdjacentHTML('beforeend', `
                <div class="partido-tarjeta-mini">
                    <div class="partido-fila-compacta">
                        <div class="equipo-wrapper">
                            ${obtenerBanderaHtml(partido.team1)}
                            <span class="equipo-nombre">${partido.team1}</span>
                        </div>
                        <span class="marcador">${visualScore}</span>
                        <div class="equipo-wrapper derecha">
                            <span class="equipo-nombre">${partido.team2}</span>
                            ${obtenerBanderaHtml(partido.team2)}
                        </div>
                    </div>
                    ${bloqueGolesHtml}
                </div>
            `);
        });
    }

    function pintarTablasCompactas(grupos, contenedorId) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;

        const selectorPrevio = document.getElementById('mundial-grupo-select');
        const grupoActivoPrevio = selectorPrevio ? selectorPrevio.value : null;

        contenedor.innerHTML = '';
        const grupoNombres = Object.keys(grupos).filter(g => g.startsWith("Group")).sort();
        
        if (grupoNombres.length === 0) return;

        let selectorHtml = `
            <div class="mundial-header-control">
                <span class="mundial-titulo-widget"><i class="fas fa-table"></i> Posiciones</span>
                <select id="mundial-grupo-select" class="mundial-dropdown">
        `;
        grupoNombres.forEach(gn => {
            const elegido = grupoActivoPrevio === gn ? 'selected' : '';
            selectorHtml += `<option value="${gn}" ${elegido}>${gn.replace("Group ", "Grupo ")}</option>`;
        });
        selectorHtml += `</select></div><div id="mundial-tablas-container"></div>`;
        contenedor.insertAdjacentHTML('beforeend', selectorHtml);

        const tablaContenedor = document.getElementById('mundial-tablas-container');
        const grupoInicial = grupoActivoPrevio || grupoNombres[0];

        grupoNombres.forEach(grupoNombre => {
            const equiposOrdenados = Object.keys(grupos[grupoNombre]).map(nombre => {
                return { nombre, ...grupos[grupoNombre][nombre] };
            }).sort((a, b) => b.Pts - a.Pts || (b.GF - b.GC) - (a.GF - a.GC) || b.GF - a.GF);

            const displayValue = grupoNombre === grupoInicial ? 'block' : 'none';
            const safeId = `grupo-id-${grupoNombre.replace(/\s+/g, '-')}`;

            let tablaHtml = `
                <div class="grupo-tabla-nodo" id="${safeId}" style="display: ${displayValue};">
                    <table class="tabla-pos-mini">
                        <thead>
                            <tr>
                                <th class="text-izquierda">Equipo</th>
                                <th class="text-centro">DG</th>
                                <th class="text-centro">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            equiposOrdenados.forEach(eq => {
                const dg = eq.GF - eq.GC;
                const dgSigno = dg > 0 ? `+${dg}` : dg;
                tablaHtml += `
                    <tr>
                        <td class="text-izquierda">
                            <div class="tabla-equipo-celda">
                                ${obtenerBanderaHtml(eq.nombre)}
                                <span class="equipo-nombre">${eq.nombre}</span>
                            </div>
                        </td>
                        <td class="text-centro text-mutado">${dgSigno}</td>
                        <td class="text-centro text-resaltado">${eq.Pts}</td>
                    </tr>
                `;
            });

            tablaHtml += `</tbody></table></div>`;
            tablaContenedor.insertAdjacentHTML('beforeend', tablaHtml);
        });

        document.getElementById('mundial-grupo-select').addEventListener('change', (e) => {
            const seleccion = e.target.value;
            grupoNombres.forEach(gn => {
                const el = document.getElementById(`grupo-id-${gn.replace(/\s+/g, '-')}`);
                if (el) el.style.display = gn === seleccion ? 'block' : 'none';
            });
        });
    }

    renderWidgetMundial();
    setInterval(renderWidgetMundial, MUNDIAL_CONFIG.refreshInterval);
});
