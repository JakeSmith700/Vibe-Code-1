class TankFrame {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this.frameThickness = Math.min(width, height) * 0.03; // 3% of smaller dimension
        this.backgroundColor = '#004466'; // Deep blue
        this.frameColor = '#444444';     // Dark grey
        this.controlHeight = 50;
        this.currentGenre = 'chill'; // Start with chill music
        this.isPlaying = false;
        this.currentTrack = null;
        this.audioElement = new Audio();
        this.tracks = {
            chill: [],
            hype: []
        };
        this.volume = 0.5; // Default volume
        
        // Feed cooldown tracking
        this.feedTimeout = null;
        this.feedCountdownInterval = null;
        
        // Add cheat code tracking
        this.cheatSequence = [];
        this.correctSequence = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'b'];
        this.lastKeyTime = 0;
        this.keyTimeout = 2000; // 2 seconds to complete the sequence
        
        // Mobile detection
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Add viewport meta tag for mobile
        this.setupViewport();
        
        // Setup key listener for cheat code
        document.addEventListener('keydown', (e) => {
            const currentTime = performance.now();
            
            // Reset sequence if too much time has passed
            if (currentTime - this.lastKeyTime > this.keyTimeout) {
                this.cheatSequence = [];
            }
            
            // Update last key time
            this.lastKeyTime = currentTime;
            
            // Add key to sequence
            const key = e.key;
            this.cheatSequence.push(key);
            
            // Keep only the last 6 keys
            if (this.cheatSequence.length > 6) {
                this.cheatSequence.shift();
            }
            
            // Check if sequence matches
            const isMatch = this.cheatSequence.join(',') === 
                this.correctSequence.join(',');
            
            if (isMatch) {
                console.log('Cheat code activated!');
                // Reset feed timer
                if (this.feedTimeout) {
                    clearTimeout(this.feedTimeout);
                }
                if (this.feedCountdownInterval) {
                    clearInterval(this.feedCountdownInterval);
                }
                
                this.feedButton.disabled = false;
                this.feedButton.style.opacity = '1';
                this.feedButton.style.cursor = 'pointer';
                this.feedButton.innerHTML = '🐟 Feed';
                
                // Visual feedback
                this.feedButton.style.animation = 'pulse 0.5s';
                setTimeout(() => {
                    this.feedButton.style.animation = '';
                }, 500);
                
                // Reset sequence
                this.cheatSequence = [];
            }
        });
        
        // Load available tracks
        this.loadTracks();
        
        // Setup UI elements
        this.setupControls();
        
        // Load credits
        this.loadCredits();
        
        // Set up audio ended event listener
        this.audioElement.addEventListener('ended', () => {
            this.playRandomTrack(); // Auto play next track
        });
    }

    loadTracks() {
        // Load music tracks from JSON file
        fetch('/assets/music/tracks.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                this.tracks = data;
                console.log('Music tracks loaded:', this.tracks);
                
                // Pre-select a random track
                if (this.tracks[this.currentGenre] && this.tracks[this.currentGenre].length > 0) {
                    const randomIndex = Math.floor(Math.random() * this.tracks[this.currentGenre].length);
                    this.currentTrack = this.tracks[this.currentGenre][randomIndex];
                }
            })
            .catch(error => {
                console.error('Failed to load music tracks:', error);
                // Fallback tracks if JSON load fails
                this.tracks = {
                    chill: ['chill1.mp3', 'chill2.mp3'],
                    hype: ['hype1.mp3', 'hype2.mp3']
                };
            });
    }

    loadCredits() {
        fetch('/credits.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(text => {
                console.log('Credits loaded successfully');
                // Format text with line breaks
                const formattedText = text.split('\n').map(line => {
                    // Add extra spacing for section headers
                    if (line.trim().endsWith(':')) {
                        return `<h2>${line}</h2>`;
                    }
                    return line;
                }).join('<br>');
                
                // Create content container
                const content = document.createElement('div');
                content.style.marginTop = '30px'; // Space for close button
                content.innerHTML = formattedText;
                
                // Clear existing content except close button
                const closeButton = this.creditsPopup.querySelector('.credits-close-btn');
                this.creditsPopup.innerHTML = '';
                this.creditsPopup.appendChild(closeButton);
                this.creditsPopup.appendChild(content);
            })
            .catch(error => {
                console.error('Error loading credits:', error);
                this.creditsPopup.textContent = 'Error loading credits. Please try again later.';
            });
    }

    setupViewport() {
        let viewport = document.querySelector('meta[name=viewport]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }

    setupControls() {
        // Create control bar container
        const controlBar = document.createElement('div');
        controlBar.className = 'control-bar';
        controlBar.style.position = 'absolute';
        controlBar.style.bottom = '10px';
        controlBar.style.left = '50%';
        controlBar.style.transform = 'translateX(-50%)';
        controlBar.style.display = 'flex';
        controlBar.style.alignItems = 'center';
        controlBar.style.gap = '10px';
        controlBar.style.padding = '5px 15px';
        controlBar.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        controlBar.style.borderRadius = '20px';
        controlBar.style.zIndex = '1000';
        
        // Create play button
        this.playButton = document.createElement('button');
        this.playButton.innerHTML = '▶️';
        this.playButton.className = 'control-button';
        this.playButton.style.padding = '8px 12px';
        this.playButton.style.border = 'none';
        this.playButton.style.borderRadius = '15px';
        this.playButton.style.backgroundColor = '#673AB7';
        this.playButton.style.color = 'white';
        this.playButton.style.cursor = 'pointer';
        this.playButton.style.transition = 'all 0.3s ease';
        this.playButton.style.minWidth = '40px';
        
        // Create genre button
        this.genreButton = document.createElement('button');
        this.genreButton.innerHTML = '🎵 Chill';
        this.genreButton.className = 'control-button';
        this.genreButton.style.cssText = this.playButton.style.cssText;
        this.genreButton.style.backgroundColor = '#9C27B0';
        this.genreButton.style.minWidth = '80px';
        
        // Create volume slider
        const volumeContainer = document.createElement('div');
        volumeContainer.style.display = 'flex';
        volumeContainer.style.alignItems = 'center';
        volumeContainer.style.marginRight = '5px';
        
        const volumeIcon = document.createElement('span');
        volumeIcon.innerHTML = '🔊';
        volumeIcon.style.color = 'white';
        volumeIcon.style.marginRight = '5px';
        
        this.volumeSlider = document.createElement('input');
        this.volumeSlider.type = 'range';
        this.volumeSlider.min = '0';
        this.volumeSlider.max = '100';
        this.volumeSlider.value = this.volume * 100;
        this.volumeSlider.style.width = '80px';
        this.volumeSlider.style.accentColor = '#FF9800';
        
        volumeContainer.appendChild(volumeIcon);
        volumeContainer.appendChild(this.volumeSlider);
        
        // Create feed button
        this.feedButton = document.createElement('button');
        this.feedButton.innerHTML = '🐟 Feed';
        this.feedButton.className = 'control-button';
        this.feedButton.style.cssText = this.playButton.style.cssText;
        this.feedButton.style.backgroundColor = '#4CAF50';
        this.feedButton.style.minWidth = '80px';
        
        // Create credits button
        this.creditsButton = document.createElement('button');
        this.creditsButton.innerHTML = 'ℹ️ Credits';
        this.creditsButton.className = 'control-button';
        this.creditsButton.style.cssText = this.feedButton.style.cssText;
        this.creditsButton.style.backgroundColor = '#2196F3';
        this.creditsButton.style.minWidth = '80px';
        
        // Add elements to control bar
        controlBar.appendChild(this.playButton);
        controlBar.appendChild(this.genreButton);
        controlBar.appendChild(volumeContainer);
        controlBar.appendChild(this.feedButton);
        controlBar.appendChild(this.creditsButton);
        
        // Add control bar to canvas container
        this.canvas.parentElement.appendChild(controlBar);
        
        // Create credits popup (hidden initially)
        this.creditsPopup = document.createElement('div');
        this.creditsPopup.className = 'credits-popup';
        this.creditsPopup.style.display = 'none';
        this.creditsPopup.style.position = 'absolute';
        this.creditsPopup.style.top = '50%';
        this.creditsPopup.style.left = '50%';
        this.creditsPopup.style.transform = 'translate(-50%, -50%)';
        this.creditsPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.creditsPopup.style.color = 'white';
        this.creditsPopup.style.padding = '20px';
        this.creditsPopup.style.borderRadius = '10px';
        this.creditsPopup.style.maxWidth = '80%';
        this.creditsPopup.style.maxHeight = '80%';
        this.creditsPopup.style.overflow = 'auto';
        this.creditsPopup.style.zIndex = '2000';
        
        // Create close button for credits
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.className = 'credits-close-btn';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '10px';
        closeButton.style.top = '10px';
        closeButton.style.border = 'none';
        closeButton.style.background = 'none';
        closeButton.style.color = 'white';
        closeButton.style.fontSize = '28px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.cursor = 'pointer';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.lineHeight = '30px';
        closeButton.style.textAlign = 'center';
        closeButton.style.padding = '0';
        closeButton.style.zIndex = '2001';
        
        // Add close button to credits popup
        this.creditsPopup.appendChild(closeButton);
        
        // Add credits popup to canvas container
        this.canvas.parentElement.appendChild(this.creditsPopup);
        
        // Setup event listeners for music controls
        this.playButton.addEventListener('click', () => this.togglePlay());
        this.genreButton.addEventListener('click', () => this.toggleGenre());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        
        // Setup event listener for feed button
        this.feedButton.addEventListener('click', () => {
            if (!this.feedButton.disabled) {
                // Emit feed event
                const event = new CustomEvent('feedFish');
                this.canvas.dispatchEvent(event);
                
                // Start cooldown
                this.startFeedCooldown();
            }
        });
        
        // Setup event listeners for credits popup
        this.creditsButton.addEventListener('click', () => {
            this.creditsPopup.style.display = 'block';
        });
        
        closeButton.addEventListener('click', () => {
            this.creditsPopup.style.display = 'none';
        });
    }

    startFeedCooldown() {
        // Disable feed button
        this.feedButton.disabled = true;
        this.feedButton.style.opacity = '0.5';
        this.feedButton.style.cursor = 'not-allowed';
        
        // Clear any existing timers
        if (this.feedTimeout) clearTimeout(this.feedTimeout);
        if (this.feedCountdownInterval) clearInterval(this.feedCountdownInterval);
        
        // Set cooldown time
        const cooldownTime = 600; // 10 minutes (600 seconds)
        let timeLeft = cooldownTime;
        
        // Format time function
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        // Update button text initially
        this.feedButton.innerHTML = `🐟 Feed (${formatTime(timeLeft)})`;
        
        // Setup interval to update countdown every second
        this.feedCountdownInterval = setInterval(() => {
            timeLeft--;
            this.feedButton.innerHTML = `🐟 Feed (${formatTime(timeLeft)})`;
            
            // When countdown reaches zero
            if (timeLeft <= 0) {
                clearInterval(this.feedCountdownInterval);
                this.feedCountdownInterval = null;
            }
        }, 1000);
        
        // Setup timeout to re-enable button after cooldown
        this.feedTimeout = setTimeout(() => {
            this.feedButton.disabled = false;
            this.feedButton.style.opacity = '1';
            this.feedButton.style.cursor = 'pointer';
            this.feedButton.innerHTML = '🐟 Feed';
            this.feedTimeout = null;
        }, cooldownTime * 1000);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audioElement.pause();
            this.playButton.innerHTML = '▶️';
        } else {
            if (!this.currentTrack) {
                this.playRandomTrack();
            } else {
                this.audioElement.src = `/assets/music/${this.currentGenre}/${this.currentTrack}`;
                this.audioElement.play().catch(error => {
                    console.error('Error playing audio:', error);
                });
            }
            this.playButton.innerHTML = '⏸️';
        }
        this.isPlaying = !this.isPlaying;
    }

    toggleGenre() {
        this.currentGenre = this.currentGenre === 'chill' ? 'hype' : 'chill';
        const genreName = this.currentGenre.charAt(0).toUpperCase() + this.currentGenre.slice(1);
        this.genreButton.innerHTML = `🎵 ${genreName}`;
        
        if (this.isPlaying) {
            this.playRandomTrack();
        }
    }

    playRandomTrack() {
        const tracks = this.tracks[this.currentGenre];
        if (tracks && tracks.length > 0) {
            const randomIndex = Math.floor(Math.random() * tracks.length);
            this.currentTrack = tracks[randomIndex];
            
            console.log(`Playing track: ${this.currentTrack} (${this.currentGenre})`);
            this.audioElement.src = `/assets/music/${this.currentGenre}/${this.currentTrack}`;
            this.audioElement.volume = this.volume;
            
            this.audioElement.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            
            this.playButton.innerHTML = '⏸️';
            this.isPlaying = true;
        } else {
            console.error('No tracks available for genre:', this.currentGenre);
        }
    }

    setVolume(value) {
        this.volume = value;
        this.audioElement.volume = value;
    }

    draw(ctx) {
        // Calculate frame thickness based on current canvas size
        this.frameThickness = Math.min(this.canvas.width, this.canvas.height) * 0.03;
        
        // Draw background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw frame
        ctx.fillStyle = this.frameColor;
        // Top
        ctx.fillRect(0, 0, this.width, this.frameThickness);
        // Bottom
        ctx.fillRect(0, this.height - this.frameThickness, this.width, this.frameThickness);
        // Left
        ctx.fillRect(0, 0, this.frameThickness, this.height);
        // Right
        ctx.fillRect(this.width - this.frameThickness, 0, this.frameThickness, this.height);
    }
}

// Add CSS animation for visual feedback
const style = document.createElement('style');
style.textContent = `
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

.control-button:hover {
    filter: brightness(1.2);
    transform: translateY(-2px);
}

.control-button:active {
    transform: translateY(1px);
}

.credits-close-btn:hover {
    color: #ff4444;
}

input[type=range] {
    height: 6px;
    border-radius: 3px;
    appearance: none;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
}

input[type=range]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #FF9800;
    cursor: pointer;
}

input[type=range]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #FF9800;
    cursor: pointer;
}
`;
document.head.appendChild(style); 