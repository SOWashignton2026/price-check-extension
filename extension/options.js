const $ = (id) => document.getElementById(id);
const fields = ["webhookUrl", "senderKey", "keyMode", "keyName"];
let savedUrl = "";

function setStatus(text, cls) { $("status").textContent = text; $("status").className = cls || ""; }

function updateKeyName() {
  const mode = $("keyMode").value;
  $("keyNameWrap").hidden = mode === "bearer";
  $("keyNameLabel").textContent = mode === "query" ? "Query parameter name" : "Header name";
  $("keyName").placeholder = mode === "query" ? "key" : "X-Webhook-Key";
}

function readForm() {
  const s = {};
  for (const f of fields) s[f] = $(f).value.trim();
  return s;
}

// Must be called synchronously from a click handler (user gesture) for chrome.permissions.request.
function requestOrigin(url) {
  let pattern;
  try { pattern = pcOriginPattern(url); } catch (e) { return Promise.reject(new Error("Invalid webhook URL: " + e.message)); }
  return chrome.permissions.request({ origins: [pattern] }).then((granted) => {
    if (!granted) throw new Error(`Permission to contact ${new URL(url).hostname} was declined.`);
    return pattern;
  });
}

async function persist(s) {
  await chrome.storage.local.set(s);
  // Drop access to a previous webhook origin we no longer use.
  if (savedUrl && savedUrl !== s.webhookUrl) {
    try {
      const oldP = pcOriginPattern(savedUrl);
      if (oldP !== pcOriginPattern(s.webhookUrl)) await chrome.permissions.remove({ origins: [oldP] });
    } catch (_) {}
  }
  savedUrl = s.webhookUrl;
}

$("save").addEventListener("click", () => {
  const s = readForm();
  if (!s.webhookUrl) { chrome.storage.local.set(s).then(() => setStatus("Saved (no webhook URL set).", "ok")); return; }
  if (s.keyMode !== "bearer" && !s.keyName) { setStatus("Enter the " + ($("keyMode").value === "query" ? "query parameter" : "header") + " name.", "err"); return; }
  requestOrigin(s.webhookUrl)
    .then(() => persist(s))
    .then(() => setStatus("Saved. Now click Send test.", "ok"))
    .catch((e) => setStatus(e.message, "err"));
});

$("test").addEventListener("click", () => {
  const s = readForm();
  if (!s.webhookUrl) { setStatus("Enter a webhook URL first.", "err"); return; }
  $("test").disabled = true;
  setStatus("Sending test…");
  requestOrigin(s.webhookUrl)
    .then(() => persist(s))
    .then(() => pcPostJson(s, {
      source: "price-check-extension",
      test: true,
      mode: "quick",
      url: null,
      page_title: "Price Check test",
      sent_at: new Date().toISOString(),
      product: null
    }))
    .then((r) => r.ok ? setStatus(`Test sent (HTTP ${r.status}). Settings saved. Check your assistant's chat for the confirmation.`, "ok") : setStatus(r.error, "err"))
    .catch((e) => setStatus(e.message, "err"))
    .finally(() => { $("test").disabled = false; });
});

$("toggleKey").addEventListener("click", () => {
  const show = $("senderKey").type === "password";
  $("senderKey").type = show ? "text" : "password";
  $("toggleKey").textContent = show ? "Hide" : "Show";
});

$("keyMode").addEventListener("change", updateKeyName);

pcGetSettings().then((s) => {
  for (const f of fields) $(f).value = s[f] || "";
  if (!["bearer", "header", "query"].includes($("keyMode").value)) $("keyMode").value = "bearer";
  savedUrl = s.webhookUrl;
  updateKeyName();
});
