// Renders store images from the real extension UI with headless Chrome.
const puppeteer = require("puppeteer-core");
const fs = require("fs"), http = require("http"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "store", "src"), OUT = path.join(ROOT, "store");
const EXT = path.join(ROOT, "extension");
const NAME = "Price Check – Compare Prices via Webhook";
fs.copyFileSync(EXT + "/icons/icon128.png", SRC + "/icon128.png");
fs.copyFileSync(EXT + "/icons/icon32.png", SRC + "/icon32.png");

const srv = http.createServer((q, r) => {
  const f = path.join(SRC, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(SRC) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  const ext = path.extname(f);
  r.writeHead(200, { "Content-Type": { ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml" }[ext] || "application/octet-stream" });
  fs.createReadStream(f).pipe(r);
}).listen(8765);
const BASE = "http://localhost:8765/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FONT = "font-family:system-ui,-apple-system,'Segoe UI',Roboto,'DejaVu Sans',sans-serif;";
const BG = "linear-gradient(135deg,#e8f5ec 0%,#f4f7fb 55%,#e9eef8 100%)";
function windowFrame({ shot, url, popup, popupRight = 18 }) {
  return `
  <div style="position:absolute;left:80px;top:122px;width:1120px;height:670px;border-radius:12px;overflow:hidden;background:#fff;
       box-shadow:0 24px 60px rgba(20,40,30,.18),0 2px 8px rgba(0,0,0,.08)">
    <div style="height:36px;background:#dfe3e8;display:flex;align-items:flex-end;padding-left:14px;gap:8px">
      <span style="display:flex;gap:7px;align-self:center;margin-right:10px"><i style="width:12px;height:12px;border-radius:50%;background:#ff5f57;display:block"></i><i style="width:12px;height:12px;border-radius:50%;background:#febc2e;display:block"></i><i style="width:12px;height:12px;border-radius:50%;background:#28c840;display:block"></i></span>
      <div style="background:#fff;border-radius:9px 9px 0 0;padding:7px 16px;font-size:12.5px;color:#333;width:220px;white-space:nowrap;overflow:hidden">${url.tab}</div>
    </div>
    <div style="height:40px;background:#fff;border-bottom:1px solid #e1e4e8;display:flex;align-items:center;gap:14px;padding:0 14px;color:#5f6368;font-size:17px">
      <span>←</span><span>→</span><span>↻</span>
      <div style="flex:1;height:28px;border-radius:14px;background:#f1f3f4;display:flex;align-items:center;padding:0 14px;font-size:13.5px;color:#202124">${url.addr}</div>
      <span style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${popup ? "#e3eee7" : "transparent"}"><img src="icon32.png" width="18" height="18"></span>
      <span style="font-size:15px">⋮</span>
    </div>
    <img src="${shot}" style="display:block;width:1120px;height:594px">
    ${popup ? `<img src="${popup}" style="position:absolute;top:70px;right:${popupRight}px;border-radius:8px;box-shadow:0 10px 32px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.08)">` : ""}
  </div>`;
}
function slide(caption, sub, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;width:1280px;height:800px;overflow:hidden;position:relative;background:${BG};${FONT}">
  <div style="position:absolute;left:80px;top:30px;right:80px;display:flex;align-items:center;gap:16px">
    <img src="icon128.png" width="56" height="56">
    <div><div style="font-size:30px;font-weight:700;color:#14281d;line-height:1.15">${caption}</div>
    <div style="font-size:17px;color:#4a5a52;margin-top:4px">${sub}</div></div></div>
  ${inner}</body></html>`;
}

(async () => {
  const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox", "--hide-scrollbars", "--font-render-hinting=none"],
    enableExtensions: true, pipe: true, userDataDir: "/tmp/pc-store-" + Date.now(), defaultViewport: null });
  const id = await b.installExtension(EXT);
  await b.waitForTarget((t) => t.type() === "service_worker", { timeout: 15000 });
  await sleep(1500);
  const ext = (p) => `chrome-extension://${id}/${p}`;
  const page = async (w, h) => { const p = await b.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 }); return p; };
  const extract = fs.readFileSync(EXT + "/extract.js", "utf8");

  // 1. Product page + real extraction
  let p = await page(1120, 594);
  await p.goto(BASE + "product.html"); await sleep(300);
  await p.screenshot({ path: SRC + "/cap-product.png" });
  const prod = await p.evaluate(extract + ";extractProduct()");
  console.log("extracted:", JSON.stringify(prod));

  // 2. Popup states (real popup.html; status set to the extension's own strings)
  const popupShot = async (file, fn) => {
    const q = await page(324, 400); await q.goto(ext("popup.html")); await sleep(300);
    await q.evaluate(fn, prod);
    const el = await q.$("body"); await el.screenshot({ path: SRC + "/" + file }); await q.close();
  };
  await popupShot("cap-popup-sent.png", (prod) => {
    document.getElementById("setup").hidden = true;
    const s = document.getElementById("status"); s.textContent = "Sent! Results will appear in your assistant's chat"; s.className = "ok";
    document.getElementById("preview").textContent = `${prod.name} — ${prod.price} ${prod.currency}`;
  });
  await popupShot("cap-popup-setup.png", () => {});

  // 3. Welcome page (real), top section
  p = await page(1120, 594); await p.goto(ext("welcome.html")); await sleep(400);
  await p.screenshot({ path: SRC + "/cap-welcome.png" });
  await p.evaluate(() => document.querySelector(".steps").scrollIntoView({ block: "start" }) || window.scrollBy(0, -50));
  await sleep(200); await p.screenshot({ path: SRC + "/cap-welcome-steps.png" });

  // 4. Options page (real), filled with example values
  p = await page(1120, 594); await p.goto(ext("options.html")); await sleep(300);
  await p.evaluate(() => {
    document.getElementById("webhookUrl").value = "https://hooks.example.com/webhooks/abc123";
    document.getElementById("senderKey").value = "example-sender-key-0000";
    const s = document.getElementById("status"); s.textContent = "Test sent (HTTP 200). Settings saved. Check your assistant's chat for the confirmation."; s.className = "ok";
  });
  await p.screenshot({ path: SRC + "/cap-options.png" });

  // 5. Illustration: chat result mock (pure HTML)
  fs.writeFileSync(SRC + "/chat.html", `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;width:1120px;height:594px;background:#f7f8fa;${FONT}color:#1f2328}
    .wrap{max-width:820px;margin:0 auto;padding:22px 0}
    .tag{font-size:12px;color:#57606a;margin-bottom:6px}.bubble{background:#fff;border:1px solid #e1e4e8;border-radius:14px;padding:16px 20px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    table{border-collapse:collapse;width:100%;font-size:14px;margin:8px 0}th,td{border:1px solid #e1e4e8;padding:6px 10px;text-align:left}th{background:#f6f8fa}
    td.g{color:#1a7f37;font-weight:600}a{color:#0969da}
    .illu{position:absolute;top:14px;right:16px;background:#fff8c5;border:1px solid #d4a72c;color:#6b4f00;font-size:12.5px;font-weight:700;padding:4px 10px;border-radius:999px}
  </style></head><body><div class="illu">ILLUSTRATION · fictional stores &amp; prices</div><div class="wrap">
  <div class="tag">Routine: Check price from browser extension · Quick check</div>
  <div class="bubble"><div style="font-weight:700;font-size:17px">Summit 40L Hiking Backpack (Trailhead, Slate)</div>
  <div style="color:#57606a;font-size:14px">On the page you're viewing: <b>$149.99</b> at Trailhead Gear Co.</div>
  <table><tr><th>Retailer</th><th>Price</th><th>Shipping</th><th>Total</th><th>vs. this page</th><th>Link</th></tr>
  <tr><td>Peak Outfitters</td><td>$124.95</td><td>Free</td><td>$124.95</td><td class="g">−$25.04</td><td><a>View</a></td></tr>
  <tr><td>Basecamp Supply</td><td>$129.00</td><td>$4.99</td><td>$133.99</td><td class="g">−$16.00</td><td><a>View</a></td></tr>
  <tr><td>Ridge &amp; River</td><td>$139.99</td><td>Free</td><td>$139.99</td><td class="g">−$10.00</td><td><a>View</a></td></tr>
  <tr><td>Trailhead (brand store)</td><td>$149.99</td><td>Free over $99</td><td>$149.99</td><td>same</td><td><a>View</a></td></tr></table>
  <div style="font-size:14.5px"><b>Verdict:</b> Peak Outfitters has the same model (MPN S40-SLATE) for $25 less with free shipping.</div>
  </div><div style="font-size:13px;color:#57606a;margin-top:12px">Want price history, reviews and return policies too? Use <b>Full check</b>.</div></div></body></html>`);
  p = await page(1120, 594); await p.goto(BASE + "chat.html"); await sleep(300);
  await p.screenshot({ path: SRC + "/cap-chat.png" });

  // Composite slides
  const slides = [
    ["screenshot-1-popup.png", "One click to check for a lower price", "Sends this product page to your own AI assistant's webhook. Results arrive in your chat.",
      windowFrame({ shot: "cap-product.png", url: { tab: "Summit 40L Hiking Backpack", addr: "trailheadgear.example/packs/summit-40l" }, popup: "cap-popup-sent.png" })],
    ["screenshot-2-results.png", "Results arrive in your assistant's chat", "Quick check: cheaper offers with links. Full check adds history, reviews, returns and coupons.",
      windowFrame({ shot: "cap-chat.png", url: { tab: "Your AI assistant", addr: "Your assistant's chat (example)" } })],
    ["screenshot-3-welcome.png", "Guided 3-step setup", "Works with Grok Bot webhook routines: copy one prompt, paste the webhook URL and key, done.",
      windowFrame({ shot: "cap-welcome-steps.png", url: { tab: "Welcome to Price Check", addr: NAME + " › welcome" } })],
    ["screenshot-4-options.png", "You choose where your data goes", "Data goes only to the webhook you enter. Settings stay in your browser. No analytics.",
      windowFrame({ shot: "cap-options.png", url: { tab: "Price Check – Options", addr: NAME + " › options" } })],
  ];
  for (const [file, cap, sub, inner] of slides) {
    fs.writeFileSync(SRC + "/slide.html", slide(cap, sub, inner));
    const s = await page(1280, 800); await s.goto(BASE + "slide.html"); await sleep(400);
    await s.screenshot({ path: OUT + "/" + file }); await s.close();
  }

  // Small promo tile 440x280
  fs.writeFileSync(SRC + "/tile.html", `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;width:440px;height:280px;overflow:hidden;background:linear-gradient(135deg,#1a7f37,#145c2a);${FONT}color:#fff;position:relative">
    <div style="position:absolute;left:34px;top:46px;width:96px;height:96px;border-radius:24px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.2)"><img src="icon128.png" width="104" height="104" style="margin:-4px"></div>
    <div style="position:absolute;left:150px;top:50px;right:24px"><div style="font-size:36px;font-weight:800;line-height:1.05">Price Check</div>
    <div style="font-size:17px;opacity:.92;margin-top:8px;line-height:1.3">Compare prices via your<br>AI assistant's webhook</div></div>
    <div style="position:absolute;left:34px;right:34px;bottom:34px;font-size:15px;line-height:1.4;opacity:.95">One click on any product page. Results in your chat.</div>
  </body></html>`);
  let s = await page(440, 280); await s.goto(BASE + "tile.html"); await sleep(300); await s.screenshot({ path: OUT + "/promo-small-440x280.png" });

  // Marquee 1400x560
  fs.writeFileSync(SRC + "/marquee.html", `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;width:1400px;height:560px;overflow:hidden;background:linear-gradient(120deg,#145c2a 0%,#1a7f37 55%,#2e9c4f 100%);${FONT}color:#fff;position:relative">
    <div style="position:absolute;left:90px;top:120px;width:560px">
      <div style="display:flex;align-items:center;gap:16px"><div style="width:72px;height:72px;border-radius:18px;background:#fff;display:flex;align-items:center;justify-content:center"><img src="icon128.png" width="80" height="80"></div>
      <div style="font-size:52px;font-weight:800">Price Check</div></div>
      <div style="font-size:28px;margin-top:22px;line-height:1.3;font-weight:600">Is there a lower price somewhere else?<br>Ask your own AI assistant in one click.</div>
      <div style="font-size:18px;margin-top:18px;opacity:.9">Works with Grok Bot webhook routines · No analytics · Settings stay local</div></div>
    <div style="position:absolute;right:80px;top:70px;width:600px;height:420px;border-radius:12px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.3);background:#fff">
      <img src="cap-product.png" style="width:600px;display:block"></div>
    <img src="cap-popup-sent.png" style="position:absolute;right:110px;top:120px;border-radius:8px;box-shadow:0 12px 34px rgba(0,0,0,.35)">
  </body></html>`);
  s = await page(1400, 560); await s.goto(BASE + "marquee.html"); await sleep(300); await s.screenshot({ path: OUT + "/promo-marquee-1400x560.png" });

  await b.close(); srv.close();
  console.log("done");
})().catch((e) => { console.error(e); process.exit(1); });
