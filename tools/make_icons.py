# Generates icons/icon{16,32,48,128}.png: green price tag with a white "$".
# 128px follows Chrome Web Store guidance (artwork ~96px with transparent padding).
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "extension", "icons")
TOOLS = os.path.dirname(os.path.abspath(__file__))
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def tag(S, hole=True):
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    green = (26, 127, 55, 255)
    k = S / 512
    r = lambda *v: [x * k for x in v]
    d.rounded_rectangle(r(170, 72, 500, 440), radius=64 * k, fill=green)
    d.polygon([tuple(r(190, 72)), tuple(r(12, 256)), tuple(r(190, 440))], fill=green)
    # soften the tip slightly
    d.ellipse(r(6, 226, 66, 286), fill=green)
    f = ImageFont.truetype(FONT, int(320 * k)) if os.path.exists(FONT) else ImageFont.load_default()
    bb = d.textbbox((0, 0), "$", font=f)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text((340 * k - w / 2 - bb[0], 256 * k - h / 2 - bb[1]), "$", font=f, fill="white")
    if hole:
        m = Image.new("L", (S, S), 0)
        ImageDraw.Draw(m).ellipse(r(96, 226, 156, 286), fill=255)
        im.paste((0, 0, 0, 0), mask=m)
    return im

def icon(n):
    ss = 8
    if n == 128:
        art = tag(96 * ss).resize((96, 96), Image.LANCZOS)
        out = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        out.paste(art, (16, 16), art)
        return out
    return tag(n * ss, hole=n >= 32).resize((n, n), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
for n in (16, 32, 48, 128):
    icon(n).save(os.path.join(OUT, f"icon{n}.png"), optimize=True)
# preview sheet (not shipped)
sheet = Image.new("RGBA", (16 + 32 + 48 + 128 + 50, 140), (255, 255, 255, 255))
x = 10
for n in (16, 32, 48, 128):
    im = Image.open(os.path.join(OUT, f"icon{n}.png")); sheet.paste(im, (x, 5), im); x += n + 10
sheet.save(os.path.join(TOOLS, "icons_preview.png"))
print("ok")
