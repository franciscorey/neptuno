/**
 * RADIO NEPTUNO - Módulo de Widgets del Tablón Público
 * Gestiona de forma aislada las 3 cajas independientes de datos.
 */
document.addEventListener('DOMContentLoaded', async () => {

    const CONFIG = {
        climaUrl: 'https://api.boostr.cl/weather/SCEL.json', // Estación AMB / Santiago Centro
        economiaUrl: 'https://mindicador.cl/api',
        // RSS oficial de alertas SENAPRED convertido a JSON limpio
        senapredUrl: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fsenapred.cl%2Ffeed%2F%3Fpost_type%3Dalertas',
        refreshInterval: 300000 // Actualización en segundo plano cada 5 minutos
    };

    // Inicializador Maestro del Tablón
    function initTablonWidgets() {
        renderClima();
        renderEconomico();
        renderWidgetHoyDia();
    }

    // --- CAJA 1: CLIMA ---
    async function renderClima() {
        const card = document.getElementById('widget-clima');
        if (!card) return;

        try {
            const res = await fetch(CONFIG.climaUrl);
            const json = await res.json();

            if (json.status === 'success' && json.data) {
                const d = json.data;
                card.innerHTML = `
                    <h3><i class="fas fa-cloud-sun"></i> Meteorología</h3>
                    <div class="data-widget-list">
                        <div class="data-widget-item">
                            <span class="data-widget-label">Estación</span>
                            <span class="data-widget-value">Stgo Centro</span>
                        </div>
                        <div class="data-widget-item">
                            <span class="data-widget-label">Temperatura</span>
                            <span class="data-widget-value">${d.temperature}°C</span>
                        </div>
                        <div class="data-widget-item">
                            <span class="data-widget-label">Condición</span>
                            <span class="data-widget-value">${d.condition}</span>
                        </div>
                        <div class="data-widget-item">
                            <span class="data-widget-label">Humedad</span>
                            <span class="data-widget-value">${d.humidity}%</span>
                        </div>
                    </div>
                `;
            } else {
                throw new Error("Datos de clima incompletos");
            }
        } catch (err) {
            console.error("Error Widget Clima:", err);
            card.innerHTML = `<h3><i class="fas fa-cloud-sun"></i> Meteorología</h3><p class="no-data">Señal climática débil.</p>`;
        }
    }

    // --- CAJA 2: INDICADORES ECONÓMICOS ---
    async function renderEconomico() {
        const card = document.getElementById('widget-economico');
        if (!card) return;

        try {
            const res = await fetch(CONFIG.economiaUrl);
            const data = await res.json();

            card.innerHTML = `
                <h3><i class="fas fa-chart-line"></i> Mercado diario</h3>
                <div class="data-widget-list">
                    <div class="data-widget-item">
                        <span class="data-widget-label">Valor UF</span>
                        <span class="data-widget-value">$${Math.round(data.uf.valor).toLocaleString('es-CL')}</span>
                    </div>
                    <div class="data-widget-item">
                        <span class="data-widget-label">Dólar Obs.</span>
                        <span class="data-widget-value">$${data.dolar.valor}</span>
                    </div>
                    <div class="data-widget-item">
                        <span class="data-widget-label">Euro</span>
                        <span class="data-widget-value">$${data.euro.valor}</span>
                    </div>
                    <div class="data-widget-item">
                        <span class="data-widget-label">Valor UTM</span>
                        <span class="data-widget-value">$${Math.round(data.utm.valor).toLocaleString('es-CL')}</span>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error("Error Widget Económico:", err);
            card.innerHTML = `<h3><i class="fas fa-chart-line"></i> Mercado diario</h3><p class="no-data">Indicadores no disponibles.</p>`;
        }
    }

    // --- CAJA 3: HOY DIA ---
    // Función genérica para cargar archivos JSON locales
    async function cargarJSON(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error cargando ${url}`);
        }

        return await response.json();
    }

    // Definimos una función genérica para cargar archivos JSON locales
    const feriados = await cargarJSON('data/feriados.json');
    const onomasticos = await cargarJSON('data/onomasticos.json');
    const efemerides = await cargarJSON('data/efemerides.json')

    // Función para cargar datos
    function obtenerDatosDelDia() {
        const hoy = new Date();

        const clave = `${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

        return {
            fecha: hoy,
            clave,
            feriado: feriados[clave] || null,
            onomastico: onomasticos[clave] || null,
            efemeride: efemerides[clave] || null
        };
    }
    // Función para renderizar el widget de Hoy Día
    function renderWidgetHoyDia() {
        // Enlaza al contenedor real de tu HTML
        const card = document.getElementById('widget-datos-publicos') || document.getElementById('widget-hoy-dia');
        if (!card) return;

        try {
            const datos = obtenerDatosDelDia();
            
            // Formateamos la fecha para el encabezado estándar h3
            const fechaTexto = datos.fecha.toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long'
            });

            // Estructura base idéntica a Clima y Economía
            let html = `<h3><i class="fas fa-calendar-day"></i> hoy: ${fechaTexto}</h3>`;

            // Si el día viene completamente vacío en tus JSON locales
            if (!datos.feriado && !datos.onomastico && (!datos.efemeride || datos.efemeride.efemerides.length === 0)) {
                card.innerHTML = html + `<p class="no-data">Sin registros para hoy.</p>`;
                return;
            }

            html += `<div class="data-widget-list">`;

            // 1. Item: Feriado
            if (datos.feriado) {
                html += `
                    <div class="data-widget-item">
                        <span class="data-widget-label"><i class="fas fa-flag"></i> Feriado</span>
                        <span class="data-widget-value">${datos.feriado.nombre}</span>
                    </div>
                `;
            }

            // 2. Item: Onomástico / Santoral
            if (datos.onomastico) {
                html += `
                    <div class="data-widget-item">
                        <span class="data-widget-label"><i class="fas fa-user"></i> Santoral</span>
                        <span class="data-widget-value">${datos.onomastico.nombres.join(', ')}</span>
                    </div>
                `;
            }

            // 3. Items dinámicos: Efemérides (Se despliegan como filas individuales del mismo estilo)
            if (datos.efemeride && datos.efemeride.efemerides) {
                datos.efemeride.efemerides.forEach(item => {
                    // Usamos el año histórico como etiqueta izquierda para mantener la simetría perfecta
                    const etiquetaAnio = item.anio ? `${item.anio}` : 'Hito';
                    
                    html += `
                        <div class="data-widget-item">
                            <span class="data-widget-label"><i class="fas fa-history"></i> ${etiquetaAnio}</span>
                            <span class="data-widget-value">${item.nombre}</span>
                        </div>
                    `;
                });
            }

            html += `</div>`;
            card.innerHTML = html;

        } catch (err) {
            console.error("Error Widget Hoy Día:", err);
            card.innerHTML = `<h3><i class="fas fa-calendar-day"></i> Efemérides</h3><p class="no-data">Archivo de bitácora no disponible.</p>`;
        }
    }



    // Disparar la carga inicial del tablón
    initTablonWidgets();

    // Ciclo de actualización silencioso en segundo plano
    setInterval(initTablonWidgets, CONFIG.refreshInterval);
});
