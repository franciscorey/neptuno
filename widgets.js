/**
 * RADIO NEPTUNO - Módulo de Widgets del Tablón Público
 * Gestiona de forma aislada las 3 cajas independientes de datos.
 */
document.addEventListener('DOMContentLoaded', () => {

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
        renderDatosPublicos();
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

    // --- CAJA 3: DATOS PÚBLICOS / EMERGENCIAS (SENAPRED) ---
    async function renderDatosPublicos() {
        const card = document.getElementById('widget-datos-publicos');
        if (!card) return;

        try {
            const res = await fetch(CONFIG.senapredUrl);
            const data = await res.json();

            let itemsHTML = "";

            if (data.status === 'ok' && data.items && data.items.length > 0) {
                // Filtramos las 3 alertas más recientes publicadas
                const alertas = data.items.slice(0, 3);
                
                itemsHTML = alertas.map(alerta => {
                    // Limpieza estética de títulos largos oficiales
                    let titulo = alerta.title.replace("Monitoreo para la comuna de", "Monit.").replace("Alerta Metropolitana", "R.M.");
                    if (titulo.length > 32) titulo = titulo.substring(0, 30) + "...";
                    
                    const esRoja = alerta.title.toLowerCase().includes("roja");

                    return `
                        <div class="data-widget-item">
                            <span class="data-widget-label" title="${alerta.title}">• ${titulo}</span>
                            <span class="data-widget-value ${esRoja ? 'alerta-activa' : ''}">
                                ${esRoja ? '🔴 ROJA' : '⚠️ AVISO'}
                            </span>
                        </div>
                    `;
                }).join('');
            } else {
                // Fallback si no hay eventos climáticos o geológicos decretados
                itemsHTML = `
                    <div class="data-widget-item">
                        <span class="data-widget-label">Alerta Nacional</span>
                        <span class="data-widget-value" style="color: var(--primary-color);">🟢 NORMAL</span>
                    </div>
                    <div class="data-widget-item" style="font-size:0.8rem; color:var(--text-muted);">
                        No hay reportes de catástrofes activos.
                    </div>
                `;
            }

            card.innerHTML = `
                <h3><i class="fas fa-exclamation-triangle"></i> Datos públicos</h3>
                <div class="data-widget-list">
                    ${itemsHTML}
                </div>
            `;
        } catch (err) {
            console.error("Error Widget Datos Públicos:", err);
            card.innerHTML = `<h3><i class="fas fa-exclamation-triangle"></i> Datos públicos</h3><p class="no-data">Conexión con SENAPRED interrumpida.</p>`;
        }
    }

    // Disparar la carga inicial del tablón
    initTablonWidgets();

    // Ciclo de actualización silencioso en segundo plano
    setInterval(initTablonWidgets, CONFIG.refreshInterval);
});
