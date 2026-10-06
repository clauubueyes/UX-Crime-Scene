# UX Crime Scene — The Junior Files

Simulador del primer trabajo de un junior. Juego a pantalla completa con una oficina 3D en primera persona, tutorial contextual y un ordenador virtual con escritorio, ventanas y archivos. Primera jornada: reproducir un problema de registro, investigar el correo, editar HTML, comprobar el cambio y entregar el ticket.

## Ejecutar

Node.js 22.12+ (validado con 24.19).

```sh
npm ci
npm run dev
```

Detén los servidores de desarrollo antes de actualizar dependencias; Windows puede bloquear los binarios de esbuild y Rollup si siguen en uso.

```sh
npm test
npm run build
npm run preview
```

Vercel: preset Vite, build `npm run build`, salida `dist`. Sin backend, claves, IA ni base de datos. Three.js y Monaco se cargan por separado cuando se necesitan. Monaco y sus workers se sirven localmente, sin depender de un CDN. Google Fonts es opcional y tiene fuentes de respaldo.

## Tutorial y controles

El primer arranque ofrece un tutorial de nueve pasos. Avanza al realizar las acciones: sentarse, leer el encargo, iniciar el proyecto, reproducir, inspeccionar, corregir, comprobar, registrarse y entregar. Puedes minimizar la guía, salir o repetirla desde el HUD de la oficina, la barra de tareas o Inicio.

- El juego ocupa toda la ventana. El botón **Pantalla completa** usa la API del navegador; Esc permite salir de ese modo.
- WASD/flechas para caminar; arrastrar para mirar; **Explorar con ratón** captura el puntero. Esc lo libera.
- Apunta a un objeto cercano y pulsa E; también hay accesos directos a ordenador, libreta y café y controles táctiles en móvil.
- TEXTURA regula un grano suave; el filtrado de materiales evita el mosaico de la versión anterior.
- En el ordenador, abre aplicaciones desde escritorio, Inicio o barra de tareas. Arrastra las barras de título y redimensiona desde la esquina inferior derecha. Minimizar conserva la aplicación; maximizar ocupa el escritorio; cerrar vuelve al escritorio.

## Ordenador virtual

- **VS Code:** Monaco con resaltado, minimapa, autocompletado HTML/CSS, búsqueda, deshacer/rehacer, explorador y terminal integrado. Archivo, Editar, Ver y Terminal tienen acciones funcionales. Ctrl/⌘+S guarda el archivo.
- **Chrome:** pestañas, nueva pestaña, cierre, barra de direcciones, atrás/adelante, recarga y DevTools del caso. La documentación se abre en otra pestaña. Cambiar de pestaña conserva el formulario del proyecto.
- **Archivos:** documentos compartidos con VS Code, selección, vista previa y creación de archivos HTML/CSS/Markdown/texto.
- **Equipo:** interfaz inspirada en Slack, canales con conversaciones separadas, mensajes directos a Marta, búsqueda en la conversación, mensajes con respuestas escritas para el caso, pistas y entrega.
- **Tickets:** criterios de aceptación y seguimiento de las comprobaciones.

Para jugar sin tutorial: en VS Code ejecuta `npm run dev` en el terminal **del juego**, abre Chrome y prueba un registro con una contraseña corta. Inspecciona el correo en DevTools. En `index.html`, añade `<label for="email">Correo electrónico</label>` antes del campo, guarda, ejecuta `npm test` dentro del juego y prueba el registro con 8 caracteres o más. Entrega en Equipo.

El escritorio es una simulación de trabajo: no ejecuta programas del sistema ni comandos arbitrarios, y Chrome navega por las páginas del caso. La edición HTML/CSS y el formulario sí funcionan en el navegador. El primer día está implementado; las siguientes jornadas todavía no.

## Guardado

Archivos y progreso se guardan en `localStorage` (`ux-junior:v1`). La finalización u omisión del tutorial se guarda en `ux-tutorial:v2`. Las ventanas y procesos duran durante la sesión; al recargar debes volver a iniciar el servidor ficticio. No se guardan los datos del formulario. Usa datos ficticios.

## Arquitectura

- `src/main.tsx`: estado de jornada, aplicaciones y conexiones entre herramientas.
- `src/Desktop.tsx` y `src/desktopState.ts`: escritorio, ventanas y acciones de su gestor.
- `src/CodeEditor.tsx`: Monaco con workers locales y solo los lenguajes necesarios.
- `src/useBrowser.ts`: pestañas, direcciones e historial del navegador virtual.
- `src/Tutorial.tsx`: introducción y guía contextual.
- `src/OfficeScene.tsx`: Three.js, texturas procedurales, iluminación, movimiento y raycasting. Libera los recursos al salir; sin WebGL puedes jugar mediante los accesos directos.
- `src/workday.ts`: archivos iniciales, reglas del ticket y terminal de comandos permitidos.
- `src/engine.test.ts`: evidencia de corrección, entrega, gestor de ventanas y rutas del navegador.

La página editada usa un iframe con sandbox y CSP. Se eliminan scripts, atributos de eventos y recursos externos del HTML, y se aceptan mensajes solo del iframe del proyecto. El registro utiliza un controlador predefinido; la comprobación del ticket no es una auditoría universal de accesibilidad.
