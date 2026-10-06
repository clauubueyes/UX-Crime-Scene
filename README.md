# UX Crime Scene — The Junior Files

Simulador del primer trabajo de un junior. Oficina 2D explorable y ordenador con escritorio, chat del equipo, navegador inspirado en Chrome, editor inspirado en VS Code y terminal simulado. Primera jornada completa: reproducir un problema de registro, investigar el campo de correo, editar HTML, comprobar el cambio y entregarlo.

## Ejecutar

Node.js 22.12+ (validado con 24.19).

```sh
npm ci --cache /tmp/ux-crime-npm --no-audit --no-fund
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

Vercel: preset Vite, build `npm run build`, salida `dist`. Sin backend, claves ni base de datos. Google Fonts es opcional; hay fuentes locales de respaldo.

## Jugar

- WASD/flechas: moverse por el pasillo de la oficina. E: interactuar con el objeto cercano. Clic en objetos: interacción directa, también en móvil.
- Ordenador: chat, editor, navegador y tickets desde el dock.
- En Code, ejecuta `npm run dev` en el terminal del juego. Abre Chrome y prueba un registro con una contraseña corta.
- Abre DevTools e inspecciona el correo. La documentación y el chat ofrecen pistas.
- Edita `index.html`: añade una etiqueta con texto y `for="email"`, conservando el campo. Guarda con el botón o Ctrl/⌘+S.
- Ejecuta `npm test` dentro del juego y comprueba un registro válido en Chrome con la versión guardada.
- Entrega desde el chat o ticket. La entrega requiere reproducción, inspección, corrección, comprobación y registro exitoso.
- Esc vuelve a la oficina o cierra diálogos.

El juego guarda archivos y progreso en `localStorage` (`ux-junior:v1`). Los procesos simulados se reinician al recargar: vuelve a ejecutar `npm run dev` dentro del juego. No se guardan los datos introducidos en el formulario. No uses datos personales. El prototipo contiene una jornada; el día 2 todavía no está implementado.

## Simulación y arquitectura

`src/workday.ts`: archivos iniciales, reglas del ticket y terminal de comandos permitidos.
`src/main.tsx`: oficina, aplicaciones, guardado, edición, iframe y estados de la jornada.
`src/style.css`: oficina y componentes adaptables.
`src/engine.test.ts`: validación de correcciones, entrega y comandos.

El editor modifica HTML/CSS reales almacenados localmente; al guardar se reconstruye la página. El iframe se aísla con sandbox y CSP: se eliminan scripts, atributos de eventos y recursos externos del HTML editado. El registro usa un controlador predefinido, y se aceptan mensajes solo del iframe activo. No se ejecutan comandos de sistema ni JavaScript escrito por el jugador. El terminal y DevTools son simulaciones del primer ticket, no herramientas generales ni navegadores completos.

La validación del ticket comprueba la asociación de etiqueta y campo; no es una auditoría de accesibilidad universal. El movimiento está limitado al pasillo libre de la oficina; no hay física ni navegación 3D.
