// Get canvas and create tank manager
const canvas = document.getElementById('fishTank');
const tankManager = new TankManager(canvas);

// Load fish sprite and animation data
const fishSprite = new Image();
let spriteLoaded = false;
let animationData = null;

// Function to initialize tank when both sprite and animation are loaded
function initializeTank() {
    if (!spriteLoaded || !animationData) return;
    
    console.log('Initializing tank with loaded assets');
    
    // Create fish
    const fish = new Fish(
        canvas.width/2, 
        canvas.height/2,
        0,
        tankManager,
        animationData
    );
    tankManager.addObject(fish);

    // Add castle
    const castle = new Castle(
        canvas.width * 0.7,    // x position
        canvas.height * 0.6,    // y position
        50                      // z position (in front of starting fish position)
    );
    tankManager.addObject(castle);

    // Add sand bed
    const sand = new SandBed(canvas.width, canvas.height);
    tankManager.addObject(sand);

    // Start animation
    requestAnimationFrame(animate);
}

// Load sprite
fishSprite.onload = () => {
    console.log('Fish sprite loaded successfully');
    spriteLoaded = true;
    initializeTank();
};

fishSprite.onerror = (error) => {
    console.error('Error loading fish sprite:', error);
};

fishSprite.src = '/assets/clownfish/clownfish.png';

// Load animation data
fetch('/assets/clownfish/animation.json')
    .then(response => response.json())
    .then(data => {
        console.log('Loaded animation data:', data);
        console.log('Available animations:', Object.keys(data.animations));
        console.log('Frame data count:', data.frameData.length);
        console.log('Sample frame data:', data.frameData[0]);
        animationData = data;
        initializeTank();
    })
    .catch(error => {
        console.error('Error loading animation data:', error);
    });

// Animation loop
function animate(currentTime) {
    tankManager.update(currentTime);
    tankManager.draw();
    requestAnimationFrame(animate);
} 