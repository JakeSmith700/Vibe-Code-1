import cv2
import numpy as np
import json
from pathlib import Path

def detect_sprites(image_path, output_json_path):
    # Read the image
    img = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)
    
    # If the image has an alpha channel, use it as mask
    if img.shape[2] == 4:
        # Get alpha channel
        alpha = img[:, :, 3]
        # Create binary mask from alpha channel
        _, mask = cv2.threshold(alpha, 1, 255, cv2.THRESH_BINARY)
    else:
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Threshold to create binary image (assuming white/light background)
        _, mask = cv2.threshold(gray, 250, 255, cv2.THRESH_BINARY_INV)

    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Sort contours by y position first, then x position
    def contour_sort_key(contour):
        x, y, w, h = cv2.boundingRect(contour)
        row = y // (img.shape[0] // 4)  # Assuming 4 rows
        col = x // (img.shape[1] // 3)  # Assuming 3 columns
        return row * 3 + col  # 3 is number of columns

    # Filter out tiny contours and sort
    min_area = 100  # Adjust this value based on your sprite size
    valid_contours = [c for c in contours if cv2.contourArea(c) > min_area]
    sorted_contours = sorted(valid_contours, key=contour_sort_key)

    # Get bounding rectangles
    sprites = []
    for contour in sorted_contours:
        x, y, w, h = cv2.boundingRect(contour)
        # Add padding to avoid edge cutting
        padding = 2
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(img.shape[1] - x, w + 2*padding)
        h = min(img.shape[0] - y, h + 2*padding)
        sprites.append({"x": x, "y": y, "width": w, "height": h})

    # Calculate average dimensions for consistent frame size
    avg_width = int(np.mean([s["width"] for s in sprites]))
    avg_height = int(np.mean([s["height"] for s in sprites]))

    # Create animation data
    animation_data = {
        "frameWidth": avg_width,
        "frameHeight": avg_height,
        "animations": {
            "swim_left": [0, 1, 2],
            "swim_front": [4, 5],
            "swim_back": [7, 8],
            "idle_front": [5],
            "idle_back": [8]
        },
        "frameData": [
            {"x": s["x"], "y": s["y"]} for s in sprites
        ]
    }

    # Save to JSON
    with open(output_json_path, 'w') as f:
        json.dump(animation_data, f, indent=4)

    # Debug visualization
    debug_img = img.copy()
    if debug_img.shape[2] == 4:
        debug_img = cv2.cvtColor(debug_img, cv2.COLOR_BGRA2BGR)

    for i, sprite in enumerate(sprites):
        color = (0, 255, 0)  # Green for bounding boxes
        cv2.rectangle(debug_img, 
                     (sprite["x"], sprite["y"]), 
                     (sprite["x"] + sprite["width"], sprite["y"] + sprite["height"]), 
                     color, 1)
        # Add sprite index
        cv2.putText(debug_img, str(i), 
                    (sprite["x"], sprite["y"] - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

    # Save debug visualization
    debug_output = str(Path(image_path).parent / 'sprite_detection_debug.png')
    cv2.imwrite(debug_output, debug_img)

    print(f"Found {len(sprites)} sprites")
    print(f"Average dimensions: {avg_width}x{avg_height}")
    print(f"Debug visualization saved to: {debug_output}")
    print(f"Animation data saved to: {output_json_path}")

if __name__ == "__main__":
    # Get the script's directory
    script_dir = Path(__file__).parent
    
    # Set paths
    sprite_path = script_dir / "clownfish" / "clownfish.png"
    json_path = script_dir / "clownfish" / "animation.json"
    
    # Run detection
    detect_sprites(sprite_path, json_path) 