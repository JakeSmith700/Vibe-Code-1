// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tankCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match container
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    
    // Initial resize
    resizeCanvas();
    
    // Resize on window change
    window.addEventListener('resize', resizeCanvas);
    
    // Create tank frame
    const tankFrame = new TankFrame(canvas, canvas.width, canvas.height);
    
    // Create tank manager
    const tankManager = new TankManager(canvas);
    
    // Animation loop
    let lastFrameTime = performance.now();
    
    function animate(currentTime) {
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw frame
        tankFrame.draw(ctx);
        
        // Update and draw tank contents
        tankManager.update(currentTime);
        tankManager.draw(ctx);
        
        // Request next frame
        requestAnimationFrame(animate);
    }
    
    // Start animation
    requestAnimationFrame(animate);
    
    // Error handling for asset loading
    window.addEventListener('error', (event) => {
        if (event.target.tagName === 'IMG' || event.target.tagName === 'AUDIO') {
            console.error('Failed to load asset:', event.target.src);
        }
    });
}); 