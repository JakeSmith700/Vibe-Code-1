class TankObject {
    constructor(x, y, z, width, height) {
        this.x = x;
        this.y = y;
        this.z = z; // z-depth: negative is further back, positive is closer
        this.baseWidth = width;  // Store original size
        this.baseHeight = height;
        this.width = width;
        this.height = height;
        this.sprite = null;
        this.loaded = false;
        this.canvasWidth = 0;   // Will be updated
        this.canvasHeight = 0;  // Will be updated
    }

    // New method to update sizes based on canvas dimensions
    updateScale(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Base scale factor from canvas size (use smaller dimension)
        const baseScale = Math.min(canvasWidth, canvasHeight) / 800;
        // Depth scaling
        const depthScale = 1 + (this.z / 200);
        // Combined scaling
        const scale = baseScale * depthScale;
        
        // Update current dimensions
        this.width = this.baseWidth * scale;
        this.height = this.baseHeight * scale;
        
        return scale;
    }

    update(deltaTime) {
        // Override in subclasses for animated objects
    }

    draw(ctx) {
        if (!this.sprite || !this.loaded) return;
        
        // Update scaling before drawing
        const scale = this.updateScale(ctx.canvas.width, ctx.canvas.height);
        
        ctx.save();
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Set global composite operation for proper transparency
        ctx.globalCompositeOperation = 'source-over';
        
        ctx.translate(this.x, this.y);
        ctx.drawImage(
            this.sprite,
            -this.width/2, -this.height/2,
            this.width, this.height
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
        super(x, y, z, 400, 600); // 2x larger (was 200, 300)
        this.sprite = new Image();
        this.sprite.src = 'assets/castle/castle.png';
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
        // Position the sand bed at the bottom of the tank, full width, proper height
        super(width/2, height, -100, width, height * 0.3);
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.sprite = new Image();
        this.sprite.src = 'assets/sand/sand.png';
        
        this.sprite.onload = () => {
            console.log('SandBed: Texture loaded successfully');
            this.loaded = true;
        };
        
        this.sprite.onerror = (error) => {
            console.error('SandBed: Failed to load texture:', error);
        };
        
        // Initialize ripple parameters
        this.ripples = [];
        const numRipples = Math.max(3, Math.floor(width / 300)); // Scale number of ripples with width
        for (let i = 0; i < numRipples; i++) {
            this.ripples.push({
                x: Math.random() * width,
                y: height - height * 0.2 + Math.random() * (height * 0.1),
                phase: Math.random() * Math.PI * 2,
                frequency: 0.3 + Math.random() * 0.2,
                size: width * 0.05 + Math.random() * (width * 0.03)
            });
        }
    }

    updateScale(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Always ensure sand bed covers full width
        this.width = canvasWidth;
        // Height is a percentage of canvas height
        this.height = canvasHeight * 0.3;
        // Y position at bottom of canvas
        this.y = canvasHeight - this.height / 2;
        
        return 1.0; // Return scale factor of 1 as we're manually setting dimensions
    }

    draw(ctx) {
        if (!this.sprite || !this.loaded) return;
        
        try {
            ctx.save();
            
            // Update scaling to ensure proper dimensions
            this.updateScale(ctx.canvas.width, ctx.canvas.height);
            
            // Calculate sand position to ensure it's at the bottom
            const sandY = this.canvasHeight - this.height;
            
            // Draw base sand color
            ctx.fillStyle = '#e6d5ac';
            ctx.fillRect(0, sandY, this.width, this.height);
            
            // Create and draw the sand pattern
            const pattern = ctx.createPattern(this.sprite, 'repeat');
            if (!pattern) return;

            // Draw sand texture
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = pattern;
            ctx.fillRect(0, sandY, this.width, this.height);
            
            // Reset blend mode for effects
            ctx.globalCompositeOperation = 'source-over';
            
            // Draw ripples scaled to canvas size
            const time = performance.now() / 1000;
            this.ripples.forEach((ripple) => {
                const wavePhase = time * ripple.frequency + ripple.phase;
                const centerX = (ripple.x / this.width) * ctx.canvas.width + Math.sin(time * 0.2) * (this.width * 0.02);
                const centerY = sandY + (ripple.y - (this.canvasHeight - this.height)) / this.height * this.height;
                
                for (let i = 0; i < 2; i++) {
                    const baseRadius = ripple.size * (1 + Math.sin(wavePhase) * 0.1);
                    const radius = baseRadius * (ctx.canvas.width / 800) + i * (this.width * 0.02);
                    
                    const gradient = ctx.createRadialGradient(
                        centerX, centerY, radius * 0.5,
                        centerX, centerY, radius
                    );
                    
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            // Add water overlay
            const gradient = ctx.createLinearGradient(0, sandY - this.height * 0.2, 0, sandY + this.height * 0.5);
            gradient.addColorStop(0, 'rgba(42, 82, 152, 0.3)');
            gradient.addColorStop(0.5, 'rgba(42, 82, 152, 0.15)');
            gradient.addColorStop(1, 'rgba(42, 82, 152, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, sandY - this.height * 0.2, this.width, this.height * 1.2);
            
            ctx.restore();
        } catch (error) {
            console.error('SandBed: Error during rendering:', error);
        }
    }
}

class SeabedDecoration extends TankObject {
    constructor(x, y, type) {
        // Base sizes relative to canvas size (will be updated in updateScale)
        // Making decorations 4x larger
        const baseSize = {
            0: { w: 160, h: 240 },  // Seaweed (4x larger)
            1: { w: 160, h: 120 },  // Clam (4x larger)
            2: { w: 200, h: 160 }   // Rock (4x larger)
        }[type] || { w: 160, h: 160 };
        
        super(x, y, -90, baseSize.w, baseSize.h);
        this.type = type;
        this.sprite = new Image();
        this.sprite.src = 'assets/seabed/seabed.png';
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
            
            ctx.drawImage(this.sprite, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                    data[i + 3] = 0;
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            this.processedSprite = new Image();
            this.processedSprite.src = canvas.toDataURL();
            this.processedSprite.onload = () => {
                this.loaded = true;
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
            
            // Update scaling
            const scale = this.updateScale(ctx.canvas.width, ctx.canvas.height);
            
            // Get current frame data
            const frameData = this.animationData.types[this.type].frames[this.currentFrame];
            
            // Draw the decoration with proper scaling
            ctx.drawImage(
                this.processedSprite,
                frameData.x, frameData.y,
                frameData.width, frameData.height,
                this.x - this.width/2,
                this.y - this.height,
                this.width, this.height
            );

            ctx.restore();
        } catch (error) {
            console.error('SeabedDecoration: Error during rendering:', error);
        }
    }
}

class FoodParticle extends TankObject {
    constructor(x, y, z) {
        super(x, y, z, 10, 10); // Base size for food
        this.wobbleSpeed = 0.3; // Slower wobble
        this.wobbleAmount = 3; // More pronounced wobble
        this.fallSpeed = 50; // Fall speed in pixels per second
        this.zDriftSpeed = 20; // Z movement speed
        this.zDriftPhase = Math.random() * Math.PI * 2; // Random starting phase
        this.eaten = false;
        this.tankWidth = 0;  // Will be set by TankManager
        this.tankHeight = 0; // Will be set by TankManager
        this.baseSize = 10;  // Base size to scale from
    }

    update(deltaTime) {
        // Normalize deltaTime to seconds and cap it
        const dt = Math.min(deltaTime / 1000, 0.1);
        
        // Wobble horizontally with normalized time
        this.x += Math.sin(performance.now() * this.wobbleSpeed / 1000) * this.wobbleAmount * dt;
        
        // Add bounds checking
        const margin = this.width;
        if (this.tankWidth && this.x < margin) this.x = margin;
        if (this.tankWidth && this.x > this.tankWidth - margin) this.x = this.tankWidth - margin;
        
        // Fall downward with normalized time
        this.y += this.fallSpeed * dt;

        // Move in z-dimension with a sinusoidal pattern
        this.z = Math.sin(performance.now() * 0.001 + this.zDriftPhase) * this.zDriftSpeed;
        
        // Update size based on z-position - objects closer to viewer (higher z) appear larger
        const depthScale = 1 + (this.z / 100); // More pronounced z-scaling
        this.width = this.baseSize * depthScale;
        this.height = this.baseSize * depthScale;
    }

    draw(ctx) {
        ctx.save();
        
        // Calculate scale based on z-depth for 2.5D effect
        const depthScale = 1 + (this.z / 100); // More pronounced z-scaling
        const scaledSize = this.baseSize * depthScale;
        
        // Draw food particle with depth scaling
        ctx.fillStyle = '#ff9f43'; // Orange color for fish food
        ctx.beginPath();
        ctx.arc(this.x, this.y, scaledSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a slight glow effect, also scaled with depth
        ctx.shadowColor = '#ffa502';
        ctx.shadowBlur = 5 * depthScale;
        ctx.fillStyle = 'rgba(255, 165, 2, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, (scaledSize/2 + 3) * depthScale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Heart extends TankObject {
    constructor(x, y) {
        super(x, y, 0, 30, 30); // Larger size for hearts
        this.velocityY = -1; // Float upward
        this.opacity = 1;
        this.fadeSpeed = 0.005; // Slower fade
        this.sprite = new Image();
        this.sprite.src = 'assets/heart/heart.png';
        this.sprite.onload = () => {
            this.loaded = true;
            console.log('Heart: Sprite loaded successfully');
        };
    }

    update(deltaTime) {
        // Move upward
        this.y += this.velocityY;
        
        // Fade out
        this.opacity -= this.fadeSpeed;
    }

    draw(ctx) {
        if (!this.sprite || !this.loaded) return;

        ctx.save();
        
        // Set up transparency
        ctx.globalAlpha = this.opacity;
        
        // Add a glow effect
        ctx.shadowColor = '#FF69B4';
        ctx.shadowBlur = 10;
        
        // Draw the heart
        ctx.drawImage(
            this.sprite,
            this.x - this.width/2,
            this.y - this.height/2,
            this.width,
            this.height
        );
        
        ctx.restore();
    }
} 