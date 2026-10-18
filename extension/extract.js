// Runs inside the page via chrome.scripting.executeScript({ func: extractProduct }).
// Must be self-contained. Reads only structured product metadata; nothing else.
function extractProduct() {
  const clean = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "number") return v;
    const s = String(v).replace(/\s+/g, " ").trim();
    return s ? s : null;
  };
  const parsePrice = (v) => {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    let s = String(v).replace(/[^\d.,]/g, "");
    if (!s) return null;
    const lastDot = s.lastIndexOf("."), lastComma = s.lastIndexOf(",");
    if (lastComma > lastDot) {
      // "1.234,56" or "12,99" -> comma is decimal separator if followed by 1-2 digits
      s = /,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    } else {
      s = s.replace(/,/g, "");
    }
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  };
  const symbolCurrency = (text) => {
    if (!text) return null;
    const t = String(text);
    if (/US\$|\$/.test(t)) {
      if (/CA\$|C\$/.test(t)) return "CAD";
      if (/A\$|AU\$/.test(t)) return "AUD";
      return "USD";
    }
    if (t.includes("€")) return "EUR";
    if (t.includes("£")) return "GBP";
    if (t.includes("¥")) return "JPY";
    if (t.includes("₹")) return "INR";
    const m = t.match(/\b([A-Z]{3})\b/);
    return m ? m[1] : null;
  };
  const meta = (...names) => {
    for (const n of names) {
      const el = document.querySelector(`meta[property="${n}"], meta[name="${n}"], meta[itemprop="${n}"]`);
      const c = el && clean(el.getAttribute("content"));
      if (c) return c;
    }
    return null;
  };
  const text = (sel) => {
    const el = document.querySelector(sel);
    return el ? clean(el.textContent) : null;
  };
  const firstImage = (img) => {
    if (!img) return null;
    if (typeof img === "string") return img;
    if (Array.isArray(img)) return firstImage(img[0]);
    if (typeof img === "object") return clean(img.url || img.contentUrl || null);
    return null;
  };
  const typeIs = (node, t) => {
    const ty = node && node["@type"];
    if (!ty) return false;
    return (Array.isArray(ty) ? ty : [ty]).some((x) => String(x).toLowerCase().endsWith(t.toLowerCase()));
  };

  const product = {
    name: null, price: null, currency: null, retailer: location.hostname || null,
    brand: null, sku: null, gtin: null, mpn: null, asin: null, image: null
  };
  const fill = (key, val) => { if (product[key] === null && val !== null && val !== undefined && val !== "") product[key] = val; };

  // 1) JSON-LD schema.org Product / Offer
  try {
    const nodes = [];
    const walk = (n, depth) => {
      if (!n || typeof n !== "object" || depth > 6) return;
      if (Array.isArray(n)) { n.forEach((x) => walk(x, depth + 1)); return; }
      nodes.push(n);
      if (n["@graph"]) walk(n["@graph"], depth + 1);
      if (n.mainEntity) walk(n.mainEntity, depth + 1);
      if (n.hasVariant) walk(n.hasVariant, depth + 1);
    };
    document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      try { walk(JSON.parse(s.textContent), 0); } catch (_) { /* ignore bad JSON-LD */ }
    });
    const prod = nodes.find((n) => typeIs(n, "Product") || typeIs(n, "ProductGroup"));
    let offers = prod ? prod.offers : null;
    if (!offers) offers = nodes.find((n) => typeIs(n, "Offer") || typeIs(n, "AggregateOffer")) || null;
    if (prod) {
      fill("name", clean(prod.name));
      const b = prod.brand;
      fill("brand", clean(b && typeof b === "object" ? (Array.isArray(b) ? (b[0] && (b[0].name || b[0])) : b.name) : b));
      fill("sku", clean(prod.sku));
      fill("gtin", clean(prod.gtin13 || prod.gtin12 || prod.gtin || prod.gtin14 || prod.gtin8 || prod.upc || null));
      fill("mpn", clean(prod.mpn || prod.model && (typeof prod.model === "object" ? prod.model.name : prod.model) || null));
      fill("image", firstImage(prod.image));
    }
    if (offers) {
      const list = Array.isArray(offers) ? offers : [offers];
      for (const o of list) {
        if (!o || typeof o !== "object") continue;
        let ps = o.priceSpecification;
        if (Array.isArray(ps)) ps = ps[0];
        const p = parsePrice(o.price ?? o.lowPrice ?? (ps && ps.price));
        if (p !== null) {
          fill("price", p);
          fill("currency", clean(o.priceCurrency || (ps && ps.priceCurrency) || null));
          if (!prod || !prod.sku) fill("sku", clean(o.sku));
          fill("gtin", clean(o.gtin13 || o.gtin12 || o.gtin || null));
          break;
        }
      }
    }
  } catch (_) { /* best effort */ }

  // 2) OpenGraph / product meta tags
  fill("name", meta("og:title", "twitter:title"));
  fill("price", parsePrice(meta("product:price:amount", "og:price:amount", "product:sale_price:amount")));
  fill("currency", meta("product:price:currency", "og:price:currency"));
  fill("brand", meta("product:brand", "og:brand"));
  fill("sku", meta("product:retailer_item_id", "product:sku"));
  fill("gtin", meta("product:upc", "product:ean", "product:gtin", "product:isbn"));
  fill("mpn", meta("product:mfr_part_no"));
  fill("image", meta("og:image", "og:image:secure_url", "twitter:image"));

  // 3) Amazon-specific
  if (/(^|\.)amazon\./i.test(location.hostname)) {
    const m = location.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/i);
    if (m) product.asin = m[1].toUpperCase();
    if (!product.asin) {
      const inp = document.querySelector('input#ASIN, input[name="ASIN"]');
      if (inp && /^[A-Z0-9]{10}$/i.test(inp.value)) product.asin = inp.value.toUpperCase();
    }
    // Amazon og:title is often generic, prefer #productTitle
    const t = text("#productTitle");
    if (t) product.name = t;
    const priceText =
      text("#corePrice_feature_div .a-price .a-offscreen") ||
      text("#corePriceDisplay_desktop_feature_div .a-price .a-offscreen") ||
      text("#apex_desktop .a-price .a-offscreen") ||
      text("#priceblock_ourprice") || text("#priceblock_dealprice") ||
      text(".a-price .a-offscreen");
    if (product.price === null && priceText) {
      product.price = parsePrice(priceText);
      fill("currency", symbolCurrency(priceText));
    }
    const byline = text("#bylineInfo");
    if (byline) fill("brand", clean(byline.replace(/^(Visit the|Brand:)\s*/i, "").replace(/\s*Store$/i, "")));
    const img = document.querySelector("#landingImage, #imgBlkFront, #main-image");
    if (img) fill("image", clean(img.getAttribute("data-old-hires") || img.getAttribute("src")));
    if (product.asin) fill("sku", product.asin);
  }

  // 4) Generic microdata
  const ip = document.querySelector('[itemprop="price"]');
  if (ip) {
    const raw = ip.getAttribute("content") || ip.textContent;
    fill("price", parsePrice(raw));
    fill("currency", symbolCurrency(raw));
  }
  const ic = document.querySelector('[itemprop="priceCurrency"]');
  if (ic) fill("currency", clean(ic.getAttribute("content") || ic.textContent));
  const iname = document.querySelector('[itemscope][itemtype*="Product"] [itemprop="name"]');
  if (iname) fill("name", clean(iname.getAttribute("content") || iname.textContent));
  for (const [key, props] of [["sku", ["sku"]], ["gtin", ["gtin13", "gtin12", "gtin", "gtin14", "gtin8"]], ["mpn", ["mpn", "model"]], ["brand", ["brand"]]]) {
    for (const p of props) {
      const el = document.querySelector(`[itemprop="${p}"]`);
      if (el) { fill(key, clean(el.getAttribute("content") || el.textContent)); break; }
    }
  }
  const iimg = document.querySelector('[itemprop="image"]');
  if (iimg) fill("image", clean(iimg.getAttribute("content") || iimg.getAttribute("src") || iimg.getAttribute("href")));

  if (product.image) {
    try { product.image = new URL(product.image, location.href).href; } catch (_) {}
  }
  if (typeof product.currency === "string") product.currency = product.currency.toUpperCase().slice(0, 8);
  return product;
}
