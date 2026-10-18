const path = require("path");
const puppeteer = require("puppeteer-core");
const ROOT = path.resolve(__dirname, "..");
const EXT = path.join(ROOT, "extension");
(async () => {
  const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new",
    args: ["--no-sandbox"], enableExtensions: true, pipe: true,
    userDataDir: "/tmp/pc-smoke-" + Date.now() });
  const xid = await b.installExtension(EXT); console.log("installed", xid);
  const sw = await b.waitForTarget((t) => t.type() === "service_worker", { timeout: 15000 });
  const id = new URL(sw.url()).host; console.log("SW loaded, id", id);
  await new Promise((r) => setTimeout(r, 2000));
  const pages = await b.pages(); console.log("open tabs:", pages.map((p) => p.url()));
  const errs = [];
  for (const [name, w, h] of [["welcome", 900, 1900], ["popup", 324, 260], ["options", 700, 700]]) {
    const p = await b.newPage(); p.on("pageerror", (e) => errs.push(name + ": " + e.message));
    p.on("console", (m) => m.type() === "error" && errs.push(name + ": " + m.text()));
    await p.setViewport({ width: w, height: h });
    await p.goto(`chrome-extension://${id}/${name}.html`); await new Promise((r) => setTimeout(r, 500));
    if (name === "popup") console.log("setup banner visible:", await p.$eval("#setup", (e) => !e.hidden));
    await p.screenshot({ path: path.join(__dirname, `shot-${name}.png`), fullPage: name === "welcome" });
  }
  console.log("errors:", errs);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
