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

        // Update all objects
        for (const object of this.objects) {
            object.update(deltaTime);
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
} 