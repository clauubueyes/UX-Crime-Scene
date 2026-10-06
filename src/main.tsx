import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
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
import "./style.css";
type AppName = "chat" | "browser" | "editor" | "tickets";
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
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-forma'; form-action 'none'"><style>${css.replace(/<\/style/gi, "")}</style></head><body>${doc.body.innerHTML}<script nonce="forma">${script}</script></body></html>`;
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
  const [files, setFiles] = useState(initial.files),
    [progress, setProgress] = useState(initial.progress),
    [screen, setScreen] = useState<"office" | "computer">("office"),
    [app, setApp] = useState<AppName>("chat"),
    [position, setPosition] = useState({ x: 54, y: 76 }),
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
    [pageTab, setPageTab] = useState<"site" | "guide">("site"),
    [revision, setRevision] = useState(0),
    [messages, setMessages] = useState<string[]>([]),
    [toast, setToast] = useState(""),
    [sound, setSound] = useState(false),
    [finish, setFinish] = useState(false),
    [saved, setSaved] = useState(true),
    [help, setHelp] = useState(false);
  const keys = useRef(new Set<string>()),
    frame = useRef<HTMLIFrameElement>(null),
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
    logEnd.current?.scrollIntoView({ block: "nearest" });
  }, [logs, app]);
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
  });
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
    keys.current.clear();
    setScreen("computer");
    ping();
  }
  const objects = [
    {
      id: "computer",
      x: 54,
      y: 62,
      name: "Tu ordenador",
      hint: "El primer ticket te está esperando.",
    },
    {
      id: "notebook",
      x: 25,
      y: 69,
      name: "Libreta de bienvenida",
      hint: "Quizá alguien dejó instrucciones.",
    },
    {
      id: "coffee",
      x: 80,
      y: 66,
      name: "La máquina de café",
      hint: "Una pausa también cuenta como trabajar.",
    },
  ];
  const nearest = objects
    .map((o) => ({ ...o, d: Math.hypot(position.x - o.x, position.y - o.y) }))
    .sort((a, b) => a.d - b.d)[0];
  function interact(id: string) {
    if (id === "computer") openComputer();
    else setInteraction(id as "notebook" | "coffee");
  }
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (help) setHelp(false);
        else if (interaction) setInteraction(null);
        else if (finish) setFinish(false);
        else if (screen === "computer") setScreen("office");
        return;
      }
      if ((e.target as HTMLElement).closest("input,textarea,select")) {
        if (e.key === "s" && (e.ctrlKey || e.metaKey) && app === "editor") {
          e.preventDefault();
          save();
        }
        return;
      }
      if (screen !== "office" || interaction || help) return;
      const k = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(k)
      ) {
        e.preventDefault();
        keys.current.add(k);
      }
      if (k === "e" && nearest.d < 17) {
        e.preventDefault();
        interact(nearest.id);
      }
    }
    function up(e: KeyboardEvent) {
      keys.current.delete(e.key.toLowerCase());
    }
    function blur() {
      keys.current.clear();
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  });
  useEffect(() => {
    if (screen !== "office" || interaction || help) return;
    let id: number,
      last = 0;
    function tick(t: number) {
      const dt = Math.min((t - last) / 1000, 0.04);
      last = t;
      const k = keys.current;
      let dx =
          Number(k.has("d") || k.has("arrowright")) -
          Number(k.has("a") || k.has("arrowleft")),
        dy =
          Number(k.has("s") || k.has("arrowdown")) -
          Number(k.has("w") || k.has("arrowup"));
      if (dx || dy) {
        const m = Math.hypot(dx, dy);
        setPosition((p) => ({
          x: Math.max(12, Math.min(88, p.x + (dx / m) * dt * 23)),
          y: Math.max(61, Math.min(86, p.y + (dy / m) * dt * 23)),
        }));
      }
      id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      keys.current.clear();
    };
  }, [screen, interaction, help]);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      void audio.current?.close();
    },
    [],
  );
  useEffect(() => {
    if (!interaction && !help && !finish) return;
    keys.current.clear();
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
  }, [interaction, help, finish]);
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
  return (
    <div className={`game ${screen}`}>
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
              <span className="green-dot" /> OFICINA / PLANTA 01{" "}
              <span>EXPLORACIÓN LIBRE</span>
            </div>
            <div className="room">
              <div className="back-wall">
                <div className="window">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="wall-sign">
                  forma<span>make things make sense.</span>
                </div>
                <div className="clock">
                  <i />
                </div>
                <div className="poster">
                  GOOD
                  <br />
                  THINGS
                  <br />
                  <em>take time.</em>
                </div>
              </div>
              <div className="floor" />
              <div className="rug" />
              <div className="plant plant-one">
                <i />
                <i />
                <i />
                <span />
              </div>
              <div className="plant plant-two">
                <i />
                <i />
                <i />
                <span />
              </div>
              <div className="colleague-desk">
                <div className="tiny-monitor" />
                <div className="desk-surface" />
                <div className="colleague-person">
                  <i />
                  <span />
                </div>
                <span className="colleague-label">MARTA · EN UNA CALL</span>
              </div>
              <button
                className={`office-object main-desk ${nearest.id === "computer" && nearest.d < 17 ? "near" : ""}`}
                onClick={() => {
                  setPosition({ x: 54, y: 68 });
                  openComputer();
                }}
                aria-label="Usar tu ordenador"
              >
                <div className="desk-surface" />
                <div className="monitor-model">
                  <div>
                    <Code2 size={25} />
                    <span>1 mensaje nuevo</span>
                  </div>
                  <i />
                </div>
                <div className="keyboard-model" />
                <div className="mouse-model" />
                <div className="desk-cup" />
                <span className="object-label">
                  TU PUESTO <kbd>E</kbd>
                </span>
                <div className="chair" />
              </button>
              <button
                className="office-object notebook-object"
                onClick={() => {
                  setPosition({ x: 25, y: 72 });
                  setInteraction("notebook");
                }}
                aria-label="Leer libreta de bienvenida"
              >
                <div className="side-table" />
                <div className="notebook-model">
                  <span>
                    DON'T
                    <br />
                    PANIC.
                  </span>
                </div>
                <span className="object-label">
                  <BookOpen size={11} /> LIBRETA
                </span>
              </button>
              <button
                className="office-object coffee-object"
                onClick={() => {
                  setPosition({ x: 80, y: 72 });
                  setInteraction("coffee");
                }}
                aria-label="Usar máquina de café"
              >
                <div className="cabinet" />
                <div className="coffee-machine">
                  <i />
                  <span />
                  <b>☕</b>
                </div>
                <span className="object-label">
                  <Coffee size={11} /> CAFÉ
                </span>
              </button>
              <div
                className="player"
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
              >
                <span className="player-shadow" />
                <div className="player-head">
                  <i />
                </div>
                <div className="player-body" />
                <div className="player-legs">
                  <i />
                  <i />
                </div>
                <span className="player-name">
                  TÚ <span>JUNIOR</span>
                </span>
              </div>
              <div className="room-coordinates">
                FORMA HQ / 40°25′ N 3°42′ W
              </div>
            </div>
            <div className="office-controls">
              <div>
                <kbd>W A S D</kbd>
                <span>moverte</span>
                <kbd>E</kbd>
                <span>interactuar</span>
              </div>
              <p>
                {nearest.d < 17 ? (
                  <>
                    <span className="green-dot" />
                    <b>{nearest.name}</b> — {nearest.hint}
                  </>
                ) : (
                  "Acércate a un objeto. También puedes hacer clic para interactuar."
                )}
              </p>
              <button onClick={openComputer}>
                Sentarte a trabajar <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
          <div className="office-bottom">
            <div
              className="incoming-message"
              onClick={() => {
                openComputer();
                setApp("chat");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  openComputer();
                  setApp("chat");
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
          <div className="computer-title">
            <button onClick={() => setScreen("office")}>
              <ArrowLeft size={14} /> Volver a la oficina <kbd>ESC</kbd>
            </button>
            <span>
              FORMA WORKSTATION <i /> JUNIOR@FORMA
            </span>
            <span className="green-dot" />
          </div>
          <div className="desktop">
            <div className="desktop-top">
              <span>
                <span className="desktop-logo">f.</span> Forma OS
              </span>
              <b>{applications.find((a) => a.id === app)?.name}</b>
              <span>
                Lun 09:12 <span className="green-dot" />
              </span>
            </div>
            <div className="desktop-content">
              <div className={`application-window ${app}`}>
                <div className="window-chrome">
                  <div className="window-controls">
                    <button
                      aria-label="Cerrar aplicación y volver a oficina"
                      onClick={() => setScreen("office")}
                    >
                      <X size={10} />
                    </button>
                    <button
                      aria-label="Ir al chat"
                      onClick={() => setApp("chat")}
                    >
                      <Minus size={10} />
                    </button>
                    <span>
                      <Maximize2 size={9} />
                    </span>
                  </div>
                  <span>
                    {app === "editor"
                      ? `${activeFile}${dirty ? " ●" : ""} — forma-web — Code`
                      : app === "browser"
                        ? "Forma — Chrome"
                        : app === "chat"
                          ? "Forma / Equipo"
                          : "Tickets / Tu trabajo"}
                  </span>
                  <span className="window-simulation">SIMULACIÓN LOCAL</span>
                </div>
                {app === "chat" && (
                  <div className="chat-layout">
                    <aside className="chat-sidebar">
                      <h2>
                        forma<span>workspace</span>
                      </h2>
                      <div className="team-badge">
                        <span className="green-dot" /> 4 EN LÍNEA
                      </div>
                      <span className="sidebar-heading">CANALES</span>
                      <button className="channel active"># bienvenida</button>
                      <button
                        className="channel"
                        onClick={() =>
                          notify(
                            "El resto del equipo está en una reunión. Marta es tu contacto hoy.",
                          )
                        }
                      >
                        # frontend
                      </button>
                      <button
                        className="channel"
                        onClick={() =>
                          notify(
                            "Mensaje fijado: el café es gratis. La paciencia también.",
                          )
                        }
                      >
                        # random
                      </button>
                      <span className="sidebar-heading">MENSAJES DIRECTOS</span>
                      <button
                        className="channel"
                        onClick={() =>
                          notify("Estás hablando con Marta en bienvenida.")
                        }
                      >
                        <span className="green-dot" /> Marta
                      </button>
                      <div className="chat-profile">
                        <span className="junior-avatar">J</span>
                        <div>
                          Tu nombre aquí<small>Junior · aprendiendo</small>
                        </div>
                      </div>
                    </aside>
                    <section className="chat-main">
                      <div className="chat-heading">
                        <b># bienvenida</b>
                        <span>Tu primer día. Estamos contigo.</span>
                      </div>
                      <div className="chat-messages">
                        <div className="date-rule">LUNES · TU PRIMER DÍA</div>
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
                              Para empezar te dejamos algo sencillito: hay gente
                              que no termina el registro. El campo de correo es
                              un poco… misterioso.
                            </p>
                            <p>
                              ¿Puedes reproducirlo, revisar qué pasa y dejarlo
                              mejor? Sin prisa. Bueno, tenemos daily después 🙂
                            </p>
                            <button
                              className="ticket-attachment"
                              onClick={() => setApp("tickets")}
                            >
                              <ClipboardList size={19} />
                              <div>
                                <b>UX-001 · El misterio del registro</b>
                                <span>
                                  Ver encargo y criterios de aceptación
                                </span>
                              </div>
                              <ArrowUpRight size={15} />
                            </button>
                          </div>
                        </div>
                        <div className="message">
                          <span className="colleague-avatar">N</span>
                          <div>
                            <b>
                              Nico <small>09:07</small>
                              <span>FRONTEND</span>
                            </b>
                            <p>
                              El proyecto está en Code. Terminal →{" "}
                              <code>npm run dev</code>. Después lo ves en
                              Chrome. Si te pierdes, el README tiene un mapa.
                            </p>
                          </div>
                        </div>
                        {messages.map((m, i) => (
                          <div className="message reply" key={i}>
                            <span className="marta-avatar">M</span>
                            <div>
                              <p>{m}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="chat-compose">
                        <span>¿Qué necesitas decir?</span>
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
                {app === "editor" && (
                  <div className="editor-layout">
                    <aside className="editor-sidebar">
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
                        <div className="line-numbers" aria-hidden="true">
                          {draft.split("\n").map((_, i) => (
                            <span key={i}>{i + 1}</span>
                          ))}
                        </div>
                        <textarea
                          aria-label={`Editar ${activeFile}`}
                          spellCheck={false}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Tab") {
                              e.preventDefault();
                              const el = e.currentTarget,
                                a = el.selectionStart,
                                b = el.selectionEnd;
                              setDraft(
                                draft.slice(0, a) + "  " + draft.slice(b),
                              );
                              requestAnimationFrame(() => {
                                el.selectionStart = el.selectionEnd = a + 2;
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="terminal-pane">
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
                )}
                {app === "browser" && (
                  <div className="browser-layout">
                    <div className="browser-tabs">
                      <button
                        className={pageTab === "site" ? "active" : ""}
                        onClick={() => setPageTab("site")}
                      >
                        <Globe size={12} /> Forma · Registro <span>×</span>
                      </button>
                      <button
                        className={pageTab === "guide" ? "active" : ""}
                        onClick={() => setPageTab("guide")}
                      >
                        <BookOpen size={12} /> HTML: etiquetas
                      </button>
                    </div>
                    <div className="address-bar">
                      <button
                        aria-label="Recargar navegador"
                        onClick={() => {
                          setRevision((v) => v + 1);
                          notify(
                            "Página recargada con los archivos guardados.",
                          );
                        }}
                      >
                        <RefreshCw size={14} />
                      </button>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (url.includes("localhost:3000"))
                            setPageTab("site");
                          else if (url === "forma://docs") setPageTab("guide");
                          else
                            notify(
                              "Este navegador simula localhost:3000 y forma://docs. No navega por Internet.",
                            );
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
                        {pageTab === "guide" ? (
                          <div className="docs">
                            <span className="eyebrow">
                              FORMA / MANUAL DE SUPERVIVENCIA
                            </span>
                            <h2>Un input no se presenta solo.</h2>
                            <p>
                              El placeholder es una pista temporal: al escribir
                              desaparece. La etiqueta permanece y le da un
                              nombre al campo.
                            </p>
                            <pre>
                              {
                                '<label for="email">Correo electrónico</label>\n<input id="email" type="email">'
                              }
                            </pre>
                            <p>
                              <code>for</code> e <code>id</code> deben
                              coincidir. Guarda en Code y vuelve a comprobarlo
                              aquí.
                            </p>
                            <button
                              className="lime-button"
                              onClick={() => setApp("editor")}
                            >
                              Volver al editor <ArrowUpRight size={14} />
                            </button>
                          </div>
                        ) : server ? (
                          <iframe
                            key={revision}
                            ref={frame}
                            title="Web ficticia de Forma"
                            sandbox="allow-scripts allow-forms"
                            srcDoc={previewDocument(
                              files["index.html"],
                              files["styles.css"],
                            )}
                          />
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
                              onClick={() => setApp("editor")}
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
                                  {valid
                                    ? "Correo electrónico"
                                    : "No encontrada"}
                                </dd>
                                <dt>Nombre accesible</dt>
                                <dd>
                                  {valid
                                    ? "Texto de la etiqueta"
                                    : "Solo placeholder (frágil)"}
                                </dd>
                              </dl>
                              <p className="devtools-note">
                                El placeholder desaparece al escribir. ¿Qué le
                                falta al campo?
                              </p>
                              <button
                                onClick={() => {
                                  setPageTab("guide");
                                  setUrl("forma://docs");
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
                {app === "tickets" && (
                  <div className="tickets-layout">
                    <aside>
                      <h2>
                        Trabajo<span>Tu cola de hoy</span>
                      </h2>
                      <button className="ticket-nav">
                        <span className="green-dot" /> UX-001{" "}
                        <ChevronRight size={14} />
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
                        <span>
                          {progress.delivered ? "COMPLETADO" : "EN CURSO"}
                        </span>
                        <b>P2 · ONBOARDING</b>
                      </div>
                      <h2>El misterio del registro.</h2>
                      <p>
                        Al escribir el correo, desaparece la única indicación de
                        qué es ese campo. Las personas pierden el contexto.
                        Necesitamos una etiqueta visible y asociada, conservando
                        el registro.
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
                          No hay que reescribir la aplicación. Encuentra el
                          cambio más pequeño que resuelva el problema.
                        </p>
                      </div>
                      <button
                        className="lime-button"
                        onClick={() => {
                          setApp("chat");
                          deliver();
                        }}
                      >
                        Entregar al equipo <Send size={14} />
                      </button>
                    </section>
                  </div>
                )}
              </div>
            </div>
            <div className="dock">
              {applications.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => setApp(a.id)}
                    aria-label={`Abrir ${a.name}`}
                    className={app === a.id ? "active" : ""}
                  >
                    <span style={{ background: a.color }}>
                      <Icon size={24} />
                    </span>
                    <small>{a.name}</small>
                    <i />
                  </button>
                );
              })}
              <span className="dock-divider" />
              <button
                onClick={() => setScreen("office")}
                aria-label="Levantarte del ordenador"
              >
                <span className="office-icon">
                  <Monitor size={23} />
                </span>
                <small>Oficina</small>
              </button>
            </div>
          </div>
          <div className="computer-footer">
            <span>
              <span className="green-dot" />{" "}
              {server ? "SERVIDOR LOCAL ACTIVO" : "SERVIDOR DETENIDO"} <i />{" "}
              {saved ? "PROGRESO GUARDADO" : "GUARDADO BLOQUEADO"}
            </span>
            <span>Aprende. Prueba. Rompe algo pequeño. Vuelve a probar.</span>
          </div>
        </main>
      )}
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
