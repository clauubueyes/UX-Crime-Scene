import { test } from "node:test";
import assert from "node:assert/strict";
import {
  starterFiles,
  checkTicket,
  canDeliver,
  emptyProgress,
  terminalCommand,
} from "./workday.ts";
const fixed = starterFiles["index.html"].replace(
  '<input id="email"',
  '<label for="email">Correo electrónico</label>\n    <input id="email"',
);
test("starter reproduces the ticket; a bound visible label fixes it", () => {
  assert.equal(checkTicket(starterFiles["index.html"]).ok, false);
  assert.equal(checkTicket(fixed).ok, true);
});
test("unbound or empty labels and removing the email field cannot pass", () => {
  for (const html of [
    fixed.replace('for="email"', 'for="other"'),
    fixed.replace(">Correo electrónico</label>", "></label>"),
    fixed.replace('id="email"', 'id="other"'),
  ])
    assert.equal(checkTicket(html).ok, false);
});
test("delivery requires reproduction, inspection, a check and a successful registration", () => {
  assert.equal(canDeliver(emptyProgress, fixed), false);
  assert.equal(
    canDeliver(
      {
        ...emptyProgress,
        inspected: true,
        reproduced: true,
        tested: true,
        registered: true,
      },
      fixed,
    ),
    true,
  );
  assert.equal(
    canDeliver(
      {
        ...emptyProgress,
        inspected: true,
        reproduced: true,
        tested: true,
        registered: true,
      },
      starterFiles["index.html"],
    ),
    false,
  );
});
test("terminal handles only supported commands and reports missing files", () => {
  assert.equal(terminalCommand("npm run dev", starterFiles).action, "start");
  assert.equal(terminalCommand("npm test", starterFiles).action, "test");
  assert.match(
    terminalCommand("cat missing", starterFiles).lines[0],
    /no existe/,
  );
  assert.match(
    terminalCommand("rm -rf /", starterFiles).lines[0],
    /no disponible/,
  );
});

import { windowAction } from "./desktopState.ts";
import { pageFor } from "./useBrowser.ts";
test("window manager restores apps without duplicates and preserves geometry", () => {
  let windows = windowAction([], { type: "open", id: "editor" });
  windows = windowAction(windows, {
    type: "move",
    id: "editor",
    x: 120,
    y: 80,
  });
  windows = windowAction(windows, { type: "minimize", id: "editor" });
  windows = windowAction(windows, { type: "open", id: "editor" });
  assert.equal(windows.length, 1);
  assert.equal(windows[0].minimized, false);
  assert.equal(windows[0].x, 120);
  windows = windowAction(windows, { type: "maximize", id: "editor" });
  assert.equal(windows[0].maximized, true);
  windows = windowAction(windows, { type: "maximize", id: "editor" });
  assert.equal(windows[0].x, 120);
});
test("raising, closing and resizing windows preserve other apps", () => {
  let windows = windowAction(
    windowAction([], { type: "open", id: "browser" }),
    { type: "open", id: "editor" },
  );
  windows = windowAction(windows, { type: "raise", id: "browser" });
  assert.equal(windows.at(-1)?.id, "browser");
  windows = windowAction(windows, {
    type: "resize",
    id: "editor",
    width: 720,
    height: 500,
  });
  assert.equal(windows[0].width, 720);
  windows = windowAction(windows, { type: "close", id: "browser" });
  assert.equal(windows.length, 1);
  assert.equal(windows[0].id, "editor");
});
test("browser distinguishes project, documentation, new tabs and unknown addresses", () => {
  assert.equal(pageFor("http://localhost:3000/signup"), "site");
  assert.equal(pageFor("https://docs.forma.test/html/labels"), "guide");
  assert.equal(pageFor("chrome://newtab"), "new");
  assert.equal(pageFor("http://localhost:30000"), "error");
});
