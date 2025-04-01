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
        console.log('TankManager: Sorting objects - Before:', 
            this.objects.map(o => ({
                type: o.constructor.name,
                z: o.z
            }))
        );
        
        // Sort objects by z-index (back to front)
        // Make sure SandBed is always rendered first
        this.objects.sort((a, b) => {
            if (a instanceof SandBed) return -1;
            if (b instanceof SandBed) return 1;
            return a.z - b.z;
        });
        
        console.log('TankManager: Sorting objects - After:', 
            this.objects.map(o => ({
                type: o.constructor.name,
                z: o.z
            }))
        );
    }

    update(currentTime) {
        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Update food particles
        this.foodParticles = this.foodParticles.filter(food => {
            food.update(deltaTime);
            // Remove food if it's eaten or falls below tank
            return !food.eaten && food.y < this.height;
        });

        // Update hearts
        this.hearts = this.hearts.filter(heart => {
            heart.update(deltaTime);
            // Remove hearts that have faded out
            return heart.opacity > 0;
        });

        // Update all objects and check for food
        for (const object of this.objects) {
            object.update(deltaTime);
            // If it's a fish, make it check for food
            if (object instanceof Fish) {
                object.detectFood(this.foodParticles);
            }
        }

        // Re-sort objects if any z-positions have changed
        this.sortObjects();
    }

    draw() {
        // Restore to initial state and save for next frame
        this.ctx.restore();
        this.ctx.save();
        
        // Clear canvas and draw background
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = this.background;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw all objects in order (back to front)
        for (const object of this.objects) {
            console.log('TankManager: Drawing', object.constructor.name);
            object.draw(this.ctx);
        }

        // Draw food particles
        for (const food of this.foodParticles) {
            food.draw(this.ctx);
        }

        // Draw hearts on top
        for (const heart of this.hearts) {
            heart.draw(this.ctx);
        }
    }

    // Helper method to check if an object at a position would be blocked by scenery
    isPositionBlocked(x, y, z, width, height) {
        // Keep fish within canvas bounds with margin
        const margin = 50;
        if (x - width/2 < margin || x + width/2 > this.width - margin ||
            y - height/2 < margin || y + height/2 > this.height - margin) {
            console.log('Position blocked: Out of bounds', {x, y, z});
            return true;
        }

        // Keep fish within reasonable depth bounds
        if (z < -100 || z > 100) {
            console.log('Position blocked: Out of depth bounds', z);
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
                console.log('Position blocked: Collision with castle');
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
        const dropZone = {
            minX: margin,
            maxX: this.width - margin,
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