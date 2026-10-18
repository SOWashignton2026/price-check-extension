// Shared helpers for the service worker, popup, options and welcome pages.
const PC_DEFAULTS = { webhookUrl: "", senderKey: "", keyMode: "bearer", keyName: "" };
const PC_TIMEOUT_MS = 20000;

async function pcGetSettings() {
  const s = await chrome.storage.local.get(PC_DEFAULTS);
  return { ...PC_DEFAULTS, ...s };
}

// Match pattern for the webhook origin, e.g. "https://hooks.example.com/*" (match patterns ignore ports).
function pcOriginPattern(webhookUrl) {
  const u = new URL(webhookUrl);
  if (u.protocol !== "https:") throw new Error("Webhook URL must start with https://");
  return `https://${u.hostname}/*`;
}

async function pcHasOriginPermission(webhookUrl) {
  try { return await chrome.permissions.contains({ origins: [pcOriginPattern(webhookUrl)] }); }
  catch (_) { return false; }
}

async function pcPostJson(settings, payload) {
  if (!settings.webhookUrl) return { ok: false, error: "Setup isn't finished: no webhook URL saved yet. Open Options (gear icon) and paste it." };
  let url;
  try { url = new URL(settings.webhookUrl); pcOriginPattern(settings.webhookUrl); }
  catch (e) { return { ok: false, error: "Invalid webhook URL: " + e.message }; }
  if (!(await pcHasOriginPermission(settings.webhookUrl))) {
    return { ok: false, error: `Access to ${url.hostname} not granted. Open Options and click Save to allow it.` };
  }
  const headers = { "Content-Type": "application/json" };
  const key = settings.senderKey || "";
  if (key) {
    if (settings.keyMode === "header") {
      const name = (settings.keyName || "").trim();
      if (!name) return { ok: false, error: "Custom header name is empty (Options)." };
      headers[name] = key;
    } else if (settings.keyMode === "query") {
      const name = (settings.keyName || "").trim();
      if (!name) return { ok: false, error: "Query parameter name is empty (Options)." };
      url.searchParams.set(name, key);
    } else {
      headers["Authorization"] = "Bearer " + key;
    }
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PC_TIMEOUT_MS);
  try {
    const res = await fetch(url.href, {
      method: "POST", headers, body: JSON.stringify(payload),
      credentials: "omit", cache: "no-store", redirect: "follow", referrerPolicy: "no-referrer", signal: ctrl.signal
    });
    if (res.ok) return { ok: true, status: res.status };
    let detail = "";
    try { detail = (await res.text()).slice(0, 200).trim(); } catch (_) {}
    let hint = "";
    if (res.status === 401 || res.status === 403) hint = " (check the sender key and the 'Send key as' setting)";
    if (res.status === 404) hint = " (check the webhook URL)";
    return { ok: false, status: res.status, error: `HTTP ${res.status} ${res.statusText || ""}`.trim() + hint + (detail ? ` – ${detail}` : "") };
  } catch (e) {
    const msg = e && e.name === "AbortError" ? `timed out after ${PC_TIMEOUT_MS / 1000}s` : (e && e.message) || String(e);
    return { ok: false, error: "Network error: " + msg };
  } finally {
    clearTimeout(timer);
  }
}
