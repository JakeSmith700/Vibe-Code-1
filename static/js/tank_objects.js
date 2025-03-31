class TankObject {
    constructor(x, y, z, width, height) {
        this.x = x;
        this.y = y;
        this.z = z; // z-depth: negative is further back, positive is closer
        this.width = width;
        this.height = height;
        this.sprite = null;
        this.loaded = false;
    }

    update(deltaTime) {
        // Override in subclasses for animated objects
    }

    draw(ctx) {
        if (!this.sprite || !this.loaded) return;
        
        // Calculate scale based on depth
        const depthScale = 1 + (this.z / 200);
        const scaledWidth = this.width * depthScale;
        const scaledHeight = this.height * depthScale;

        ctx.save();
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Set global composite operation for proper transparency
        ctx.globalCompositeOperation = 'source-over';
        
        ctx.translate(this.x, this.y);
        ctx.drawImage(
            this.sprite,
            -scaledWidth/2, -scaledHeight/2,
            scaledWidth, scaledHeight
        );
        ctx.restore();
    }

    // Helper method to check if this object is behind another
    isBehind(otherObject) {
        return this.z < otherObject.z;
    }

    // Collision detection for depth interaction
    intersects(other) {
        const depthScale = 1 + (this.z / 200);
        const otherDepthScale = 1 + (other.z / 200);
        
        const thisWidth = this.width * depthScale;
        const thisHeight = this.height * depthScale;
        const otherWidth = other.width * otherDepthScale;
        const otherHeight = other.height * otherDepthScale;

        return !(
            this.x + thisWidth/2 < other.x - otherWidth/2 ||
            this.x - thisWidth/2 > other.x + otherWidth/2 ||
            this.y + thisHeight/2 < other.y - otherHeight/2 ||
            this.y - thisHeight/2 > other.y + otherHeight/2
        );
    }
}

class Castle extends TankObject {
    constructor(x, y, z) {
        super(x, y, z, 200, 300); // Adjust size as needed
        this.sprite = new Image();
        this.sprite.src = '/assets/castle/castle.png';
        this.sprite.onload = () => {
            this.loaded = true;
            // Create a temporary canvas to process the image
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = this.sprite.width;
            tempCanvas.height = this.sprite.height;
            
            // Draw the image to the temporary canvas
            tempCtx.drawImage(this.sprite, 0, 0);
            
            // Get the image data
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            // Convert white to transparent
            for (let i = 0; i < data.length; i += 4) {
                // If pixel is white or very close to white
                if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) {
                    data[i + 3] = 0; // Set alpha to 0
                }
            }
            
            // Put the modified image data back
            tempCtx.putImageData(imageData, 0, 0);
            
            // Create a new image from the modified canvas
            const processedImage = new Image();
            processedImage.src = tempCanvas.toDataURL();
            processedImage.onload = () => {
                this.sprite = processedImage;
            };
        };
    }
}

class SandBed extends TankObject {
    constructor(width, height) {
        super(width/2, height - 50, -100, width, 100);
        this.sprite = new Image();
        this.sprite.src = '/assets/sand/sand.png';
        this.sprite.onload = () => {
            this.loaded = true;
        };
    }

    draw(ctx) {
        if (!this.sprite || !this.loaded) return;
        
        // Sand bed doesn't scale with depth, but tiles horizontally
        const pattern = ctx.createPattern(this.sprite, 'repeat-x');
        if (pattern) {
            ctx.save();
            ctx.fillStyle = pattern;
            ctx.fillRect(0, this.y - this.height/2, this.width, this.height);
            ctx.restore();
        }
    }
} 