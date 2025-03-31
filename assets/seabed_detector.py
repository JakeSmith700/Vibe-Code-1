import cv2
import numpy as np
import json
import sys
from pathlib import Path

def detect_seabed_sprites(image_path):
    # Read the image
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")

    # Convert to RGBA (we need alpha channel for transparency)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

    # Get dimensions
    height, width = img.shape[:2]
    
    # Since we know it's a 3x3 grid:
    frame_width = width // 3
    frame_height = height // 3
    
    # Create animation data for each type
    animation_data = {
        "types": [
            {
                "name": "seaweed",
                "frames": []
            },
            {
                "name": "clam",
                "frames": []
            },
            {
                "name": "rock",
                "frames": []
            }
        ],
        "frameWidth": frame_width,
        "frameHeight": frame_height,
        "frameDuration": 200  # 200ms per frame
    }

    # For each type (row)
    for type_idx in range(3):
        # For each frame (column)
        for frame_idx in range(3):
            frame_data = {
                "x": frame_idx * frame_width,
                "y": type_idx * frame_height,
                "width": frame_width,
                "height": frame_height
            }
            animation_data["types"][type_idx]["frames"].append(frame_data)

    return animation_data

def main():
    if len(sys.argv) != 2:
        print("Usage: python seabed_detector.py <image_path>")
        sys.exit(1)

    image_path = Path(sys.argv[1])
    if not image_path.exists():
        print(f"Error: Image file not found: {image_path}")
        sys.exit(1)

    try:
        animation_data = detect_seabed_sprites(image_path)
        
        # Save to animation.json in the same directory as the image
        output_path = image_path.parent / "animation.json"
        with open(output_path, 'w') as f:
            json.dump(animation_data, f, indent=2)
            
        print(f"Successfully processed {image_path}")
        print(f"Animation data saved to: {output_path}")
        print(f"Found frames: {len(animation_data['types']) * 3} (3 types × 3 frames)")
        print(f"Frame dimensions: {animation_data['frameWidth']}x{animation_data['frameHeight']}")
        
    except Exception as e:
        print(f"Error processing image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 