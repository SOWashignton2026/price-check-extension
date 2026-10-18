const btn = document.getElementById("check");
const fullBtn = document.getElementById("full");
const statusEl = document.getElementById("status");
const preview = document.getElementById("preview");
const setupEl = document.getElementById("setup");

function openWelcome() {
  chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  window.close();
}

document.getElementById("gear").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
document.getElementById("finishSetup").addEventListener("click", (e) => {
  e.preventDefault();
  openWelcome();
});

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = cls || "";
}

async function send(mode) {
  btn.disabled = fullBtn.disabled = true;
  setStatus(mode === "full" ? "Sending full check…" : "Sending…");
  preview.textContent = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const res = await chrome.runtime.sendMessage({ type: "check-price", mode, tabId: tab && tab.id });
    if (res && res.ok) {
      setStatus("Sent! Results will appear in your assistant's chat", "ok");
    } else {
      setStatus((res && res.error) || "Unknown error", "err");
      if (res && res.needsSetup) setupEl.hidden = false;
    }
    const p = res && res.product;
    if (p && (p.name || (p.price !== null && p.price !== undefined))) {
      const price = p.price !== null && p.price !== undefined ? `${p.price}${p.currency ? " " + p.currency : ""}` : "price not found";
      preview.textContent = `${p.name || "(no name)"} — ${price}`;
    }
  } catch (e) {
    setStatus(String((e && e.message) || e), "err");
  } finally {
    btn.disabled = fullBtn.disabled = false;
  }
}

btn.addEventListener("click", () => send("quick"));
fullBtn.addEventListener("click", () => send("full"));

pcGetSettings().then((s) => { setupEl.hidden = !!s.webhookUrl; });
