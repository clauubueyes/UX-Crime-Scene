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
