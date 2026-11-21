from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
png_path = root / "icons" / "icon.png"
ico_path = root / "icons" / "icon.ico"

image = Image.open(png_path).convert("RGBA")
# Preserve the already-cropped PRINCIPIA artwork and its transparent outside area.
# Normalize to a square canvas without flattening alpha onto white.
side = max(image.width, image.height)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
canvas.alpha_composite(image, ((side - image.width) // 2, (side - image.height) // 2))
canvas.save(png_path, format="PNG", optimize=True)
canvas.save(ico_path, format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
print(f"Generated transparent circular icon: {ico_path}")
