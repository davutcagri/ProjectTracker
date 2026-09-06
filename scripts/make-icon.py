#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFilter

S = 1024
SS = S * 4  # supersample

# ---------- background: dark vertical gradient, rounded-rect masked ----------
top = (0x22, 0x2a, 0x31)
bot = (0x0b, 0x0e, 0x11)
grad = Image.new("RGB", (1, SS))
for y in range(SS):
    t = y / (SS - 1)
    grad.putpixel((0, y), tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
grad = grad.resize((SS, SS)).convert("RGBA")

# Apple macOS icon grid: rounded rect ~= 824/1024 of canvas (≈ 9.8% margin each side)
inset = int(SS * 0.055)
rect = [inset, inset, SS - inset - 1, SS - inset - 1]
radius = int((SS - 2 * inset) * 0.225)

mask = Image.new("L", (SS, SS), 0)
ImageDraw.Draw(mask).rounded_rectangle(rect, radius=radius, fill=255)

img = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
img.paste(grad, (0, 0), mask)
d = ImageDraw.Draw(img)
d.rounded_rectangle(rect, radius=radius, outline=(255, 255, 255, 24), width=max(2, SS // 480))

EMER = (0x34, 0xd3, 0x99, 255)
cx = SS // 2
cy = int(SS * 0.485)

# ---------- soft emerald glow behind mark ----------
glow = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse(
    [cx - int(SS * 0.36), cy - int(SS * 0.30), cx + int(SS * 0.36), cy + int(SS * 0.30)],
    fill=(0x34, 0xd3, 0x99, 78))
glow = glow.filter(ImageFilter.GaussianBlur(SS // 18))
img.alpha_composite(Image.composite(glow, Image.new("RGBA", (SS, SS), (0, 0, 0, 0)), mask))
d = ImageDraw.Draw(img)

# ---------- checkmark (big, centered) ----------
w = int(SS * 0.108)
p1 = (int(SS * 0.250), cy + int(SS * 0.020))
p2 = (int(SS * 0.430), cy + int(SS * 0.190))
p3 = (int(SS * 0.775), cy - int(SS * 0.205))

# drop shadow
shadow = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
o = int(SS * 0.014)
sd.line([(p1[0] + o, p1[1] + o), (p2[0] + o, p2[1] + o), (p3[0] + o, p3[1] + o)],
        fill=(0, 0, 0, 150), width=w, joint="curve")
for p in (p1, p2, p3):
    sd.ellipse([p[0] - w // 2 + o, p[1] - w // 2 + o, p[0] + w // 2 + o, p[1] + w // 2 + o],
               fill=(0, 0, 0, 150))
shadow = shadow.filter(ImageFilter.GaussianBlur(SS // 90))
img.alpha_composite(Image.composite(shadow, Image.new("RGBA", (SS, SS), (0, 0, 0, 0)), mask))
d = ImageDraw.Draw(img)

d.line([p1, p2, p3], fill=EMER, width=w, joint="curve")
for p in (p1, p2, p3):
    d.ellipse([p[0] - w // 2, p[1] - w // 2, p[0] + w // 2, p[1] + w // 2], fill=EMER)

# ---------- progress tick strip (footer, subtle) ----------
seg_w = int(SS * 0.132)
seg_h = int(SS * 0.050)
gap = int(SS * 0.040)
total = 3 * seg_w + 2 * gap
x0 = cx - total // 2
y0 = int(SS * 0.790)
for i in range(3):
    x = x0 + i * (seg_w + gap)
    box = [x, y0, x + seg_w, y0 + seg_h]
    rr = seg_h // 2
    if i < 2:
        d.rounded_rectangle(box, radius=rr, fill=EMER)
    else:
        d.rounded_rectangle(box, radius=rr, outline=(0x34, 0xd3, 0x99, 95),
                            width=max(3, SS // 170))

# ---------- console chevron, top-left accent ----------
chx = int(SS * 0.300)
chy = int(SS * 0.212)
cw = int(SS * 0.030)
cs = int(SS * 0.044)
d.line([(chx - cs, chy - cs), (chx, chy), (chx - cs, chy + cs)],
       fill=(0x34, 0xd3, 0x99, 190), width=cw, joint="curve")

# ---------- downsample & save ----------
out = img.resize((S, S), Image.LANCZOS)
dst = "/private/tmp/claude-501/-Users-davutcagri-Documents-Projects-ProjectTracker/16af1232-906a-46ea-af71-a9627ad8526e/scratchpad/icon_1024.png"
out.save(dst)
print("wrote", dst)
