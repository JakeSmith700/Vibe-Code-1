class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.z = 0; // Z position (depth) from -100 (far) to 100 (near)
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
        this.baseScale = 0.25; // Reduced base scale to match new frame size
        this.wobbleAmplitude = 2;
        this.wobbleFrequency = 0.03;
        this.wobbleTimer = 0;
        this.idleTimer = 0;
        this.minIdleTime = 60;
        this.depthChangeThreshold = 0.3; // When to switch to front/back animations
        this.lastAnimation = null; // Track animation changes
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dz = this.targetZ - this.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < 1) {
            if (this.idleTimer >= this.minIdleTime) {
                const margin = 150;
                this.targetX = margin + Math.random() * (canvas.width - 2 * margin);
                this.targetY = margin + Math.random() * (canvas.height - 2 * margin);
                this.targetZ = -100 + Math.random() * 200;
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

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.z += this.velocityZ;

        // Keep fish within bounds
        const margin = 50;
        this.x = Math.max(margin, Math.min(canvas.width - margin, this.x));
        this.y = Math.max(margin, Math.min(canvas.height - margin, this.y));
        this.z = Math.max(-100, Math.min(100, this.z));

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

        // Store previous animation
        const prevAnimation = this.currentAnimation;

        // Determine primary movement direction
        const isMovingZ = absVelocityZ > this.depthChangeThreshold;
        const isMovingX = absVelocityX > movementThreshold;
        const isIdle = absVelocityX < movementThreshold && absVelocityY < movementThreshold && absVelocityZ < movementThreshold;

        // Choose animation based on movement
        let newAnimation;
        if (isIdle) {
            newAnimation = this.z > 0 ? 'idle_front' : 'idle_back';
        } else if (isMovingZ) {
            newAnimation = this.velocityZ > 0 ? 'swim_front' : 'swim_back';
        } else if (isMovingX) {
            newAnimation = 'swim_left';
        } else {
            newAnimation = this.currentAnimation; // Keep current animation if no clear direction
        }

        // Handle animation transition
        if (newAnimation !== this.currentAnimation) {
            this.currentAnimation = newAnimation;
            // Reset frame index when changing animations to prevent out-of-bounds
            this.frameIndex = 0;
            this.animationTimer = 0;
        }

        // Update animation frame
        this.animationTimer += this.animationSpeed;
        if (this.animationTimer >= 1) {
            this.animationTimer = 0;
            const frames = animationData.animations[this.currentAnimation];
            if (frames && frames.length > 0) { // Safety check
                this.frameIndex = (this.frameIndex + 1) % frames.length;
            }
        }
    }

    draw(ctx) {
        // Safety checks
        if (!animationData.animations[this.currentAnimation]) {
            console.error('Invalid animation:', this.currentAnimation);
            return;
        }

        const frames = animationData.animations[this.currentAnimation];
        if (!frames || frames.length === 0) {
            console.error('No frames for animation:', this.currentAnimation);
            return;
        }

        const frame = frames[this.frameIndex];
        const frameData = animationData.frameData[frame];
        if (!frameData) {
            console.error('No frame data for index:', frame);
            return;
        }

        // Scale based on depth
        const depthScale = 1 + (this.z / 200);
        const currentScale = this.baseScale * depthScale;
        
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
        const scaledWidth = animationData.frameWidth * currentScale;
        const scaledHeight = animationData.frameHeight * currentScale;
        
        try {
            ctx.drawImage(
                fishSprite,
                frameData.x, frameData.y,
                animationData.frameWidth, animationData.frameHeight,
                -scaledWidth/2, -scaledHeight/2,
                scaledWidth, scaledHeight
            );
        } catch (error) {
            console.error('Draw error:', error, {
                animation: this.currentAnimation,
                frame: this.frameIndex,
                frameData: frameData
            });
        }
        
        ctx.restore();
    }
}

// Canvas setup
const canvas = document.getElementById('fishTank');
const ctx = canvas.getContext('2d');

// Enable image smoothing for better scaling
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

// Load assets
const fishSprite = new Image();
fishSprite.src = '/assets/clownfish/clownfish.png';

// Debug logging
console.log('Loading fish sprite from:', fishSprite.src);

let animationData = null;
let fish = null;

// Load animation data
fetch('/assets/clownfish/animation.json')
    .then(response => {
        console.log('Animation JSON response:', response);
        return response.json();
    })
    .then(data => {
        console.log('Loaded animation data:', data);
        animationData = data;
        // Create fish once animation data is loaded
        fish = new Fish(canvas.width/2, canvas.height/2);
        console.log('Created fish at:', fish.x, fish.y);
    })
    .catch(error => {
        console.error('Error loading animation data:', error);
    });

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (fish) {
        fish.update();
        fish.draw(ctx);
    }
    
    requestAnimationFrame(animate);
}

// Start animation when sprite is loaded
fishSprite.onload = () => {
    console.log('Fish sprite loaded successfully');
    animate();
};

fishSprite.onerror = (error) => {
    console.error('Error loading fish sprite:', error);
}; 