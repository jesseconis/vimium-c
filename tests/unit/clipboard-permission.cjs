const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { test } = require("node:test")
const vm = require("node:vm")
const ts = require("typescript")

// Execute the real preflight from frame_commands.ts without loading browser globals.
const path = require("node:path").join(__dirname, "../../background/frame_commands.ts")
const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true)
let preflight
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(source) === "set_runOnTee_") {
    let callback = node.arguments[0]
    while (!ts.isArrowFunction(callback)) callback = callback.expression
    preflight = callback.body.statements[0].getText(source)
  }
  ts.forEachChild(node, visit)
}
visit(source)
assert.ok(preflight, "clipboard preflight must exist")
const code = ts.transpileModule(`(function(task, serializable, data) { ${preflight} })`, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None }
}).outputText

function setup(permission, { mv3 = true, chrome = true } = {}) {
  const checks = [], pastes = []
  const contains = () => {}
  const run = vm.runInNewContext(code, {
    Build: { MV3: mv3 }, OnChrome: chrome, kTeeTask: { Paste: 3 },
    browser_: { permissions: { contains } },
    Q_: (fn, query) => {
      assert.equal(fn, contains)
      checks.push(JSON.parse(JSON.stringify(query)))
      return permission()
    },
    blank_: () => {},
    runOnTee_: (...args) => { pastes.push(args); return Promise.resolve("test clipboard") },
    navigator: { permissions: { query: () => { throw Error("must not query worker web permissions") } } }
  })
  return { run, checks, pastes }
}

test("granted extension permission allows paste despite an unusable web Permissions API", async () => {
  const { run, checks, pastes } = setup(() => Promise.resolve(true))
  assert.equal(await run(3, 0, null), "test clipboard")
  assert.deepEqual(checks, [{ permissions: ["clipboardRead"] }])
  assert.deepEqual(pastes, [[3, -1, null]])
})
test("preserves paste length limit and marks the permission check complete", async () => {
  const { run, pastes } = setup(() => Promise.resolve(true))
  await run(3, 256, null)
  assert.deepEqual(pastes, [[3, -257, null]])
})
test("missing extension permission fails closed", async () => {
  const { run, pastes } = setup(() => Promise.resolve(false))
  assert.equal(await run(3, 0, null), false)
  assert.deepEqual(pastes, [])
})
test("permission API rejection fails closed", async () => {
  const { run, pastes } = setup(() => Promise.reject(Error("permission error")))
  assert.equal(await run(3, 0, null), false)
  assert.deepEqual(pastes, [])
})
test("does not preflight other tasks, already-checked pastes, MV2, or non-Chromium", () => {
  for (const [task, limit, options] of [[2, 0, {}], [3, -1, {}], [3, 0, { mv3: false }],
      [3, 0, { chrome: false }]]) {
    const { run, checks } = setup(() => { throw Error("unexpected permission check") }, options)
    assert.equal(run(task, limit, null), undefined)
    assert.deepEqual(checks, [])
  }
})
