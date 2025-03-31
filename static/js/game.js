class Fish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.speed = 2;
        this.direction = Math.random() * Math.PI * 2;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    }

    update() {
        // Move fish
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        // Bounce off walls
        if (this.x < 0 || this.x > canvas.width) {
            this.direction = Math.PI - this.direction;
        }
        if (this.y < 0 || this.y > canvas.height) {
            this.direction = -this.direction;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);
        
        // Draw fish body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size, this.size/2);
        ctx.lineTo(-this.size, -this.size/2);
        ctx.closePath();
        ctx.fill();

        // Draw eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.size/2, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 5;
        this.speed = 1;
    }

    update() {
        this.y += this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = 'brown';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let fishes = [];
let food = [];

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw fish
    fishes.forEach(fish => {
        fish.update();
        fish.draw(ctx);
    });

    // Update and draw food
    food = food.filter(f => {
        f.update();
        f.draw(ctx);
        return f.y < canvas.height;
    });

    requestAnimationFrame(gameLoop);
}

// Add fish function
function addFish() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    fishes.push(new Fish(x, y));
}

// Add food function
function addFood() {
    const x = Math.random() * canvas.width;
    food.push(new Food(x, 0));
}

// Start game
gameLoop(); 