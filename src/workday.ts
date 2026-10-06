export const starterFiles: Record<string, string> = {
  "index.html": `<main class="signup">
  <span class="brand">forma®</span>
  <h1>Tu próxima idea<br>empieza aquí.</h1>
  <p>Un espacio para crear algo diferente.</p>
  <form id="registration">
    <label for="name">Nombre</label>
    <input id="name" name="name" required placeholder="Tu nombre">

    <input id="email" name="email" type="email"
      required placeholder="Correo electrónico">

    <label for="password">Contraseña</label>
    <input id="password" name="password" type="password"
      required placeholder="Crea una contraseña">
    <button type="submit">Crear cuenta →</button>
    <div id="feedback" role="status"></div>
  </form>
  <small>Gratis. Sin tarjeta de crédito.</small>
</main>`,
  "styles.css": `body { margin: 0; background: #f3f1e9; color: #344239;
  font-family: Arial, sans-serif; }
.signup { max-width: 320px; margin: 35px auto; padding: 25px; }
.brand { font-size: 26px; font-weight: bold; }
h1 { font-size: 30px; letter-spacing: -1px; }
p, small { color: #788677; font-size: 12px; }
label { display: block; font-size: 12px; margin-top: 16px; }
input { box-sizing: border-box; width: 100%; padding: 12px;
  margin-top: 8px; border: 1px solid #d4d9ca; border-radius: 5px; }
button { width: 100%; background: #445d49; color: white;
  padding: 13px; border: 0; border-radius: 5px; margin-top: 20px;
  cursor: pointer; }
#feedback { font-size: 12px; margin-top: 14px; }
small { display: block; text-align: center; margin-top: 20px; }`,
  "README.md": `# Forma / frontend

Primer día: respira. Nadie se sabe todo esto de memoria.

La web se construye con index.html y styles.css.
Guarda el archivo para actualizar la versión del navegador.

Comandos de este terminal simulado:
  help          Ver comandos
  ls            Listar archivos
  cat README.md Leer esta nota
  npm run dev   Iniciar la web local
  npm test      Revisar el ticket
  clear         Limpiar terminal

Ticket UX-001:
El campo de correo necesita una etiqueta visible y asociada.
Reproduce el registro antes de cambiar nada.
Después de guardar, prueba que el registro sigue funcionando.
`,
};
export type Progress = {
  inspected: boolean;
  reproduced: boolean;
  tested: boolean;
  registered: boolean;
  delivered: boolean;
};
export const emptyProgress: Progress = {
  inspected: false,
  reproduced: false,
  tested: false,
  registered: false,
  delivered: false,
};
export function checkTicket(html: string): { ok: boolean; message: string } {
  const input = html.match(/<input\b[^>]*\bid\s*=\s*["']email["'][^>]*>/i);
  const labels = [...html.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label\s*>/gi)];
  const bound = labels.some(
    (x) =>
      /\bfor\s*=\s*["']email["']/i.test(x[1]) &&
      x[2].replace(/<[^>]*>/g, "").trim().length > 0,
  );
  const validType = input && /\btype\s*=\s*["']email["']/i.test(input[0]);
  if (!input || !validType)
    return {
      ok: false,
      message: "El campo email debe conservar su id y su tipo email.",
    };
  if (!bound)
    return {
      ok: false,
      message:
        'El correo todavía no tiene una etiqueta con texto y for="email".',
    };
  return {
    ok: true,
    message:
      "PASS · El correo tiene una etiqueta asociada. Comprueba también el registro en el navegador.",
  };
}
export function canDeliver(p: Progress, html: string) {
  return (
    p.inspected &&
    p.reproduced &&
    p.tested &&
    p.registered &&
    checkTicket(html).ok
  );
}
export function terminalCommand(
  command: string,
  files: Record<string, string>,
): { lines: string[]; action?: "start" | "test" | "clear" } {
  const cmd = command.trim();
  if (cmd === "clear") return { lines: [], action: "clear" };
  if (cmd === "help")
    return {
      lines: [
        "help · ls · cat <archivo> · npm run dev · npm test · clear",
        "Terminal de juego: no ejecuta comandos del sistema.",
      ],
    };
  if (cmd === "ls") return { lines: Object.keys(files) };
  if (cmd.startsWith("cat ")) {
    const name = cmd.slice(4).trim();
    return { lines: [files[name] ?? `cat: ${name}: no existe ese archivo`] };
  }
  if (cmd === "npm run dev")
    return {
      lines: [
        "FORMA DEV v0.1",
        "Ready → http://localhost:3000",
        "Abre Chrome desde la barra de aplicaciones.",
      ],
      action: "start",
    };
  if (cmd === "npm test")
    return {
      lines: [checkTicket(files["index.html"]).message],
      action: "test",
    };
  return {
    lines: [
      `Comando no disponible: ${cmd || "(vacío)"}. Escribe help para ver las opciones.`,
    ],
  };
}
