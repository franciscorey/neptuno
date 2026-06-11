/**
 * RADIO NEPTUNO - Módulo Autónomo Copa Mundial FIFA 2026
 * Procesamiento de datos satelitales en tiempo real desde Openfootball.
 */
document.addEventListener('DOMContentLoaded', () => {

    const MUNDIAL_CONFIG = {
        apiUrl: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json',
        refreshInterval: 600000 // Actualización silenciosa cada 10 minutos
    };

    // Diccionario de banderas FlagCDN para los 48 equipos
    const mapaBanderas = {
        "Argentina": "ar", "Australia": "au", "Belgium": "be", "Brazil": "br", "Cameroon": "cm",
        "Canada": "ca", "Costa Rica": "cr", "Croatia": "hr", "Denmark": "dk", "Ecuador": "ec",
        "England": "gb-eng", "France": "fr", "Germany": "de", "Ghana": "gh", "Iran": "ir",
        "Japan": "jp", "Mexico": "mx", "Morocco": "ma", "Netherlands": "nl", "Poland": "pl",
        "Portugal": "pt", "Qatar": "qa", "Saudi Arabia": "sa", "Senegal": "sn", "Serbia": "rs",
        "South Korea": "kr", "Spain": "es", "Switzerland": "ch", "Tunisia": "tn", "United States": "us",
        "Uruguay": "uy", "Wales": "gb-wls", "South Africa": "za", "Italy": "it", "Colombia": "co",
        "Chile": "cl", "Peru": "pe", "Algeria": "dz", "Nigeria": "ng", "Egypt": "eg"
    };

    function obtenerBanderaHtml(nombreEquipo) {
        const codigo = mapaBanderas[nombreEquipo] || "un"; 
        return `<img src="https://flagcdn.com/${codigo}.png" class="flag-icon" alt="${nombreEquipo}">`;
    }

    async function renderWidgetMundial() {
        try {
            const res = await fetch(MUNDIAL_CONFIG.apiUrl);
            if (!res.ok) throw new Error("Señal interrumpida con Openfootball");
            const datos = await res.json();

            // Fechas locales reales basadas en el huso horario de Santiago (Formato YYYY-MM-DD)
            const hoyObj = new Date();
            const hoyStr = hoyObj.toLocaleDateString('sv-SE'); 
            
            const mananaObj = new Date();
            mananaObj.setDate(hoyObj.getDate() + 1);
            const mananaStr = mananaObj.toLocaleDateString('sv-SE');

            let partidosHoy = [];
            let partidosManana = [];
            let estructuraGrupos = {};

            if (datos.rounds) {
                datos.rounds.forEach(jornada => {
                    if (!jornada.matches) return;
                    
                    jornada.matches.forEach(partido => {
                        if (partido.date === hoyStr) partidosHoy.push(partido);
                        if (partido.date === mananaStr) partidosManana.push(partido);

                        // Procesamiento matemático de estadísticas de grupo
                        const grupo = partido.group || "Fase Final";
                        if (!estructuraGrupos[grupo]) estructuraGrupos[grupo] = {};
                        
                        [partido.team1, partido.team2].forEach(eq => {
                            if (!estructuraGrupos[grupo][eq]) {
                                estructuraGrupos[grupo][eq] = { PJ: 0, G: 0, E: 0, P: 0, GF: 0, GC: 0, Pts: 0 };
                            }
                        });

                        if (partido.score1 !== undefined && partido.score2 !== undefined && partido.score1 !== null) {
                            const g1 = Number(partido.score1);
                            const g2 = Number(partido.score2);
                            
                            estructuraGrupos[grupo][partido.team1].PJ++;
                            estructuraGrupos[grupo][partido.team2].PJ++;
                            estructuraGrupos[grupo][partido.team1].GF += g1;
                            estructuraGrupos[grupo][partido.team1].GC += g2;
                            estructuraGrupos[grupo][partido.team2].GF += g2;
                            estructuraGrupos[grupo][partido.team2].GC += g1;

                            if (g1 > g2) {
                                estructuraGrupos[grupo][partido.team1].G++;
                                estructuraGrupos[grupo][partido.team1].Pts += 3;
                                estructuraGrupos[grupo][partido.team2].P++;
                            } else if (g1 < g2) {
                                estructuraGrupos[grupo][partido.team2].G++;
                                estructuraGrupos[grupo][partido.team2].Pts += 3;
                                estructuraGrupos[grupo][partido.team1].P++;
                            } else {
                                estructuraGrupos[grupo][partido.team1].E++;
                                estructuraGrupos[grupo][partido.team1].Pts += 1;
                                estructuraGrupos[grupo][partido.team2].E++;
                                estructuraGrupos[grupo][partido.team2].Pts += 1;
                            }
                        }
                    });
                });
            }

            pintarPartidos(partidosHoy, 'partidos-hoy', false);
            pintarPartidos(partidosManana, 'partidos-manana', true);
            pintarTablas(estructuraGrupos, 'tablas-grupos');

        } catch (error) {
            console.error("Error Widget Mundial:", error);
            const contenedor = document.getElementById('partidos-hoy');
            if (contenedor) {
                contenedor.innerHTML = '<p class="no-data-mundial">Frecuencia deportiva interrumpida temporalmente.</p>';
            }
        }
    }

    function pintarPartidos(lista, contenedorId, esFuturo = false) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;
        contenedor.innerHTML = '';
        
        if (lista.length === 0) {
            contenedor.innerHTML = '<div class="no-data-mundial">No hay partidos fijados para esta fecha</div>';
            return;
        }

        lista.forEach(partido => {
            const mar1 = partido.score1 !== undefined && partido.score1 !== null ? partido.score1 : '';
            const mar2 = partido.score2 !== undefined && partido.score2 !== null ? partido.score2 : '';
            const visualScore = (mar1 === '' && mar2 === '') ? 'VS' : `${mar1} - ${mar2}`;

            const html = `
                <div class="partido-fila">
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
            `;
            contenedor.insertAdjacentHTML('beforeend', html);
        });
    }

    function pintarTablas(grupos, contenedorId) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;
        contenedor.innerHTML = '';

        let tablasRenderizadas = 0;

        for (const grupoNombre in grupos) {
            if (grupoNombre.includes("Fase Final")) continue;

            const equiposOrdenados = Object.keys(grupos[grupoNombre]).map(nombre => {
                return { nombre, ...grupos[grupoNombre][nombre] };
            }).sort((a, b) => b.Pts - a.Pts || (b.GF - b.GC) - (a.GF - a.GC));

            if (equiposOrdenados.length === 0) continue;
            tablasRenderizadas++;

            let tablaHtml = `
                <div class="grupo-contenedor">
                    <div class="grupo-nombre">${grupoNombre}</div>
                    <table class="tabla-pos">
                        <thead>
                            <tr>
                                <th class="text-izquierda">Equipo</th>
                                <th>PJ</th>
                                <th>DG</th>
                                <th>Pts</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            equiposOrdenados.forEach(eq => {
                const dg = eq.GF - eq.GC;
                const difGolesSigno = dg > 0 ? `+${dg}` : dg;
                tablaHtml += `
                    <tr>
                        <td class="text-izquierda">
                            <div class="tabla-equipo-celda">
                                <img src="https://flagcdn.com/${mapaBanderas[eq.nombre] || 'un'}.png" class="flag-icon" alt="${eq.nombre}">
                                <span class="equipo-nombre">${eq.nombre}</span>
                            </div>
                        </td>
                        <td>${eq.PJ}</td>
                        <td>${difGolesSigno}</td>
                        <td style="font-weight:bold;">${eq.Pts}</td>
                    </tr>
                `;
            });

            tablaHtml += `</tbody></table></div>`;
            contenedor.insertAdjacentHTML('beforeend', tablaHtml);
        }

        if (tablasRenderizadas === 0) {
            contenedor.innerHTML = '<div class="no-data-mundial">Tablas de posiciones en preparación...</div>';
        }
    }

    // Ejecución inicial y bucle de fondo
    renderWidgetMundial();
    setInterval(renderWidgetMundial, MUNDIAL_CONFIG.refreshInterval);
});
