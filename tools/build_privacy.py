import html, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
md = (ROOT / "extension" / "PRIVACY.md").read_text()
NAME = "Price Check – Compare Prices via Webhook"
def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    s = re.sub(r"(?<!\w)_(.+?)_(?!\w)", r"<i>\1</i>", s)
    return s
out, inlist = [], False
for line in md.splitlines():
    if line.startswith("- "):
        if not inlist: out.append("<ul>"); inlist = True
        out.append("  <li>" + inline(line[2:]) + "</li>"); continue
    if inlist: out.append("</ul>"); inlist = False
    if line.startswith("## "): out.append("<h2>" + inline(line[3:]) + "</h2>")
    elif line.startswith("# "): out.append("<h1>" + inline(line[2:]) + "</h1>")
    elif line.strip(): out.append("<p>" + inline(line) + "</p>")
if inlist: out.append("</ul>")
body = "\n".join(out)
CSS = """body{font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1f2328;background:#fff}
h1{font-size:28px;line-height:1.25}h2{font-size:20px;margin-top:32px}a{color:#0969da}code{background:#f6f8fa;padding:1px 5px;border-radius:4px;font-size:90%}
nav{margin-bottom:24px;font-size:14px}footer{margin-top:48px;padding-top:12px;border-top:1px solid #d0d7de;font-size:13px;color:#57606a}"""
# 1) inside the extension (uses welcome.css)
(ROOT / "extension" / "privacy.html").write_text(
  f'<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>Privacy Policy – {NAME}</title>\n  <link rel="stylesheet" href="welcome.css">\n</head>\n<body>\n{body}\n</body>\n</html>\n')
# 2) standalone site
site = ROOT / "docs"
head = lambda t, d: (f'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
  f'<title>{t}</title>\n<meta name="description" content="{d}">\n<link rel="icon" type="image/png" href="icon128.png">\n<style>\n{CSS}\n</style>\n</head>\n<body>\n')
(site / "privacy.html").write_text(head(f"Privacy Policy – {NAME}", "Privacy policy for the Price Check Chrome extension.") +
  '<nav><a href="index.html">← Home</a></nav>\n' + body + f'\n<footer>{NAME} · Independent project. Not affiliated with or endorsed by xAI/Grok.</footer>\n</body>\n</html>\n')
(site / "index.html").write_text(head(NAME, "A Chrome extension that sends the product page you're viewing to your own AI assistant's webhook to find a lower price.") + f"""<header style="display:flex;gap:16px;align-items:center"><img src="icon128.png" width="72" height="72" alt=""><h1 style="margin:0">{NAME}</h1></header>
<p>A Chrome extension that sends the product page you're viewing to <b>your own AI assistant's webhook</b>, which looks for a lower price at other stores and replies in your assistant's chat. Works with Grok Bot webhook routines.</p>
<ul>
  <li><b>Check price</b>: a quick table of cheaper current offers, with links.</li>
  <li><b>Full check</b>: also price history, reviews, return policies, shipping and coupons.</li>
  <li>Reads the page only when you click. Sends data only to the webhook you set up. Collects nothing.</li>
</ul>
<p><a href="privacy.html"><b>Privacy policy</b></a></p>
<footer>Independent project. Not affiliated with or endorsed by xAI/Grok.</footer>
</body>
</html>
""")
print("ok")
