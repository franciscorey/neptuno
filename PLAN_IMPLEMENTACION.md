# RADIO NEPTUNO — IMPLEMENTACIÓN SECCIÓN SONANDO (VERSIÓN MVP)

## Objetivo

Implementar una nueva sección llamada **SONANDO** dentro del SPA actual de Radio Neptuno.

La sección permitirá:

* Mostrar un Top 10 dinámico
* Mostrar Nuevos Ingresos
* Permitir votaciones de usuarios
* Recibir sugerencias musicales
* Mantener la reproducción continua de la radio
* Utilizar Google Sheets como CMS musical
* Mantener una arquitectura simple y económica

---

# Filosofía

SONANDO debe sentirse como una extensión natural de la radio.

No es una red social.

No es Spotify.

No es una plataforma de estadísticas.

Es una herramienta de participación comunitaria alrededor de una estación curada.

La audiencia puede:

* impulsar canciones
* descubrir música
* sugerir material

La curaduría final sigue siendo editorial.

---

# Arquitectura

```text
Google Sheets
      ↓
Google Apps Script
      ↓
JSON Público
      ↓
SPA Neptuno
```

---

# Estado actual

Ya existe:

* Sitio SPA con contenido html, estilos css, funcionamiento js integrado.
* Google Sheets configurado
* Apps Script desplegado
* Endpoint JSON funcionando

Actualmente el endpoint devuelve:

```json
{
  "top10": [],
  "nuevos": []
}
```

---

# Estructura del proyecto

```text
index.html
style.css
main.js
sonando.js
```

No crear archivos HTML independientes.

SONANDO debe vivir dentro de `index.html`.

---

# Integración HTML

Agregar una nueva vista SPA.

Ejemplo:

```html
<section id="sonando-view" class="view">

  <div class="section-header">

    <h1>SONANDO</h1>

    <p>
      Las señales más fuertes de esta semana.
    </p>

  </div>

  <section class="top10-section">

    <h2>TOP 10</h2>

    <div id="top10-list"></div>

  </section>

  <section class="new-section">

    <h2>NUEVOS INGRESOS</h2>

    <div id="new-list"></div>

  </section>

  <section class="suggest-section">

    <h2>SUGERIR TRACK</h2>

    <button id="open-suggest">
      Transmitir sugerencia
    </button>

  </section>

</section>
```

---

# Integración JS

Crear:

```text
sonando.js
```

y cargarlo globalmente.

```html
<script src="sonando.js"></script>
```

---

# Carga dinámica

La información debe cargarse desde Apps Script.

```js
const API_URL = "URL_APPS_SCRIPT";
```

---

# Importante para SPA

No ejecutar la carga al iniciar el sitio.

Debe ejecutarse solamente cuando el usuario entra a SONANDO.

Ejemplo:

```js
if(view === "sonando") {
  loadSonando();
}
```

---

# Render dinámico

Los contenedores:

```html
<div id="top10-list"></div>

<div id="new-list"></div>
```

deben generarse completamente desde JavaScript.

No escribir canciones manualmente en HTML.

---

# Orden automático

El Top 10 siempre debe ordenarse por cantidad de votos.

Ejemplo:

```js
tracks.sort((a,b) => b.votos - a.votos);
```

La hoja de Google solo almacena los datos.

El orden visual lo calcula el frontend.

---

# Sistema de votación

Cada canción tendrá:

```text
📻 Señalizar
```

---

# Flujo UX recomendado

```text
[ 📻 Señalizar ]
        ↓
expandir
        ↓
[ Enviar señal ]
        ↓
Verificando...
        ↓
Transmitiendo...
        ↓
✓ Señal recibida
        ↓
autocierre
```

---

# Importante

No utilizar:

* modales invasivos
* popups
* redirecciones

La experiencia debe mantenerse dentro de la misma vista.

---

# Sistema de sugerencias

Botón:

```text
Transmitir sugerencia
```

Abre formulario interno.

---

# Campos sugeridos

```text
Artista
Canción
Nombre
Correo
Comentario (opcional)
```

---

# Google Sheets

Las sugerencias deben almacenarse en:

```text
SOLICITUDES
```

---

# Privacidad

La hoja:

```text
SOLICITUDES
```

NO debe exponerse en el JSON público.

El endpoint solo debe devolver:

```text
TOP_10
NUEVOS
```

---

# Sistema Anti-Spam (MVP)

## Estrategia seleccionada

El tráfico esperado es bajo.

Las siguientes medidas son suficientes.

---

# 1. Cache Local

Objetivo:

Reducir llamadas innecesarias a Google Apps Script.

---

# Implementación

Guardar:

```js
localStorage
```

con:

```text
sonando_cache
sonando_cache_time
```

---

# Política

Duración:

```text
12 horas
```

Si existe cache válido:

* usar cache
* evitar fetch

---

# Beneficios

* menor latencia
* menor consumo de cuota Google
* mayor estabilidad

---

# 2. Honeypot Invisible

Agregar campo oculto en formularios.

Ejemplo:

```html
<input
 type="text"
 name="website"
 autocomplete="off"
 tabindex="-1"
/>
```

---

# Regla

Si llega contenido en este campo:

```text
rechazar solicitud
```

---

# Objetivo

Bloquear bots simples.

---

# 3. Tiempo mínimo de envío

Registrar momento de apertura del formulario.

---

# Regla

No aceptar envíos realizados antes de:

```text
3 segundos
```

---

# Objetivo

Evitar automatizaciones básicas.

---

# 4. Deshabilitar botones

Al enviar:

```js
button.disabled = true;
```

---

# Mostrar estado visual

```text
Transmitiendo...
```

---

# Restaurar

Al finalizar correctamente:

```text
✓ Señal recibida
```

---

# Objetivo

Evitar múltiples clics.

---

# 5. Cooldown de votos

Guardar votos en:

```js
localStorage
```

---

# Regla inicial

```text
1 voto por track cada 24 horas
```

---

# Objetivo

Reducir abuso sin requerir cuentas.

---

# Validación Backend

Toda validación crítica debe realizarse en Apps Script.

Nunca confiar únicamente en el frontend.

---

# Validaciones mínimas

Campos requeridos:

* artista
* canción

---

# Limitar longitud

Ejemplos:

```text
artista: 100 caracteres
canción: 100 caracteres
nombre: 100 caracteres
correo: 100 caracteres
comentario: 300 caracteres
```

---

# Sanitización

Eliminar:

```text
<
>
```

y otros caracteres potencialmente problemáticos.

---

# Carga de la vista

Cuando el usuario entre a SONANDO:

1. Revisar cache local.
2. Si cache válido:

   * renderizar inmediatamente.
3. Si cache vencido:

   * consultar Apps Script.
4. Actualizar cache.
5. Renderizar.

---

# Roadmap


* Vista SONANDO
* Render Top 10
* Render Nuevos Ingresos
* Integración Apps Script
* Cache local

---

* Sistema de votación
* Cooldown local
* Estados visuales
* Honeypot

---

* Formulario de sugerencias
* Escritura en Google Sheets
* Validación Apps Script

---

# Resultado esperado

Una sección participativa, ligera y coherente con la identidad de Radio Neptuno, capaz de funcionar durante meses con muy poco mantenimiento y sin necesidad de infraestructura compleja.
