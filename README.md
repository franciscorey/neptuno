# Radio Neptuno

Sitio web SPA (Single Page Application) para una radio online comunitaria con reproductor de streaming en vivo, programación dinámica, noticias y tienda de productos.

## 📋 Características

- **Reproductor de Audio en Vivo**: Integración con Zeno FM para streaming de audio con metadatos en tiempo real
- **Sistema SPA**: Navegación sin recargas entre secciones (Radio, Programa, Noticias, Productos)
- **Programación Dinámica**: Muestra qué programa está "Al Aire" según la hora actual
- **Noticias**: Carga dinámica desde archivo JSON con vista de detalle completa
- **Diseño Responsive**: Adaptable a móviles, tablets y escritorio
- **Tema Oscuro**: Interfaz moderna con colores neón inspirados en Radio Neptuno

## 🚀 Cómo Ejecutar Localmente

1. Clona o descarga este repositorio
2. Abre el archivo `index.html` directamente en tu navegador
3. Para una mejor experiencia, usa un servidor local:

```bash
# Con Python 3
python -m http.server 8000

# O con Node.js (npx)
npx serve

# Luego abre http://localhost:8000 en tu navegador
```

## 📁 Estructura de Archivos

```
/workspace/
├── index.html          # Página principal (SPA única)
├── app.js              # Lógica JavaScript: navegación, reproductor, noticias
├── styles.css          # Estilos CSS con variables y diseño responsive
├── noticias.json       # Datos de noticias (editable)
├── README.md           # Este archivo
└── assets/             # Imágenes del sitio
    ├── logo.png
    ├── hero-bg.png
    ├── radio.png
    └── estudio.png
```

## ⚙️ Configuración de Zeno FM

Edita el objeto `ZENO_CONFIG` en `app.js` (línea ~302):

```javascript
const ZENO_CONFIG = {
    streamUrl: "https://stream.zeno.fm/TU_ID_DE_STREAM",
    stationId: "TU_ID_DE_ESTACION",
    updateInterval: 15000 
};
```

Para obtener tu ID de estación:
1. Ve a tu panel de Zeno FM
2. Copia el ID de tu stream (aparece en la URL del dashboard)
3. Reemplaza `lqnwrpclo7hvv` por tu ID

## 🛠️ Tecnologías

- HTML5 semántico
- CSS3 con variables custom y Grid/Flexbox
- JavaScript ES6+ (sin frameworks)
- Font Awesome (iconos vía CDN)
- API de Zeno FM (metadatos en vivo)

## 🔒 Seguridad

El proyecto implementa sanitización básica contra XSS al cargar contenido dinámico desde `noticias.json`, eliminando scripts y atributos peligrosos antes de renderizar.

## 📄 Licencia

Proyecto de código abierto para la comunidad de Radio Neptuno.

---

Hecho con ❤️ para la comunidad.