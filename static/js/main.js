// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tankCanvas');
    if (!canvas) {
        console.error('Failed to find canvas element');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get canvas context');
        return;
    }

    let devicePixelRatio;
    
    // Set canvas size to match container with proper device pixel ratio
    function resizeCanvas() {
        const container = canvas.parentElement;
        if (!container) {
            console.error('Canvas has no parent container');
            return;
        }
        
        // Get device pixel ratio and container size
        devicePixelRatio = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        // Set canvas dimensions for rendering (physical pixels)
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        
        // Set display size (CSS pixels)
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        // Log the canvas dimensions
        console.log(`Canvas resized - Display: ${rect.width}x${rect.height}, Actual: ${canvas.width}x${canvas.height}, DPR: ${devicePixelRatio}`);
        
        // Update tank frame and manager with new dimensions
        if (window.tankFrame) {
            tankFrame.width = canvas.width;
            tankFrame.height = canvas.height;
        }
        
        // Update all objects with new canvas size if tankManager exists
        if (window.tankManager) {
            tankManager.width = canvas.width;
            tankManager.height = canvas.height;
            tankManager.sortObjects(); // Resort objects after resize
        }
    }
    
    // Initial resize
    resizeCanvas();
    
    // Resize on window change
    window.addEventListener('resize', resizeCanvas);
    
    // Create tank frame and manager
    const tankFrame = new TankFrame(canvas, canvas.width, canvas.height);
    const tankManager = new TankManager(canvas);
    
    // Store references for resize handler
    window.tankFrame = tankFrame;
    window.tankManager = tankManager;
    
    // Load fish animation data first
    fetch('/assets/clownfish/animation.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(animData => {
            if (!animData || !animData.animations) {
                throw new Error('Invalid animation data format');
            }
            console.log('Fish animation data loaded:', animData);
            
            // Add sand bed first (background)
            const sandBed = new SandBed(canvas.width, canvas.height);
            tankManager.addObject(sandBed);
            
            // Add seabed decorations with positions relative to canvas size
            // Add some seaweed clusters
            const seaweedPositions = [0.15, 0.4, 0.75]; // Spread across tank
            seaweedPositions.forEach(xPos => {
                const x = canvas.width * xPos;
                const y = canvas.height * 0.85; // Position relative to height
                const seaweed = new SeabedDecoration(x, y, 0);
                tankManager.addObject(seaweed);
            });
            
            // Add some clams
            const clamPositions = [0.25, 0.6, 0.85]; // Between seaweed
            clamPositions.forEach(xPos => {
                const x = canvas.width * xPos;
                const y = canvas.height * 0.9; // Position relative to height
                const clam = new SeabedDecoration(x, y, 1);
                tankManager.addObject(clam);
            });
            
            // Add some rocks
            const rockPositions = [0.1, 0.35, 0.65, 0.9]; // Spread out
            rockPositions.forEach(xPos => {
                const x = canvas.width * xPos;
                const y = canvas.height * 0.92; // Position relative to height
                const rock = new SeabedDecoration(x, y, 2);
                tankManager.addObject(rock);
            });
            
            // Add castle (mid-ground)
            const castle = new Castle(
                canvas.width * 0.75,    // X position (right side)
                canvas.height * 0.7,    // Y position (near bottom)
                -20                     // Z depth
            );
            tankManager.addObject(castle);
            
            // Add fish last (foreground)
            const fish = new Fish(
                canvas.width * 0.5,     // X position (center)
                canvas.height * 0.5,     // Y position (center)
                animData
            );
            tankManager.addObject(fish);
            
            // Start animation loop
            requestAnimationFrame(animate);
        })
        .catch(error => {
            console.error('Failed to load fish animation data:', error);
        });
    
    // Animation loop
    let lastFrameTime = performance.now();
    
    function animate(currentTime) {
        // Handle DPR changes (mostly for testing)
        if (devicePixelRatio !== window.devicePixelRatio) {
            resizeCanvas();
        }
        
        // Calculate actual elapsed time in milliseconds
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Scale all drawing operations to match device pixel ratio
        ctx.save();
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // Draw frame and background
        tankFrame.draw(ctx);
        
        // Set up clipping region for tank contents (using logical coordinates)
        ctx.beginPath();
        ctx.rect(
            tankFrame.frameThickness / devicePixelRatio,
            tankFrame.frameThickness / devicePixelRatio,
            (canvas.width - 2 * tankFrame.frameThickness) / devicePixelRatio,
            (canvas.height - 2 * tankFrame.frameThickness) / devicePixelRatio
        );
        ctx.clip();
        
        // Update and draw tank contents
        tankManager.update(deltaTime);
        tankManager.draw(ctx);
        
        ctx.restore();
        
        // Request next frame
        requestAnimationFrame(animate);
    }
    
    // Error handling for asset loading
    window.addEventListener('error', (event) => {
        if (event.target.tagName === 'IMG' || event.target.tagName === 'AUDIO') {
            console.error('Failed to load asset:', event.target.src);
        }
    });
}); 

function sortObjects() {
    console.log('Before sort:', this.objects.map(o => ({
        type: o.constructor.name,
        z: o.z
    })));
    this.objects.sort((a, b) => {
        if (a instanceof SandBed) return -1;
        if (b instanceof SandBed) return 1;
        return a.z - b.z;
    });
    console.log('After sort:', this.objects.map(o => ({
        type: o.constructor.name,
        z: o.z
    })));
} 