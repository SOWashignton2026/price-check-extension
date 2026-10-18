# Price Check – Compare Prices via Webhook

A Chrome extension (Manifest V3, version 1.0.0) that sends the product page you are viewing to **your own AI assistant's webhook**. The assistant looks for a lower price at other stores and replies in your chat. It works with Grok Bot webhook routines. The welcome page includes a ready-made prompt that creates the routine.

Not affiliated with or endorsed by xAI.

The extension reads product details only when you ask (toolbar button, right-click menu, or keyboard shortcut) and sends them only to the webhook you configure. There is no analytics, and settings stay in the browser.

**Privacy policy:** https://sowashignton2026.github.io/price-check-extension/privacy.html

## Repository layout

| Path | Contents |
|---|---|
| `extension/` | Manifest V3 source. This is the folder that gets zipped for the Chrome Web Store. |
| `docs/` | Static home page and privacy policy for GitHub Pages (`main` branch, `/docs`). Includes `.nojekyll`. |
| `store/` | Chrome Web Store listing text and images. |
| `tools/` | Icon and screenshot build scripts, plus checks. |

## Install unpacked

1. Open `chrome://extensions` and turn on **Developer mode** (top right).
2. Click **Load unpacked** and choose the `extension/` folder in this repository.
3. Pin it: puzzle-piece icon in the toolbar, then the pin next to **Price Check – Compare Prices via Webhook**.
4. A welcome page opens with the setup steps. You can reopen it from the popup ("Finish setup") or the Options page.

Paste your Grok Bot (or other assistant) webhook URL and sender key into Options, click **Save**, allow access to that site when Chrome asks, then click **Send test**. Open any product page and click **Check price**. Results appear in your assistant's chat, not in the extension.

## Build the store zip

From the repository root:

```bash
./tools/build-zip.sh
```

This writes `price-check-extension.zip` next to the repository root, with the files from `extension/` at the **root of the zip** (`manifest.json` is at the top level, which is what the Chrome Web Store expects). Pass another path as the first argument to choose the output file. Zip files are gitignored.

## Privacy

https://sowashignton2026.github.io/price-check-extension/privacy.html

The same policy is in `docs/privacy.html` (the page GitHub Pages serves) and inside the extension package.

## License

MIT. Copyright 2026 Sergey Ovcharenko. See [LICENSE](LICENSE).
