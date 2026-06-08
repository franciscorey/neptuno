document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // SISTEMA DE NAVEGACIÓN SPA
    // ==========================================

    // Estado de la aplicación
    let appData = {
        noticias: [],
        programas: [],
        programacion: [],
        informativos: [],
        ranking: [],
        anuncios: []
    };
    let currentSection = 'inicio';
    let allNews = [];
    let currentArticleId = null;

    let programasData = [];
    let programacionData = [];
    let scheduleData = [];

    const API_URL =
        'https://script.google.com/macros/s/AKfycbxMmITY5Bf7euH5iYwFKFACLc_7Dt0GxLDtY_rc6cy_CVqAK1WJZ_ynM955qqWc9Sfl/exec';

    // Precarga
    // Precarga Unificada Eficiente (Ahorra cuotas de Apps Script)
    async function preloadData() {
        try {
            const response = await fetch(`${API_URL}?action=all`);
            const data = await response.json();

            // 1. Guardar estado general de la radio
            appData.noticias = data.noticias || [];
            appData.programas = data.programas || [];
            appData.programacion = data.programacion || [];
            appData.informativos = data.informativos || [];
            appData.anuncios = data.anuncios || [];
            appData.tv = data.tv || null;

            // 2. Capturar el ranking que ahora viene en el mismo viaje
            appData.ranking = data.top10 || [];

            // 3. Sincronizar localmente para blindar a sonando.js sin causarle peticiones extras
            localStorage.setItem('sonando_cache', JSON.stringify({
                top10: data.top10 || [],
                nuevos: data.nuevos || []
            }));
            localStorage.setItem('sonando_cache_time', Date.now().toString());

            console.log('✅ Base de datos unificada cargada: ' + appData.ranking.length + ' tracks en memoria.');

            // 4. Disparar los renders en cascada
            renderInformativos();          // La barra informativa ahora sí leerá el TOP 1
            updateExploreProgramacion();   // Muestra horario, título y descripción
            updateExploreNoticias();       // Muestra última noticia con asset correcto
            updateExploreSonando();        // Muestra la canción más votada del ranking

            if (currentSection === 'noticias') renderNoticias();

        } catch (error) {
            console.error('Error cargando la data centralizada:', error);
        }
    }

    // Función principal para mostrar secciones
    function showSection(sectionId, articleId = null) {
        // Ocultar todas las secciones con clase view-section
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            currentSection = sectionId;
        }

        // Manejo especial para la sección "Sobre Radio Neptuno" y "Explora"
        // Solo deben ser visibles cuando estamos en la vista 'inicio'
        const aboutSection = document.getElementById('sobre-radio');
        const exploreSection = document.getElementById('explora');
        const tvSection = document.getElementById('neptuno-tv');
        const adsSection = document.getElementById('ads-section');
        const widgetsSection = document.getElementById('datos-widgets');

        if (sectionId === 'inicio') {
            if (aboutSection) aboutSection.classList.add('active');
            if (exploreSection) exploreSection.classList.add('active');
            if (tvSection) tvSection.classList.add('active');
            if (adsSection) adsSection.classList.add('active');
            if (widgetsSection) widgetsSection.classList.add('active');
        } else {
            if (aboutSection) aboutSection.classList.remove('active');
            if (exploreSection) exploreSection.classList.remove('active');
            if (tvSection) tvSection.classList.remove('active');
            if (adsSection) adsSection.classList.remove('active');
            if (widgetsSection) widgetsSection.classList.remove('active');
        }

        // Actualizar navegación activa en el menú
        updateNavActive(sectionId);

        // Scroll al inicio del main
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Si es una vista de detalle de artículo, cargar el contenido
        if (sectionId === 'noticia-detalle' && articleId !== null) {
            loadArticleDetail(articleId);
        }

        // Guardar estado en el historial del navegador
        if (articleId !== null) {
            history.pushState({ section: sectionId, articleId: articleId }, '', `?view=${sectionId}&id=${articleId}`);
        } else {
            history.pushState({ section: sectionId }, '', `?view=${sectionId}`);
        }
    }

    // Exponer showSection al scope global para que funcione desde los onclick del HTML
    window.showSection = showSection;

    // Actualizar clase active en el menú de navegación
    function updateNavActive(sectionId) {
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.classList.remove('active');
        });

        // Mapeo especial para la sección de detalle de noticia
        const navSectionId = sectionId === 'noticia-detalle' ? 'noticias' : sectionId;

        const activeLink = document.querySelector(`.main-nav a[data-section="${navSectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Manejar navegación desde enlaces del header con data-section
    document.querySelectorAll('.main-nav a[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);

            // Cargar datos dinámicos si es la sección SONANDO
            if (sectionId === 'sonando' && typeof loadSonando === 'function') {
                loadSonando();
            }
        });
    });

    // Manejar navegación desde tarjetas de exploración (explore-card)
    document.querySelectorAll('.explore-card[data-section]').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = card.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Manejar navegación desde enlaces del footer con data-section
    document.querySelectorAll('.footer-links a[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);

            // Cargar datos dinámicos si es la sección SONANDO
            if (sectionId === 'sonando' && typeof loadSonando === 'function') {
                loadSonando();
            }
        });
    });

    // Manejar clic en el logo del header para volver al inicio
    const logoLink = document.querySelector('.logo a');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('inicio');
        });
    }

    // Inicializar: Asegurar que las secciones Explora y Sobre Radio sean visibles en inicio
    // Esto corrige el problema de que no se muestran al cargar la página por primera vez
    const aboutSection = document.getElementById('sobre-radio');
    const exploreSection = document.getElementById('explora');
    const tvSection = document.getElementById('neptuno-tv');
    const adsSection = document.getElementById('ads-section');
    const widgetsSection = document.getElementById('datos-widgets');
    if (aboutSection) aboutSection.classList.add('active');
    if (exploreSection) exploreSection.classList.add('active');
    if (tvSection) tvSection.classList.add('active');
    if (adsSection) adsSection.classList.add('active');
    if (widgetsSection) widgetsSection.classList.add('active');

    // Manejar botón "Volver" y navegación del historial
    window.addEventListener('popstate', (e) => {
        if (e.state) {
            const { section, articleId } = e.state;
            showSection(section, articleId);
        } else {
            // Si no hay estado, volver al inicio
            showSection('inicio');
        }
    });

    // REFRESH DE DATA


    // 2. NUEVA FUNCIÓN: Actualizador en tiempo real exclusivo para NOTICIAS (Salta caché del navegador)
    async function refreshNoticiasTiempoReal() {
        try {
            // Generamos el bypass solo para esta petición ligera de noticias
            const cacheBuster = new Date().getTime();
            const response = await fetch(`${API_URL}?action=noticias&_cb=${cacheBuster}`);
            const data = await response.json();

            if (data.success && data.noticias) {
                // Sincronizamos los dos almacenes globales de noticias
                appData.noticias = data.noticias;
                allNews = data.noticias;

                console.log("📰 Noticias actualizadas en tiempo real desde Sheets");

                // Si el usuario está parado justo en la sección de noticias, se las refrescamos usando la función correcta
                if (currentSection === 'noticias' && typeof renderNewsList === 'function') {
                    renderNewsList();
                }
            }
        } catch (error) {
            console.error("Error al refrescar noticias en segundo plano:", error);
        }
    }

    // 3. NUEVA FUNCIÓN: Actualizador en tiempo real para la BARRA DE INFO (Informativos) y TV
    async function refreshBarraYTvTiempoReal() {
        try {
            const cacheBuster = new Date().getTime();

            // Pedimos informativos con bypass de navegador
            const resInfo = await fetch(`${API_URL}?action=informativos&_cb=${cacheBuster}`);
            const dataInfo = await resInfo.json();
            if (dataInfo.success && dataInfo.informativos) {
                appData.informativos = dataInfo.informativos;
                if (typeof renderInformativos === 'function') renderInformativos();
            }

            // Pedimos configuración de TV por si se activa o desactiva la transmisión en vivo
            const resTv = await fetch(`${API_URL}?action=tv&_cb=${cacheBuster}`);
            const dataTv = await resTv.json();
            if (dataTv.success && dataTv.tv) {
                appData.tv = dataTv.tv;
                // Aquí puedes llamar a la función que actualice el reproductor de TV si existiera
                console.log("📺 Estado de la TV verificado");
            }

        } catch (error) {
            console.error("Error al refrescar barra de información:", error);
        }
    }

    // ======================================
    // BARRA INFORMATIVA
    // ======================================

    let informativoActual = 0;

    function initInformativos() {
        const track = document.getElementById("signal-track");
        if (!track) return;

        let mensajes = [];

        // 1. INFORMATIVOS SHEETS (Filtro booleano estricto)
        const informativos = appData.informativos.filter(item => item.activo === true);

        informativos.forEach(item => {
            if (item.texto) {
                mensajes.push({
                    tipo: item.nombre,
                    texto: item.texto
                });
            }
        });

        // 2. TOP 1 SONANDO (Ahora lee directo de appData.ranking ordenado)
        if (appData.ranking && appData.ranking.length) {
            const top = [...appData.ranking].sort((a, b) => Number(b.votos || 0) - Number(a.votos || 0))[0];
            if (top && top.artista && top.cancion) {
                mensajes.unshift({
                    tipo: "SONANDO",
                    texto: `${top.artista} - ${top.cancion} lidera con ${top.votos || 0} votos`
                });
            }
        }

        // 3. PROGRAMA ACTUAL Y PRÓXIMO
        const actual = getCurrentProgram();
        if (actual) {
            mensajes.unshift({
                tipo: "AL AIRE",
                texto: actual.nombre || actual.programa
            });
        }

        const siguiente = getNextProgram();
        if (siguiente) {
            mensajes.push({
                tipo: "SIGUE",
                texto: siguiente.nombre || siguiente.programa
            });
        }

        // 4. MENSAJE FIJO TV
        mensajes.push({
            tipo: "TV",
            texto: "Neptuno TV transmite en vivo"
        });

        // 5. RENDERIZADO AL DOM
        const contenidoHTML = mensajes.map(msg => `
            <span class="signal-item">
                <span class="signal-badge">${msg.tipo}</span>
                ${msg.texto}
            </span>
            <span class="signal-separator">●</span>
        `).join('');

        // Inyectar doble para evitar saltos en la animación CSS de marquesina infinita
        track.innerHTML = contenidoHTML + contenidoHTML;
    }

    // Función para mostrar Fecha y Hora en la Barra

    function updateDateTime() {

        const now = new Date();

        const dias = [
            'Domingo',
            'Lunes',
            'Martes',
            'Miércoles',
            'Jueves',
            'Viernes',
            'Sábado'
        ];

        const meses = [
            'Ene',
            'Feb',
            'Mar',
            'Abr',
            'May',
            'Jun',
            'Jul',
            'Ago',
            'Sep',
            'Oct',
            'Nov',
            'Dic'
        ];

        const fecha =
            `${dias[now.getDay()]} ${now.getDate()}, ${meses[now.getMonth()]} ${now.getFullYear()}`;

        const hora =
            now.toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

        document.getElementById('current-date').textContent = fecha;
        document.getElementById('current-time').textContent = hora;
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    // ==========================================
    // VISTA NEPTUNO TV
    // ==========================================

    function renderNeptunoTV() {
        const container = document.querySelector("#tv-player-container");
        if (!container) return;

        const tvConfig = appData.tv;

        // Fallback por si la API no responde o el nodo viene vacío
        if (!tvConfig) {
            container.innerHTML = `<video autoplay loop muted playsinline><source src="assets/tv-loop.mp4" type="video/mp4"></video>`;
            return;
        }

        if (tvConfig.activo && tvConfig.url_stream) {
            // MODO EN VIVO: Inyecta tu iframe de Kick original
            container.innerHTML = `
            <iframe 
                src="${tvConfig.url_stream}" 
                allowfullscreen>
            </iframe>
        `;
        } else {
            // MODO OFF-AIR: Inyecta el video loop local usando la ruta de tu Sheets
            const videoSrc = tvConfig.url_loop || "assets/tv-loop.mp4";
            container.innerHTML = `
            <video autoplay loop muted playsinline>
                <source src="${videoSrc}" type="video/mp4">
            </video>
        `;
        }
    }

    // ==========================================
    // RESUMEN SECCION EXPLORA (INTEGRADO)
    // ==========================================

    function updateExploreProgramacion() {
        const ahora = getCurrentProgram(); // Tu función que calcula el show actual según la hora

        const elTitle = document.getElementById("explore-onair");
        const elTime = document.getElementById("explore-onair-time");
        const elDesc = document.getElementById("explore-onair-desc");

        if (ahora) {
            if (elTitle) elTitle.textContent = ahora.nombre || ahora.programa || "Programa Especial";
            if (elTime) elTime.textContent = `${ahora.inicio || '--:--'} - ${ahora.fin || '--:--'}`;
            if (elDesc) elDesc.textContent = ahora.descripcion || "Sintoniza nuestra señal en vivo.";
        } else {
            if (elTitle) elTitle.textContent = "Sin transmisión";
            if (elTime) elTime.textContent = "--:-- - --:--";
            if (elDesc) elDesc.textContent = "Disfruta de nuestra música de continuidad.";
        }
    }

    function updateExploreNoticias() {
        if (!appData.noticias || appData.noticias.length === 0) return;

        const noticia = appData.noticias[0];
        const titleEl = document.getElementById("explore-news-title");
        const imgEl = document.getElementById("explore-news-image");

        if (titleEl) titleEl.textContent = noticia.titulo;
        if (imgEl) {
            imgEl.src = noticia.imagen ? `assets/noticias/${noticia.imagen}` : '';
        }
    }

    function updateExploreSonando() {
        if (!appData.ranking || appData.ranking.length === 0) return;

        // Ordenamos el ranking por votos para asegurar el TOP 1 real
        const topTrack = [...appData.ranking].sort((a, b) => {
            const votosA = Number(a.votos || 0);
            const votosB = Number(b.votos || 0);
            return votosB - votosA;
        })[0];

        const textEl = document.getElementById("explore-top-track");
        const imgEl = document.getElementById("explore-top-cover");

        if (!topTrack) return;

        // 1. Inyectamos texto limpio en tu contenedor original
        if (textEl) {
            textEl.innerHTML = `
            <strong>${topTrack.cancion || 'Canción'}</strong><br>
            <span>${topTrack.artista || 'Artista'}</span><br>
            <small>⚡ ${topTrack.votos || 0} impulsos</small>
        `;
        }

        // 2. Acoplamos dinámicamente el nombre del archivo que viene desde Sheets
        if (imgEl) {
            // Al concatenar con la carpeta raíz de carátulas, la URL queda: assets/covers/xyz.webp
            imgEl.src = topTrack.cover ? `assets/covers/${topTrack.cover}` : 'assets/covers/default.webp';
            imgEl.alt = `${topTrack.cancion} - ${topTrack.artista}`;
        }
    }


    // ==========================================
    // SISTEMA DE NOTICIAS DINÁMICAS
    // ==========================================

    // Renderizar lista de noticias en la sección principal
    function renderNewsList() {
        const newsGrid = document.getElementById('newsGrid');
        if (!newsGrid || allNews.length === 0) return;

        newsGrid.innerHTML = allNews.map(news => `
            <article class="news-card" data-id="${news.id}">
                <div class="news-img-placeholder" style="background-image: url('assets/noticias/${news.imagen}'); background-size: cover; background-position: center;">
                    ${!news.imagen ? '<i class="far fa-newspaper"></i>' : ''}
                </div>
                <div class="news-body">
                    <span class="news-tag">${news.categoria}</span>
                    <h3>${news.titulo}</h3>
                    <p>${news.extracto}</p>
                    <a href="#" class="news-link" onclick="event.preventDefault(); showSection('noticia-detalle', ${news.id});">
                        Leer artículo completo <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `).join('');
    }

    // Cargar detalle de artículo con sanitización básica para prevenir XSS
    async function loadArticleDetail(articleId) {
        const articleRoot = document.getElementById('article-root');
        if (!articleRoot) return;

        articleRoot.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Cargando artículo...</p>';

        try {
            // Si aún no hemos cargado las noticias, hacerlo ahora
            if (allNews.length === 0) {

                allNews = appData.noticias;

            }

            const article = allNews.find(item => item.id === articleId);
            currentArticleId = articleId;

            if (!article) {
                articleRoot.innerHTML = `
                    <nav class="breadcrumb">
                        <a href="#" onclick="event.preventDefault(); showSection('noticias');">← Volver a Noticias</a>
                    </nav>
                    <p>No se encontró el artículo solicitado.</p>
                `;
                return;
            }

            // Buscar noticia anterior y siguiente
            const currentIndex = allNews.findIndex(item => item.id === articleId);
            const prevArticle = currentIndex > 0 ? allNews[currentIndex - 1] : null;
            const nextArticle = currentIndex < allNews.length - 1 ? allNews[currentIndex + 1] : null;

            // Formatear fecha
            const formattedDate = new Date(article.fecha).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // URL actual para compartir
            const currentUrl = encodeURIComponent(window.location.href);
            const encodedTitle = encodeURIComponent(article.titulo);

            // Sanitización básica: crear elementos DOM en lugar de insertar HTML crudo
            // Esto previene XSS al evitar que se ejecuten scripts maliciosos
            const articleContainer = document.createElement('div');

            // Crear breadcrumb
            const breadcrumb = document.createElement('nav');
            breadcrumb.className = 'breadcrumb';
            const backLink = document.createElement('a');
            backLink.href = '#';
            backLink.textContent = '← Volver a Noticias';
            backLink.onclick = (e) => { e.preventDefault(); showSection('noticias'); };
            breadcrumb.appendChild(backLink);
            articleContainer.appendChild(breadcrumb);

            // Crear imagen del artículo
            const img = document.createElement('img');
            img.src = article.imagen
                ? `assets/noticias/${article.imagen}`
                : '';
            img.alt = article.titulo || 'Imagen del artículo';
            img.className = 'article-image';
            articleContainer.appendChild(img);

            // Crear header del artículo
            const header = document.createElement('div');
            header.className = 'article-header';

            const category = document.createElement('span');
            category.className = 'article-category';
            category.textContent = article.categoria || '';
            header.appendChild(category);

            const dateSpan = document.createElement('span');
            dateSpan.className = 'article-date';
            dateSpan.textContent = formattedDate;
            header.appendChild(dateSpan);

            const title = document.createElement('h1');
            title.className = 'article-title';
            title.textContent = article.titulo || '';
            header.appendChild(title);

            articleContainer.appendChild(header);

            // Crear cuerpo del artículo - USAR textContent para seguridad
            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'article-body';
            // Si el cuerpo es HTML seguro, podemos usar innerHTML, pero para máxima seguridad usamos textContent
            // o un parser DOM que elimine scripts
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = article.cuerpo || '';
            // Eliminar cualquier script potencial
            const scripts = tempDiv.querySelectorAll('script');
            scripts.forEach(script => script.remove());
            // Eliminar eventos on* (onclick, onerror, etc.)
            const allElements = tempDiv.querySelectorAll('*');
            allElements.forEach(el => {
                Array.from(el.attributes).forEach(attr => {
                    if (attr.name.startsWith('on')) {
                        el.removeAttribute(attr.name);
                    }
                });
            });
            bodyDiv.innerHTML = tempDiv.innerHTML;
            articleContainer.appendChild(bodyDiv);

            // Bloque de compartir
            const shareBlock = document.createElement('div');
            shareBlock.className = 'share-block';
            const shareText = document.createElement('p');
            shareText.textContent = 'Compartir esta noticia:';
            shareBlock.appendChild(shareText);

            const shareButtons = document.createElement('div');
            shareButtons.className = 'share-buttons';

            // Botón Twitter
            const twitterBtn = document.createElement('a');
            twitterBtn.href = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${currentUrl}`;
            twitterBtn.className = 'btn-share twitter';
            twitterBtn.target = '_blank';
            twitterBtn.rel = 'noopener noreferrer';
            twitterBtn.innerHTML = '<i class="fab fa-twitter"></i> Twitter';
            shareButtons.appendChild(twitterBtn);

            // Botón WhatsApp
            const whatsappBtn = document.createElement('a');
            whatsappBtn.href = `https://wa.me/?text=${encodedTitle}%20${currentUrl}`;
            whatsappBtn.className = 'btn-share whatsapp';
            whatsappBtn.target = '_blank';
            whatsappBtn.rel = 'noopener noreferrer';
            whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i> WhatsApp';
            shareButtons.appendChild(whatsappBtn);

            shareBlock.appendChild(shareButtons);
            articleContainer.appendChild(shareBlock);

            // Navegación entre artículos
            const navDiv = document.createElement('div');
            navDiv.className = 'article-navigation';

            if (prevArticle) {
                const prevLink = document.createElement('a');
                prevLink.href = '#';
                prevLink.className = 'nav-article prev';
                prevLink.onclick = (e) => { e.preventDefault(); showSection('noticia-detalle', prevArticle.id); };
                prevLink.innerHTML = `<span class="nav-label">← Anterior</span><span class="nav-title">${prevArticle.titulo}</span>`;
                navDiv.appendChild(prevLink);
            } else {
                navDiv.appendChild(document.createElement('div'));
            }

            if (nextArticle) {
                const nextLink = document.createElement('a');
                nextLink.href = '#';
                nextLink.className = 'nav-article next';
                nextLink.onclick = (e) => { e.preventDefault(); showSection('noticia-detalle', nextArticle.id); };
                nextLink.innerHTML = `<span class="nav-label">Siguiente →</span><span class="nav-title">${nextArticle.titulo}</span>`;
                navDiv.appendChild(nextLink);
            }

            articleContainer.appendChild(navDiv);

            // Limpiar y agregar el contenido sanitizado
            articleRoot.innerHTML = '';
            articleRoot.appendChild(articleContainer);
        } catch (error) {
            console.error('Error cargando artículo:', error);
            articleRoot.innerHTML = `
                <nav class="breadcrumb">
                    <a href="#" onclick="event.preventDefault(); showSection('noticias');">← Volver a Noticias</a>
                </nav>
                <p>No se pudo cargar el artículo. Por favor, intenta nuevamente.</p>
            `;
        }
    }

    // ==========================================
    // SISTEMA DE ANUNCIOS INTERACTIVOS (Corregido)
    // ==========================================
    function renderAnuncios() {
        const container = document.querySelector("#ads-container");
        if (!container) return;

        const anuncios = appData.anuncios;

        if (!anuncios || anuncios.length === 0) {
            container.innerHTML = `
                    <div class="ad-empty-state">
                        <h3>¿Quieres anunciarte en Radio Neptuno?</h3>
                        <p>Apoya nuestra señal independiente y llega a toda la comunidad local.</p>
                        <a href="mailto:info@radioneptuno.cl" class="btn-ad-dynamic">Escríbenos Hoy</a>
                    </div>
                `;
            return;
        }

        container.innerHTML = anuncios.map(ad => {
            const tieneImagen = ad.imagen && ad.imagen.trim() !== "";

            // VALIDACIÓN DE ENLACE EXTERNO: Si no trae http/https, se lo agregamos automáticamente
            let urlFinal = ad.link ? ad.link.trim() : '#';
            if (urlFinal !== '#' && !/^https?:\/\//i.test(urlFinal)) {
                urlFinal = 'https://' + urlFinal;
            }

            return `
                    <div class="ad-dynamic-card ${tieneImagen ? 'has-image' : ''}">
                        ${tieneImagen ? `
                            <div class="ad-reveal-bg">
                                <img src="${ad.imagen}" alt="${escapeHTML(ad.titulo)}" loading="lazy">
                            </div>
                        ` : ''}
                        
                        <div class="ad-card-content">
                            <div class="ad-header-group">
                                <i class="fas ${ad.icono || 'fa-star'} ad-icon"></i>
                                <div class="ad-text-group">
                                    <h3>${escapeHTML(ad.titulo)}</h3>
                                    <p>${escapeHTML(ad.descripcion)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <a href="${urlFinal}" target="_blank" rel="noopener noreferrer" class="btn-ad-dynamic">
                            ${escapeHTML(ad.textoBoton || 'Saber más')}
                        </a>
                    </div>
                `;
        }).join('');
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g,
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // ==========================================
    // SISTEMA DE PROGRAMACIÓN DINÁMICA
    // ==========================================

    async function initData() {
        // 1. Espera la precarga pesada inicial (Pasa por el caché largo de Google)
        await preloadData();

        // 2. Asignación de los datos iniciales
        allNews = appData.noticias;
        programasData = appData.programas;
        programacionData = appData.programacion;

        // 3. Renders e inicializaciones iniciales de la página
        renderNewsList();
        mergeScheduleData();
        renderSchedule();
        updateLiveSchedule();
        initInformativos();
        renderAnuncios();
        renderNeptunoTV();
        updateExploreProgramacion();
        updateExploreNoticias();
        updateExploreSonando();

        // 4. Temporizadores en segundo plano (Ciclos en tiempo real optimizados)
        setInterval(updateLiveSchedule, 60000);       // Actualiza la aguja de la hora actual
        setInterval(refreshBarraYTvTiempoReal, 60000); // Revisa la barra e hilos de TV cada 1 min
        setInterval(refreshNoticiasTiempoReal, 300000); // Revisa noticias nuevas cada 5 min
    }

    async function loadProgramas() {

        try {
            const response =
                await fetch(`${API_URL}?action=programas`);
            const data =
                await response.json();

            programasData =
                data.programas || [];

        } catch (error) {
            console.error(
                'Error cargando programas:',
                error
            );
        }
    }

    async function loadSchedule() {

        try {
            const response =
                await fetch(`${API_URL}?action=programacion`);
            const data =
                await response.json();

            programacionData =
                data.programacion || [];

            mergeScheduleData();
            renderSchedule();
            updateLiveSchedule();
            setInterval(updateLiveSchedule, 60000);

        } catch (error) {

            console.error(
                'Error cargando programación:',
                error
            );
        }
    }

    function mergeScheduleData() {

        const programasMap = {};

        programasData.forEach(programa => {

            programasMap[programa.id] = programa;
        });

        scheduleData = programacionData.map(item => ({

            ...item,

            ...(programasMap[item.programa_id] || {})
        }));
    }

    function renderSchedule() {

        const container =
            document.querySelector('.schedule-grid');

        if (!container) return;

        container.innerHTML =
            scheduleData.map((item, index) => `

        <div
            class="schedule-card"
            data-index="${index}"
            data-start="${item.inicio}"
            data-end="${item.fin}"
        >

            <span class="time">
                <i class="fas ${item.icono}"></i>
                ${item.inicio} - ${item.fin}
            </span>

            <h3>${item.nombre}</h3>

            <p>${item.descripcion}</p>

        </div>

    `).join('');
    }


    function isCurrentProgram(
        currentMinutes,
        startMinutes,
        endMinutes
    ) {

        if (endMinutes < startMinutes) {

            return (
                currentMinutes >= startMinutes ||
                currentMinutes < endMinutes
            );

        }

        return (
            currentMinutes >= startMinutes &&
            currentMinutes < endMinutes
        );

    }

    function getCurrentProgram() {
        if (!scheduleData || scheduleData.length === 0) return null;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (let i = 0; i < scheduleData.length; i++) {
            const programa = scheduleData[i];
            const [startHour, startMinute] = programa.inicio.split(':').map(Number);
            const [endHour, endMinute] = programa.fin.split(':').map(Number);

            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            if (isCurrentProgram(currentMinutes, startMinutes, endMinutes)) {
                return programa;
            }
        }
        return null;
    }

    function getNextProgram() {
        if (!scheduleData || scheduleData.length === 0) return null;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (let i = 0; i < scheduleData.length; i++) {
            const programa = scheduleData[i];
            const [startHour, startMinute] = programa.inicio.split(':').map(Number);
            const [endHour, endMinute] = programa.fin.split(':').map(Number);

            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            if (isCurrentProgram(currentMinutes, startMinutes, endMinutes)) {
                // Retorna el siguiente programa, o el primero del día si es el último
                return scheduleData[i + 1] || scheduleData[0];
            }
        }
        return null;
    }

    function updateLiveSchedule() {

        const now = new Date();

        const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();

        let currentShow = null;

        document
            .querySelectorAll('.schedule-card')
            .forEach(card => {

                card.classList.remove('current');

                const badge =
                    card.querySelector(
                        '.current-badge'
                    );

                if (badge)
                    badge.remove();
            });

        scheduleData.forEach((programa, index) => {

            const [startHour, startMinute] =
                programa.inicio
                    .split(':')
                    .map(Number);

            const [endHour, endMinute] =
                programa.fin
                    .split(':')
                    .map(Number);

            const startMinutes =
                startHour * 60 +
                startMinute;

            const endMinutes =
                endHour * 60 +
                endMinute;

            const active =
                isCurrentProgram(
                    currentMinutes,
                    startMinutes,
                    endMinutes
                );

            if (!active) return;

            currentShow = programa;

            const card =
                document.querySelectorAll(
                    '.schedule-card'
                )[index];

            if (!card) return;

            card.classList.add('current');

            const badge =
                document.createElement(
                    'span'
                );

            badge.className =
                'current-badge';

            badge.textContent =
                'Al Aire';

            card.appendChild(badge);

        });

        updateWidgetSchedule(
            currentShow
        );

    }

    function updateWidgetSchedule(
        currentShow
    ) {

        const widgetShowName =
            document.getElementById(
                'widgetShowName'
            );

        const widgetShowTime =
            document.getElementById(
                'widgetShowTime'
            );

        if (
            !widgetShowName ||
            !widgetShowTime
        ) return;

        if (currentShow) {

            widgetShowName.textContent =
                currentShow.nombre;

            widgetShowTime.textContent =
                `${currentShow.inicio} - ${currentShow.fin}`;

        } else {

            widgetShowName.textContent =
                'Sin programación';

            widgetShowTime.textContent =
                '--:-- - --:--';

        }

    }

    // ==========================================
    // PARÁMETROS DE CONFIGURACIÓN DE TU EMISORA
    // ==========================================
    const ZENO_CONFIG = {
        // 1. URL de tu stream de audio de Zeno (Asegúrate de incluir el ID de tu stream al final)
        streamUrl: "https://stream.zeno.fm/lqnwrpclo7hvv",

        // 2. ID de tu estación en Zeno (Se usa para consultar los metadatos en vivo)
        stationId: "lqnwrpclo7hvv",

        // Intervalo de actualización de metadatos en milisegundos (ej: 15000 = 15 segundos)
        updateInterval: 15000
    };

    // Elementos del DOM del Menú
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    // Elementos del DOM del Reproductor (usando el mismo audio que antes)
    const audio = document.getElementById('zenoAudio');

    // Elementos del widget flotante
    const radioWidget = document.getElementById('radio-widget');
    const widgetExpandBtn = document.getElementById('widgetExpandBtn');
    const widgetCollapseBtn = document.getElementById('widgetCollapseBtn');
    const widgetPlayBtn = document.getElementById('widgetPlayBtn');
    const widgetPlayIcon = document.getElementById('widgetPlayIcon');
    const widgetVolumeSlider = document.getElementById('widgetVolumeSlider');
    const widgetMuteBtn = document.getElementById('widgetMuteBtn');
    const widgetVolumeIcon = document.getElementById('widgetVolumeIcon');
    const widgetMiniStatus = document.getElementById('widgetMiniStatus');
    const widgetLiveBadge = document.getElementById('widgetLiveBadge');

    // Elementos de Metadatos del widget
    const widgetTrackTitle = document.getElementById('widgetTrackTitle');
    const widgetTrackArtist = document.getElementById('widgetTrackArtist');
    const widgetCover = document.getElementById('widgetCover');
    const widgetDefaultIcon = document.getElementById('widgetDefaultIcon');

    let isPlaying = false;
    let isMuted = false;
    let lastVolume = 0.8;
    let metadataTimer = null;

    // Asignar URL del stream al elemento de audio
    audio.src = ZENO_CONFIG.streamUrl;
    audio.volume = lastVolume;

    // Lógica del menú desplegable (Mobile) - Mejorado
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            const icon = menuToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');

            // Toggle aria-expanded para accesibilidad
            const isExpanded = mainNav.classList.contains('open');
            menuToggle.setAttribute('aria-expanded', isExpanded);
        });

        // Cerrar menú al hacer clic en un enlace (mejora UX móvil)
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    mainNav.classList.remove('open');
                    const icon = menuToggle.querySelector('i');
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    // ==========================================
    // LÓGICA DEL REPRODUCTOR AUDIO HTML5
    // ==========================================

    // Control de expansión/colapso del widget
    if (widgetExpandBtn && radioWidget) {
        widgetExpandBtn.addEventListener('click', () => {
            radioWidget.classList.remove('widget-minimized');
            radioWidget.classList.add('widget-expanded');
        });
    }

    if (widgetCollapseBtn && radioWidget) {
        widgetCollapseBtn.addEventListener('click', () => {
            radioWidget.classList.remove('widget-expanded');
            radioWidget.classList.add('widget-minimized');
        });
    }

    // Control de reproducción desde el widget
    if (widgetPlayBtn) {
        widgetPlayBtn.addEventListener('click', () => {
            if (!isPlaying) {
                if (widgetMiniStatus) widgetMiniStatus.textContent = "CONECTANDO...";

                audio.play()
                    .then(() => {
                        isPlaying = true;
                        widgetPlayIcon.classList.replace('fa-play', 'fa-pause');
                        if (widgetMiniStatus) widgetMiniStatus.textContent = "ON";
                        if (widgetLiveBadge) widgetLiveBadge.style.display = 'inline-block';

                        // Iniciar la consulta de metadatos cuando empiece a sonar
                        fetchZenoMetadata();
                        metadataTimer = setInterval(fetchZenoMetadata, ZENO_CONFIG.updateInterval);
                    })
                    .catch(error => {
                        console.error("Error al reproducir el stream:", error);
                        if (widgetMiniStatus) widgetMiniStatus.textContent = "ERROR";
                    });
            } else {
                // Detener por completo el buffer en streams en vivo para evitar delays al retomar
                audio.pause();
                audio.load();
                isPlaying = false;
                widgetPlayIcon.classList.replace('fa-pause', 'fa-play');
                if (widgetMiniStatus) widgetMiniStatus.textContent = "OFF";
                if (widgetLiveBadge) widgetLiveBadge.style.display = 'none';

                // Detener las peticiones de metadatos para optimizar rendimiento
                clearInterval(metadataTimer);
                resetMetadataUI();
            }
        });
    }

    // Control de volumen desde el widget
    if (widgetVolumeSlider) {
        widgetVolumeSlider.addEventListener('input', (e) => {
            audio.volume = e.target.value;
            lastVolume = e.target.value;
            isMuted = (e.target.value == 0);
            updateVolumeIcon();
        });
    }

    // Control de mute desde el widget
    if (widgetMuteBtn) {
        widgetMuteBtn.addEventListener('click', () => {
            if (isMuted) {
                audio.volume = lastVolume > 0 ? lastVolume : 0.8;
                widgetVolumeSlider.value = audio.volume;
                isMuted = false;
            } else {
                lastVolume = audio.volume;
                audio.volume = 0;
                widgetVolumeSlider.value = 0;
                isMuted = true;
            }
            updateVolumeIcon();
        });
    }

    function updateVolumeIcon() {
        if (!widgetVolumeIcon) return;

        widgetVolumeIcon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-mute');

        if (isMuted || audio.volume === 0) {
            widgetVolumeIcon.classList.add('fa-volume-mute');
        } else if (audio.volume < 0.5) {
            widgetVolumeIcon.classList.add('fa-volume-down');
        } else {
            widgetVolumeIcon.classList.add('fa-volume-up');
        }
    }

    // Eventos del elemento de audio para feedback visual inmediato
    audio.addEventListener('waiting', () => {
        if (isPlaying && widgetMiniStatus) widgetMiniStatus.textContent = "SINC...";
    });

    audio.addEventListener('playing', () => {
        if (isPlaying && widgetMiniStatus) widgetMiniStatus.textContent = "ON";
    });

    audio.addEventListener('error', () => {
        if (widgetMiniStatus) widgetMiniStatus.textContent = "ERROR";
    });

    // ==========================================
    // EXTRACCIÓN DE METADATOS (API ZENO + DEEZER)
    // ==========================================
    function fetchZenoMetadata() {
        if (!ZENO_CONFIG.stationId || ZENO_CONFIG.stationId.includes("TU_STATION_ID")) return;

        // Endpoint público de metadatos de Zeno Radio
        const zenoApiUrl = `https://api.zeno.fm/public/v2/store/station/${ZENO_CONFIG.stationId}/current-track`;

        fetch(zenoApiUrl)
            .then(response => {
                if (!response.ok) throw new Error('Error al conectar con la API de Zeno');
                return response.json();
            })
            .then(data => {
                // Estructura típica de respuesta de Zeno: data.title y data.artist
                if (data && (data.title || data.artist)) {
                    const songTitle = data.title || "Radio Neptuno";
                    const songArtist = data.artist || "Señal Online";

                    // Si cambiaron los metadatos respecto a lo que se muestra, actualizamos e invocamos a Deezer
                    if (widgetTrackTitle.textContent !== songTitle || widgetTrackArtist.textContent !== songArtist) {
                        widgetTrackTitle.textContent = songTitle;
                        widgetTrackArtist.textContent = songArtist;
                        fetchAlbumArt(songArtist, songTitle);
                    }
                }
            })
            .catch(err => {
                console.warn("No se pudieron obtener metadatos de Zeno:", err);
            });
    }

    // Buscar carátula en la API pública de Deezer mediante JSONP/CORS Proxy alternativo incorporado por la API
    function fetchAlbumArt(artist, title) {
        const query = encodeURIComponent(`${artist} ${title}`);
        // Usamos la API de búsqueda pública de Deezer
        const deezerUrl = `https://api.deezer.com/search?q=${query}&limit=1&output=jsonp`;

        // Crear una petición JSONP nativa para saltar restricciones de CORS de la API de Deezer
        const scriptId = 'deezer_jsonp_callback';
        const oldScript = document.getElementById(scriptId);
        if (oldScript) oldScript.remove();

        window.deezerCallback = (data) => {
            if (data && data.data && data.data.length > 0) {
                const albumCover = data.data[0].album.cover_medium;
                displayCover(albumCover);
            } else {
                displayDefaultIcon();
            }
            delete window.deezerCallback;
        };

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `${deezerUrl}&callback=deezerCallback`;
        document.body.appendChild(script);
    }

    function displayCover(url) {
        widgetCover.src = url;
        widgetCover.style.display = 'block';
        widgetDefaultIcon.style.display = 'none';
    }

    function displayDefaultIcon() {
        widgetCover.style.display = 'none';
        widgetDefaultIcon.style.display = 'block';
    }

    function resetMetadataUI() {
        widgetTrackTitle.textContent = "Radio Neptuno";
        widgetTrackArtist.textContent = "Señal Online";
        displayDefaultIcon();
    }


    // Funcionalidad del botón CTA "Escuchar Ahora" en el Hero
    const ctaEscucharAhora = document.getElementById('ctaEscucharAhora');
    if (ctaEscucharAhora && radioWidget) {
        ctaEscucharAhora.addEventListener('click', (e) => {
            e.preventDefault();

            // Expandir el widget si está minimizado
            if (radioWidget.classList.contains('widget-minimized')) {
                radioWidget.classList.remove('widget-minimized');
                radioWidget.classList.add('widget-expanded');
            }

            // Iniciar reproducción si no está sonando
            if (!isPlaying) {
                if (widgetMiniStatus) widgetMiniStatus.textContent = "CONECTANDO...";

                audio.play()
                    .then(() => {
                        isPlaying = true;
                        widgetPlayIcon.classList.replace('fa-play', 'fa-pause');
                        if (widgetMiniStatus) widgetMiniStatus.textContent = "ON";
                        if (widgetLiveBadge) widgetLiveBadge.style.display = 'inline-block';

                        // Iniciar la consulta de metadatos cuando empiece a sonar
                        fetchZenoMetadata();
                        metadataTimer = setInterval(fetchZenoMetadata, ZENO_CONFIG.updateInterval);
                    })
                    .catch(error => {
                        console.error("Error al reproducir el stream:", error);
                        if (widgetMiniStatus) widgetMiniStatus.textContent = "ERROR";
                    });
            }
        });
    }

    // Inicializar carga de datos maestra al inicio
    initData();
});
