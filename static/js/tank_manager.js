class TankManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Get the context after ensuring canvas exists
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Failed to get canvas context');
            return;
        }
        
        // Set image smoothing after context is confirmed
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Save initial canvas state
        this.ctx.save();
        
        // Initialize arrays
        this.objects = [];
        this.foodParticles = [];
        this.hearts = [];
        
        // Create background gradient
        this.createBackground();
        
        // Initialize lastFrameTime
        this.lastFrameTime = performance.now();
        
        // Set maximum food particles
        this.maxFoodParticles = 10;
        
        // Add event listeners for food and hearts
        this.canvas.addEventListener('feedFish', (event) => {
            console.log('TankManager: Feed event received');
            this.dropFood();
        });
        
        document.addEventListener('createHeart', (event) => {
            console.log('TankManager: Create heart event received at:', event.detail.x, event.detail.y);
            const heart = new Heart(event.detail.x, event.detail.y);
            this.hearts.push(heart);
        });
        
        console.log('TankManager: Initialization complete');
    }

    createBackground() {
        this.background = this.ctx.createLinearGradient(0, 0, 0, this.height);
        this.background.addColorStop(0, '#1a3c8c');   // Dark blue at top
        this.background.addColorStop(1, '#2a5298');   // Lighter blue at bottom
        console.log('TankManager: Background gradient created');
    }

    addObject(object) {
        console.log('TankManager: Adding object', object.constructor.name);
        this.objects.push(object);
        // Sort objects by z-index whenever we add a new one
        this.sortObjects();
        console.log('TankManager: Objects in scene:', this.objects.map(o => o.constructor.name));
    }

    removeObject(object) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
            console.log('TankManager: Removed object', object.constructor.name);
        }
    }

    sortObjects() {
        // Sort objects by z-index (back to front)
        // Make sure SandBed is always rendered first
        this.objects.sort((a, b) => {
            if (a instanceof SandBed) return -1;
            if (b instanceof SandBed) return 1;
            return a.z - b.z;
        });
        
        console.log('TankManager: Objects sorted by z-depth:', 
            this.objects.map(o => ({
                type: o.constructor.name,
                z: o.z
            }))
        );
    }

    update(deltaTime) {
        // Ensure deltaTime is reasonable (prevent huge jumps if tab was inactive)
        const cappedDeltaTime = Math.min(deltaTime, 100);
        
        // Update canvas dimensions for scaling calculations
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Update food particles
        this.foodParticles = this.foodParticles.filter(food => {
            // Update tank dimensions for boundary checking
            food.tankWidth = this.width;
            food.tankHeight = this.height;
            food.update(cappedDeltaTime);
            // Remove food if it's eaten or falls below tank
            return !food.eaten && food.y < this.height;
        });

        // Update hearts
        this.hearts = this.hearts.filter(heart => {
            heart.update(cappedDeltaTime);
            // Remove hearts that have faded out
            return heart.opacity > 0;
        });

        // Update all objects and check for food
        for (const object of this.objects) {
            // First update the object's scale
            if (object.updateScale) {
                object.updateScale(this.width, this.height);
            }
            
            // Then update its position and state
            object.update(cappedDeltaTime);
            
            // If it's a fish, make it check for food
            if (object instanceof Fish) {
                object.detectFood(this.foodParticles);
            }
        }

        // Re-sort objects if any z-positions have changed
        this.sortObjects();
    }

    draw(ctx) {
        // Recreate background gradient with current dimensions
        const dpr = window.devicePixelRatio || 1;
        const logicalWidth = this.width / dpr;
        const logicalHeight = this.height / dpr;
        
        this.background = ctx.createLinearGradient(0, 0, 0, logicalHeight);
        this.background.addColorStop(0, '#1a3c8c');   // Dark blue at top
        this.background.addColorStop(1, '#2a5298');   // Lighter blue at bottom
        
        // Clear canvas and draw background (using logical coordinates)
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // Draw all objects in order (back to front)
        for (const object of this.objects) {
            object.draw(ctx);
        }

        // Draw food particles
        for (const food of this.foodParticles) {
            food.draw(ctx);
        }

        // Draw hearts on top
        for (const heart of this.hearts) {
            heart.draw(ctx);
        }
    }

    // Helper method to check if an object at a position would be blocked by scenery
    isPositionBlocked(x, y, z, width, height) {
        // Keep fish within canvas bounds with margin
        const margin = 50;
        if (x - width/2 < margin || x + width/2 > this.width - margin ||
            y - height/2 < margin || y + height/2 > this.height - margin) {
            return true;
        }

        // Keep fish within reasonable depth bounds
        if (z < -100 || z > 100) {
            return true;
        }

        const testObject = {
            x, y, z,
            width, height,
            isBehind: function(other) { return this.z < other.z; }
        };

        // Check collision with scenery objects
        for (const object of this.objects) {
            if (object instanceof Castle && // Only check collision with certain objects
                !testObject.isBehind(object) && // Only if we're not behind it
                object.intersects(testObject)) {
                return true;
            }
        }
        return false;
    }

    // Get safe position for new objects
    getSafePosition(width, height) {
        const margin = 50;
        const x = margin + Math.random() * (this.width - 2 * margin);
        const y = margin + Math.random() * (this.height - 2 * margin);
        const z = -50 + Math.random() * 100; // Reduced depth range for easier navigation
        return { x, y, z };
    }

    dropFood() {
        // Only drop food if we're under the limit
        if (this.foodParticles.length >= this.maxFoodParticles) {
            console.log('Maximum food particles reached');
            return;
        }

        // Calculate how many particles we can still add
        const remainingSlots = this.maxFoodParticles - this.foodParticles.length;
        const numParticles = Math.min(remainingSlots, Math.floor(Math.random() * 3) + 2);
        
        // Tank dimensions for random positioning
        const margin = 50;
        const centerX = this.width / 2;
        const dropWidth = this.width * 0.4; // 40% of tank width around center
        
        const dropZone = {
            minX: centerX - dropWidth/2,
            maxX: centerX + dropWidth/2,
            y: margin, // Drop from near the top
            minZ: -50, // Minimum z-depth
            maxZ: 50   // Maximum z-depth
        };
        
        for (let i = 0; i < numParticles; i++) {
            const x = dropZone.minX + Math.random() * (dropZone.maxX - dropZone.minX);
            const z = dropZone.minZ + Math.random() * (dropZone.maxZ - dropZone.minZ);
            const food = new FoodParticle(x, dropZone.y, z);
            food.tankWidth = this.width;
            food.tankHeight = this.height;
            this.foodParticles.push(food);
            console.log('Dropped food particle at:', x, dropZone.y, z);
        }
    }
} 