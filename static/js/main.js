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
    
    // Set canvas size to match container
    function resizeCanvas() {
        const container = canvas.parentElement;
        if (!container) {
            console.error('Canvas has no parent container');
            return;
        }
        
        // Get device pixel ratio and container size
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        // Set canvas size accounting for pixel ratio
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Set display size
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        // Scale context to account for pixel ratio
        ctx.scale(dpr, dpr);
        
        console.log('Canvas resized to:', canvas.width, 'x', canvas.height, 'with DPR:', dpr);
    }
    
    // Initial resize
    resizeCanvas();
    
    // Resize on window change
    window.addEventListener('resize', resizeCanvas);
    
    // Create tank frame and manager
    const tankFrame = new TankFrame(canvas, canvas.width, canvas.height);
    const tankManager = new TankManager(canvas);
    
    // Load fish animation data first
    fetch('assets/clownfish/animation.json')
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
            
            // Add seabed decorations
            // Add some seaweed clusters
            for (let i = 0; i < 3; i++) {
                const x = canvas.width * (0.2 + i * 0.3); // Spread across the tank
                const y = canvas.height - 120; // Just above the sand
                const seaweed = new SeabedDecoration(x, y, 0); // type 0 is seaweed
                tankManager.addObject(seaweed);
            }
            
            // Add some clams
            for (let i = 0; i < 2; i++) {
                const x = canvas.width * (0.3 + i * 0.4); // Spread between seaweed
                const y = canvas.height - 80; // On the sand
                const clam = new SeabedDecoration(x, y, 1); // type 1 is clam
                tankManager.addObject(clam);
            }
            
            // Add some rocks
            for (let i = 0; i < 2; i++) {
                const x = canvas.width * (0.25 + i * 0.5); // Spread out
                const y = canvas.height - 70; // On the sand
                const rock = new SeabedDecoration(x, y, 2); // type 2 is rock
                tankManager.addObject(rock);
            }
            
            // Add castle next (mid-ground)
            const castle = new Castle(canvas.width * 0.7, canvas.height * 0.6, 50);
            tankManager.addObject(castle);
            
            // Add fish last (foreground)
            const fish = new Fish(canvas.width / 2, canvas.height / 2, animData);
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
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        // Draw frame and background
        tankFrame.draw(ctx);
        
        // Set up clipping region for tank contents
        ctx.save();
        ctx.beginPath();
        ctx.rect(
            tankFrame.frameThickness,
            tankFrame.frameThickness,
            canvas.width - 2 * tankFrame.frameThickness,
            canvas.height - 2 * tankFrame.frameThickness
        );
        ctx.clip();
        
        // Update and draw tank contents
        tankManager.update(currentTime);
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