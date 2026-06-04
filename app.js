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
    ranking: []
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
    async function preloadData() {

    try {

        const response =
            await fetch(`${API_URL}?action=all`);

        const data =
            await response.json();

        appData.noticias =
            data.noticias || [];

        appData.programas =
            data.programas || [];

        appData.programacion =
            data.programacion || [];

        appData.informativos =
            data.informativos || [];

        appData.ranking =
            data.top10 || [];

        console.log('Datos precargados');

    } catch(error) {

        console.error(
            'Error precargando datos',
            error
        );

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
        
        if (sectionId === 'inicio') {
            if (aboutSection) aboutSection.classList.add('active');
            if (exploreSection) exploreSection.classList.add('active');
            if (tvSection) tvSection.classList.add('active');
        } else {
            if (aboutSection) aboutSection.classList.remove('active');
            if (exploreSection) exploreSection.classList.remove('active');
            if (tvSection) tvSection.classList.remove('active');
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
    if (aboutSection) aboutSection.classList.add('active');
    if (exploreSection) exploreSection.classList.add('active');
    if (tvSection) tvSection.classList.add('active');

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

    // ======================================
    // BARRA INFORMATIVA
    // ======================================
    
    let informativoActual = 0;

    function initInformativos() {

        console.log("INIT INFORMATIVOS EJECUTADO");
        
        const track =
            document.getElementById(
                "signal-track"
            );
    
        if (!track) {
            return;
        }
    
        let mensajes = [];
    
        // INFORMATIVOS SHEETS
    
        const informativos =
            appData.informativos.filter(
                item =>
                    item.activo === true ||
                    item.activo === "TRUE"
            );
    
        informativos.forEach(item => {
    
            mensajes.push({
    
                tipo:
                    item.nombre,
    
                texto:
                    item.texto
            });
        });
    
        // TOP 1 SONANDO
    
        if (
            appData.ranking &&
            appData.ranking.length
        ) {
            const top =
                appData.ranking[0];
    
            mensajes.unshift({
                tipo:
                    "SONANDO",
                texto:
                    `${top.artista} - ${top.cancion} lidera con ${top.votos} votos`
            });
        }
    
        // PROGRAMA ACTUAL
    
        const actual =
            getCurrentProgram();
    
        if (actual) {
            mensajes.unshift({
                tipo:
                    "AL AIRE",
                texto:
                    actual.nombre
            });
        }
    
        // PROXIMO
    
        const siguiente =
            getNextProgram();
    
        if (siguiente) {
            mensajes.push({
                tipo:
                    "SIGUE",
                texto:
                    `${siguiente.nombre}`
            });
        }
    
        // TV
    
        mensajes.push({
            tipo:
                "TV",
            texto:
                "Neptuno TV transmite en vivo"
        });

        console.log("LLEGO AL FINAL");
        
        track.innerHTML =
            mensajes.map(msg => `
                <span class="signal-item">
                    <span class="signal-badge">
                        ${msg.tipo}
                    </span>
                    ${msg.texto}
                </span>
                <span class="signal-separator">
                    ●
                </span>
            `).join('');
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

    // Inicializar carga de datos
    initData();
    
// ==========================================
// SISTEMA DE PROGRAMACIÓN DINÁMICA
// ==========================================

async function initData() {

    await preloadData();

    allNews =
        appData.noticias;

    programasData =
        appData.programas;

    programacionData =
        appData.programacion;

    renderNewsList();

    mergeScheduleData();

    renderSchedule();

    updateLiveSchedule();

    initInformativos();

    setInterval(
        updateLiveSchedule,
        60000
    );
}
    
async function loadProgramas() {

    try {

        const response =
            await fetch(`${API_URL}?action=programas`);

        const data =
            await response.json();

        programasData =
            data.programas || [];

    } catch(error) {

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

    } catch(error) {

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

    // Highlight automático del menú basado en la sección visible durante el scroll
    // Desactivado en modo SPA ya que la navegación es manual
    /*
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 110;
            const sectionId = current.getAttribute('id');
            const navLink = document.querySelector(`.main-nav a[href*=${sectionId}]`);

            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    document.querySelector('.main-nav a.active')?.classList.remove('active');
                    navLink.classList.add('active');
                }
            }
        });
    });
    */

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
});
