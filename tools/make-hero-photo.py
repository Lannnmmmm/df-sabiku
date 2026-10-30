# CATATAN PENGGUNAAN
# Alat ini membuat dua gambar untuk hero dari satu foto: cutout (latar dihapus) dan peta kedalaman.
# Koordinat kotak GrabCut di bawah DISETEL KHUSUS untuk foto yang dipakai sekarang (potret portrait,
# 996 x 1757 piksel). Untuk foto lain, sesuaikan kotak `rect(...)` dan area crop (x0, y0, x1, y1),
# atau buat cutout dengan layanan lain lalu taruh hasilnya langsung di public/images/.
#
# Keluaran PNG lalu diubah ke WebP (kualitas ~82) dan disimpan sebagai:
#   public/images/dewi-cutout.webp   (RGBA)
#   public/images/dewi-depth.webp    (grayscale)
# Ukuran kedua berkas harus sama, dan nilai 840 x 780 di src/gl/HeroScene.ts perlu disesuaikan
# bila ukurannya berubah.
#
# Penting: peta kedalaman di sini PERKIRAAN (siluet menggembung + tonjolan wajah), bukan estimasi
# kedalaman dari model AI. Cukup untuk paralaks halus, tidak untuk memutar wajah secara nyata.
#
# Kebutuhan: python3, opencv-python, numpy.
# Pakai:     python3 tools/make-hero-photo.py foto-asli.jpg folder-keluaran/
"""Cutout (GrabCut) + approximate depth map for the hero portrait.

Usage: python3 make_cutout.py <input.jpg> <out_dir>
Outputs: out_dir/dewi-cutout.png (RGBA, cropped bust, bottom fade), out_dir/dewi-depth.png (L)
"""
import sys
import cv2
import numpy as np

src, out_dir = sys.argv[1], sys.argv[2]
img = cv2.imread(src)
H, W = img.shape[:2]
print("input", W, H)

# --- GrabCut on the full image (downscaled for speed) -------------------------
scale = 0.6
small = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
sh, sw = small.shape[:2]
mask = np.full((sh, sw), cv2.GC_PR_BGD, np.uint8)

def rect(x0, y0, x1, y1, val):
    mask[int(y0 * scale):int(y1 * scale), int(x0 * scale):int(x1 * scale)] = val

# probable foreground: head + upper body region
rect(100, 300, 900, 1500, cv2.GC_PR_FGD)
# definite background: left stairs strip and far right corner/top area
rect(0, 0, 90, H, cv2.GC_BGD)
rect(0, 0, W, 250, cv2.GC_BGD)
rect(930, 0, W, H, cv2.GC_BGD)
# definite foreground: face, hijab, blazer core
rect(520, 480, 760, 700, cv2.GC_FGD)      # face
rect(380, 700, 700, 950, cv2.GC_FGD)      # hijab drape
rect(250, 800, 450, 1000, cv2.GC_FGD)     # left blazer
rect(700, 880, 840, 1100, cv2.GC_FGD)     # right blazer

bgd = np.zeros((1, 65), np.float64)
fgd = np.zeros((1, 65), np.float64)
cv2.grabCut(small, mask, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

# keep largest connected component, fill holes
n, lab, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
if n > 1:
    biggest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    fg = np.where(lab == biggest, 255, 0).astype(np.uint8)
inv = 255 - fg
n2, lab2, st2, _ = cv2.connectedComponentsWithStats(inv, 8)
for i in range(1, n2):
    x, y, w, h, a = st2[i]
    touches = x == 0 or y == 0 or x + w >= sw or y + h >= sh
    if not touches:
        fg[lab2 == i] = 255

# smooth + feather the matte at full resolution
fg_full = cv2.resize(fg, (W, H), interpolation=cv2.INTER_LINEAR)
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
fg_full = cv2.morphologyEx(fg_full, cv2.MORPH_OPEN, k)
fg_full = cv2.morphologyEx(fg_full, cv2.MORPH_CLOSE, k)
fg_full = cv2.erode(fg_full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))  # trim bg halo
alpha = cv2.GaussianBlur(fg_full, (0, 0), 2.2).astype(np.float32) / 255.0

# --- crop to bust, fade the bottom into particles -----------------------------
x0, y0, x1, y1 = 80, 290, 920, 1070
crop = img[y0:y1, x0:x1]
a = alpha[y0:y1, x0:x1].copy()
ch, cw = a.shape

# manual clean-up of two leftover background bits found in visual QA
a[:215, :372] = 0                                   # stair-railing stick, upper left
hsv_v = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)[..., 2]
patch = np.zeros_like(a, dtype=bool)
patch[340:440, 620:720] = True                      # dark gap behind the ear / strap
a[patch & (hsv_v < 95)] = 0
a = cv2.GaussianBlur(a, (0, 0), 1.2)
fade_start, fade_end = int(ch * 0.66), ch - 1
ramp = np.ones(ch, np.float32)
ramp[fade_start:] = np.linspace(1, 0, ch - fade_start) ** 1.4
a *= ramp[:, None]

rgba = np.dstack([crop, (a * 255).astype(np.uint8)])
cv2.imwrite(f"{out_dir}/dewi-cutout.png", rgba)

# --- approximate depth: inflated silhouette + soft face bulge ----------------
binary = (a > 0.5).astype(np.uint8)
dist = cv2.distanceTransform(binary, cv2.DIST_L2, 5).astype(np.float32)
dist = dist / (dist.max() + 1e-6)
dist = np.sqrt(dist)  # balloon profile
yy, xx = np.mgrid[0:ch, 0:cw].astype(np.float32)
fx, fy = (600 - x0), (600 - y0)  # face centre in crop coords
face = np.exp(-(((xx - fx) / 150.0) ** 2 + ((yy - fy) / 190.0) ** 2))
depth = 0.55 * dist + 0.45 * face
depth *= (a > 0.02)
depth = cv2.GaussianBlur(depth, (0, 0), 9)
depth = (255 * np.clip(depth / (depth.max() + 1e-6), 0, 1)).astype(np.uint8)
cv2.imwrite(f"{out_dir}/dewi-depth.png", depth)

# preview on dark green for visual QA
bg = np.zeros_like(crop)
bg[:] = (19, 42, 15)  # BGR of ~#0F2A13
prev = (crop * a[..., None] + bg * (1 - a[..., None])).astype(np.uint8)
cv2.imwrite(f"{out_dir}/preview.jpg", prev)
print("crop", cw, ch)
