export type AppName = "chat" | "browser" | "editor" | "tickets" | "files";
export type DesktopWindow = {
  id: AppName;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
};
export type WindowAction =
  | { type: "open" | "raise" | "minimize" | "maximize" | "close"; id: AppName }
  | { type: "move"; id: AppName; x: number; y: number }
  | { type: "resize"; id: AppName; width: number; height: number };
export function windowAction(
  windows: DesktopWindow[],
  action: WindowAction,
): DesktopWindow[] {
  const found = windows.find((w) => w.id === action.id);
  if (action.type === "close") return windows.filter((w) => w.id !== action.id);
  if (action.type === "open" || action.type === "raise") {
    const w = found ?? {
      id: action.id,
      x: 55 + windows.length * 35,
      y: 35 + windows.length * 25,
      width: 970,
      height: 680,
      minimized: false,
      maximized: false,
    };
    return [
      ...windows.filter((w) => w.id !== action.id),
      { ...w, minimized: false },
    ];
  }
  if (!found) return windows;
  return windows.map((w) =>
    w.id !== action.id
      ? w
      : action.type === "minimize"
        ? { ...w, minimized: true }
        : action.type === "maximize"
          ? { ...w, maximized: !w.maximized, minimized: false }
          : action.type === "move"
            ? { ...w, x: action.x, y: action.y }
            : action.type === "resize"
              ? { ...w, width: action.width, height: action.height }
              : w,
  );
}
