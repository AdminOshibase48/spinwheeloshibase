class WheelOfFortune {
    constructor() {
        this.config = {
            items: ['Hadiah 1', 'Hadiah 2', 'Hadiah 3', 'Hadiah 4', 'Hadiah 5', 'Hadiah 6'],
            secretSettings: {
                winProbability: 50,
                autoSpin: false,
                spinDuration: 5,
                soundEnabled: true,
                winnerColor: '#FFD700',
                confettiEnabled: true,
                weightedMode: false,
                removeAfterWin: false
            }
        };

        this.wheelItems = [];
        this.spinning = false;
        this.currentRotation = 0;
        this.canvas = null;
        this.ctx = null;
        this.confettiCanvas = null;
        this.confettiCtx = null;
        this.confettiParticles = [];
        this.animationId = null;

        this.init();
    }

    init() {
        console.log('🚀 Wheel of Fortune Initializing...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        try {
            this.setupCanvas();
            this.setupConfetti();
            this.loadConfig();
            this.loadItems();
            this.setupEventListeners();
            this.initializeWheel();
            
            console.log('✅ Wheel of Fortune Ready!');
        } catch (error) {
            console.error('❌ Setup Error:', error);
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('wheel');
        if (!this.canvas) throw new Error('Canvas not found');
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) throw new Error('Canvas context not available');
    }

    setupConfetti() {
        this.confettiCanvas = document.getElementById('confetti-canvas');
        if (this.confettiCanvas) {
            this.confettiCtx = this.confettiCanvas.getContext('2d');
            this.updateConfettiSize();
        }
    }

    updateConfettiSize() {
        if (this.confettiCanvas) {
            this.confettiCanvas.width = window.innerWidth;
            this.confettiCanvas.height = window.innerHeight;
        }
    }

    setupEventListeners() {
        // Button events
        this.addListener('spin-btn', 'click', () => this.spinWheel());
        this.addListener('reset-btn', 'click', () => this.resetWheel());
        this.addListener('add-item-btn', 'click', () => this.addItem());
        this.addListener('clear-all-btn', 'click', () => this.clearAllItems());
        this.addListener('secret-trigger', 'click', () => this.openSecretSettings());
        this.addListener('save-settings', 'click', () => this.saveSecretSettings());
        this.addListener('reset-settings', 'click', () => this.resetSecretSettings());
        this.addListener('close-result', 'click', () => this.closeResultModal());
        this.addListener('spin-again', 'click', () => this.spinAgain());
        
        // Input events
        this.addListener('item-input', 'keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });
        
        // Range inputs
        this.addListener('win-probability', 'input', (e) => this.updateRangeValue(e));
        this.addListener('spin-duration', 'input', (e) => this.updateRangeValue(e));
        
        // Modal close events
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
        
        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Window resize
        window.addEventListener('resize', () => this.updateConfettiSize());
    }

    addListener(id, event, handler) {
        const element = document.getElementById(id);
        if (element) element.addEventListener(event, handler);
    }

    initializeWheel() {
        if (this.wheelItems.length === 0) {
            this.wheelItems = [...this.config.items];
        }
        this.drawWheel();
        this.renderItemsList();
    }

    drawWheel() {
        if (!this.ctx || !this.canvas) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = this.canvas.width / 2 - 30;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.wheelItems.length === 0) {
            this.ctx.fillStyle = '#f0f0f0';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#666';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('Tambahkan item terlebih dahulu', centerX, centerY);
            return;
        }
        
        const sliceAngle = (2 * Math.PI) / this.wheelItems.length;
        let startAngle = 0;
        
        const colors = this.generateColors(this.wheelItems.length);
        
        this.wheelItems.forEach((item, index) => {
            const endAngle = startAngle + sliceAngle;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = colors[index];
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Arial';
            
            const maxTextLength = 12;
            const displayText = item.length > maxTextLength ? 
                item.substring(0, maxTextLength) + '...' : item;
                
            this.ctx.fillText(displayText, radius - 35, 5);
            this.ctx.restore();
            
            startAngle = endAngle;
        });
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
    }

    generateColors(count) {
        const colorSchemes = [
            ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
            ['#FF9FF3', '#F368E0', '#FF9F43', '#FFCA3A', '#54A0FF', '#5F27CD', '#00D2D3', '#10AC84'],
            ['#FC5C65', '#FD9644', '#FED330', '#26DE81', '#2BCBBA', '#45AAF2', '#4B7BEC', '#A55EEA']
        ];
        
        const selectedScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
        const colors = [];
        
        for (let i = 0; i < count; i++) {
            colors.push(selectedScheme[i % selectedScheme.length]);
        }
        
        return colors;
    }

    spinWheel() {
        if (this.spinning) return;
        if (this.wheelItems.length === 0) {
            alert('Tambahkan item terlebih dahulu!');
            return;
        }
        
        this.spinning = true;
        const spinBtn = document.getElementById('spin-btn');
        if (spinBtn) spinBtn.disabled = true;

        const winnerIndex = this.determineWinner();
        const sliceAngle = (2 * Math.PI) / this.wheelItems.length;
        const targetAngle = (winnerIndex * sliceAngle) + (Math.PI * 8) - (sliceAngle / 2);
        
        const duration = this.config.secretSettings.spinDuration * 1000;
        const startTime = Date.now();
        const startRotation = this.currentRotation;
        const targetRotation = startRotation + (8 * 2 * Math.PI) + targetAngle;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            this.currentRotation = startRotation + easeOut * (targetRotation - startRotation);
            
            this.canvas.style.transform = `rotate(${this.currentRotation}rad)`;
            
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.finishSpin(winnerIndex);
            }
        };
        
        animate();
        
        if (this.config.secretSettings.soundEnabled) {
            this.playSpinSound();
        }
    }

    determineWinner() {
        if (this.config.secretSettings.weightedMode && this.wheelItems.length > 1) {
            const weights = this.wheelItems.map((_, index) => 
                Math.max(0.1, 1 - (index * 0.8 / this.wheelItems.length))
            );
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
            const random = Math.random() * totalWeight;
            
            let cumulativeWeight = 0;
            for (let i = 0; i < weights.length; i++) {
                cumulativeWeight += weights[i];
                if (random <= cumulativeWeight) {
                    return i;
                }
            }
        }
        
        const shouldWin = Math.random() * 100 <= this.config.secretSettings.winProbability;
        return Math.floor(Math.random() * this.wheelItems.length);
    }

    finishSpin(winnerIndex) {
        setTimeout(() => {
            const winner = this.wheelItems[winnerIndex];
            this.showResult(winner);
            
            this.spinning = false;
            const spinBtn = document.getElementById('spin-btn');
            if (spinBtn) spinBtn.disabled = false;
            
            if (this.config.secretSettings.removeAfterWin) {
                this.removeItem(winnerIndex);
            }
            
            if (this.config.secretSettings.confettiEnabled) {
                this.launchConfetti();
            }
        }, 1000);
    }

    showResult(winner) {
        const winnerName = document.getElementById('winner-name');
        const resultModal = document.getElementById('result-modal');
        
        if (winnerName && resultModal) {
            winnerName.textContent = winner;
            winnerName.style.color = this.config.secretSettings.winnerColor;
            resultModal.style.display = 'flex';
        }
    }

    closeResultModal() {
        const resultModal = document.getElementById('result-modal');
        if (resultModal) resultModal.style.display = 'none';
    }

    spinAgain() {
        this.closeResultModal();
        if (this.config.secretSettings.autoSpin) {
            setTimeout(() => this.spinWheel(), 500);
        }
    }

    resetWheel() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.currentRotation = 0;
        this.canvas.style.transform = 'rotate(0rad)';
        this.spinning = false;
        const spinBtn = document.getElementById('spin-btn');
        if (spinBtn) spinBtn.disabled = false;
    }

    addItem() {
        const input = document.getElementById('item-input');
        if (!input) return;
        
        const itemName = input.value.trim();
        
        if (itemName) {
            this.wheelItems.push(itemName);
            input.value = '';
            this.drawWheel();
            this.renderItemsList();
            this.saveItems();
        } else {
            alert('Masukkan nama item terlebih dahulu!');
        }
    }

    removeItem(index) {
        this.wheelItems.splice(index, 1);
        this.drawWheel();
        this.renderItemsList();
        this.saveItems();
    }

    clearAllItems() {
        if (this.wheelItems.length > 0 && confirm('Apakah Anda yakin ingin menghapus semua item?')) {
            this.wheelItems = [];
            this.drawWheel();
            this.renderItemsList();
            this.saveItems();
        }
    }

    renderItemsList() {
        const container = document.getElementById('items-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.wheelItems.length === 0) {
            container.innerHTML = '<div class="empty-state">Belum ada item. Tambahkan item terlebih dahulu.</div>';
            return;
        }
        
        this.wheelItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.innerHTML = `
                <span class="item-name">${item}</span>
                <button class="delete-item" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(itemElement);
        });
        
        container.querySelectorAll('.delete-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.removeItem(index);
            });
        });
    }

    openSecretSettings() {
        document.getElementById('win-probability').value = this.config.secretSettings.winProbability;
        document.getElementById('win-probability-value').textContent = this.config.secretSettings.winProbability + '%';
        document.getElementById('auto-spin').checked = this.config.secretSettings.autoSpin;
        document.getElementById('spin-duration').value = this.config.secretSettings.spinDuration;
        document.getElementById('spin-duration-value').textContent = this.config.secretSettings.spinDuration + 's';
        document.getElementById('sound-effect').checked = this.config.secretSettings.soundEnabled;
        document.getElementById('winner-color').value = this.config.secretSettings.winnerColor;
        document.getElementById('confetti-effect').checked = this.config.secretSettings.confettiEnabled;
        document.getElementById('weighted-mode').checked = this.config.secretSettings.weightedMode;
        document.getElementById('remove-after-win').checked = this.config.secretSettings.removeAfterWin;
        
        document.getElementById('secret-modal').style.display = 'flex';
    }

    saveSecretSettings() {
        this.config.secretSettings.winProbability = parseInt(document.getElementById('win-probability').value);
        this.config.secretSettings.autoSpin = document.getElementById('auto-spin').checked;
        this.config.secretSettings.spinDuration = parseInt(document.getElementById('spin-duration').value);
        this.config.secretSettings.soundEnabled = document.getElementById('sound-effect').checked;
        this.config.secretSettings.winnerColor = document.getElementById('winner-color').value;
        this.config.secretSettings.confettiEnabled = document.getElementById('confetti-effect').checked;
        this.config.secretSettings.weightedMode = document.getElementById('weighted-mode').checked;
        this.config.secretSettings.removeAfterWin = document.getElementById('remove-after-win').checked;
        
        localStorage.setItem('wheelSecretConfig', JSON.stringify(this.config.secretSettings));
        document.getElementById('secret-modal').style.display = 'none';
        alert('✅ Pengaturan rahasia telah disimpan!');
    }

    resetSecretSettings() {
        if (confirm('Reset semua pengaturan ke default?')) {
            this.config.secretSettings = {
                winProbability: 50,
                autoSpin: false,
                spinDuration: 5,
                soundEnabled: true,
                winnerColor: '#FFD700',
                confettiEnabled: true,
                weightedMode: false,
                removeAfterWin: false
            };
            
            localStorage.removeItem('wheelSecretConfig');
            document.getElementById('secret-modal').style.display = 'none';
            alert('✅ Pengaturan telah direset ke default!');
        }
    }

    updateRangeValue(e) {
        const value = e.target.value;
        if (e.target.id === 'win-probability') {
            document.getElementById('win-probability-value').textContent = value + '%';
        } else if (e.target.id === 'spin-duration') {
            document.getElementById('spin-duration-value').textContent = value + 's';
        }
    }

    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('wheelSecretConfig');
            if (savedConfig) {
                this.config.secretSettings = JSON.parse(savedConfig);
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    loadItems() {
        try {
            const savedItems = localStorage.getItem('wheelItems');
            if (savedItems) {
                this.wheelItems = JSON.parse(savedItems);
            }
        } catch (error) {
            console.error('Error loading items:', error);
        }
    }

    saveItems() {
        try {
            localStorage.setItem('wheelItems', JSON.stringify(this.wheelItems));
        } catch (error) {
            console.error('Error saving items:', error);
        }
    }

    playSpinSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 5);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 5);
        } catch (error) {
            console.log('Sound effect skipped');
        }
    }

    launchConfetti() {
        if (!this.confettiCanvas || !this.confettiCtx) return;
        
        this.confettiCanvas.style.display = 'block';
        this.confettiParticles = [];
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        for (let i = 0; i < 150; i++) {
            this.confettiParticles.push({
                x: Math.random() * this.confettiCanvas.width,
                y: Math.random() * -100,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 3 + 2,
                rotation: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.2
            });
        }
        
        this.animateConfetti();
    }

    animateConfetti() {
        if (!this.confettiCtx || !this.confettiCanvas) return;
        
        this.confettiCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.confettiCtx.fillRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        
        let particlesAlive = false;
        
        this.confettiParticles.forEach(particle => {
            if (particle.y < this.confettiCanvas.height) {
                particlesAlive = true;
                
                particle.y += particle.speed;
                particle.x += Math.sin(particle.rotation) * 2;
                particle.rotation += particle.spin;
                
                this.confettiCtx.save();
                this.confettiCtx.translate(particle.x, particle.y);
                this.confettiCtx.rotate(particle.rotation);
                
                this.confettiCtx.fillStyle = particle.color;
                this.confettiCtx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
                
                this.confettiCtx.restore();
            }
        });
        
        if (particlesAlive) {
            requestAnimationFrame(() => this.animateConfetti());
        } else {
            setTimeout(() => {
                if (this.confettiCtx) {
                    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
                    this.confettiCanvas.style.display = 'none';
                }
            }, 1000);
        }
    }
}

// Start the application
const wheelApp = new WheelOfFortune();
