// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas and context
    const canvas = document.getElementById('fishTank');
    if (!canvas) {
        console.error('Could not find canvas element with id "fishTank"');
        return;
    }
    
    const ctx = canvas.getContext('2d');

    // Create tank frame
    const tankFrame = new TankFrame(canvas, canvas.width, canvas.height);
    const frameThickness = tankFrame.frameThickness;

    // Adjust canvas size to account for frame
    const tankWidth = canvas.width - (frameThickness * 2);
    const tankHeight = canvas.height - (frameThickness * 2);

    // Create tank manager with adjusted dimensions and context
    const tankManager = new TankManager(tankWidth, tankHeight, ctx);

    // Load fish sprite and animation data before creating objects
    Promise.all([
        // Load fish animation data
        fetch('/assets/clownfish/animation.json').then(response => response.json()),
        // Load seabed animation data
        fetch('/assets/seabed/animation.json').then(response => response.json())
    ]).then(([fishAnimData, seabedAnimData]) => {
        // Create fish at center of tank with animation data
        const fish = new Fish(tankWidth / 2, tankHeight / 2, fishAnimData);
        tankManager.addObject(fish);

        // Add castle at 70% of width and 60% of height
        const castle = new Castle(tankWidth * 0.7, tankHeight * 0.6, 50);
        tankManager.addObject(castle);

        // Add sand bed
        const sandBed = new SandBed(tankWidth, tankHeight);
        tankManager.addObject(sandBed);

        // Add seabed decorations
        const numSeaweed = 3 + Math.floor(Math.random() * 3);
        const numClams = 2 + Math.floor(Math.random() * 2);
        const numRocks = 2 + Math.floor(Math.random() * 3);

        function getRandomSeabedPosition() {
            const x = 50 + Math.random() * (tankWidth - 100);
            const y = tankHeight - 20;
            return { x, y };
        }

        // Add seaweed (type 0)
        for (let i = 0; i < numSeaweed; i++) {
            const pos = getRandomSeabedPosition();
            const seaweed = new SeabedDecoration(pos.x, pos.y, 0);
            tankManager.addObject(seaweed);
        }

        // Add clams (type 1)
        for (let i = 0; i < numClams; i++) {
            const pos = getRandomSeabedPosition();
            const clam = new SeabedDecoration(pos.x, pos.y, 1);
            tankManager.addObject(clam);
        }

        // Add rocks (type 2)
        for (let i = 0; i < numRocks; i++) {
            const pos = getRandomSeabedPosition();
            const rock = new SeabedDecoration(pos.x, pos.y, 2);
            tankManager.addObject(rock);
        }

        // Start animation loop
        let lastTime = 0;
        function animate(currentTime) {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // Clear the entire canvas including frame area
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw the frame
            tankFrame.draw(ctx);
            
            // Set up clipping region for tank contents
            ctx.save();
            ctx.beginPath();
            ctx.rect(frameThickness, frameThickness, tankWidth, tankHeight);
            ctx.clip();
            
            // Translate context to account for frame
            ctx.translate(frameThickness, frameThickness);
            
            // Update and draw tank contents
            tankManager.update(deltaTime);
            tankManager.draw(ctx);
            
            // Restore context
            ctx.restore();
            
            requestAnimationFrame(animate);
        }

        // Start animation
        animate(0);
    }).catch(error => {
        console.error('Error loading animation data:', error);
    });
}); 