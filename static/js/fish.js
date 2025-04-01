class Fish extends TankObject {
    constructor(x, y, animData) {
        // Make fish size relative to screen size
        const baseWidth = animData.frameWidth * 0.25;
        const baseHeight = animData.frameHeight * 0.25;
        super(x, y, 0, baseWidth, baseHeight);
        
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
        
        this.velocityX = 0;
        this.velocityY = 0;
        this.velocityZ = 0;
        this.speed = 1.5;
        this.direction = 1;
        this.currentAnimation = 'swim_left';
        this.frameIndex = 0;
        this.animationSpeed = 0.05;
        this.animationTimer = 0;
        this.targetX = x;
        this.targetY = y;
        this.targetZ = 0;
        this.wobbleAmplitude = 2;
        this.wobbleFrequency = 0.03;
        this.wobbleTimer = 0;
        this.idleTimer = 0;
        this.minIdleTime = 60;
        this.depthChangeThreshold = 0.3;
        this.sprite = new Image();
        this.sprite.src = '/assets/clownfish/clownfish.png';
        this.sprite.onload = () => {
            this.loaded = true;
            console.log('Fish: Sprite loaded successfully');
        };
        this.animationData = animData;
        this.lastUpdateTime = performance.now();
        this.stuckTimer = 0;
        this.lastPosition = { x, y, z: 0 };
        this.avoidanceForceX = 0;
        this.avoidanceForceY = 0;
        this.avoidanceForceZ = 0;
        this.detectionRadius = Infinity; // Unlimited detection radius
        this.eatRadius = 25; // Larger eat radius
        this.currentFood = null;
        this.chaseSpeed = 3; // Reduced from 4
        this.normalSpeed = 1; // Back to normal speed
        this.chaseAcceleration = 0.3; // Reduced from 0.5
        this.foodDetectionDelay = 1000; // 1 second delay before detecting food
        this.lastFoodCheck = 0;
        this.canvasWidth = 0;
        this.canvasHeight = 0;
    }

    updateScale(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Base scale factor from canvas size (use smaller dimension)
        const baseScale = Math.min(canvasWidth, canvasHeight) / 800;
        
        // Make sure fish is visible on any screen size
        const minScale = 0.5; // Minimum scale to ensure fish is visible
        const scaleMultiplier = Math.max(minScale, baseScale);
        
        // Adjust fish size with scale and depth
        const depthScale = 1 + (this.z / 200);
        const finalScale = scaleMultiplier * depthScale;
        
        // Update current dimensions
        this.width = this.baseWidth * finalScale;
        this.height = this.baseHeight * finalScale;
        
        // Update eat radius based on canvas size
        this.eatRadius = Math.max(25, Math.min(canvasWidth, canvasHeight) * 0.05);
        
        return finalScale;
    }

    pickNewTarget() {
        // Generate new random target within reasonable bounds
        const margin = this.width;
        const maxDepth = 100;
        
        // Use actual canvas dimensions for boundaries
        if (this.canvasWidth === 0 || this.canvasHeight === 0) {
            console.error('Fish: Canvas dimensions not set properly');
            return;
        }
        
        this.targetX = margin + Math.random() * (this.canvasWidth - 2 * margin);
        this.targetY = margin + Math.random() * (this.canvasHeight - 2 * margin);
        this.targetZ = -maxDepth + Math.random() * (2 * maxDepth);
        
        console.log('Fish: New target set to', this.targetX.toFixed(2), this.targetY.toFixed(2), this.targetZ.toFixed(2));
    }

    update(deltaTime) {
        const currentTime = performance.now();
        const timeSinceLastUpdate = currentTime - this.lastUpdateTime;
        
        // If we have food to chase, make it our target
        if (this.currentFood && !this.currentFood.eaten) {
            this.targetX = this.currentFood.x;
            this.targetY = this.currentFood.y;
            
            // Move faster when chasing food
            this.speed = this.chaseSpeed;
            
            // Check if we're close enough to eat
            const dx = this.currentFood.x - this.x;
            const dy = this.currentFood.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.eatRadius) {
                // Eat the food and create a heart
                this.currentFood.eaten = true;
                this.currentFood = null;
                
                // Emit event for heart creation
                const event = new CustomEvent('createHeart', {
                    detail: {
                        x: this.x,
                        y: this.y - this.height/2
                    }
                });
                document.dispatchEvent(event);
                
                // Pick a new random target
                this.pickNewTarget();
                this.speed = this.normalSpeed;
            }
        } else {
            this.speed = this.normalSpeed;
        }

        // Calculate distance to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dz = this.targetZ - this.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < 1) {
            if (this.idleTimer >= this.minIdleTime) {
                this.pickNewTarget();
                this.idleTimer = 0;
            } else {
                this.idleTimer++;
            }
            return;
        }

        // Calculate base target velocity with increased acceleration when chasing food
        const acceleration = this.currentFood ? this.chaseAcceleration : 0.1;
        const targetVelocityX = (dx / distance) * this.speed;
        const targetVelocityY = (dy / distance) * this.speed;
        const targetVelocityZ = (dz / distance) * this.speed;

        // Apply avoidance forces (decay over time)
        const avoidanceDecay = 0.95;
        this.avoidanceForceX *= avoidanceDecay;
        this.avoidanceForceY *= avoidanceDecay;
        this.avoidanceForceZ *= avoidanceDecay;

        // Smooth velocity changes with avoidance forces
        const finalTargetVelocityX = targetVelocityX + this.avoidanceForceX;
        const finalTargetVelocityY = targetVelocityY + this.avoidanceForceY;
        const finalTargetVelocityZ = targetVelocityZ + this.avoidanceForceZ;

        this.velocityX += (finalTargetVelocityX - this.velocityX) * acceleration;
        this.velocityY += (finalTargetVelocityY - this.velocityY) * acceleration;
        this.velocityZ += (finalTargetVelocityZ - this.velocityZ) * acceleration;

        // Calculate new position
        const newX = this.x + this.velocityX;
        const newY = this.y + this.velocityY;
        const newZ = this.z + this.velocityZ;

        // Simple boundary checking - use actual canvas dimensions
        const margin = this.width;
        const maxDepth = 100;
        const isBlocked = 
            newX < margin || newX > this.canvasWidth - margin ||
            newY < margin || newY > this.canvasHeight - margin ||
            newZ < -maxDepth || newZ > maxDepth;

        if (!isBlocked) {
            this.x = newX;
            this.y = newY;
            this.z = newZ;
        } else {
            // Apply avoidance force
            const centerX = this.canvasWidth / 2;
            const centerY = this.canvasHeight / 2;
            
            this.avoidanceForceX = (centerX - this.x) * 0.01;
            this.avoidanceForceY = (centerY - this.y) * 0.01;
            this.avoidanceForceZ = -this.velocityZ; // Reverse z direction

            // Pick new target if really stuck
            if (Math.abs(this.velocityX) < 0.1 && Math.abs(this.velocityY) < 0.1) {
                this.pickNewTarget();
            }
        }

        // Natural swimming motion
        this.wobbleTimer += this.wobbleFrequency;
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        const wobbleOffset = Math.sin(this.wobbleTimer) * this.wobbleAmplitude * (speed / this.speed);
        this.y += wobbleOffset * 0.1;

        // Update last position and time
        this.lastPosition = { x: this.x, y: this.y, z: this.z };
        this.lastUpdateTime = currentTime;

        // Animation updates
        const absVelocityX = Math.abs(this.velocityX);
        const absVelocityY = Math.abs(this.velocityY);
        const absVelocityZ = Math.abs(this.velocityZ);
        const movementThreshold = 0.05;

        // Update direction for left/right movement
        if (absVelocityX > movementThreshold) {
            this.direction = this.velocityX < 0 ? 1 : -1;
        }

        // Determine primary movement direction
        const isMovingZ = absVelocityZ > this.depthChangeThreshold;
        const isMovingX = absVelocityX > movementThreshold;
        const isIdle = absVelocityX < movementThreshold && absVelocityY < movementThreshold && absVelocityZ < movementThreshold;

        // Choose animation based on movement
        if (isIdle) {
            this.currentAnimation = this.z > 0 ? 'idle_front' : 'idle_back';
        } else if (isMovingZ) {
            this.currentAnimation = this.velocityZ > 0 ? 'swim_front' : 'swim_back';
        } else if (isMovingX) {
            this.currentAnimation = 'swim_left';
        }

        // Update animation frame
        this.animationTimer += this.animationSpeed * (speed / this.speed);
        if (this.animationTimer >= 1) {
            this.animationTimer = 0;
            const frames = this.animationData.animations[this.currentAnimation];
            if (frames && frames.length > 0) {
                this.frameIndex = (this.frameIndex + 1) % frames.length;
            }
        }
    }

    draw(ctx) {
        if (!this.sprite || !this.loaded || !this.animationData) return;

        // Update canvas dimensions and scale
        this.updateScale(ctx.canvas.width, ctx.canvas.height);

        // Safety checks for animation data
        const animations = this.animationData.animations[this.currentAnimation];
        if (!animations || !animations.length) {
            // If current animation is invalid, fall back to swim_left
            this.currentAnimation = 'swim_left';
            this.frameIndex = 0;
            return;
        }

        // Ensure frameIndex is within bounds
        this.frameIndex = this.frameIndex % animations.length;
        const frame = animations[this.frameIndex];
        
        const frameData = this.animationData.frameData[frame];
        if (!frameData) {
            console.error('Missing frame data for frame:', frame);
            return;
        }
        
        // Use width and height that were updated in updateScale
        const scaledWidth = this.width;
        const scaledHeight = this.height;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Add subtle rotation based on vertical velocity
        const rotationAngle = Math.atan2(this.velocityY, Math.abs(this.velocityX)) * 0.2;
        ctx.rotate(rotationAngle);

        // Only flip horizontally for side-swimming animation
        if (this.direction < 0 && this.currentAnimation === 'swim_left') {
            ctx.scale(-1, 1);
        }

        // Draw the fish with improved visibility
        ctx.drawImage(
            this.sprite,
            frameData.x, frameData.y,
            this.animationData.frameWidth, this.animationData.frameHeight,
            -scaledWidth/2, -scaledHeight/2,
            scaledWidth, scaledHeight
        );
        
        ctx.restore();
    }

    detectFood(foodParticles) {
        const currentTime = performance.now();
        
        // Only check for food every second
        if (currentTime - this.lastFoodCheck < this.foodDetectionDelay) {
            return;
        }
        this.lastFoodCheck = currentTime;

        if (this.currentFood && !this.currentFood.eaten) return; // Already chasing food

        // Find the closest food particle (no distance limit)
        let closestFood = null;
        let closestDistance = Infinity;

        for (const food of foodParticles) {
            if (food.eaten) continue;

            const dx = food.x - this.x;
            const dy = food.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestFood = food;
            }
        }

        if (closestFood) {
            this.currentFood = closestFood;
            console.log('Fish detected food at distance:', closestDistance);
        }
    }
} 