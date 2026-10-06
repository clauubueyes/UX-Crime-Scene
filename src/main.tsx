import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Hash,
  Users,
  Bell,
  Plus,
  Code2,
  Folder,
  FileCode,
  FileText,
  Globe,
  MessageSquare,
  Terminal,
  Monitor,
  Volume2,
  VolumeX,
  X,
  Minus,
  Maximize2,
  Search,
  RefreshCw,
  Lock,
  ClipboardList,
  Send,
  Coffee,
  BookOpen,
  Briefcase,
  HelpCircle,
  Power,
  Save,
} from "lucide-react";
import {
  starterFiles,
  checkTicket,
  terminalCommand,
  canDeliver,
  emptyProgress,
  type Progress,
} from "./workday";
import { useBrowser, pageFor } from "./useBrowser";
import Desktop from "./Desktop";
import Tutorial from "./Tutorial";
import {
  windowAction,
  type AppName,
  type DesktopWindow,
  type WindowAction,
} from "./desktopState";
import "./style.css";
const OfficeScene = lazy(() => import("./OfficeScene"));
const CodeEditor = lazy(() => import("./CodeEditor"));
function restore() {
  try {
    const s = JSON.parse(localStorage.getItem("ux-junior:v1") || "null");
    if (
      s &&
      s.version === 1 &&
      typeof s.files?.["index.html"] === "string" &&
      typeof s.files?.["styles.css"] === "string"
    )
      return {
        files: { ...starterFiles, ...s.files } as Record<string, string>,
        progress: { ...emptyProgress, ...s.progress } as Progress,
      };
  } catch {}
  return { files: { ...starterFiles }, progress: { ...emptyProgress } };
}
function previewDocument(html: string, css: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll(
      "script,iframe,object,embed,link,meta,base,style,svg,math",
    )
    .forEach((n) => n.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const a of [...el.attributes])
      if (
        a.name.startsWith("on") ||
        ["src", "srcdoc", "href", "action", "formaction"].includes(a.name)
      )
        el.removeAttribute(a.name);
  });
  const script = `document.querySelector('form')?.addEventListener('submit',e=>{e.preventDefault();const p=document.getElementById('password');const out=document.getElementById('feedback');if(p&&p.value.length<8){if(out)out.textContent='La contraseña debe tener al menos 8 caracteres.';parent.postMessage({type:'forma-result',ok:false},'*')}else{if(out)out.textContent='Cuenta creada. Bienvenido a Forma.';parent.postMessage({type:'forma-result',ok:true},'*')}});`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-dXgtY3JpbWUtc2NlbmU=' ; form-action 'none'"><style>${css.replace(/<\/style/gi, "")}</style></head><body>${doc.body.innerHTML}<script nonce="dXgtY3JpbWUtc2NlbmU=">${script}</script></body></html>`;
}
const applications = [
  {
    id: "chat" as const,
    name: "Equipo",
    icon: MessageSquare,
    color: "#b8c58a",
  },
  { id: "browser" as const, name: "Chrome", icon: Globe, color: "#e4aa70" },
  { id: "editor" as const, name: "Code", icon: Code2, color: "#8fb6c6" },
  {
    id: "tickets" as const,
    name: "Tickets",
    icon: ClipboardList,
    color: "#c2a9d4",
  },
];
function App() {
  const [initial] = useState(restore);
  const browser = useBrowser();
  const pageTab = browser.current.page;
  const [files, setFiles] = useState(initial.files),
    [progress, setProgress] = useState(initial.progress),
    [screen, setScreen] = useState<"office" | "computer">("office"),
    [app, setApp] = useState<AppName>("chat"),
    [windows, setWindows] = useState<DesktopWindow[]>([]),
    [tutorial, setTutorial] = useState(() => {
      try {
        return localStorage.getItem("ux-tutorial:v2") === "done" ? 10 : 0;
      } catch {
        return 0;
      }
    }),
    [tutorialCollapsed, setTutorialCollapsed] = useState(false),
    [newFile, setNewFile] = useState(""),
    [fullScreen, setFullScreen] = useState(false),
    [interaction, setInteraction] = useState<"notebook" | "coffee" | null>(
      null,
    ),
    [activeFile, setActiveFile] = useState("index.html"),
    [draft, setDraft] = useState(initial.files["index.html"]),
    [server, setServer] = useState(false),
    [command, setCommand] = useState(""),
    [logs, setLogs] = useState([
      "Forma workspace / Terminal de desarrollo",
      "Escribe help si esto te suena a chino.",
    ]),
    [devtools, setDevtools] = useState(false),
    [url, setUrl] = useState("http://localhost:3000"),
    [revision, setRevision] = useState(0),
    [chatChannel, setChatChannel] = useState("bienvenida"),
    [channelMessages, setChannelMessages] = useState<Record<string, string[]>>(
      {},
    ),
    [chatSearch, setChatSearch] = useState(""),
    [chatInput, setChatInput] = useState(""),
    [editorMenu, setEditorMenu] = useState<string | null>(null),
    [showExplorer, setShowExplorer] = useState(true),
    [showTerminal, setShowTerminal] = useState(true),
    [toast, setToast] = useState(""),
    [sound, setSound] = useState(false),
    [finish, setFinish] = useState(false),
    [saved, setSaved] = useState(true),
    [help, setHelp] = useState(false);
  const chatLog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const log = chatLog.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [chatChannel, channelMessages]);
  const codeEditor = useRef<
    import("monaco-editor").editor.IStandaloneCodeEditor | null
  >(null);
  const frame = useRef<HTMLIFrameElement>(null),
    audio = useRef<AudioContext | null>(null),
    logEnd = useRef<HTMLDivElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = draft !== files[activeFile],
    valid = checkTicket(files["index.html"]).ok;
  function notify(s: string) {
    setToast(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 5000);
  }
  function ping() {
    if (!sound) return;
    try {
      const a = audio.current ?? (audio.current = new AudioContext());
      void a.resume();
      const o = a.createOscillator(),
        g = a.createGain();
      o.connect(g);
      g.connect(a.destination);
      o.frequency.value = 740;
      g.gain.setValueAtTime(0.035, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.12);
      o.start();
      o.stop(a.currentTime + 0.12);
    } catch {}
  }
  function mark(key: keyof Progress) {
    setProgress((p) => ({ ...p, [key]: true }));
  }
  useEffect(() => {
    try {
      localStorage.setItem(
        "ux-junior:v1",
        JSON.stringify({ version: 1, files, progress }),
      );
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [files, progress]);
  useEffect(() => {
    const output = logEnd.current?.parentElement;
    if (output) output.scrollTop = output.scrollHeight;
  }, [logs]);

  useEffect(() => {
    function message(e: MessageEvent) {
      if (
        e.source !== frame.current?.contentWindow ||
        e.data?.type !== "forma-result"
      )
        return;
      mark("reproduced");
      if (e.data.ok) {
        mark("registered");
        notify("Registro completado. Una comprobación menos.");
        ping();
      } else
        notify(
          "Has reproducido un error. Puedes volver a intentarlo con 8 caracteres.",
        );
    }
    window.addEventListener("message", message);
    return () => window.removeEventListener("message", message);
  }, [sound]);
  function save() {
    setFiles((p) => ({ ...p, [activeFile]: draft }));
    if (activeFile !== "README.md") {
      setProgress((p) => ({ ...p, tested: false, registered: false }));
      setRevision((v) => v + 1);
    }
    notify("Archivo guardado. El navegador usa esta versión.");
    ping();
  }
  function openComputer() {
    setScreen("computer");
    ping();
  }
  function interact(id: "computer" | "notebook" | "coffee") {
    if (id === "computer") openComputer();
    else setInteraction(id);
  }
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if (e.defaultPrevented || tutorial === 0) return;
      if (e.key === "Escape") {
        if (document.pointerLockElement || document.fullscreenElement) return;
        e.preventDefault();
        if (help) setHelp(false);
        else if (interaction) setInteraction(null);
        else if (finish) setFinish(false);
        else if (screen === "computer") setScreen("office");
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "s" &&
        screen === "computer" &&
        app === "editor"
      ) {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      void audio.current?.close();
    },
    [],
  );
  useEffect(() => {
    if (!interaction && !help && !finish && tutorial !== 0) return;
    const previous = document.activeElement as HTMLElement;
    const dialog = document.querySelector<HTMLElement>("[role=dialog]");
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab" || !dialog) return;
      const nodes = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a,input,textarea,[tabindex="0"]',
        ),
      );
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [interaction, help, finish, tutorial]);
  function run(e: React.FormEvent) {
    e.preventDefault();
    const result = terminalCommand(command, files);
    if (result.action === "clear") setLogs([]);
    else setLogs((p) => [...p, `junior@forma:~$ ${command}`, ...result.lines]);
    if (result.action === "start") {
      setServer(true);
      notify("Servidor listo. Abre Chrome para visitar la web.");
    }
    if (result.action === "test") {
      setProgress((p) => ({ ...p, tested: valid }));
      ping();
    }
    setCommand("");
  }
  function chooseFile(name: string) {
    if (
      dirty &&
      !window.confirm(
        "Hay cambios sin guardar. ¿Descartarlos para abrir otro archivo?",
      )
    )
      return;
    setActiveFile(name);
    setDraft(files[name]);
  }
  function deliver() {
    if (!canDeliver(progress, files["index.html"])) {
      setMessages((p) => [
        ...p,
        "MARTA · Antes de cerrar el ticket: reproduce el registro, inspecciona el correo, pasa npm test y comprueba que puedes crear una cuenta con la versión guardada.",
      ]);
      notify("Marta te ha pedido una última comprobación.");
      return;
    }
    mark("delivered");
    setMessages((p) => [
      ...p,
      "MARTA · Lo he revisado. Ahora el campo tiene una etiqueta y el registro funciona. Buen primer cambio. ¡Nos vemos en la daily!",
    ]);
    setFinish(true);
    ping();
  }
  const steps = [
    { done: progress.reproduced, text: "Reproducir el registro" },
    { done: progress.inspected, text: "Inspeccionar el correo" },
    { done: valid, text: "Guardar una etiqueta asociada" },
    { done: progress.tested, text: "Pasar npm test" },
    { done: progress.registered, text: "Comprobar el registro" },
    { done: progress.delivered, text: "Entregar al equipo" },
  ];

  useEffect(
    () => setUrl(browser.current.url),
    [browser.active, browser.current.url],
  );
  function act(action: WindowAction) {
    setWindows((ws) => windowAction(ws, action));
    if (action.type === "open" || action.type === "raise") setApp(action.id);
  }
  function openApp(id: AppName) {
    act({ type: "open", id });
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      notify(
        "El navegador no permite pantalla completa. El juego sigue ocupando toda la ventana.",
      );
    }
  }
  useEffect(() => {
    const change = () => setFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  useEffect(() => {
    const top = windows.filter((w) => !w.minimized).at(-1);
    if (top) setApp(top.id);
  }, [windows]);
  function skipTutorial() {
    setTutorial(10);
    try {
      localStorage.setItem("ux-tutorial:v2", "done");
    } catch {}
  }
  useEffect(() => {
    const conditions = [
      false,
      screen === "computer",
      windows.some((w) => w.id === "chat" && !w.minimized),
      server,
      progress.reproduced,
      progress.inspected,
      valid,
      progress.tested,
      progress.registered,
      progress.delivered,
    ];
    if (tutorial > 0 && tutorial < 10 && conditions[tutorial])
      setTutorial((v) => v + 1);
    if (tutorial === 10) {
      try {
        localStorage.setItem("ux-tutorial:v2", "done");
      } catch {}
    }
  }, [tutorial, screen, windows, server, progress, valid]);
  function tutorialAction() {
    if (tutorial === 0) {
      setTutorial(1);
      return;
    }
    if (tutorial === 1) {
      openComputer();
      return;
    }
    openComputer();
    const target: AppName =
      tutorial === 2 || tutorial === 9
        ? "chat"
        : [3, 6, 7].includes(tutorial)
          ? "editor"
          : "browser";
    openApp(target);
    if (tutorial === 6) chooseFile("index.html");
  }
  const messages = channelMessages[chatChannel] ?? [];
  function setMessages(update: (previous: string[]) => string[]) {
    setChannelMessages((previous) => ({
      ...previous,
      [chatChannel]: update(previous[chatChannel] ?? []),
    }));
  }
  const visibleChat = (text: string) =>
    !chatSearch.trim() ||
    text.toLowerCase().includes(chatSearch.trim().toLowerCase());
  function renderApplication(windowId: AppName) {
    return (
      <>
        {" "}
        {windowId === "chat" && (
          <div className="chat-layout slack-layout">
            <div className="slack-topbar">
              <MessageSquare size={19} />
              <label className="slack-search">
                <Search size={16} />
                <input
                  aria-label="Buscar en la conversación"
                  placeholder="Buscar en Forma"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                />
              </label>
              <button
                aria-label="Ayuda de Equipo"
                onClick={() =>
                  notify(
                    "Selecciona un canal o a Marta. Puedes enviar mensajes, pedir pistas y entregar tu cambio.",
                  )
                }
              >
                <HelpCircle size={19} />
              </button>
            </div>
            <nav className="slack-rail" aria-label="Espacios de trabajo">
              <span className="slack-workspace-icon">f</span>
              <button
                className="selected"
                onClick={() => setChatChannel("bienvenida")}
              >
                <MessageSquare size={21} />
                <span>Inicio</span>
              </button>
              <button onClick={() => setChatChannel("Marta")}>
                <Users size={21} />
                <span>Mensajes</span>
              </button>
              <button onClick={() => openApp("tickets")}>
                <Bell size={21} />
                <span>Actividad</span>
              </button>
              <span className="slack-self-avatar">
                J<i />
              </span>
            </nav>
            <aside className="chat-sidebar">
              <h2>
                Forma <ChevronDown size={16} />
              </h2>
              <div className="slack-workspace-caption">
                Tu equipo de producto
              </div>
              <span className="sidebar-heading">
                <ChevronDown size={13} /> Canales
              </span>
              {["bienvenida", "frontend", "random"].map((channel) => (
                <button
                  key={channel}
                  aria-label={channel}
                  aria-pressed={chatChannel === channel}
                  className={`channel ${chatChannel === channel ? "active" : ""}`}
                  onClick={() => {
                    setChatChannel(channel);
                    setChatSearch("");
                  }}
                >
                  <Hash size={16} />
                  {channel}
                  {channel === "bienvenida" && (
                    <span className="slack-channel-count">2</span>
                  )}
                </button>
              ))}
              <span className="sidebar-heading">
                <ChevronDown size={13} /> Mensajes directos
              </span>
              <button
                aria-label="Marta"
                aria-pressed={chatChannel === "Marta"}
                className={`channel ${chatChannel === "Marta" ? "active" : ""}`}
                onClick={() => {
                  setChatChannel("Marta");
                  setChatSearch("");
                }}
              >
                <span className="slack-dm-avatar">
                  M<i />
                </span>
                Marta
              </button>
              <div className="chat-profile">
                <span className="junior-avatar">J</span>
                <div>
                  Junior
                  <small>
                    <span className="green-dot" /> Disponible
                  </small>
                </div>
              </div>
            </aside>
            <section className="chat-main">
              <div className="chat-heading">
                <div>
                  <b>
                    {chatChannel === "Marta" ? (
                      <span className="green-dot" />
                    ) : (
                      <Hash size={20} />
                    )}{" "}
                    {chatChannel}
                  </b>
                  <span>
                    {chatChannel === "bienvenida"
                      ? "Tu primer día. Estamos contigo."
                      : chatChannel === "frontend"
                        ? "Código, preguntas y pequeñas victorias."
                        : chatChannel === "random"
                          ? "La pausa del café también cuenta."
                          : "Product lead · En línea"}
                  </span>
                </div>
                <span className="slack-members">
                  <Users size={16} /> {chatChannel === "Marta" ? 2 : 4}
                </span>
              </div>
              <div className="chat-messages" ref={chatLog} aria-live="polite">
                <div className="date-rule">
                  <span>Lunes · Tu primer día</span>
                </div>
                {(chatChannel === "bienvenida" || chatChannel === "Marta") &&
                  visibleChat(
                    "Marta Bienvenido Forma registro correo UX-001",
                  ) && (
                    <div className="message">
                      <span className="marta-avatar">M</span>
                      <div>
                        <b>
                          Marta <small>09:05</small>
                          <span>PRODUCT LEAD</span>
                        </b>
                        <p>
                          ¡Bienvenido a Forma! 🎉 Ya tienes tu ordenador
                          preparado.
                        </p>
                        <p>
                          Para empezar te dejamos algo sencillito: hay gente que
                          no termina el registro. El campo de correo es un poco…
                          misterioso.
                        </p>
                        <p>
                          ¿Puedes reproducirlo, revisar qué pasa y dejarlo
                          mejor? Sin prisa. Bueno, tenemos daily después 🙂
                        </p>
                        <button
                          className="ticket-attachment"
                          onClick={() => openApp("tickets")}
                        >
                          <ClipboardList size={19} />
                          <div>
                            <b>UX-001 · El misterio del registro</b>
                            <span>Ver encargo y criterios de aceptación</span>
                          </div>
                          <ArrowUpRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                {chatChannel === "bienvenida" &&
                  visibleChat(
                    "Nico proyecto Code terminal npm run dev Chrome README",
                  ) && (
                    <div className="message">
                      <span className="colleague-avatar">N</span>
                      <div>
                        <b>
                          Nico <small>09:07</small>
                          <span>FRONTEND</span>
                        </b>
                        <p>
                          El proyecto está en Code. Terminal →{" "}
                          <code>npm run dev</code>. Después lo ves en Chrome. Si
                          te pierdes, el README tiene un mapa.
                        </p>
                      </div>
                    </div>
                  )}
                {chatChannel === "frontend" &&
                  visibleChat("Nico frontend terminal npm run dev") && (
                    <div className="message">
                      <span className="colleague-avatar">N</span>
                      <div>
                        <b>
                          Nico <small>09:07</small>
                        </b>
                        <p>
                          ¡Bienvenido al canal de frontend! Arranca el proyecto
                          con <code>npm run dev</code> en VS Code. Aquí puedes
                          preguntar por el terminal o por las etiquetas HTML.
                        </p>
                      </div>
                    </div>
                  )}
                {chatChannel === "random" &&
                  visibleChat("Marta café pausa") && (
                    <div className="message">
                      <span className="marta-avatar">M</span>
                      <div>
                        <b>
                          Marta <small>09:10</small>
                        </b>
                        <p>
                          El café es gratis ☕. La paciencia también. Acuérdate
                          de hacer una pausa entre bugs.
                        </p>
                      </div>
                    </div>
                  )}
                {messages.filter(visibleChat).map((m, i) => (
                  <div className="message reply" key={i}>
                    <span
                      className={
                        m.startsWith("TÚ")
                          ? "junior-avatar"
                          : m.startsWith("NICO")
                            ? "colleague-avatar"
                            : "marta-avatar"
                      }
                    >
                      {m.startsWith("TÚ")
                        ? "J"
                        : m.startsWith("NICO")
                          ? "N"
                          : "M"}
                    </span>
                    <div>
                      <b>
                        {m.startsWith("TÚ")
                          ? "Tú"
                          : m.startsWith("NICO")
                            ? "Nico"
                            : "Marta"}
                        <small>09:12</small>
                      </b>
                      <p>{m.slice(m.indexOf(" · ") + 3)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-compose">
                <form
                  className="chat-message-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = chatInput.trim();
                    if (!text) return;
                    const answer = /label|etiqueta|correo/i.test(text)
                      ? 'NICO · La etiqueta necesita for="email", igual que el id del campo. Tienes un ejemplo en la documentación de Chrome.'
                      : /terminal|arranc|servidor/i.test(text)
                        ? "NICO · En VS Code, escribe npm run dev en el terminal. Luego abre localhost:3000 en Chrome."
                        : /hola|buenas/i.test(text)
                          ? "MARTA · ¡Hola! Bienvenido. Tienes el encargo UX-001 en Tickets."
                          : /entreg|termin|listo/i.test(text)
                            ? "MARTA · Genial. Usa Entregar cambio para que pueda revisar las comprobaciones."
                            : "MARTA · Reproduce el registro y revisa el correo con DevTools. Si necesitas algo concreto, pregunta por la etiqueta o el terminal.";
                    setMessages((p) => [...p, "TÚ · " + text, answer]);
                    setChatInput("");
                  }}
                >
                  <div className="slack-compose-label">
                    Mensaje a{" "}
                    {chatChannel === "Marta" ? "Marta" : "#" + chatChannel}
                  </div>
                  <input
                    aria-label="Mensaje al equipo"
                    placeholder={`Escribe a ${chatChannel === "Marta" ? "Marta" : "#" + chatChannel}…`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <div className="slack-compose-bottom">
                    <span>
                      <Plus size={15} /> Enter para enviar
                    </span>
                    <button
                      aria-label="Enviar mensaje"
                      type="submit"
                      disabled={!chatInput.trim()}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
                <span>Acciones del primer día</span>
                <div>
                  <button
                    onClick={() =>
                      setMessages((p) => [
                        ...p,
                        "TÚ · ¿Por dónde empiezo?",
                        "MARTA · Abre Code, inicia la web con npm run dev y prueba un registro. En Chrome puedes abrir DevTools para investigar el correo.",
                      ])
                    }
                  >
                    <HelpCircle size={14} /> No sé por dónde empezar
                  </button>
                  <button
                    onClick={() =>
                      setMessages((p) => [
                        ...p,
                        "TÚ · ¿Qué significa asociar una etiqueta?",
                        'NICO · El atributo for de un label debe coincidir con el id del input. Para este campo: for="email". Es HTML, no magia negra.',
                      ])
                    }
                  >
                    Pedir una pista
                  </button>
                  <button className="lime-button" onClick={deliver}>
                    <Send size={14} /> Entregar cambio
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
        {windowId === "editor" && (
          <div className="vscode-application">
            <div className="vscode-menubar">
              <Code2 size={17} />
              {[
                ["file", "Archivo"],
                ["edit", "Editar"],
                ["view", "Ver"],
                ["terminal", "Terminal"],
                ["help", "Ayuda"],
              ].map(([id, name]) => (
                <div className="editor-menu" key={id}>
                  <button
                    onClick={() => setEditorMenu(editorMenu === id ? null : id)}
                  >
                    {name}
                  </button>
                  {editorMenu === id && (
                    <div className="editor-menu-items">
                      {id === "file" ? (
                        <>
                          <button
                            onClick={() => {
                              openApp("files");
                              setEditorMenu(null);
                            }}
                          >
                            Nuevo archivo…
                          </button>
                          <button
                            onClick={() => {
                              save();
                              setEditorMenu(null);
                            }}
                          >
                            Guardar <kbd>Ctrl+S</kbd>
                          </button>
                          <button
                            onClick={() => {
                              act({ type: "close", id: "editor" });
                              setEditorMenu(null);
                            }}
                          >
                            Cerrar ventana
                          </button>
                        </>
                      ) : id === "edit" ? (
                        <>
                          <button
                            onClick={() => {
                              codeEditor.current?.trigger("menu", "undo", null);
                              setEditorMenu(null);
                            }}
                          >
                            Deshacer <kbd>Ctrl+Z</kbd>
                          </button>
                          <button
                            onClick={() => {
                              codeEditor.current?.trigger("menu", "redo", null);
                              setEditorMenu(null);
                            }}
                          >
                            Rehacer <kbd>Ctrl+Y</kbd>
                          </button>
                          <button
                            onClick={() => {
                              void codeEditor.current
                                ?.getAction("actions.find")
                                ?.run();
                              setEditorMenu(null);
                            }}
                          >
                            Buscar <kbd>Ctrl+F</kbd>
                          </button>
                        </>
                      ) : id === "view" ? (
                        <>
                          <button
                            onClick={() => {
                              setShowExplorer((v) => !v);
                              setEditorMenu(null);
                            }}
                          >
                            Mostrar / ocultar explorador
                          </button>
                          <button
                            onClick={() => {
                              setShowTerminal((v) => !v);
                              setEditorMenu(null);
                            }}
                          >
                            Mostrar / ocultar terminal
                          </button>
                        </>
                      ) : id === "terminal" ? (
                        <>
                          <button
                            onClick={() => {
                              setShowTerminal(true);
                              setEditorMenu(null);
                              setTimeout(
                                () =>
                                  document.getElementById("command")?.focus(),
                                0,
                              );
                            }}
                          >
                            Mostrar terminal
                          </button>
                          <button
                            onClick={() => {
                              setLogs([]);
                              setEditorMenu(null);
                            }}
                          >
                            Limpiar terminal
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setTutorial(3);
                            setTutorialCollapsed(false);
                            setEditorMenu(null);
                          }}
                        >
                          Abrir guía del primer día
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button className="menu-save" onClick={save}>
                <Save size={12} />
                Guardar
              </button>
            </div>
            <div className="editor-layout">
              <aside
                className="editor-sidebar"
                style={{ display: showExplorer ? undefined : "none" }}
              >
                <div className="editor-activity">
                  <Code2 size={21} />
                  <Search size={19} />
                  <Folder size={19} />
                </div>
                <div className="file-tree">
                  <span>EXPLORADOR</span>
                  <b>
                    <ChevronRight size={12} /> FORMA-WEB
                  </b>
                  {Object.keys(files).map((f) => (
                    <button
                      key={f}
                      className={activeFile === f ? "active" : ""}
                      onClick={() => chooseFile(f)}
                    >
                      {f.endsWith(".md") ? (
                        <FileText size={13} />
                      ) : (
                        <FileCode size={13} />
                      )}{" "}
                      {f}
                    </button>
                  ))}
                  <div className="editor-tip">
                    Un archivo guardado
                    <br />
                    es un cambio real.
                    <br />
                    <span>Ctrl / ⌘ + S</span>
                  </div>
                </div>
              </aside>
              <div className="editor-main">
                <div className="editor-tabs">
                  <span>
                    <FileCode size={13} />
                    {activeFile} {dirty && "●"}
                  </span>
                  <button onClick={save}>
                    <Save size={13} /> Guardar
                  </button>
                </div>
                <div className="editor-path">
                  forma-web <ChevronRight size={11} /> {activeFile}
                </div>
                <div className="code-area">
                  <Suspense
                    fallback={
                      <div className="editor-loading">Abriendo VS Code…</div>
                    }
                  >
                    <CodeEditor
                      file={activeFile}
                      value={draft}
                      onChange={setDraft}
                      onSave={save}
                      onReady={(editor) => (codeEditor.current = editor)}
                    />
                  </Suspense>
                </div>
                <div
                  className="terminal-pane"
                  style={{ display: showTerminal ? undefined : "none" }}
                >
                  <div className="terminal-tabs">
                    <span>PROBLEMAS</span>
                    <b>TERMINAL</b>
                    <span>OUTPUT</span>
                    <Terminal size={13} />
                  </div>
                  <div className="terminal-output">
                    {logs.map((l, i) => (
                      <div
                        key={i}
                        className={
                          l.includes("PASS")
                            ? "pass"
                            : l.startsWith("junior@")
                              ? "prompt"
                              : ""
                        }
                      >
                        {l}
                      </div>
                    ))}
                    <div ref={logEnd} />
                  </div>
                  <form className="terminal-input" onSubmit={run}>
                    <label htmlFor="command">junior@forma:~$</label>
                    <input
                      id="command"
                      aria-label="Comando del terminal"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button type="submit" aria-label="Ejecutar comando">
                      <ArrowRight size={13} />
                    </button>
                  </form>
                </div>
                <div className="editor-status">
                  <span>
                    main* <span>✓ HTML</span>
                  </span>
                  <span>
                    {dirty ? "SIN GUARDAR" : "GUARDADO"} · UTF-8 ·{" "}
                    {activeFile.endsWith(".css")
                      ? "CSS"
                      : activeFile.endsWith(".md")
                        ? "Markdown"
                        : "HTML"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {windowId === "browser" && (
          <div className="browser-layout">
            <div className="browser-tabs">
              {browser.tabs.map((tab) => {
                const page = pageFor(tab.history[tab.index]);
                return (
                  <div
                    key={tab.id}
                    className={`chrome-tab ${browser.active === tab.id ? "active" : ""}`}
                  >
                    <button onClick={() => browser.select(tab.id)}>
                      <Globe size={12} />
                      {page === "site"
                        ? "Forma · Registro"
                        : page === "guide"
                          ? "HTML: etiquetas"
                          : page === "new"
                            ? "Nueva pestaña"
                            : "Página no disponible"}
                    </button>
                    <button
                      aria-label={`Cerrar pestaña ${page === "site" ? "Forma" : page === "guide" ? "Documentación" : tab.id}`}
                      onClick={() => browser.close(tab.id)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              <button
                className="chrome-new-tab"
                aria-label="Nueva pestaña"
                onClick={() => browser.newTab()}
              >
                +
              </button>
            </div>
            <div className="address-bar">
              <button
                aria-label="Atrás"
                disabled={browser.current.index === 0}
                onClick={() => browser.history(-1)}
              >
                <ArrowLeft size={15} />
              </button>
              <button
                aria-label="Adelante"
                disabled={
                  browser.current.index === browser.current.history.length - 1
                }
                onClick={() => browser.history(1)}
              >
                <ArrowRight size={15} />
              </button>
              <button
                aria-label="Recargar navegador"
                onClick={() => {
                  setRevision((v) => v + 1);
                  notify("Página recargada con los archivos guardados.");
                }}
              >
                <RefreshCw size={14} />
              </button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  browser.navigate(url);
                }}
              >
                <Lock size={11} />
                <input
                  aria-label="Dirección del navegador"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </form>
              <button
                className={devtools ? "devtools-on" : ""}
                onClick={() => setDevtools((v) => !v)}
              >
                <Code2 size={14} /> DevTools
              </button>
            </div>
            <div className="browser-body">
              <div className="web-content">
                {server && (
                  <iframe
                    key={revision}
                    ref={frame}
                    title="Web ficticia de Forma"
                    sandbox="allow-scripts allow-forms"
                    style={{ display: pageTab === "site" ? "block" : "none" }}
                    srcDoc={previewDocument(
                      files["index.html"],
                      files["styles.css"],
                    )}
                  />
                )}
                {pageTab === "new" ? (
                  <div className="chrome-start">
                    <h2>
                      <span>G</span>
                      <span>o</span>
                      <span>o</span>
                      <span>g</span>
                      <span>l</span>
                      <span>e</span>
                    </h2>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        browser.navigate(url);
                      }}
                    >
                      <Search size={17} />
                      <input
                        aria-label="Buscar o escribir una dirección"
                        placeholder="Buscar o escribir una dirección"
                        value={url === "chrome://newtab" ? "" : url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </form>
                    <button
                      onClick={() => browser.navigate("http://localhost:3000")}
                    >
                      <Globe size={21} />
                      Forma · localhost:3000
                    </button>
                  </div>
                ) : pageTab === "error" ? (
                  <div className="connection-error">
                    <Globe size={42} />
                    <h2>No se puede acceder a este sitio.</h2>
                    <p>
                      Esta dirección no está disponible en el ordenador del
                      juego.
                    </p>
                    <code>ERR_NAME_NOT_RESOLVED</code>
                    <button
                      className="lime-button"
                      onClick={() => browser.navigate("http://localhost:3000")}
                    >
                      Abrir proyecto local
                    </button>
                  </div>
                ) : pageTab === "guide" ? (
                  <div className="docs">
                    <span className="eyebrow">
                      FORMA / MANUAL DE SUPERVIVENCIA
                    </span>
                    <h2>Un input no se presenta solo.</h2>
                    <p>
                      El placeholder es una pista temporal: al escribir
                      desaparece. La etiqueta permanece y le da un nombre al
                      campo.
                    </p>
                    <pre>
                      {
                        '<label for="email">Correo electrónico</label>\n<input id="email" type="email">'
                      }
                    </pre>
                    <p>
                      <code>for</code> e <code>id</code> deben coincidir. Guarda
                      en Code y vuelve a comprobarlo aquí.
                    </p>
                    <button
                      className="lime-button"
                      onClick={() => openApp("editor")}
                    >
                      Volver al editor <ArrowUpRight size={14} />
                    </button>
                  </div>
                ) : server ? (
                  <></>
                ) : (
                  <div className="connection-error">
                    <Globe size={42} />
                    <h2>No se puede acceder a este sitio.</h2>
                    <p>localhost ha rechazado la conexión.</p>
                    <code>ERR_CONNECTION_REFUSED</code>
                    <p>
                      El servidor no está iniciado. Abre Code y ejecuta{" "}
                      <b>npm run dev</b> en el terminal.
                    </p>
                    <button
                      onClick={() => openApp("editor")}
                      className="lime-button"
                    >
                      Abrir Code <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
              {devtools && (
                <aside className="devtools">
                  <div>
                    <b>ELEMENTS</b>
                    <span>ACCESSIBILITY</span>
                    <button
                      aria-label="Cerrar DevTools"
                      onClick={() => setDevtools(false)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <p>INSPECTOR DE LA ESCENA</p>
                  <button
                    onClick={() => {
                      if (!server) {
                        notify(
                          "Inicia el servidor antes de inspeccionar la web.",
                        );
                        return;
                      }
                      mark("inspected");
                      notify(
                        "Campo inspeccionado. Revisa su nombre accesible y su etiqueta.",
                      );
                    }}
                  >
                    <Search size={14} /> Inspeccionar correo
                  </button>
                  {progress.inspected && (
                    <>
                      <pre>
                        {
                          '<input id="email"\n  type="email"\n  placeholder="Correo…">'
                        }
                      </pre>
                      <dl>
                        <dt>Role</dt>
                        <dd>textbox</dd>
                        <dt>Etiqueta asociada</dt>
                        <dd className={valid ? "good" : "bad"}>
                          {valid ? "Correo electrónico" : "No encontrada"}
                        </dd>
                        <dt>Nombre accesible</dt>
                        <dd>
                          {valid
                            ? "Texto de la etiqueta"
                            : "Solo placeholder (frágil)"}
                        </dd>
                      </dl>
                      <p className="devtools-note">
                        El placeholder desaparece al escribir. ¿Qué le falta al
                        campo?
                      </p>
                      <button
                        onClick={() => {
                          browser.openPage("guide");
                        }}
                      >
                        <BookOpen size={13} /> Consultar documentación
                      </button>
                    </>
                  )}
                </aside>
              )}
            </div>
          </div>
        )}
        {windowId === "tickets" && (
          <div className="tickets-layout">
            <aside>
              <h2>
                Trabajo<span>Tu cola de hoy</span>
              </h2>
              <button className="ticket-nav">
                <span className="green-dot" /> UX-001 <ChevronRight size={14} />
              </button>
              <div className="next-ticket">
                <Lock size={16} />
                <span>
                  Día 02
                  <br />
                  <small>Próximamente</small>
                </span>
              </div>
            </aside>
            <section className="ticket-detail">
              <div className="ticket-meta">
                UX-001{" "}
                <span>{progress.delivered ? "COMPLETADO" : "EN CURSO"}</span>
                <b>P2 · ONBOARDING</b>
              </div>
              <h2>El misterio del registro.</h2>
              <p>
                Al escribir el correo, desaparece la única indicación de qué es
                ese campo. Las personas pierden el contexto. Necesitamos una
                etiqueta visible y asociada, conservando el registro.
              </p>
              <div className="ticket-author">
                <span className="marta-avatar">M</span>
                <span>
                  Asignado por Marta <b>→ Tú</b>
                </span>
              </div>
              <h3>Antes de entregar</h3>
              <div className="checklist">
                {steps.map((s) => (
                  <div key={s.text}>
                    <span className={s.done ? "checked" : ""}>
                      {s.done ? <Check size={12} /> : null}
                    </span>
                    {s.text}
                  </div>
                ))}
              </div>
              <div className="scope-note">
                <BookOpen size={17} />
                <p>
                  No hay que reescribir la aplicación. Encuentra el cambio más
                  pequeño que resuelva el problema.
                </p>
              </div>
              <button
                className="lime-button"
                onClick={() => {
                  openApp("chat");
                  deliver();
                }}
              >
                Entregar al equipo <Send size={14} />
              </button>
            </section>
          </div>
        )}
        {windowId === "files" && (
          <div className="file-manager">
            <div className="files-toolbar">
              <Folder size={18} />
              <span>Este equipo / Proyectos / forma-web</span>
              <button
                onClick={() => {
                  chooseFile(activeFile);
                  openApp("editor");
                }}
              >
                <Code2 size={14} /> Abrir en VS Code
              </button>
            </div>
            <div className="file-manager-body">
              <aside>
                <b>Acceso rápido</b>
                <span>Escritorio</span>
                <span>Documentos</span>
                <span className="active">forma-web</span>
              </aside>
              <section>
                <div className="files-column-head">
                  <span>Nombre</span>
                  <span>Tipo</span>
                  <span>Tamaño</span>
                </div>
                {Object.entries(files).map(([name, text]) => (
                  <button
                    key={name}
                    className={activeFile === name ? "selected-file" : ""}
                    onClick={() => chooseFile(name)}
                    onDoubleClick={() => {
                      chooseFile(name);
                      openApp("editor");
                    }}
                  >
                    <span>
                      <FileCode size={17} />
                      {name}
                    </span>
                    <span>{name.split(".").at(-1)?.toUpperCase()}</span>
                    <span>{new TextEncoder().encode(text).length} B</span>
                  </button>
                ))}
                <form
                  className="new-file"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = newFile.trim();
                    if (
                      !/^[a-zA-Z0-9_-]+\.(html|css|md|txt)$/.test(name) ||
                      name in files
                    ) {
                      notify(
                        "Usa un nombre nuevo terminado en .html, .css, .md o .txt.",
                      );
                      return;
                    }
                    setFiles((p) => ({ ...p, [name]: "" }));
                    setNewFile("");
                    notify("Archivo creado en forma-web.");
                  }}
                >
                  <input
                    aria-label="Nombre del nuevo archivo"
                    value={newFile}
                    onChange={(e) => setNewFile(e.target.value)}
                    placeholder="notas.txt"
                  />
                  <button type="submit">Nuevo archivo</button>
                </form>
                <div className="file-preview">
                  <span>VISTA PREVIA · {activeFile}</span>
                  <pre>{files[activeFile]}</pre>
                </div>
              </section>
            </div>
          </div>
        )}
      </>
    );
  }
  return (
    <div
      className={`game ${screen} ${tutorial > 0 && tutorial < 10 && !tutorialCollapsed ? "with-tutorial" : ""}`}
    >
      <header className="game-header">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setScreen("office");
          }}
        >
          UX CRIME SCENE<span>THE JUNIOR FILES</span>
        </a>
        <div className="day-pill">
          <span /> DÍA 01 <i /> TU PRIMER TRABAJO
        </div>
        <div className="header-actions">
          <button
            aria-label={
              fullScreen ? "Salir de pantalla completa" : "Pantalla completa"
            }
            onClick={toggleFullscreen}
          >
            <Maximize2 size={17} />
          </button>
          <button
            aria-label="Repetir tutorial"
            onClick={() => {
              setTutorial(0);
              setTutorialCollapsed(false);
            }}
          >
            <BookOpen size={17} />
          </button>
          <button
            aria-label={sound ? "Desactivar sonido" : "Activar sonido"}
            onClick={() => setSound((v) => !v)}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button aria-label="Ayuda" onClick={() => setHelp(true)}>
            <HelpCircle size={17} />
          </button>
          <span className="junior-avatar">J</span>
        </div>
      </header>
      {screen === "office" ? (
        <main className="office-layout">
          <div className="office-heading">
            <div>
              <span className="eyebrow">LUNES, 09:07 · ESTUDIO FORMA</span>
              <h1>
                Finge que sabes
                <br />
                lo que estás haciendo<span>.</span>
              </h1>
              <p>Un escritorio nuevo. Un ticket «sencillito». Cero contexto.</p>
            </div>
            <div className="employee-card">
              <span>ACCESO DE EMPLEADO</span>
              <b>Junior Designer</b>
              <small>Experiencia: pendiente de demostrar</small>
              <div>
                <Briefcase size={15} /> PRIMER DÍA <span>001</span>
              </div>
            </div>
          </div>
          <div className="office-board">
            <div className="board-label">
              <span className="green-dot" /> OFICINA / PRIMERA PERSONA{" "}
              <span>EXPLORACIÓN 3D</span>
            </div>
            <Suspense
              fallback={
                <div className="scene-loading">Preparando la oficina…</div>
              }
            >
              <OfficeScene
                onInteract={interact}
                paused={!!interaction || help || finish || tutorial === 0}
              />
            </Suspense>
          </div>
          <div className="office-bottom">
            <div
              className="incoming-message"
              onClick={() => {
                openComputer();
                openApp("chat");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  openComputer();
                  openApp("chat");
                }
              }}
            >
              <span className="marta-avatar">M</span>
              <div>
                <span>
                  MARTA · PRODUCT LEAD <small>09:05</small>
                </span>
                <p>«¡Bienvenido! Te dejamos algo sencillito para empezar 🙂»</p>
              </div>
              <ArrowUpRight size={19} />
            </div>
            <div className="first-mission">
              <ClipboardList size={20} />
              <div>
                <span>PRIMER ENCARGO</span>
                <p>El misterio del registro</p>
              </div>
              <span className="priority">P2</span>
            </div>
          </div>
          <footer>
            <span>
              {saved ? "GUARDADO LOCAL ACTIVO" : "GUARDADO NO DISPONIBLE"} <i />{" "}
              SIN DATOS REALES
            </span>
            <span>No hace falta saberlo todo. Hace falta empezar.</span>
          </footer>
        </main>
      ) : (
        <main className="computer-layout">
          <Desktop
            windows={windows}
            onAction={act}
            renderApp={renderApplication}
            dirty={dirty}
            onOffice={() => setScreen("office")}
            onFullscreen={toggleFullscreen}
            onHelp={() => {
              setTutorial(0);
              setTutorialCollapsed(false);
            }}
          />
        </main>
      )}
      <Tutorial
        step={tutorial}
        onAction={tutorialAction}
        onSkip={skipTutorial}
        collapsed={tutorialCollapsed}
        onCollapse={() => setTutorialCollapsed((v) => !v)}
      />
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          {toast}
          <button aria-label="Cerrar aviso" onClick={() => setToast("")}>
            <X size={13} />
          </button>
        </div>
      )}
      {(interaction || help || finish) && (
        <div className="modal-backdrop">
          <section
            className="game-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              finish
                ? "Primera jornada completada"
                : help
                  ? "Cómo jugar"
                  : interaction === "coffee"
                    ? "Pausa para café"
                    : "Libreta de bienvenida"
            }
          >
            <button
              className="modal-close"
              aria-label="Cerrar"
              autoFocus
              onClick={() => {
                setInteraction(null);
                setHelp(false);
                setFinish(false);
              }}
            >
              <X size={19} />
            </button>
            {finish ? (
              <>
                <span className="stamp">FIRST DAY SURVIVED</span>
                <span className="eyebrow">UX-001 / COMPLETADO</span>
                <h2>
                  No sabías hacerlo.
                  <br />
                  Ahora sabes un poco más.
                </h2>
                <p>
                  Reprodujiste el problema, encontraste su causa, editaste el
                  proyecto y comprobaste tu cambio. Eso también es trabajar.
                </p>
                <div className="learning">
                  <CheckCircle2 />
                  <span>
                    HABILIDAD DESBLOQUEADA<b>Etiquetas y nombres accesibles</b>
                  </span>
                </div>
                <p className="small-print">
                  Primera jornada del prototipo completada. Los siguientes días
                  todavía no están implementados.
                </p>
                <button
                  className="lime-button"
                  onClick={() => {
                    setFinish(false);
                    setScreen("office");
                  }}
                >
                  Volver a la oficina <ArrowRight size={15} />
                </button>
              </>
            ) : help ? (
              <>
                <span className="eyebrow">MANUAL DEL JUNIOR</span>
                <h2>No necesitas saberlo de antemano.</h2>
                <p>
                  Muévete con WASD o flechas. E interactúa con el objeto
                  cercano. También puedes hacer clic en los objetos.
                </p>
                <p>
                  En el ordenador: lee el chat, abre Code, ejecuta npm run dev y
                  prueba la web en Chrome. DevTools y la documentación te ayudan
                  a entender el problema.
                </p>
                <p>
                  Edita index.html, guarda, ejecuta npm test y verifica el
                  registro. Después entrega el cambio en el chat.
                </p>
                <p>
                  Esc vuelve a la oficina. Ctrl / ⌘ + S guarda cuando escribes
                  en el editor.
                </p>
              </>
            ) : interaction === "notebook" ? (
              <>
                <span className="eyebrow">NOTA DEL JUNIOR ANTERIOR</span>
                <h2>
                  Si estás leyendo esto:
                  <br />
                  vas bien.
                </h2>
                <p>
                  1. Lee el ticket. Dos veces.
                  <br />
                  2. Reproduce lo que dicen que falla.
                  <br />
                  3. Pregunta cuando no entiendas algo.
                  <br />
                  4. Haz un cambio pequeño.
                  <br />
                  5. Comprueba que no has roto el resto.
                </p>
                <blockquote>
                  «No confundas no saber con no poder aprender.»
                </blockquote>
                <button
                  className="lime-button"
                  onClick={() => {
                    setInteraction(null);
                    openComputer();
                  }}
                >
                  Vale. Al ordenador <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <>
                <Coffee size={42} className="coffee-icon" />
                <span className="eyebrow">PAUSA ESTRATÉGICA</span>
                <h2>Un café. Y respira.</h2>
                <p>
                  Oyes a Marta en su llamada: «Lo de sencillito es relativo. Que
                  pregunte si necesita ayuda».
                </p>
                <p>
                  Tu energía no es una barra que se agota. Puedes investigar a
                  tu ritmo.
                </p>
                <button
                  className="lime-button"
                  onClick={() => {
                    setInteraction(null);
                    notify(
                      "Café obtenido. Conocimientos de JavaScript: sin cambios.",
                    );
                    ping();
                  }}
                >
                  Volver al trabajo <ArrowRight size={15} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
