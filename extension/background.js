importScripts("common.js", "extract.js");

const MENU_QUICK = "price-check-page";
const MENU_FULL = "full-check-page";
const TITLE = "Price Check";
const normMode = (m) => (m === "full" ? "full" : "quick");

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.removeAll(() => {
    const contexts = ["page", "image", "link", "selection"];
    chrome.contextMenus.create({ id: MENU_QUICK, title: "Check price of this page", contexts });
    chrome.contextMenus.create({ id: MENU_FULL, title: "Full check of this page", contexts });
  });
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function checkPrice(tab, mode) {
  mode = normMode(mode);
  if (!tab) tab = await getActiveTab();
  if (!tab || !tab.url || !/^https?:/i.test(tab.url)) {
    return { ok: false, mode, error: "This tab isn't a web page. Open a product page and try again." };
  }
  const settings = await pcGetSettings();
  if (!settings.webhookUrl) {
    return { ok: false, mode, needsSetup: true, error: "Setup isn't finished: no webhook saved yet. Click 'Finish setup' or open Options." };
  }

  let product = null;
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractProduct });
    product = res && res.result ? res.result : null;
  } catch (e) {
    // Protected pages (e.g. the Chrome Web Store) can't be read; still send URL + title.
    console.warn("Price Check: could not read page", e);
  }
  if (!product) {
    let host = null;
    try { host = new URL(tab.url).hostname; } catch (_) {}
    product = { name: null, price: null, currency: null, retailer: host, brand: null, sku: null, gtin: null, mpn: null, asin: null, image: null };
  }

  const payload = {
    source: "price-check-extension",
    mode,
    url: tab.url,
    page_title: tab.title || null,
    sent_at: new Date().toISOString(),
    product
  };
  const result = await pcPostJson(settings, payload);
  return { ...result, mode, product };
}

async function flashBadge(tabId, result) {
  const opts = tabId ? { tabId } : {};
  const label = result.mode === "full" ? "Full check" : "Quick check";
  await chrome.action.setBadgeBackgroundColor({ ...opts, color: result.ok ? "#1a7f37" : "#cf222e" });
  await chrome.action.setBadgeText({ ...opts, text: result.ok ? "✓" : "!" });
  await chrome.action.setTitle({ ...opts, title: result.ok ? `${TITLE}: ${label} sent! Results will appear in your assistant's chat` : `${TITLE}: ${result.error}` });
  setTimeout(() => {
    chrome.action.setBadgeText({ ...opts, text: "" });
    chrome.action.setTitle({ ...opts, title: TITLE });
  }, result.ok ? 6000 : 15000);
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_QUICK && info.menuItemId !== MENU_FULL) return;
  const result = await checkPrice(tab, info.menuItemId === MENU_FULL ? "full" : "quick");
  await flashBadge(tab && tab.id, result);
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "check-price" && command !== "full-check") return;
  tab = tab || (await getActiveTab());
  const result = await checkPrice(tab, command === "full-check" ? "full" : "quick");
  await flashBadge(tab && tab.id, result);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Only accept messages from this extension's own pages.
  if (sender.id !== chrome.runtime.id) return;
  if (msg && msg.type === "check-price") {
    (async () => {
      const tab = msg.tabId ? await chrome.tabs.get(msg.tabId) : await getActiveTab();
      sendResponse(await checkPrice(tab, msg.mode));
    })().catch((e) => sendResponse({ ok: false, error: String((e && e.message) || e) }));
    return true; // async response
  }
});
