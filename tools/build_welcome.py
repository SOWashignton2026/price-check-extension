import html, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / "extension"
prompt = (root / "setup-prompt.txt").read_text().rstrip("\n")
page = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to Price Check – Compare Prices via Webhook</title>
  <link rel="stylesheet" href="welcome.css">
</head>
<body>
  <header>
    <img src="icons/icon128.png" alt="" width="64" height="64">
    <div>
      <h1>Welcome to Price Check</h1>
      <p class="sub">A one-click button that asks <b>your own AI assistant</b> to find a better price for the product you're looking at.
        <span class="works">Works with Grok Bot webhook routines.</span></p>
    </div>
  </header>

  <div id="connected" class="done" hidden>✓ You're set up. Open any product page and click the Price Check button in your toolbar.</div>

  <section>
    <h2>What it does</h2>
    <p>When you're on a product page in any online store, click <b>Check price</b>. The extension sends the product's name, price,
      store and product codes to your Grok Bot. Your Grok Bot then looks for the same item at other stores and posts the results
      in your Grok Bot chat. <b>Full check</b> also covers price history, reviews, return policies, shipping and coupons, and takes a few minutes.</p>
    <p>The extension can't show results by itself. They always appear in your Grok Bot chat.</p>
  </section>

  <section>
    <h2>What you need</h2>
    <p>Your own AI assistant that can receive webhooks, such as a Grok Bot. The extension doesn't do the price search itself.
      It hands the page to your assistant, so you set it up once below. The steps below are written for Grok Bot.
      Takes about 2 minutes.</p>
  </section>

  <section>
    <h2>Set it up in 3 steps</h2>
    <ol class="steps">
      <li>
        <h3>Copy the setup prompt and paste it into your Grok Bot chat</h3>
        <p>It asks your Grok Bot to create a webhook routine named <b>Check price from browser extension</b>.</p>
        <textarea id="prompt" readonly rows="14" spellcheck="false">""" + html.escape(prompt) + """</textarea>
        <div class="row">
          <button id="copy" type="button">Copy setup prompt</button>
          <span id="copyStatus" role="status"></span>
        </div>
      </li>
      <li>
        <h3>Copy the webhook URL and key into Options</h3>
        <p>When your Grok Bot has created the routine, it gives you a <b>webhook URL</b> and a <b>sender key</b>.
          Paste both into the extension's Options. If your bot says the key goes in a custom header or a query parameter,
          pick that under <b>Send key as</b>; otherwise leave it on <b>Authorization: Bearer</b>.</p>
        <button id="openOptions" type="button" class="secondary">Open Options</button>
      </li>
      <li>
        <h3>Save, then Send test</h3>
        <p>Click <b>Save</b> and allow Chrome to contact your webhook's site (only that site). Then click <b>Send test</b>.
          Your Grok Bot should reply in chat that the connection works.</p>
      </li>
    </ol>
  </section>

  <section>
    <h2>Tips</h2>
    <ul>
      <li>Pin the extension: click the puzzle-piece icon in Chrome's toolbar, then the pin next to Price Check.</li>
      <li>Shortcuts: <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> for a quick check, <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> for a full check.
        You can also right-click any page.</li>
      <li>Privacy: the page is read only when you ask. Only product details, the page address and title go to <i>your</i> webhook.
        No cookies, form data or full page contents are ever sent, and the developer collects nothing. <a href="privacy.html">Privacy policy</a></li>
    </ul>
  </section>

  <footer>Price Check – Compare Prices via Webhook is an independent project. Not affiliated with or endorsed by xAI/Grok.</footer>
  <script src="common.js"></script>
  <script src="welcome.js"></script>
</body>
</html>
"""
(root / "welcome.html").write_text(page)
print("ok")
