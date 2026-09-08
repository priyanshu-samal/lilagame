import os
from PIL import Image

src_dir = r"G:\lilagame\player_data\player_data\minimaps"
out_dir = r"G:\lilagame\public\minimaps"
os.makedirs(out_dir, exist_ok=True)

# Image map target sizes:
# AmbroseValley is 4320x4320 -> resize to 2048x2048 WebP (high quality, small size, instant GPU load)
# GrandRift is 2160x2158 -> resize to 2048x2048 WebP
# Lockdown is 9000x9000 -> resize to 2048x2048 WebP

images = [
    ("AmbroseValley_Minimap.png", "AmbroseValley.webp", 2048, 2048),
    ("GrandRift_Minimap.png", "GrandRift.webp", 2048, 2048),
    ("Lockdown_Minimap.jpg", "Lockdown.webp", 2048, 2048),
]

for src_name, out_name, target_w, target_h in images:
    src_path = os.path.join(src_dir, src_name)
    out_path = os.path.join(out_dir, out_name)
    print(f"Processing {src_name} -> {out_name} ({target_w}x{target_h})...")
    with Image.open(src_path) as im:
        # Convert RGBA or RGB
        if im.mode not in ('RGB', 'RGBA'):
            im = im.convert('RGB')
        resized = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
        resized.save(out_path, format="WEBP", quality=90)
        orig_size = os.path.getsize(src_path) / (1024 * 1024)
        new_size = os.path.getsize(out_path) / (1024 * 1024)
        print(f"  Done: {orig_size:.2f} MB -> {new_size:.2f} MB")

print("All minimap images processed successfully!")
