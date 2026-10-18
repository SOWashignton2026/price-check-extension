# Chrome Web Store listing – Price Check – Compare Prices via Webhook

## Basics

| Field | Value |
|---|---|
| **Name (title)** | Price Check – Compare Prices via Webhook (40 characters) |
| **Summary** (manifest description, max 132) | Send the product page you're viewing to your own AI assistant's webhook to find a lower price. Works with Grok Bot routines. (124 characters) |
| **Category** | Lifestyle › Shopping (fallback: Productivity › Tools) |
| **Language** | English |
| **Version** | 1.0.0 |
| **Store icon** | `store-icon-128.png` (96 px of artwork with transparent padding) |
| **Screenshots (1280×800)** | `screenshot-1-popup.png`, `screenshot-2-results.png` (illustration, labelled as such), `screenshot-3-welcome.png`, `screenshot-4-options.png` |
| **Small promo tile (440×280)** | `promo-small-440x280.png` |
| **Marquee (1400×560, optional)** | `promo-marquee-1400x560.png` |
| **Homepage URL** | https://sowashignton2026.github.io/price-check-extension/ |
| **Privacy policy URL** | https://sowashignton2026.github.io/price-check-extension/privacy.html |
| **Support URL** | Optional. The homepage above, or GitHub Issues for this repository. |

## Full description

Price Check – Compare Prices via Webhook

Is there a lower price somewhere else? Click once on any product page and your own AI assistant goes and checks.

Price Check reads the product you're viewing (name, price, store, brand and product codes) and sends it to a webhook you set up in your own AI assistant. Your assistant compares prices at other stores and replies in your chat. Works with Grok Bot webhook routines, and the built-in setup guide includes a ready-made prompt that creates the routine for you.

TWO KINDS OF CHECK
• Check price (quick): a fast table of cheaper current offers for the same item, with links.
• Full check: also price history, a reviews summary, return policies, shipping, and coupons or deals. Takes a few minutes.

USE IT YOUR WAY
• Toolbar button
• Right-click any page: "Check price of this page" or "Full check of this page"
• Keyboard shortcuts: Alt+Shift+P (quick) and Alt+Shift+F (full)

SET UP IN ABOUT 2 MINUTES
1. Copy the setup prompt from the welcome page and paste it into your assistant's chat. It creates a webhook routine.
2. Paste that routine's webhook URL and key into Options.
3. Click Save, then Send test.

PRIVATE BY DESIGN
• Reads the page only when you click, use the menu, or press a shortcut. It never runs in the background.
• Sends only product details, the page address and its title, and only to the webhook you entered. Never cookies, form data or the full page.
• No developer servers, no accounts, no analytics, no ads. Settings stay in your browser.
• Asks for access only to your webhook's site, and only when you click Save.

Note: Price Check doesn't display results itself. Results appear in your assistant's chat. You need your own AI assistant that can receive webhooks (for example, a Grok Bot routine).

Independent project. Not affiliated with or endorsed by xAI/Grok.

## Single purpose

Price Check has one purpose: when the user asks, send the product details of the page they're viewing to a webhook the user configured (their own AI assistant), so the assistant can find a lower price elsewhere.

## Permission justifications

| Permission | Justification (paste into the dashboard) |
|---|---|
| `activeTab` | Lets the extension read the current tab only after the user clicks the toolbar button, a context-menu item or a keyboard shortcut. No permanent access to any site. |
| `scripting` | Runs a single self-contained function in the active tab, at the user's request, that reads the product's structured data (schema.org JSON-LD, OpenGraph/product meta tags, microdata, and the price/title elements on Amazon pages). It doesn't modify the page, and no remote code is used. |
| `storage` | Saves the user's webhook URL, sender key and key format in `chrome.storage.local` on the device. Nothing is synced or sent to the developer. |
| `contextMenus` | Adds two right-click items, "Check price of this page" and "Full check of this page". |
| Optional host permission `https://*/*` | The webhook address is chosen by the user and can be on any HTTPS host, so it can't be listed in advance. Nothing is granted at install. When the user clicks Save in Options, the extension asks only for that one origin (e.g. `https://hooks.example.com/*`), uses it only to POST the product details there, and gives up access to the old origin when the webhook changes. It never reads or changes pages on that host. |

**Remote code:** No. All JavaScript is in the package. No eval and no remotely hosted scripts.

## Data-use disclosures (Privacy practices tab)

**What user data do you collect?** (Collecting here means data leaving the device. It goes only to the user's own webhook, never to the developer.) Suggested answers, erring on the side of disclosing:

- [x] **Website content**: product name, price, brand, product codes, image URL and page title of the page the user chose to check.
- [x] **Web history**: the URL of the one page the user chose to check (sent only at the user's request, not browsing history).
- [ ] Personally identifiable information: no
- [ ] Health information: no
- [ ] Financial and payment information: no (product prices only; no payment data)
- [ ] Authentication information: no. The webhook key is a credential the user enters for their own service. It goes only to that service and is never collected by the developer. (If a reviewer pushes back, tick it and explain.)
- [ ] Personal communications: no
- [ ] Location: no
- [ ] User activity (clicks, keystrokes, mouse movement): no

**Certifications** (all three can be ticked truthfully):
- [x] I do not sell or transfer user data to third parties, apart from the approved use cases.
- [x] I do not use or transfer user data for purposes unrelated to my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

The privacy policy URL is required, because the extension handles website content.

## Test instructions for reviewers

Price Check sends data to a webhook the user owns, so it needs a webhook URL to test. No account with any AI service is needed. A free request inspector works:

1. Open https://webhook.site in a new tab. It shows a unique URL like `https://webhook.site/<random-id>`. Copy it.
2. Install the extension. The welcome page opens (setup guide). Click **Open Options**.
3. Paste the URL into **Webhook URL**. Type any text (e.g. `test-key-123`) into **Sender key**. Leave **Send key as** on **Authorization: Bearer**.
4. Click **Save** and accept Chrome's prompt to allow access to `webhook.site` (the only host requested).
5. Click **Send test**. The status shows "Test sent (HTTP 200)". On webhook.site, a POST appears with JSON `{"source":"price-check-extension","test":true,"mode":"quick",...}` and the header `Authorization: Bearer test-key-123`.
6. Open any product page (e.g. a product on amazon.com or bestbuy.com), click the toolbar icon, then **Check price**. The popup shows "Sent! Results will appear in your assistant's chat", and webhook.site shows the product payload (name, price, currency, retailer, brand, sku/gtin/mpn/asin, image, url, page_title, sent_at). **Full check** sends the same with `"mode":"full"`.
7. Also: right-click a page → "Check price of this page", or press Alt+Shift+P / Alt+Shift+F.

In normal use, the webhook belongs to the user's own AI assistant routine (e.g. Grok Bot), and results are posted in that assistant's chat. The extension itself never displays results.

## Notes for the submission

- Screenshot 2 (chat results) is a labelled illustration with fictional stores and prices. The other screenshots show the real extension UI; the popup's "Sent!" status and the example values in Options were filled in for the picture.
- Visibility: Public (or Unlisted first, for a soft launch).
- Regions: all.
