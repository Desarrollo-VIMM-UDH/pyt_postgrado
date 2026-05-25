"""
Generates a 3D spinning UDH logo GIF replicating the CSS preserve-3d login effect.
The logo always reads correctly (never mirrored), just like in the live app.
Transparent background version.
"""
from PIL import Image, ImageEnhance
import math
import os

# --- Configuration ---
LOGO_PATH = r"public\udh-logo.png"
OUTPUT_PATH = r"public\udh-logo-spinning.gif"
CANVAS_SIZE = 400
NUM_FRAMES = 72
FRAME_DURATION = 110       # ms per frame (~8s full rotation)
NUM_LAYERS = 30
LAYER_SPACING = 1.0
PERSPECTIVE = 800
LOGO_SCALE = 0.65


def render_frame(logo_img, angle_deg, canvas_size):
    """Render one frame of the spinning 3D logo with transparent background."""
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    cx, cy = canvas_size / 2, canvas_size / 2

    angle_rad = math.radians(angle_deg)
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)

    logo_w, logo_h = logo_img.size

    # Build all 30 layers with world-space positions
    layers = []
    for i in range(NUM_LAYERS):
        local_z = (i - NUM_LAYERS / 2 + 0.5) * LAYER_SPACING
        world_z = local_z * cos_a
        world_x = local_z * sin_a
        layers.append({'index': i, 'z': world_z, 'x': world_x})

    # Sort back-to-front (painter's algorithm)
    layers.sort(key=lambda l: l['z'])

    for layer in layers:
        i = layer['index']
        z = layer['z']
        x_off = layer['x']

        scale = PERSPECTIVE / (PERSPECTIVE + z)
        if scale <= 0.01:
            continue

        is_front_face = (i == NUM_LAYERS - 1)
        is_back_face = (i == 0)
        is_edge = is_front_face or is_back_face

        width_compression = abs(cos_a)
        scaled_h = int(logo_h * LOGO_SCALE * scale)
        scaled_w = int(logo_w * LOGO_SCALE * scale * max(width_compression, 0.02))

        if scaled_w <= 0 or scaled_h <= 0:
            continue

        px = cx + x_off * scale * LOGO_SCALE - scaled_w / 2
        py = cy - scaled_h / 2

        if is_edge:
            resized = logo_img.resize((scaled_w, scaled_h), Image.LANCZOS)
            shadow_strength = 0.15 + 0.85 * width_compression
            if shadow_strength < 1.0:
                enhancer = ImageEnhance.Brightness(resized)
                resized = enhancer.enhance(shadow_strength)
        else:
            edge_color = (40, 35, 20, 255)
            dark = Image.new("RGBA", (scaled_w, scaled_h), edge_color)
            alpha_source = logo_img.resize((scaled_w, scaled_h), Image.LANCZOS)
            alpha = alpha_source.split()[3]
            dark.putalpha(alpha)
            resized = dark

        canvas.paste(resized, (int(px), int(py)), resized)

    return canvas


def main():
    print("Loading logo...")
    logo = Image.open(LOGO_PATH).convert("RGBA")

    print(f"Generating {NUM_FRAMES} frames...")
    frames = []

    for f in range(NUM_FRAMES):
        angle = (f / NUM_FRAMES) * 360
        frame = render_frame(logo, angle, CANVAS_SIZE)

        # Convert RGBA to P mode with transparency for GIF
        # Use a consistent palette by quantizing
        p_frame = frame.convert("RGBA").quantize(colors=255, method=2)
        frames.append(p_frame)

        if (f + 1) % 10 == 0:
            print(f"  Frame {f + 1}/{NUM_FRAMES}")

    print(f"Saving GIF to {OUTPUT_PATH}...")
    frames[0].save(
        OUTPUT_PATH,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=False,
        transparency=0,
        disposal=2,  # Clear frame before drawing next (needed for transparency)
    )

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"Done! Size: {size_kb:.0f} KB")
    print(f"File: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
