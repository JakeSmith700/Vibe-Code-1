class Fish extends TankObject {
    constructor(x, y, animData) {
        super(x, y, 0, animData.frameWidth * 0.25, animData.frameHeight * 0.25);
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
    }

    pickNewTarget() {
        // Generate new random target within reasonable bounds
        const margin = 50;
        const maxDepth = 100;
        
        this.targetX = margin + Math.random() * (800 - 2 * margin); // Assuming 800px width
        this.targetY = margin + Math.random() * (600 - 2 * margin); // Assuming 600px height
        this.targetZ = -maxDepth + Math.random() * (2 * maxDepth);
        
        console.log('Fish: New target set to', this.targetX.toFixed(2), this.targetY.toFixed(2), this.targetZ.toFixed(2));
    }

    update(deltaTime) {
        const currentTime = performance.now();
        const timeSinceLastUpdate = currentTime - this.lastUpdateTime;
        
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

        // Calculate base target velocity
        const acceleration = 0.1;
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

        // Simple boundary checking
        const margin = 50;
        const maxDepth = 100;
        const isBlocked = 
            newX < margin || newX > 800 - margin ||
            newY < margin || newY > 600 - margin ||
            newZ < -maxDepth || newZ > maxDepth;

        if (!isBlocked) {
            this.x = newX;
            this.y = newY;
            this.z = newZ;
        } else {
            // Apply avoidance force
            const centerX = 400; // Assuming 800px width
            const centerY = 300; // Assuming 600px height
            
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
        
        // Scale based on depth
        const depthScale = 1 + (this.z / 200);
        const currentScale = depthScale * 0.25; // Base scale is 0.25
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Add subtle rotation based on vertical velocity
        const rotationAngle = Math.atan2(this.velocityY, Math.abs(this.velocityX)) * 0.2;
        ctx.rotate(rotationAngle);

        // Only flip horizontally for side-swimming animation
        if (this.direction < 0 && this.currentAnimation === 'swim_left') {
            ctx.scale(-1, 1);
        }

        // Draw the fish
        const scaledWidth = this.animationData.frameWidth * currentScale;
        const scaledHeight = this.animationData.frameHeight * currentScale;
        
        ctx.drawImage(
            this.sprite,
            frameData.x, frameData.y,
            this.animationData.frameWidth, this.animationData.frameHeight,
            -scaledWidth/2, -scaledHeight/2,
            scaledWidth, scaledHeight
        );
        
        ctx.restore();
    }
} 