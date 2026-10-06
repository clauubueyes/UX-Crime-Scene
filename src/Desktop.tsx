import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Code2,
  Globe,
  MessageSquare,
  Folder,
  ClipboardList,
  Minus,
  Square,
  X,
  Copy,
  Monitor,
  Maximize2,
  HelpCircle,
  Wifi,
  Volume2,
  Search,
} from "lucide-react";
import {
  type AppName,
  type DesktopWindow,
  type WindowAction,
} from "./desktopState";
export const apps = [
  {
    id: "files" as const,
    name: "Explorador de archivos",
    short: "Archivos",
    icon: Folder,
  },
  {
    id: "browser" as const,
    name: "Google Chrome",
    short: "Chrome",
    icon: Globe,
  },
  {
    id: "editor" as const,
    name: "Visual Studio Code",
    short: "VS Code",
    icon: Code2,
  },
  {
    id: "chat" as const,
    name: "Equipo · Forma",
    short: "Equipo",
    icon: MessageSquare,
  },
  {
    id: "tickets" as const,
    name: "Tickets",
    short: "Tickets",
    icon: ClipboardList,
  },
];
export default function Desktop({
  windows,
  onAction,
  renderApp,
  onOffice,
  onFullscreen,
  onHelp,
  dirty,
}: {
  windows: DesktopWindow[];
  onAction: (a: WindowAction) => void;
  renderApp: (id: AppName) => ReactNode;
  onOffice: () => void;
  onFullscreen: () => void;
  onHelp: () => void;
  dirty: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    gesture = useRef<{
      id: AppName;
      x: number;
      y: number;
      wx: number;
      wy: number;
      width: number;
      height: number;
      resize: boolean;
    } | null>(null);
  const [size, setSize] = useState({ width: 1200, height: 800 }),
    [start, setStart] = useState(false);
  useEffect(() => {
    const el = host.current!;
    const ro = new ResizeObserver(() =>
      setSize({ width: el.clientWidth, height: el.clientHeight - 48 }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const foreground = windows.filter((w) => !w.minimized).at(-1)?.id;
  function begin(e: React.PointerEvent, w: DesktopWindow, resize = false) {
    if ((e.target as HTMLElement).closest("button") && !resize) return;
    if (w.maximized) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = {
      id: w.id,
      x: e.clientX,
      y: e.clientY,
      wx: Math.min(w.x, Math.max(0, size.width - w.width)),
      wy: Math.min(w.y, Math.max(0, size.height - w.height)),
      width: w.width,
      height: w.height,
      resize,
    };
    onAction({ type: "raise", id: w.id });
  }
  function move(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (g.resize)
      onAction({
        type: "resize",
        id: g.id,
        width: Math.max(360, Math.min(size.width, g.width + dx)),
        height: Math.max(300, Math.min(size.height, g.height + dy)),
      });
    else
      onAction({
        type: "move",
        id: g.id,
        x: Math.max(
          0,
          Math.min(size.width - Math.min(g.width, size.width), g.wx + dx),
        ),
        y: Math.max(0, Math.min(size.height - 100, g.wy + dy)),
      });
  }
  return (
    <div ref={host} className="os-desktop">
      <div className="os-wallpaper">
        <span className="wallpaper-mark">
          forma<span>make things make sense.</span>
        </span>
      </div>
      <div className="desktop-shortcuts">
        {apps.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              aria-label={`Abrir ${a.short}`}
              onDoubleClick={() => onAction({ type: "open", id: a.id })}
              onClick={() => onAction({ type: "open", id: a.id })}
            >
              <span className={`app-symbol ${a.id}`}>
                <Icon size={29} />
              </span>
              <span>{a.name}</span>
            </button>
          );
        })}
      </div>
      {[...windows]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((w) => {
          const i = windows.findIndex((item) => item.id === w.id);
          const a = apps.find((a) => a.id === w.id)!;
          const Icon = a.icon;
          return (
            <section
              key={w.id}
              className={`os-window ${w.id} ${foreground === w.id ? "foreground" : ""} ${w.maximized ? "maximized" : ""}`}
              aria-label={`Ventana ${a.name}`}
              style={{
                display: w.minimized ? "none" : "flex",
                zIndex: i + 2,
                left: w.maximized
                  ? 0
                  : Math.min(
                      w.x,
                      Math.max(0, size.width - Math.min(w.width, size.width)),
                    ),
                top: w.maximized
                  ? 0
                  : Math.min(
                      w.y,
                      Math.max(
                        0,
                        size.height - Math.min(w.height, size.height),
                      ),
                    ),
                width: w.maximized ? size.width : Math.min(w.width, size.width),
                height: w.maximized
                  ? size.height
                  : Math.min(w.height, size.height),
              }}
              onPointerDownCapture={() => {
                if (foreground !== w.id) onAction({ type: "raise", id: w.id });
              }}
            >
              <div
                className="os-titlebar"
                onPointerDown={(e) => begin(e, w)}
                onPointerMove={move}
                onPointerUp={() => (gesture.current = null)}
                onPointerCancel={() => (gesture.current = null)}
                onDoubleClick={() => onAction({ type: "maximize", id: w.id })}
              >
                <span>
                  <Icon size={13} />
                  {a.name}
                  {w.id === "editor" ? ` — forma-web${dirty ? " ●" : ""}` : ""}
                </span>
                <div>
                  <button
                    aria-label={`Minimizar ${a.short}`}
                    onClick={() => onAction({ type: "minimize", id: w.id })}
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    aria-label={`${w.maximized ? "Restaurar" : "Maximizar"} ${a.short}`}
                    onClick={() => onAction({ type: "maximize", id: w.id })}
                  >
                    {w.maximized ? <Copy size={12} /> : <Square size={11} />}
                  </button>
                  <button
                    aria-label={`Cerrar ${a.short}`}
                    onClick={() => onAction({ type: "close", id: w.id })}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="os-window-body">{renderApp(w.id)}</div>
              {!w.maximized && (
                <button
                  className="window-resize"
                  aria-label={`Cambiar tamaño de ${a.short}`}
                  onPointerDown={(e) => begin(e, w, true)}
                  onPointerMove={move}
                  onPointerUp={() => (gesture.current = null)}
                  onPointerCancel={() => (gesture.current = null)}
                />
              )}
            </section>
          );
        })}
      {start && (
        <div className="start-menu">
          <h3>Hola, junior.</h3>
          <p>Tu puesto de trabajo</p>
          {apps.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => {
                  onAction({ type: "open", id: a.id });
                  setStart(false);
                }}
              >
                <Icon size={19} />
                {a.name}
              </button>
            );
          })}
          <button onClick={onHelp}>
            <HelpCircle size={18} />
            Repetir tutorial
          </button>
          <button onClick={onOffice}>
            <Monitor size={18} />
            Levantarte del ordenador
          </button>
        </div>
      )}
      <div className="os-taskbar">
        <button
          className="start-button"
          aria-label="Menú Inicio"
          onClick={() => setStart((v) => !v)}
        >
          <span />
          <span />
          <span />
          <span />
        </button>
        <span className="taskbar-divider" />
        {apps.map((a) => {
          const Icon = a.icon;
          const running = windows.some((w) => w.id === a.id);
          return (
            <button
              key={a.id}
              title={a.name}
              aria-label={`Abrir ${a.short}`}
              className={`taskbar-app ${running ? "running" : ""} ${foreground === a.id ? "selected" : ""}`}
              onClick={() =>
                onAction({
                  type: foreground === a.id ? "minimize" : "open",
                  id: a.id,
                })
              }
            >
              <span className={`app-symbol ${a.id}`}>
                <Icon size={23} />
              </span>
            </button>
          );
        })}
        <div className="taskbar-tray">
          <button aria-label="Volver a la oficina" onClick={onOffice}>
            <Monitor size={16} />
          </button>
          <button aria-label="Pantalla completa" onClick={onFullscreen}>
            <Maximize2 size={16} />
          </button>
          <button aria-label="Tutorial" onClick={onHelp}>
            <HelpCircle size={16} />
          </button>
          <Wifi size={13} />
          <span>
            09:12<small>Lunes · Día 01</small>
          </span>
        </div>
      </div>
    </div>
  );
}
