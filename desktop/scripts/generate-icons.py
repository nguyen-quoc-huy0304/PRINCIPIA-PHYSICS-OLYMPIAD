from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
png_path = root / "icons" / "icon.png"
ico_path = root / "icons" / "icon.ico"

image = Image.open(png_path).convert("RGBA")
# Keep the original artwork and alpha channel; make a square canvas.
side = max(512, image.width, image.height)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
canvas.alpha_composite(image, ((side - image.width) // 2, (side - image.height) // 2))
# Windows packaging requires an ICO containing a real 256x256 frame.
canvas.save(png_path, format="PNG", optimize=True)
canvas.save(ico_path, format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
print(f"Generated {canvas.width}x{canvas.height} transparent PNG and multi-size ICO: {ico_path}")
