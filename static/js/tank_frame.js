class TankFrame {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this.frameThickness = 20;
        this.controlHeight = 50;
        this.currentGenre = 'chill'; // Start with chill music
        this.isPlaying = false;
        this.currentTrack = null;
        this.audioElement = new Audio();
        this.tracks = {
            chill: [],
            hype: []
        };
        this.canFeed = true;
        this.feedTimeout = null;
        this.feedCooldown = false;
        
        // Load available tracks
        this.loadTracks();
        
        // Setup UI event listeners
        this.setupControls();
        
        // Load credits
        this.credits = '';
        this.loadCredits();
        
        // Check for existing cooldown in cookies
        this.checkFeedCooldown();
    }

    loadTracks() {
        // We'll populate this with actual tracks from the server
        fetch('/assets/music/tracks.json')
            .then(response => response.json())
            .then(data => {
                this.tracks = data;
                console.log('Music tracks loaded:', this.tracks);
            })
            .catch(error => {
                console.error('Failed to load music tracks:', error);
            });
    }

    loadCredits() {
        fetch('/credits.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load credits file');
                }
                return response.text();
            })
            .then(text => {
                this.credits = text;
                console.log('Credits loaded successfully');
            })
            .catch(error => {
                console.error('Failed to load credits:', error);
                this.credits = 'Credits information unavailable.';
            });
    }

    setupControls() {
        // Create control container
        const controls = document.createElement('div');
        controls.style.position = 'absolute';
        controls.style.left = `${this.frameThickness}px`;
        controls.style.bottom = `${this.frameThickness}px`;
        controls.style.width = `${this.width - 2 * this.frameThickness}px`;
        controls.style.height = `${this.controlHeight}px`;
        controls.style.display = 'flex';
        controls.style.alignItems = 'center';
        controls.style.justifyContent = 'center';
        controls.style.gap = '10px';
        controls.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        controls.style.borderRadius = '10px';
        controls.style.padding = '5px';

        // Create play/pause button
        const playButton = document.createElement('button');
        playButton.innerHTML = '▶️';
        playButton.className = 'tank-control-btn';
        playButton.onclick = () => this.togglePlay();

        // Create genre toggle button
        const genreButton = document.createElement('button');
        genreButton.innerHTML = '🎵 Chill';
        genreButton.className = 'tank-control-btn';
        genreButton.onclick = () => this.toggleGenre();

        // Create volume slider
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = '50';
        volumeSlider.className = 'tank-volume-slider';
        volumeSlider.oninput = (e) => this.setVolume(e.target.value / 100);

        // Create feed button
        const feedButton = document.createElement('button');
        feedButton.innerHTML = '🐟 Feed';
        feedButton.className = 'tank-control-btn';
        feedButton.onclick = () => this.handleFeed();
        this.feedButton = feedButton;

        // Create credits button
        const creditsButton = document.createElement('button');
        creditsButton.innerHTML = 'ℹ️ Credits';
        creditsButton.className = 'tank-control-btn';
        creditsButton.onclick = () => this.showCredits();

        // Add controls to container
        controls.appendChild(playButton);
        controls.appendChild(genreButton);
        controls.appendChild(volumeSlider);
        controls.appendChild(feedButton);
        controls.appendChild(creditsButton);

        // Add container to document
        this.canvas.parentElement.appendChild(controls);
        this.controls = {
            container: controls,
            playButton,
            genreButton,
            volumeSlider,
            feedButton,
            creditsButton
        };

        // Create credits popup (hidden by default)
        this.createCreditsPopup();
    }

    createCreditsPopup() {
        const popup = document.createElement('div');
        popup.className = 'credits-popup';
        popup.style.display = 'none';
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        popup.style.padding = '20px';
        popup.style.borderRadius = '10px';
        popup.style.color = 'white';
        popup.style.maxWidth = '80%';
        popup.style.maxHeight = '80%';
        popup.style.overflow = 'auto';
        popup.style.zIndex = '1000';
        popup.style.border = '2px solid rgba(255, 255, 255, 0.2)';

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.className = 'credits-close-btn';
        closeButton.onclick = () => this.hideCredits();

        const content = document.createElement('div');
        content.className = 'credits-content';

        popup.appendChild(closeButton);
        popup.appendChild(content);
        document.body.appendChild(popup);
        this.creditsPopup = popup;
        this.creditsContent = content;
    }

    showCredits() {
        this.creditsContent.innerHTML = this.credits.replace(/\n/g, '<br>');
        this.creditsPopup.style.display = 'block';
    }

    hideCredits() {
        this.creditsPopup.style.display = 'none';
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audioElement.pause();
            this.controls.playButton.innerHTML = '▶️';
        } else {
            if (!this.currentTrack) {
                this.playRandomTrack();
            } else {
                this.audioElement.play();
            }
            this.controls.playButton.innerHTML = '⏸️';
        }
        this.isPlaying = !this.isPlaying;
    }

    toggleGenre() {
        this.currentGenre = this.currentGenre === 'chill' ? 'hype' : 'chill';
        this.controls.genreButton.innerHTML = `🎵 ${this.currentGenre.charAt(0).toUpperCase() + this.currentGenre.slice(1)}`;
        if (this.isPlaying) {
            this.playRandomTrack();
        }
    }

    playRandomTrack() {
        const tracks = this.tracks[this.currentGenre];
        if (tracks && tracks.length > 0) {
            const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
            this.currentTrack = randomTrack;
            this.audioElement.src = `/assets/music/${this.currentGenre}/${randomTrack}`;
            this.audioElement.play();
        }
    }

    setVolume(value) {
        this.audioElement.volume = value;
    }

    feedFish() {
        if (!this.canFeed) return;

        // Emit a feed event that the tank manager can listen to
        const event = new CustomEvent('feedFish', {
            detail: {
                x: this.width / 2,
                y: 50 // Feed from near the top
            }
        });
        this.canvas.dispatchEvent(event);

        // Disable feed button
        this.canFeed = false;
        this.feedButton.classList.add('disabled');
        
        // Start cooldown
        if (this.feedTimeout) {
            clearTimeout(this.feedTimeout);
        }
        
        this.feedTimeout = setTimeout(() => {
            this.canFeed = true;
            this.feedButton.classList.remove('disabled');
        }, 10000); // 10 second cooldown

        // Update button text to show cooldown
        let secondsLeft = 10;
        const updateButtonText = () => {
            if (secondsLeft > 0) {
                this.feedButton.innerHTML = `🐟 Wait ${secondsLeft}s`;
                secondsLeft--;
                setTimeout(updateButtonText, 1000);
            } else {
                this.feedButton.innerHTML = '🐟 Feed';
            }
        };
        updateButtonText();
    }

    // Cookie helper functions
    setCookie(name, value, minutes) {
        const date = new Date();
        date.setTime(date.getTime() + (minutes * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    checkFeedCooldown() {
        const feedCooldownEnd = this.getCookie('feedCooldownEnd');
        if (feedCooldownEnd) {
            const now = new Date().getTime();
            const endTime = parseInt(feedCooldownEnd);
            
            if (now < endTime) {
                // Still in cooldown
                this.feedCooldown = true;
                this.feedButton.classList.add('disabled');
                this.startCooldownTimer(endTime - now);
            } else {
                // Cooldown expired
                this.feedButton.textContent = '🐟 Feed';
                this.feedButton.classList.remove('disabled');
                this.feedCooldown = false;
                this.setCookie('feedCooldownEnd', '', -1); // Remove expired cookie
            }
        }
    }

    startCooldownTimer(remainingTime) {
        const minutesLeft = Math.floor(remainingTime / 60000);
        let secondsLeft = Math.floor((remainingTime % 60000) / 1000);
        
        const updateCooldown = () => {
            if (secondsLeft === 0) {
                if (minutesLeft === 0) {
                    this.feedButton.textContent = '🐟 Feed';
                    this.feedButton.classList.remove('disabled');
                    this.feedCooldown = false;
                    this.setCookie('feedCooldownEnd', '', -1); // Remove expired cookie
                    return;
                }
                secondsLeft = 59;
            } else {
                secondsLeft--;
            }
            
            this.feedButton.textContent = `Feed (${minutesLeft}:${secondsLeft.toString().padStart(2, '0')})`;
            setTimeout(updateCooldown, 1000);
        };
        
        updateCooldown();
    }

    handleFeed() {
        if (this.feedCooldown) return;
        
        // Emit feed event
        const feedEvent = new CustomEvent('feedFish');
        document.dispatchEvent(feedEvent);
        
        // Start cooldown
        this.feedCooldown = true;
        this.feedButton.classList.add('disabled');
        
        // Set cookie for 15 minutes
        const cooldownEnd = new Date().getTime() + (15 * 60 * 1000);
        this.setCookie('feedCooldownEnd', cooldownEnd.toString(), 15);
        
        // Start the countdown timer
        this.startCooldownTimer(15 * 60 * 1000);
    }

    draw(ctx) {
        // Draw wooden frame
        ctx.save();
        
        // Create wooden texture gradient
        const frameGradient = ctx.createLinearGradient(0, 0, this.frameThickness, this.frameThickness);
        frameGradient.addColorStop(0, '#8B4513');   // Saddle brown
        frameGradient.addColorStop(0.5, '#DEB887'); // Burly wood
        frameGradient.addColorStop(1, '#8B4513');   // Saddle brown
        
        ctx.fillStyle = frameGradient;
        
        // Draw frame pieces
        // Top
        ctx.fillRect(0, 0, this.width, this.frameThickness);
        // Bottom
        ctx.fillRect(0, this.height - this.frameThickness, this.width, this.frameThickness);
        // Left
        ctx.fillRect(0, 0, this.frameThickness, this.height);
        // Right
        ctx.fillRect(this.width - this.frameThickness, 0, this.frameThickness, this.height);
        
        // Add some wood grain texture
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        // Horizontal grain
        for (let i = 0; i < this.width; i += 5) {
            // Top frame grain
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 10, this.frameThickness);
            ctx.stroke();
            
            // Bottom frame grain
            ctx.beginPath();
            ctx.moveTo(i, this.height - this.frameThickness);
            ctx.lineTo(i + 10, this.height);
            ctx.stroke();
        }
        
        // Vertical grain
        for (let i = 0; i < this.height; i += 5) {
            // Left frame grain
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(this.frameThickness, i + 10);
            ctx.stroke();
            
            // Right frame grain
            ctx.beginPath();
            ctx.moveTo(this.width - this.frameThickness, i);
            ctx.lineTo(this.width, i + 10);
            ctx.stroke();
        }
        
        ctx.restore();
    }
} 