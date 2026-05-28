# Guía de Implementación: Widget de Radio Moderno

Esta guía detalla los componentes esenciales y la lógica necesaria para integrar un nuevo widget de radio flotante, diseñado para reemplazar reproductores obsoletos, priorizando una experiencia de usuario fluida y una estética adaptable.

1. Arquitectura del Widget

El widget debe ser un contenedor posicionado de forma fija (fixed) en la interfaz, permitiendo dos estados de visualización alternados:

Estado Minimizada: Un bloque compacto que sirve como disparador (trigger) para expandir el reproductor. Este diseño debe ocupar el espacio mínimo indispensable.

Estado Expandida: Una vista completa que contiene los controles de audio y la información en tiempo real de la transmisión.

2. Funcionalidad Clave

Para lograr una renovación efectiva del reproductor antiguo, el widget debe cumplir con los siguientes puntos técnicos:

A. Gestión de Estados

Alternancia: Debe existir un mecanismo (lógica de clases o manipulación del DOM) para cambiar suavemente entre el estado minimizado y el expandido.

Persistencia: La lógica debe garantizar que, al estar en estado minimizado, el audio continúe reproduciéndose sin interrupciones.

B. Control de Audio

Integración: El uso de un elemento de audio centralizado es fundamental.

Controles: Implementar funciones básicas de play, pause y mute. Se recomienda liberar la fuente (src) del audio durante la pausa para reducir el consumo de recursos y evitar latencia acumulada.

C. Sincronización de Metadata (Programación)

Para una experiencia moderna, el widget debe ser capaz de mostrar información dinámica basada en tu infraestructura actual:

Fuente de Datos: El widget debe consumir directamente de la seccion programación ya existente en el sitio para obtener los datos de la parrilla programática tanto hora actual como texto informativo con el nombre del programa en curso.

Reloj interno: Implementar una función similar a la que destaca el bloque programatico actual, que rastree la hora actual (usando la zona horaria local de Chile) para identificar qué programa está activo en la sección de programación.

3. Consideraciones de Diseño y Estilo

Respeto a la identidad visual: NO se deben realizar cambios a la paleta de colores actual del sitio. La estética del nuevo widget debe heredar y respetar los colores y estilos definidos en el CSS del proyecto original.

Adaptabilidad: El widget debe ser responsivo, ajustando su tamaño y disposición dependiendo del ancho de pantalla del dispositivo.

Feedback Visual: Incluir indicadores de estado ("En vivo" o "Pausado") mediante elementos gráficos que denoten actividad (por ejemplo, animaciones de pulso).

Eficiencia de Texto: Implementar un efecto de marquesina (texto deslizante) para asegurar que los nombres largos de los programas sean legibles en el contenedor del widget.

4. Integración con la Infraestructura de Audio Actual (Zeno.fm)

Para evitar errores y mantener la estabilidad de la transmisión, la implementación debe seguir estas reglas:

Preservación de Configuración: NO modificar ni reemplazar el objeto de configuración existente (ZENO_CONFIG) ni las URLs de stream. El widget debe consumir estas variables de manera pasiva.

Mapeo de Controles: El nuevo widget debe actuar como una capa de control (UI) que ejecute los métodos de reproducción (audio.play(), audio.pause()) sobre la instancia de audio ya configurada en el proyecto original.

Respeto a los Event Listeners: Si ya cuentas con listeners que gestionan los metadatos o estados de error de Zeno.fm, estos deben ser integrados para actualizar la nueva interfaz del widget en lugar de ser eliminados. La lógica de negocio del streaming debe permanecer intacta.

5. Notas para el Desarrollo

Limpieza de código: Evitar el uso de librerías de terceros para la lógica de reproducción. La API nativa del elemento <audio> de HTML5 es suficiente y más performante.

Interacción: Asegurar que los disparadores sean lo suficientemente grandes para facilitar la interacción táctil en dispositivos móviles.
