# Privacy Policy – Price Check – Compare Prices via Webhook

_Last updated: October 18, 2026_

Price Check – Compare Prices via Webhook ("the extension") is an independent project. Not affiliated with or endorsed by xAI/Grok.

## The short version

- The developer collects **nothing**. There are no developer servers, no accounts, no analytics, no tracking, and no ads.
- The extension sends data **only to the webhook URL you configure yourself** (for example, your own Grok Bot routine), and only when you ask it to.
- Your settings stay **in your browser**.

## What the extension reads, and when

The extension reads the current tab **only when you trigger it**: by clicking **Check price** or **Full check**, using the right-click menu item, or pressing the keyboard shortcut. It never runs in the background on pages you visit.

When triggered, it reads only:

- the page address (URL) and page title, and
- product details the page publishes: name, price, currency, store (website name), brand, SKU, GTIN/UPC/EAN, MPN, Amazon ASIN, and product image address.

It does **not** read or send cookies, passwords, form fields, browsing history, or the full contents of the page.

## Where that data goes

That information is sent in a single HTTPS request to the webhook URL you entered in Options, along with the sender key you entered (as an Authorization header, a custom header, or a query parameter, as you chose). The webhook belongs to the service you chose (for example, your own Grok Bot), and what happens to the data after that is governed by that service's own terms and privacy policy.

The developer of this extension never receives a copy.

## What is stored

Your webhook URL, sender key, and "Send key as" choice are saved with `chrome.storage.local` on your device. They are not synced or sent anywhere except as part of the request to your webhook. Removing the extension deletes them.

## Permissions

- **activeTab** and **scripting**: read product details from the tab you are on, only when you trigger a check.
- **storage**: save your settings locally.
- **contextMenus**: add the right-click "Check price" items.
- **Optional access to your webhook's site** (requested when you click Save): lets the extension send requests to that one site. You can revoke it any time at `chrome://extensions`.

## Changes and contact

If this policy changes, the updated version will be published with the extension and on its listing page. Questions: contact the developer through the Chrome Web Store listing.
