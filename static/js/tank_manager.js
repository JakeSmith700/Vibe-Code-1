class TankManager {
    constructor(width, height, ctx) {
        console.log('TankManager: Initializing with dimensions', width, 'x', height);
        this.width = width;
        this.height = height;
        this.ctx = ctx;
        this.objects = [];
        this.lastFrameTime = 0;
        
        // Enable image smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Create gradient background
        this.createBackground();
        console.log('TankManager: Initialization complete');

        this.foodParticles = [];
        this.hearts = [];
        this.maxFoodParticles = 3; // Maximum number of food particles allowed
        
        // Listen for feed button clicks
        document.addEventListener('feedFish', () => this.dropFood());
        
        // Listen for heart creation events
        document.addEventListener('createHeart', (e) => {
            const heart = new Heart(e.detail.x, e.detail.y);
            this.hearts.push(heart);
        });
    }

    createBackground() {
        this.background = this.ctx.createLinearGradient(0, 0, 0, this.height);
        this.background.addColorStop(0, '#1a3c8c');   // Dark blue at top
        this.background.addColorStop(1, '#2a5298');   // Lighter blue at bottom
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
        const numParticles = Math.min(remainingSlots, Math.floor(Math.random() * 5) + 2); // Random 2-6 particles
        
        // Tank dimensions for random positioning
        const tankWidth = this.width;
        const tankHeight = this.height;
        const maxDepth = 100; // Maximum depth for food particles
        
        for (let i = 0; i < numParticles; i++) {
            // Random position across the tank
            const x = Math.random() * tankWidth;
            const y = 50 + Math.random() * 100; // Start between 50-150 from top
            const z = -maxDepth + Math.random() * (2 * maxDepth); // Random depth
            
            const food = new FoodParticle(x, y);
            food.z = z; // Set the depth
            this.foodParticles.push(food);
            console.log('Dropped food particle:', i + 1, 'of', numParticles, 'at x:', x, 'y:', y, 'z:', z);
        }
    }
} 