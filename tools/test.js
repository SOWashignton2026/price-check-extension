const fs = require("fs"), vm = require("vm"), { JSDOM } = require("jsdom");
const path = require("path");
const EXT = path.join(__dirname, "..", "extension") + path.sep;
const src = fs.readFileSync(EXT + "extract.js", "utf8");
function run(html, url) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only" });
  dom.window.eval(src);
  return dom.window.eval("JSON.stringify(extractProduct())");
}
const cases = {
  jsonld: [`<html><head><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":"Product","name":"Acme Blender 3000","brand":{"@type":"Brand","name":"Acme"},"sku":"AB3000","gtin13":"0123456789012","mpn":"AB-3000","image":["/img/b.jpg"],"offers":{"@type":"Offer","price":"129.99","priceCurrency":"USD"}}]}</script><meta property="og:title" content="OG title"></head><body></body></html>`, "https://shop.example.com/p/ab3000"],
  og: [`<html><head><meta property="og:title" content="Widget Pro"><meta property="product:price:amount" content="1.234,56"><meta property="product:price:currency" content="EUR"><meta property="og:image" content="https://cdn.x/w.png"><meta property="product:brand" content="WidgetCo"></head></html>`, "https://www.store.de/widget"],
  amazon: [`<html><head><meta property="og:title" content="Amazon.com"></head><body><span id="productTitle">  Echo Thing (4th Gen)  </span><a id="bylineInfo">Visit the Echo Store</a><div id="corePrice_feature_div"><span class="a-price"><span class="a-offscreen">$49.99</span></span></div><img id="landingImage" data-old-hires="https://m.media-amazon.com/x.jpg"></body></html>`, "https://www.amazon.com/Echo-Thing/dp/B0ABCDEF12/ref=sr_1"],
  microdata: [`<html><body><div itemscope itemtype="https://schema.org/Product"><span itemprop="name">Lamp</span><span itemprop="price" content="£19.50">£19.50</span><meta itemprop="sku" content="L-1"></div></body></html>`, "https://lamps.co.uk/lamp"],
  empty: [`<html><head><title>Hi</title></head></html>`, "https://blog.example.org/"]
};
for (const [k, [h, u]] of Object.entries(cases)) console.log(k.padEnd(10), run(h, u));

// pcPostJson with mocked chrome + fetch
const common = fs.readFileSync(EXT + "common.js", "utf8");
const calls = [];
const ctx = {
  URL, AbortController, setTimeout, clearTimeout, console,
  chrome: { permissions: { contains: async ({ origins }) => origins[0] === "https://hooks.example.com/*" }, storage: { local: { get: async (d) => d } } },
  fetch: async (url, opts) => { calls.push({ url, headers: opts.headers, credentials: opts.credentials, body: JSON.parse(opts.body) }); return { ok: true, status: 202 }; }
};
vm.createContext(ctx); vm.runInContext(common, ctx);
(async () => {
  const base = { webhookUrl: "https://hooks.example.com/w/abc", senderKey: "s3cret" };
  console.log(await ctx.pcPostJson({ ...base, keyMode: "bearer" }, { test: true, mode: "quick" }));
  console.log(await ctx.pcPostJson({ ...base, keyMode: "header", keyName: "X-Key" }, { test: true }));
  console.log(await ctx.pcPostJson({ ...base, keyMode: "query", keyName: "key" }, { test: true }));
  console.log(await ctx.pcPostJson({ ...base, webhookUrl: "http://hooks.example.com/w" }, {}));
  console.log(await ctx.pcPostJson({ ...base, webhookUrl: "https://other.example.com/w" }, {}));
  console.log(await ctx.pcPostJson({ webhookUrl: "" }, {}));
  for (const c of calls) console.log(c.url, JSON.stringify(c.headers), c.credentials);

  // background: onInstalled opens welcome on install only
  const bg = fs.readFileSync(EXT + "background.js", "utf8").replace(/^importScripts\(.*\);/m, "");
  const L = {}, created = [], menus = [];
  const ev = (n) => ({ addListener: (f) => (L[n] = f) });
  const bctx = { URL, console, setTimeout, chrome: {
    runtime: { onInstalled: ev("inst"), onMessage: ev("msg"), getURL: (p) => "chrome-extension://id/" + p, id: "id" },
    contextMenus: { removeAll: (cb) => cb(), create: (o) => menus.push(o.title), onClicked: ev("menu") },
    commands: { onCommand: ev("cmd") }, tabs: { create: (o) => created.push(o.url) } } };
  vm.createContext(bctx); vm.runInContext(bg, bctx);
  L.inst({ reason: "install" }); L.inst({ reason: "update" });
  console.log("menus:", menus, "tabs opened:", created);
})();
