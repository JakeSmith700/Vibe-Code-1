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
        // Position the sand bed at the bottom of the tank
        super(width/2, height, -100, width, 200);
        this.canvasHeight = height;
        this.sprite = new Image();
        this.sprite.src = '/assets/sand/sand.png';
        
        this.sprite.onload = () => {
            console.log('SandBed: Texture loaded successfully');
            this.loaded = true;
        };
        
        // Initialize ripple parameters - just a few subtle ones near the bottom
        this.ripples = [];
        for (let i = 0; i < 3; i++) {  // Fewer ripples
            this.ripples.push({
                x: Math.random() * width,
                y: height - 100 + Math.random() * 50,  // Keep ripples near the bottom
                phase: Math.random() * Math.PI * 2,
                frequency: 0.3 + Math.random() * 0.2,  // Slower, gentler movement
                size: 60 + Math.random() * 40         // Smaller sizes
            });
        }
    }

    draw(ctx) {
        if (!this.sprite || !this.loaded) return;
        
        try {
            ctx.save();
            
            // Draw from the bottom of the tank
            const extraHeight = 50;
            const sandY = this.canvasHeight - this.height;
            
            // First draw a solid sand-colored background
            ctx.fillStyle = '#e6d5ac';
            ctx.fillRect(0, sandY, this.width, this.height + extraHeight);
            
            // Create and draw the sand pattern
            const pattern = ctx.createPattern(this.sprite, 'repeat-x');
            if (!pattern) {
                console.error('SandBed: Failed to create pattern');
                return;
            }

            // Draw the sand texture with multiply blend for better visibility
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = pattern;
            ctx.fillRect(0, sandY, this.width, this.height + extraHeight);
            
            // Reset blend mode for the water effects
            ctx.globalCompositeOperation = 'source-over';
            
            // Draw subtle ripples
            const time = performance.now() / 1000;
            
            this.ripples.forEach((ripple) => {
                const wavePhase = time * ripple.frequency + ripple.phase;
                const centerX = ripple.x + Math.sin(time * 0.2) * 30;  // Gentler movement
                const centerY = ripple.y + Math.cos(time * 0.15) * 10; // Very subtle vertical movement
                
                // Draw subtle concentric ripples
                for (let i = 0; i < 2; i++) {  // Fewer rings
                    const baseRadius = ripple.size * (1 + Math.sin(wavePhase) * 0.1);
                    const radius = baseRadius + i * 30;
                    
                    const gradient = ctx.createRadialGradient(
                        centerX, centerY, radius * 0.5,
                        centerX, centerY, radius
                    );
                    
                    // Much more subtle gradient
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');  // Less opaque
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            // Add subtle water overlay gradient
            const gradient = ctx.createLinearGradient(0, sandY - 50, 0, sandY + 150);
            gradient.addColorStop(0, 'rgba(42, 82, 152, 0.3)');
            gradient.addColorStop(0.5, 'rgba(42, 82, 152, 0.15)');
            gradient.addColorStop(1, 'rgba(42, 82, 152, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, sandY - 50, this.width, this.height + 100);
            
            // Add very subtle caustics
            ctx.globalCompositeOperation = 'overlay';
            for (let i = 0; i < 5; i++) {  // Fewer caustics
                const x = (Math.sin(time * 0.5 + i) * 0.5 + 0.5) * this.width;
                const y = sandY + (Math.cos(time * 0.4 + i) * 30);
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');  // Much less intense
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, sandY, this.width, this.height);
            }
            
            ctx.restore();
        } catch (error) {
            console.error('SandBed: Error during rendering:', error);
        }
    }
}

class SeabedDecoration extends TankObject {
    constructor(x, y, type) {
        super(x, y, -90, 50, 50);
        this.sprite = new Image();
        this.sprite.src = '/assets/seabed/seabed.png';
        this.type = type;
        this.currentFrame = 0;
        this.totalFrames = 3;
        this.animationTimer = 0;
        this.animationDuration = 3000 + Math.random() * 3000;
        this.lastAnimationTime = performance.now();
        this.isAnimating = false;
        this.processedSprite = null;
        this.animationData = null;

        // Load animation data
        fetch('/assets/seabed/animation.json')
            .then(response => response.json())
            .then(data => {
                this.animationData = data;
                this.frameWidth = data.frameWidth;
                this.frameHeight = data.frameHeight;
                console.log(`SeabedDecoration: Animation data loaded for type ${this.type}`);
            })
            .catch(error => {
                console.error('SeabedDecoration: Failed to load animation data:', error);
            });

        this.sprite.onload = () => {
            // Process transparency
            const canvas = document.createElement('canvas');
            canvas.width = this.sprite.width;
            canvas.height = this.sprite.height;
            const ctx = canvas.getContext('2d');
            
            // Draw the original sprite
            ctx.drawImage(this.sprite, 0, 0);
            
            // Get the image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Process each pixel
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Check if pixel is white or very light
                if (r > 240 && g > 240 && b > 240) {
                    data[i + 3] = 0; // Set alpha to 0
                }
            }
            
            // Put the processed image data back
            ctx.putImageData(imageData, 0, 0);
            
            // Create a new image with the processed data
            this.processedSprite = new Image();
            this.processedSprite.src = canvas.toDataURL();
            this.processedSprite.onload = () => {
                // Adjust size based on type
                if (this.type === 0) { // Seaweed
                    this.width = 40;
                    this.height = 60;
                } else if (this.type === 1) { // Clam
                    this.width = 40;
                    this.height = 30;
                } else { // Rock
                    this.width = 50;
                    this.height = 40;
                }
                this.loaded = true;
                console.log(`SeabedDecoration: Type ${this.type} loaded and processed successfully`);
            };
        };
    }

    update(deltaTime) {
        if (!this.loaded || !this.animationData) return;

        const currentTime = performance.now();
        
        // Check if we should start a new animation cycle
        if (!this.isAnimating && currentTime - this.lastAnimationTime >= this.animationDuration) {
            this.isAnimating = true;
            this.currentFrame = 0;
            this.animationTimer = 0;
        }

        // If we're animating, progress through frames
        if (this.isAnimating) {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.animationData.frameDuration) {
                this.currentFrame++;
                this.animationTimer = 0;

                // Reset after animation cycle
                if (this.currentFrame >= this.totalFrames) {
                    this.currentFrame = 0;
                    this.isAnimating = false;
                    this.lastAnimationTime = currentTime;
                }
            }
        }
    }

    draw(ctx) {
        if (!this.processedSprite || !this.loaded || !this.animationData) return;

        try {
            ctx.save();
            
            // Get the current frame data
            const frameData = this.animationData.types[this.type].frames[this.currentFrame];
            
            // Draw the decoration using the processed sprite
            ctx.drawImage(
                this.processedSprite,
                frameData.x, frameData.y,
                frameData.width, frameData.height,
                this.x - this.width / 2,
                this.y - this.height,
                this.width, this.height
            );

            ctx.restore();
        } catch (error) {
            console.error('SeabedDecoration: Error during rendering:', error);
        }
    }
} 