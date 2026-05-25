document.addEventListener('DOMContentLoaded', () => {
    
    // LOGICA MENU DESPLEGABLE (MOBILE)
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('open');
        const icon = menuToggle.querySelector('i');
        if(mainNav.classList.contains('open')) {
            icon.classList.replace('fa-bars', 'fa-times');
        } else {
            icon.classList.replace('fa-times', 'fa-bars');
        }
    });

    // INTEGRACIÓN REPRODUCTOR ZENO.FM (API NATIVA DE AUDIO)
    const audio = document.getElementById('zenoAudio');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const streamStatus = document.getElementById('stream-status');
    const volumeSlider = document.getElementById('volumeSlider');

    let isPlaying = false;

    // Manejo de Reproducción / Pausa
    playBtn.addEventListener('click', () => {
        if (!isPlaying) {
            // Cargar el stream al hacer click evita consumo innecesario de datos previo
            if(audio.readyState === 0) {
                streamStatus.textContent = "Cargando señal...";
            }
            
            audio.play()
                .then(() => {
                    isPlaying = true;
                    playIcon.classList.replace('fa-play', 'fa-pause');
                    streamStatus.textContent = "Escuchando en vivo";
                })
                .catch(error => {
                    console.error("Error al reproducir el stream:", error);
                    streamStatus.textContent = "Error de conexión. Reintente.";
                });
        } else {
            // Para streams en vivo, "pausar" acumula retraso. 
            // Es mejor vaciar el src o hacer un 'load' para que al dar play reconecte en tiempo real.
            audio.pause();
            audio.load(); 
            isPlaying = false;
            playIcon.classList.replace('fa-pause', 'fa-play');
            streamStatus.textContent = "Transmisión en pausa";
        }
    });

    // Control de Volumen
    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
    });

    // Control de eventos nativos del elemento Audio para robustez de la UI
    audio.addEventListener('waiting', () => {
        streamStatus.textContent = "Buffer/Amortiguando...";
    });

    audio.addEventListener('playing', () => {
        streamStatus.textContent = "Escuchando en vivo";
    });

    // Highlight automático de la navegación al hacer scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
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
});
