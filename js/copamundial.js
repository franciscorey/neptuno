/**
 * RADIO NEPTUNO - Módulo Autónomo Copa Mundial FIFA 2026
 * Procesamiento de datos directos desde la API plana de Openfootball.
 */
document.addEventListener('DOMContentLoaded', () => {

    const MUNDIAL_CONFIG = {
        apiUrl: 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json',
        refreshInterval: 600000 // 10 minutos
    };

    // Diccionario extendido con los nombres exactos del JSON real
    const mapaBanderas = {
        "Argentina": "ar", "Algeria": "dz", "Australia": "au", "Austria": "at",
        "Belgium": "be", "Bosnia & Herzegovina": "ba", "Brazil": "br",
        "Canada": "ca", "Cape Verde": "cv", "Colombia": "co", "Costa Rica": "cr", "Croatia": "hr", "Curaçao": "cw", "Czech Republic": "cz",
        "Denmark": "dk", "DR Congo": "cd",
        "Ecuador": "ec", "Egypt": "eg", "England": "gb-eng",
        "France": "fr",
        "Germany": "de", "Ghana": "gh",
        "Haiti": "ht",
        "Iran": "ir", "Iraq": "iq", "Italy": "it", "Ivory Coast": "ci",
        "Japan": "jp", "Jordan": "jo",
        "Mexico": "mx", "Morocco": "ma",
        "Netherlands": "nl", "New Zealand": "nz", "Nigeria": "ng", "Norway": "no",
        "Panama": "pa", "Paraguay": "py", "Peru": "pe", "Poland": "pl", "Portugal": "pt",
        "Qatar": "qa",
        "Saudi Arabia": "sa", "Scotland": "gb-sct", "Senegal": "sn", "Serbia": "rs", "South Africa": "za", "South Korea": "kr", "Spain": "es", "Sweden": "se", "Switzerland": "ch",
        "Tunisia": "tn", "Turkey": "tr",
        "USA": "us", "Uruguay": "uy", "Uzbekistan": "uz",
        "Wales": "gb-wls"
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

            // Captura de fechas en formato ISO local (YYYY-MM-DD)
            const hoyObj = new Date();
            const hoyStr = hoyObj.toLocaleDateString('sv-SE'); 
            
            const mananaObj = new Date();
            mananaObj.setDate(hoyObj.getDate() + 1);
            const mananaStr = mananaObj.toLocaleDateString('sv-SE');

            let partidosHoy = [];
            let partidosManana = [];
            let estructuraGrupos = {};

            // 🌟 CORRECCIÓN: Acceso directo al array raíz 'matches'
            if (datos.matches && Array.isArray(datos.matches)) {
                datos.matches.forEach(partido => {
                    
                    const t1 = partido.team1;
                    const t2 = partido.team2;
                    if (!t1 || !t2) return;

                    // 🌟 CORRECCIÓN: Manejo ultra-defensivo de goles para partidos futuros
                    let s1 = null;
                    let s2 = null;

                    if (partido.score1 !== undefined && partido.score1 !== null) {
                        s1 = Number(partido.score1);
                    }
                    if (partido.score2 !== undefined && partido.score2 !== null) {
                        s2 = Number(partido.score2);
                    }
                    // Por si la API muta a su formato alternativo con el torneo en marcha
                    if (partido.score && Array.isArray(partido.score.ft)) {
                        s1 = partido.score.ft[0] !== null ? Number(partido.score.ft[0]) : null;
                        s2 = partido.score.ft[1] !== null ? Number(partido.score.ft[1]) : null;
                    }

                    const partidoLimpio = {
                        date: partido.date,
                        team1: t1,
                        team2: t2,
                        score1: s1,
                        score2: s2,
                        time: partido.time || ''
                    };

                    // Clasificación por jornadas del día
                    if (partido.date === hoyStr) partidosHoy.push(partidoLimpio);
                    if (partido.date === mananaStr) partidosManana.push(partidoLimpio);

                    // Inicializar los grupos con todos los equipos (así la tabla se muestra aunque vayan 0-0)
                    const grupo = partido.group || "Fase de Grupos";
                    
                    // Solo procesamos grupos de la primera fase (evitamos "Round of 32", etc.)
                    if (grupo.startsWith("Group")) {
                        if (!estructuraGrupos[grupo]) estructuraGrupos[grupo] = {};
                        
                        [t1, t2].forEach(eq => {
                            if (!estructuraGrupos[grupo][eq]) {
                                estructuraGrupos[grupo][eq] = { PJ: 0, G: 0, E: 0, P: 0, GF: 0, GC: 0, Pts: 0 };
                            }
                        });

                        // Cómputo matemático: Solo si hay goles registrados se altera la tabla
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
                    }
                });
            }

            // Inyección limpia en tus contenedores del DOM
            pintarPartidos(partidosHoy, 'partidos-hoy');
            pintarPartidos(partidosManana, 'partidos-manana');
            pintarTablas(estructuraGrupos, 'tablas-grupos');

        } catch (error) {
            console.error("Error Módulo Copa Mundial:", error);
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
            contenedor.innerHTML = '<div class="no-data-mundial">No hay partidos fijados para esta fecha</div>';
            return;
        }

        lista.forEach(partido => {
            const mar1 = partido.score1 !== null ? partido.score1 : '';
            const mar2 = partido.score2 !== null ? partido.score2 : '';
            
            // Si no hay goles seteados, muestra el 'VS' o la hora configurada de transmisión
            const visualScore = (mar1 === '' && mar2 === '') ? `<span class="vs-badge">VS</span>` : `${mar1} - ${mar2}`;

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

        for (const grupoNombre in grupos) {
            const equiposOrdenados = Object.keys(grupos[grupoNombre]).map(nombre => {
                return { nombre, ...grupos[grupoNombre][nombre] };
            }).sort((a, b) => b.Pts - a.Pts || (b.GF - b.GC) - (a.GF - a.GC) || b.GF - a.GF);

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
    }

    // Inicialización del servicio
    renderWidgetMundial();
    setInterval(renderWidgetMundial, MUNDIAL_CONFIG.refreshInterval);
});
