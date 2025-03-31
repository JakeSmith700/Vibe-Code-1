class TankManager {
    constructor(canvas) {
        console.log('TankManager: Initializing with canvas', canvas.width, 'x', canvas.height);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
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
        this.background = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        this.background.addColorStop(0, '#1a3c8c');   // Dark blue at top
        this.background.addColorStop(1, '#2a5298');   // Lighter blue at bottom
    }

    addObject(object) {
        console.log('TankManager: Adding object', object.constructor.name);
        this.objects.push(object);
        // Sort objects by z-index whenever we add a new one
        this.sortObjects();
        console.log('TankManager: Current objects:', this.objects.map(o => o.constructor.name));
    }

    removeObject(object) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }

    sortObjects() {
        // Sort objects by z-index (back to front)
        this.objects.sort((a, b) => a.z - b.z);
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
        this.ctx.fillStyle = this.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all objects in order (back to front)
        for (const object of this.objects) {
            console.log('TankManager: Drawing object', object.constructor.name);
            object.draw(this.ctx);
        }
    }

    // Helper method to check if an object at a position would be blocked by scenery
    isPositionBlocked(x, y, z, width, height) {
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
        const x = margin + Math.random() * (this.canvas.width - 2 * margin);
        const y = margin + Math.random() * (this.canvas.height - 2 * margin);
        const z = -100 + Math.random() * 200;
        return { x, y, z };
    }
} 