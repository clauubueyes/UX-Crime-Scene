# UX Crime Scene — The Junior Files

Simulador del primer trabajo de un junior. Oficina 3D en primera persona y ordenador con escritorio, chat del equipo, navegador inspirado en Chrome, editor inspirado en VS Code y terminal simulado. Primera jornada completa: reproducir un problema de registro, investigar el campo de correo, editar HTML, comprobar el cambio y entregarlo.

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

- WASD/flechas: moverse por la oficina 3D. Arrastra sobre la escena para mirar, o usa Explorar con ratón para capturar el puntero (Esc lo libera). E: interactuar con el objeto cercano al que apuntas. Clic en objetos o accesos inferiores: interacción directa. En móvil hay controles táctiles.
- El control TEXTURA ajusta el tramado y el grano de la escena, sin afectar al texto de las aplicaciones. Volver a tu puesto restablece la cámara.
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
`src/OfficeScene.tsx`: escena Three.js, mobiliario, texturas procedurales, iluminación, colisiones, raycasting y postprocesado retro. Se carga por separado y libera sus recursos al salir.
`src/style.css`: componentes adaptables, HUD y marco de monitor CRT.
`src/engine.test.ts`: validación de correcciones, entrega y comandos.

El editor modifica HTML/CSS reales almacenados localmente; al guardar se reconstruye la página. El iframe se aísla con sandbox y CSP: se eliminan scripts, atributos de eventos y recursos externos del HTML editado. El registro usa un controlador predefinido, y se aceptan mensajes solo del iframe activo. No se ejecutan comandos de sistema ni JavaScript escrito por el jugador. El terminal y DevTools son simulaciones del primer ticket, no herramientas generales ni navegadores completos.

La validación del ticket comprueba la asociación de etiqueta y campo; no es una auditoría de accesibilidad universal. El movimiento de primera persona evita las paredes y los principales muebles. No hay motor de física. La escena requiere WebGL; si no está disponible, los accesos a ordenador, libreta y café permiten continuar. Las texturas y los modelos se generan localmente: no hay descargas de assets ni servicios externos.
