import { useRef, useState } from "react";
export type BrowserPage = "site" | "guide" | "new" | "error";
export type BrowserTab = { id: number; history: string[]; index: number };
const addresses = {
  site: "http://localhost:3000",
  guide: "https://docs.forma.test/html/labels",
  new: "chrome://newtab",
  error: "chrome://error",
};
export function pageFor(url: string): BrowserPage {
  if (url === "chrome://newtab") return "new";
  if (url === addresses.guide || url === "forma://docs") return "guide";
  try {
    const u = new URL(url);
    if (u.hostname === "localhost" && u.port === "3000") return "site";
  } catch {}
  return "error";
}
export function useBrowser() {
  const [tabs, setTabs] = useState<BrowserTab[]>([
      { id: 1, history: [addresses.site], index: 0 },
    ]),
    [active, setActive] = useState(1);
  const sequence = useRef(1);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  const url = current.history[current.index];
  function navigate(address: string) {
    const normalized = /^[a-z]+:\/\//i.test(address)
      ? address
      : "http://" + address;
    setTabs((ts) =>
      ts.map((t) =>
        t.id === active
          ? {
              ...t,
              history: [...t.history.slice(0, t.index + 1), normalized],
              index: t.index + 1,
            }
          : t,
      ),
    );
  }
  function newTab(page: BrowserPage = "new") {
    const id = ++sequence.current;
    setTabs((ts) => [...ts, { id, history: [addresses[page]], index: 0 }]);
    setActive(id);
  }
  function openPage(page: BrowserPage) {
    const existing = tabs.find((t) => pageFor(t.history[t.index]) === page);
    if (existing) setActive(existing.id);
    else newTab(page);
  }
  function close(id: number) {
    if (tabs.length === 1) {
      const newid = ++sequence.current;
      setTabs([{ id: newid, history: [addresses.new], index: 0 }]);
      setActive(newid);
      return;
    }
    const left = tabs.filter((t) => t.id !== id);
    setTabs(left);
    if (active === id) setActive(left.at(-1)!.id);
  }
  function history(delta: number) {
    setTabs((ts) =>
      ts.map((t) =>
        t.id === active
          ? {
              ...t,
              index: Math.max(
                0,
                Math.min(t.history.length - 1, t.index + delta),
              ),
            }
          : t,
      ),
    );
  }
  return {
    tabs,
    active,
    current: { ...current, url, page: pageFor(url) },
    navigate,
    newTab,
    openPage,
    close,
    history,
    select: setActive,
  };
}
