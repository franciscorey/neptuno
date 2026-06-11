/**
 * RADIO NEPTUNO - Módulo Autónomo Copa Mundial FIFA 2026
 * Procesamiento de datos satelitales en tiempo real desde Openfootball.
 */
document.addEventListener('DOMContentLoaded', () => {

    const MUNDIAL_CONFIG = {
        apiUrl: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json',
        refreshInterval: 600000 // Actualización silenciosa cada 10 minutos
    };

    // Diccionario de banderas FlagCDN para los 48 equipos (Nombres oficiales en inglés de la API)
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

            // Fechas locales de control (Formato YYYY-MM-DD)
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
                        
                        // 🌟 CAPA DEFENSIVA 1: Normalización de Equipos (Soporta String u Objeto)
                        const t1 = (partido.team1 && typeof partido.team1 === 'object') ? partido.team1.name : partido.team1;
                        const t2 = (partido.team2 && typeof partido.team2 === 'object') ? partido.team2.name : partido.team2;
                        
                        if (!t1 || !t2) return; // Salto de seguridad

                        // 🌟 CAPA DEFENSIVA 2: Normalización de Marcadores (Soporta score1 o score.ft)
                        let s1 = null;
                        let s2 = null;

                        if (partido.score1 !== undefined && partido.score1 !== null) {
                            s1 = Number(partido.score1);
                            s2 = Number(partido.score2);
                        } else if (partido.score && Array.isArray(partido.score.ft)) {
                            s1 = partido.score.ft[0] !== null ? Number(partido.score.ft[0]) : null;
                            s2 = partido.score.ft[1] !== null ? Number(partido.score.ft[1]) : null;
                        }

                        // Construcción de objeto limpio unificado
                        const partidoLimpio = {
                            date: partido.date,
                            team1: t1,
                            team2: t2,
                            score1: s1,
                            score2: s2
                        };

                        // Clasificación por fecha
                        if (partido.date === hoyStr) partidosHoy.push(partidoLimpio);
                        if (partido.date === mananaStr) partidosManana.push(partidoLimpio);

                        // Procesamiento matemático para la tabla de posiciones
                        const grupo = partido.group || "Fase de Grupos";
                        if (!estructuraGrupos[grupo]) estructuraGrupos[grupo] = {};
                        
                        [t1, t2].forEach(eq => {
                            if (!estructuraGrupos[grupo][eq]) {
                                estructuraGrupos[grupo][eq] = { PJ: 0, G: 0, E: 0, P: 0, GF: 0, GC: 0, Pts: 0 };
                            }
                        });

                        // Solo sumar a la tabla si el partido ya se jugó y tiene goles registrados
                        if (s1 !== null && s2 !== null) {
                            estructuraGrupos[grupo][t1].PJ++;
                            estructuraGrupos[grupo][t2].PJ++;
                            estructuraGrupos[grupo][t1].GF += s1;
                            estructuraGrupos[grupo][t1].GC += s2;
                            estructuraGrupos[grupo][t2].GF += s2;
                            estructuraGrupos[grupo][t2].GC += s1;

                            if (s1 > s2) {
                                estructuraGrupos[grupo][t1].G++;
                                estructuraGrupos[grupo][t1].Pts += 3;
                                estructuraGrupos[grupo][t2].P++;
                            } else if (s1 < s2) {
                                estructuraGrupos[grupo][t2].G++;
                                estructuraGrupos[grupo][t2].Pts += 3;
                                estructuraGrupos[grupo][t1].P++;
                            } else {
                                estructuraGrupos[grupo][t1].E++;
                                estructuraGrupos[grupo][t1].Pts += 1;
                                estructuraGrupos[grupo][t2].E++;
                                estructuraGrupos[grupo][t2].Pts += 1;
                            }
                        }
                    });
                });
            }

            // Inyección en el DOM
            pintarPartidos(partidosHoy, 'partidos-hoy');
            pintarPartidos(partidosManana, 'partidos-manana');
            pintarTablas(estructuraGrupos, 'tablas-grupos');

        } catch (error) {
            console.error("Error Widget Mundial:", error);
            const contenedor = document.getElementById('partidos-hoy');
            if (contenedor) {
                contenedor.innerHTML = '<p class="no-data-mundial">Frecuencia deportiva interrumpida temporalmente.</p>';
            }
        }
    }

    function pintarPartidos(lista, contenedorId) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;
        contenedor.innerHTML = '';
        
        if (lista.length === 0) {
            contenedor.innerHTML = '<div class="no-data-mundial">No hay partidos fijados para hoy</div>';
            return;
        }

        lista.forEach(partido => {
            const mar1 = partido.score1 !== null ? partido.score1 : '';
            const mar2 = partido.score2 !== null ? partido.score2 : '';
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
            if (grupoNombre.includes("Fase Final") || grupoNombre.includes("Eliminatorias")) continue;

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
                                ${obtenerBanderaHtml(eq.nombre)}
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
            contenedor.innerHTML = '<div class="no-data-mundial">Tablas en preparación...</div>';
        }
    }

    // Encendido de transmisiones
    renderWidgetMundial();
    setInterval(renderWidgetMundial, MUNDIAL_CONFIG.refreshInterval);
});
