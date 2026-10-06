import {
  ArrowRight,
  X,
  ChevronDown,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
const lessons = [
  [
    "Tu primer día empieza aquí.",
    "Eres el nuevo junior de Forma. No tienes que saber programar de memoria: vas a aprender investigando y haciendo un cambio pequeño.",
    "Empezar tutorial",
  ],
  [
    "01 · Encuentra tu puesto",
    "WASD o flechas para moverte. Arrastra para mirar. Apunta al monitor y pulsa E. También tienes accesos directos abajo.",
    "Sentarme al ordenador",
  ],
  [
    "02 · Lee el encargo",
    "Estás en tu escritorio. Abre Equipo desde su icono o la barra de tareas. Marta te explica el primer ticket.",
    "Abrir Equipo",
  ],
  [
    "03 · Arranca el proyecto",
    "Abre VS Code. En su terminal escribe npm run dev y pulsa Enter. Eso hace que la web esté disponible en Chrome.",
    "Abrir VS Code",
  ],
  [
    "04 · Reproduce el problema",
    "Abre Chrome, rellena el registro con datos ficticios y prueba una contraseña corta. Observa lo que ocurre antes de tocar el código.",
    "Abrir Chrome",
  ],
  [
    "05 · Investiga el correo",
    "En Chrome abre DevTools y pulsa Inspeccionar correo. Fíjate en su etiqueta. La pestaña de documentación explica cómo asociarla.",
    "Ir al navegador",
  ],
  [
    "06 · Haz un cambio pequeño",
    'En index.html añade una etiqueta antes del correo: <label for="email">Correo electrónico</label>. Guarda con Ctrl+S o Guardar.',
    "Abrir el archivo",
  ],
  [
    "07 · Comprueba tu cambio",
    "En el terminal de VS Code ejecuta npm test. Es una comprobación del ticket; además necesitas probar el formulario.",
    "Ir al terminal",
  ],
  [
    "08 · Prueba el registro",
    "Vuelve a Chrome y crea una cuenta con una contraseña de 8 caracteres o más. Los archivos guardados se reflejan en la web.",
    "Abrir Chrome",
  ],
  [
    "09 · Entrega al equipo",
    "Abre Equipo y pulsa Entregar cambio. Marta revisará que investigaste, corregiste y comprobaste el problema.",
    "Abrir Equipo",
  ],
];
export default function Tutorial({
  step,
  onAction,
  onSkip,
  collapsed,
  onCollapse,
}: {
  step: number;
  onAction: () => void;
  onSkip: () => void;
  collapsed: boolean;
  onCollapse: () => void;
}) {
  if (step >= lessons.length) return null;
  const [title, body, action] = lessons[step];
  if (step === 0)
    return (
      <div className="tutorial-welcome-backdrop">
        <section
          className="tutorial-welcome"
          role="dialog"
          aria-modal="true"
          aria-label="Bienvenido al tutorial"
        >
          <span className="eyebrow">UX CRIME SCENE / THE JUNIOR FILES</span>
          <h1>{title}</h1>
          <p>{body}</p>
          <div className="tutorial-start-facts">
            <span>
              <BookOpen size={17} />
              Primera jornada guiada
            </span>
            <span>
              <CheckCircle2 size={17} />
              Sin conocimientos previos
            </span>
          </div>
          <button className="lime-button" autoFocus onClick={onAction}>
            {action}
            <ArrowRight size={16} />
          </button>
          <button className="tutorial-skip" onClick={onSkip}>
            Entrar sin tutorial
          </button>
        </section>
      </div>
    );
  return (
    <aside
      className={`tutorial-card ${collapsed ? "collapsed" : ""}`}
      aria-label="Tutorial"
    >
      <div className="tutorial-card-heading">
        <BookOpen size={14} />
        <span>GUÍA DEL PRIMER DÍA</span>
        <b>{step}/9</b>
        <button
          aria-label={collapsed ? "Expandir tutorial" : "Minimizar tutorial"}
          onClick={onCollapse}
        >
          <ChevronDown size={14} />
        </button>
      </div>
      {!collapsed && (
        <>
          <h3>{title}</h3>
          <p>{body}</p>
          <div className="tutorial-progress">
            {lessons.slice(1).map((_, i) => (
              <i key={i} className={i < step ? "done" : ""} />
            ))}
          </div>
          <button className="lime-button" onClick={onAction}>
            {action}
            <ArrowRight size={13} />
          </button>
          <button className="tutorial-skip" onClick={onSkip}>
            Salir del tutorial
          </button>
        </>
      )}
    </aside>
  );
}
