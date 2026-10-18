# Price Check – Compare Prices via Webhook

A Chrome extension (Manifest V3) that sends the product page you're viewing to **your own AI assistant's webhook**, which checks other stores for a lower price and replies in your assistant's chat. Works with Grok Bot webhook routines; the setup below uses Grok Bot.

> Independent project. Not affiliated with or endorsed by xAI/Grok.

- **Check price** (quick): a fast table of cheaper current offers with links.
- **Full check**: also price history, reviews summary, return policies, shipping and coupons. Takes a few minutes.
- Right-click any page: "Check price of this page" / "Full check of this page".
- Shortcuts: **Alt+Shift+P** (quick), **Alt+Shift+F** (full). Change them at `chrome://extensions/shortcuts`.

The extension can't receive replies. Results always appear in your assistant's chat.

## Install (unpacked, for testing)

1. Unzip `price-check-public.zip` into a folder.
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the unzipped folder.
4. Pin it: puzzle-piece icon in the toolbar, then the pin next to **Price Check – Compare Prices via Webhook**.
5. A welcome page opens automatically with the setup steps. You can reopen it from the popup ("Finish setup") or the Options page.

## Set up (about 2 minutes)

1. **Create the routine in your Grok Bot.** On the welcome page, click **Copy setup prompt** (same text as `setup-prompt.txt`) and paste it into your Grok Bot chat. It creates a webhook routine named **Check price from browser extension**.
2. **Copy the webhook URL and key.** Open the extension's **Options** (gear icon in the popup) and paste the routine's **Webhook URL** and **Sender key**. Under **Send key as**, keep **Authorization: Bearer** unless your bot says to use a custom header or a query parameter (then enter its name).
3. **Save, then Send test.** Click **Save** and allow access to your webhook's site when Chrome asks. Click **Send test**. Your Grok Bot should confirm the connection in chat.

Then open any product page and click **Check price**.

## What gets sent

```json
{
  "source": "price-check-extension",
  "mode": "quick",
  "url": "https://store.example/product/123",
  "page_title": "Example Product – Store",
  "sent_at": "2026-10-18T19:45:00.000Z",
  "product": {
    "name": "Example Product", "price": 199.99, "currency": "USD", "retailer": "store.example",
    "brand": "Example", "sku": "123", "gtin": "0123456789012", "mpn": "EX-1", "asin": null, "image": "https://…"
  }
}
```

Missing fields are `null`. The test button sends `{ "test": true, "mode": "quick", ... }`.
Product details are read best-effort, in this order: JSON-LD schema.org Product/Offer, OpenGraph/product meta tags, Amazon page elements, then `itemprop="price"` microdata. Cookies, form data and full page HTML are never sent.

## Permissions

| Permission | Why |
|---|---|
| `activeTab` | Read the current tab only when you click the button, menu item or shortcut |
| `scripting` | Run the one-time product-details reader in that tab |
| `storage` | Save your settings locally (`chrome.storage.local`) |
| `contextMenus` | Right-click "Check price" items |
| optional `https://*/*` | Requested only for your webhook's site when you click Save; nothing else is ever granted |

See [PRIVACY.md](PRIVACY.md).

## Updating (unpacked)

Replace the folder's files with the new version, then click the reload icon on the extension's card in `chrome://extensions`. Settings are kept. Changes to how results look are made in your Grok Bot routine, not the extension.

## Troubleshooting

- **"Setup isn't finished"**: no webhook saved yet. Open Options.
- **"Access to … not granted"**: open Options and click Save, then allow.
- **HTTP 401/403**: wrong sender key, or the wrong **Send key as** choice.
- **Nothing in chat after "Sent!"**: check that the routine is enabled in your Grok Bot.
- Some pages (Chrome Web Store, `chrome://` pages) can't be read; the URL and title are still sent when possible.
