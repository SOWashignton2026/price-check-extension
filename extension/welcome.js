const promptEl = document.getElementById("prompt");
const copyStatus = document.getElementById("copyStatus");

document.getElementById("copy").addEventListener("click", async () => {
  const text = promptEl.value;
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    // Fallback for browsers that block the async clipboard API here.
    promptEl.focus();
    promptEl.select();
    document.execCommand("copy");
  }
  copyStatus.textContent = "Copied! Now paste it into your Grok Bot chat.";
  setTimeout(() => { copyStatus.textContent = ""; }, 6000);
});

document.getElementById("openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage());

pcGetSettings().then((s) => { document.getElementById("connected").hidden = !s.webhookUrl; });
