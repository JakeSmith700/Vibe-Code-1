// Create a canvas for generating the sand texture
const canvas = document.createElement('canvas');
canvas.width = 256;  // Power of 2 for better tiling
canvas.height = 128;
const ctx = canvas.getContext('2d');

// Fill base sand color
ctx.fillStyle = '#e6d5ac';  // Light sandy color
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Add noise and variation
for (let i = 0; i < 5000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 3 + 1;
    
    // Randomly choose between darker and lighter spots
    const shade = Math.random();
    if (shade < 0.5) {
        ctx.fillStyle = 'rgba(209, 190, 140, 0.5)';  // Darker spots
    } else {
        ctx.fillStyle = 'rgba(245, 232, 199, 0.5)';  // Lighter spots
    }
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}

// Create subtle horizontal lines for a more natural look
for (let y = 0; y < canvas.height; y += 4) {
    ctx.strokeStyle = 'rgba(209, 190, 140, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
}

// Download function
function downloadSand() {
    const link = document.createElement('a');
    link.download = 'sand.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Add canvas and download button to page
document.body.appendChild(canvas);
const button = document.createElement('button');
button.textContent = 'Download Sand Texture';
button.onclick = downloadSand;
document.body.appendChild(button); 