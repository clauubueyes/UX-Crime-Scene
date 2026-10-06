# UX Crime Scene

Juego de investigación UX en navegador. MVP con tres niveles progresivos: registro, envío y checkout. React + TypeScript + Vite; sin backend, servicios de IA ni base de datos. El progreso de casos completados se guarda localmente; la investigación en curso se reinicia al recargar.

## Desarrollo

Node.js 22.12+ (comprobado con Node 24).

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Cómo jugar

Completa la tarea en **Usar interfaz**. Cambia a **Investigar**, selecciona un sospechoso, aplica una herramienta y captura la observación. Selecciona una prueba en la bandeja y presenta una acusación. Para cerrar el caso hay que completar la tarea y demostrar ambos problemas. Una acusación incorrecta resta 75 XP; explorar no penaliza. Los niveles siguientes se desbloquean al cerrar el anterior.

- Q: selector de herramientas. 1–3: herramienta en investigación.
- E: capturar prueba del elemento seleccionado.
- Espacio: visión forense en investigación.
- WASD/flechas: desplazar la escena en investigación.
- Tab: navegación nativa. Esc: expediente/cerrar panel.
- Los atajos se suspenden al escribir. Todos los controles tienen alternativas con botones.

El caso 2 tiene un recorrido deliberadamente incorrecto: enfoca Dirección y pulsa Tab dos veces (Ciudad → Código postal). El caso 3 simula un pago de 6,5 segundos: captura con Interaction probe después de 2,1 segundos. Todos los pagos y datos son ficticios.

## Arquitectura

`src/engine.ts`: casos, herramientas, observaciones y evaluación pura. `src/main.tsx`: escenas React, interacciones y shell del juego. `src/style.css`: presentación responsive y movimiento reducido. `src/engine.test.ts`: reglas de evidencia y acusación.

Para añadir un caso, define sus sospechosos y reglas en el motor y crea su escena con eventos instrumentados. El MVP no es un detector universal de UX. Forensic Vision muestra elementos investigables, no respuestas. Focus Tracker registra una secuencia simulada y no realiza una auditoría general de accesibilidad.

## Despliegue

Vercel: preset Vite, comando `npm run build`, salida `dist`. No requiere variables de entorno. Las fuentes de Google son opcionales y tienen fallback local. Sin sincronización entre dispositivos ni cuentas. Borrar los datos del navegador elimina el progreso.
