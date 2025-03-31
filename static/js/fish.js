class Fish extends TankObject {
    constructor(x, y, z, tankManager, animData) {
        super(x, y, z, animData.frameWidth * 0.25, animData.frameHeight * 0.25);
        this.tankManager = tankManager;
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
        this.targetZ = z;
        this.wobbleAmplitude = 2;
        this.wobbleFrequency = 0.03;
        this.wobbleTimer = 0;
        this.idleTimer = 0;
        this.minIdleTime = 60;
        this.depthChangeThreshold = 0.3;
        this.sprite = fishSprite;
        this.loaded = true;
        this.animationData = animData;
    }

    pickNewTarget() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const pos = this.tankManager.getSafePosition(this.width, this.height);
            
            // Check if the path to this position is blocked
            if (!this.tankManager.isPositionBlocked(pos.x, pos.y, pos.z, this.width, this.height)) {
                this.targetX = pos.x;
                this.targetY = pos.y;
                this.targetZ = pos.z;
                return true;
            }
            attempts++;
        }
        
        // If we couldn't find a safe position, just stay where we are
        this.targetX = this.x;
        this.targetY = this.y;
        this.targetZ = this.z;
        return false;
    }

    update(deltaTime) {
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

        // Calculate acceleration towards target
        const acceleration = 0.05;
        const targetVelocityX = (dx / distance) * this.speed;
        const targetVelocityY = (dy / distance) * this.speed;
        const targetVelocityZ = (dz / distance) * this.speed;

        // Smooth velocity changes
        this.velocityX += (targetVelocityX - this.velocityX) * acceleration;
        this.velocityY += (targetVelocityY - this.velocityY) * acceleration;
        this.velocityZ += (targetVelocityZ - this.velocityZ) * acceleration;

        // Calculate new position
        const newX = this.x + this.velocityX;
        const newY = this.y + this.velocityY;
        const newZ = this.z + this.velocityZ;

        // Check if new position would be blocked
        if (!this.tankManager.isPositionBlocked(newX, newY, newZ, this.width, this.height)) {
            this.x = newX;
            this.y = newY;
            this.z = newZ;
        } else {
            // If blocked, pick a new target
            this.pickNewTarget();
        }

        // Natural swimming motion
        this.wobbleTimer += this.wobbleFrequency;
        const wobbleOffset = Math.sin(this.wobbleTimer) * this.wobbleAmplitude;
        this.y += wobbleOffset * 0.1;

        // Calculate movement magnitudes
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
        this.animationTimer += this.animationSpeed;
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