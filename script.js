class WheelOfFortune {
    constructor() {
        this.config = {
            items: [
                { name: 'Hadiah 1', probability: 20 },
                { name: 'Hadiah 2', probability: 20 },
                { name: 'Hadiah 3', probability: 20 },
                { name: 'Hadiah 4', probability: 20 },
                { name: 'Hadiah 5', probability: 20 }
            ],
            secretSettings: {
                winProbability: 50,
                autoSpin: false,
                spinDuration: 5,
                soundEnabled: true,
                winnerColor: '#FFD700',
                confettiEnabled: true,
                weightedMode: false,
                removeAfterWin: false,
                showProbability: false
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
        this.confettiAnimationId = null;

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
        
        // Tab events
        this.addListener('auto-distribute-btn', 'click', () => this.autoDistributeProbabilities());
        
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

        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Window resize
        window.addEventListener('resize', () => this.updateConfettiSize());
    }

    addListener(id, event, handler) {
        const element = document.getElementById(id);
        if (element) element.addEventListener(event, handler);
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        if (tabName === 'probability') {
            this.renderProbabilityControls();
        }
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
        
        const totalProbability = this.wheelItems.reduce((sum, item) => sum + (item.probability || 0), 0);
        let startAngle = 0;
        
        const colors = this.generateColors(this.wheelItems.length);
        
        this.wheelItems.forEach((item, index) => {
            const probability = item.probability || Math.floor(100 / this.wheelItems.length);
            const sliceAngle = (2 * Math.PI * probability) / totalProbability;
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
            
            const itemName = item.name || item;
            const maxTextLength = 12;
            const displayText = itemName.length > maxTextLength ? 
                itemName.substring(0, maxTextLength) + '...' : itemName;
                
            this.ctx.fillText(displayText, radius - 35, 5);
            
            if (this.config.secretSettings.showProbability) {
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText(probability + '%', radius - 35, 18);
            }
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
        const totalProbability = this.wheelItems.reduce((sum, item) => sum + (item.probability || 0), 0);
        
        // Hitung sudut berdasarkan probabilitas
        let currentAngle = 0;
        let targetAngle = 0;
        
        for (let i = 0; i <= winnerIndex; i++) {
            const probability = this.wheelItems[i].probability || Math.floor(100 / this.wheelItems.length);
            const sliceAngle = (2 * Math.PI * probability) / totalProbability;
            if (i === winnerIndex) {
                targetAngle = currentAngle + (sliceAngle / 2);
            }
            currentAngle += sliceAngle;
        }
        
        const finalTargetAngle = targetAngle + (Math.PI * 8) - (Math.PI / 2);
        
        const duration = this.config.secretSettings.spinDuration * 1000;
        const startTime = Date.now();
        const startRotation = this.currentRotation;
        const targetRotation = startRotation + (8 * 2 * Math.PI) + finalTargetAngle;
        
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
        // FIX: Gunakan probabilitas custom dari items
        const totalProbability = this.wheelItems.reduce((sum, item) => sum + (item.probability || 0), 0);
        
        // Debug: log probabilities
        console.log('🎯 Probabilitas Items:', this.wheelItems.map(item => ({
            name: item.name || item,
            probability: item.probability || Math.floor(100 / this.wheelItems.length)
        })));
        console.log('📊 Total Probability:', totalProbability);
        
        const random = Math.random() * totalProbability;
        console.log('🎲 Random Number:', random);
        
        let cumulativeProbability = 0;
        for (let i = 0; i < this.wheelItems.length; i++) {
            const probability = this.wheelItems[i].probability || Math.floor(100 / this.wheelItems.length);
            cumulativeProbability += probability;
            console.log(`Item ${i}: ${this.wheelItems[i].name || this.wheelItems[i]} - Prob: ${probability} - Cumulative: ${cumulativeProbability}`);
            
            if (random <= cumulativeProbability) {
                console.log('🎉 Winner Index:', i);
                return i;
            }
        }
        
        console.log('🔚 Fallback to last item');
        return this.wheelItems.length - 1;
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
            const name = winner.name || winner;
            
            winnerName.textContent = name;
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
        if (this.confettiAnimationId) {
            cancelAnimationFrame(this.confettiAnimationId);
        }
        this.currentRotation = 0;
        this.canvas.style.transform = 'rotate(0rad)';
        this.spinning = false;
        const spinBtn = document.getElementById('spin-btn');
        if (spinBtn) spinBtn.disabled = false;
        
        if (this.confettiCtx && this.confettiCanvas) {
            this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
            this.confettiCanvas.style.display = 'none';
        }
    }

    addItem() {
        const input = document.getElementById('item-input');
        if (!input) return;
        
        const itemName = input.value.trim();
        
        if (itemName) {
            const defaultProbability = this.wheelItems.length > 0 ? 
                Math.floor(100 / (this.wheelItems.length + 1)) : 100;
            
            this.wheelItems.push({
                name: itemName,
                probability: defaultProbability
            });
            
            input.value = '';
            this.redistributeProbabilities();
            this.drawWheel();
            this.renderItemsList();
            this.saveItems();
        } else {
            alert('Masukkan nama item terlebih dahulu!');
        }
    }

    removeItem(index) {
        this.wheelItems.splice(index, 1);
        if (this.wheelItems.length > 0) {
            this.redistributeProbabilities();
        }
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
            const itemName = item.name || item;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.innerHTML = `
                <span class="item-name">${itemName}</span>
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

    // PROBABILITY FEATURES
    renderProbabilityControls() {
        const container = document.getElementById('probability-items');
        const totalProbabilityElement = document.getElementById('total-probability');
        const warningElement = document.getElementById('probability-warning');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        const colors = this.generateColors(this.wheelItems.length);
        const totalProbability = this.wheelItems.reduce((sum, item) => sum + (item.probability || 0), 0);
        
        if (totalProbabilityElement) {
            totalProbabilityElement.textContent = totalProbability;
        }
        
        if (warningElement) {
            warningElement.style.display = totalProbability !== 100 ? 'block' : 'none';
        }
        
        this.wheelItems.forEach((item, index) => {
            const itemName = item.name || item;
            const probability = item.probability || Math.floor(100 / this.wheelItems.length);
            
            const itemElement = document.createElement('div');
            itemElement.className = 'probability-item';
            itemElement.innerHTML = `
                <div class="probability-item-color" style="background-color: ${colors[index]}"></div>
                <div class="probability-item-name">${itemName}</div>
                <div class="probability-controls">
                    <input type="range" class="probability-slider" 
                           min="1" max="100" value="${probability}" 
                           data-index="${index}">
                    <input type="number" class="probability-value" 
                           min="1" max="100" value="${probability}"
                           data-index="${index}">
                </div>
            `;
            container.appendChild(itemElement);
        });
        
        container.querySelectorAll('.probability-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const value = parseInt(e.target.value);
                this.updateItemProbability(index, value);
            });
        });
        
        container.querySelectorAll('.probability-value').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const value = parseInt(e.target.value) || 1;
                this.updateItemProbability(index, value);
            });
        });
    }

    updateItemProbability(index, probability) {
        if (index >= 0 && index < this.wheelItems.length) {
            if (typeof this.wheelItems[index] === 'string') {
                this.wheelItems[index] = {
                    name: this.wheelItems[index],
                    probability: probability
                };
            } else {
                this.wheelItems[index].probability = Math.max(1, Math.min(100, probability));
            }
            this.renderProbabilityControls();
        }
    }

    redistributeProbabilities() {
        if (this.wheelItems.length === 0) return;
        
        const equalProbability = Math.floor(100 / this.wheelItems.length);
        const remainder = 100 - (equalProbability * this.wheelItems.length);
        
        this.wheelItems.forEach((item, index) => {
            if (typeof item === 'string') {
                this.wheelItems[index] = {
                    name: item,
                    probability: equalProbability + (index < remainder ? 1 : 0)
                };
            } else {
                item.probability = equalProbability + (index < remainder ? 1 : 0);
            }
        });
        
        // Force update wheel setelah redistribusi
        this.drawWheel();
    }

    autoDistributeProbabilities() {
        this.redistributeProbabilities();
        this.renderProbabilityControls();
    }

    saveProbabilitiesSilent() {
        const totalProbability = this.wheelItems.reduce((sum, item) => sum + (item.probability || 0), 0);
        
        if (totalProbability !== 100) {
            this.autoDistributeProbabilities();
        }
        
        this.drawWheel();
        this.saveItems();
    }

    // SECRET SETTINGS
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
        document.getElementById('show-probability').checked = this.config.secretSettings.showProbability;
        
        this.switchTab('basic');
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
        this.config.secretSettings.showProbability = document.getElementById('show-probability').checked;
        
        this.saveProbabilitiesSilent();
        
        localStorage.setItem('wheelSecretConfig', JSON.stringify(this.config.secretSettings));
        document.getElementById('secret-modal').style.display = 'none';
        
        this.drawWheel();
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
                removeAfterWin: false,
                showProbability: false
            };
            
            this.redistributeProbabilities();
            this.drawWheel();
            this.saveItems();
            
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
                const items = JSON.parse(savedItems);
                if (items.length > 0 && typeof items[0] === 'string') {
                    this.wheelItems = items.map(name => ({
                        name: name,
                        probability: Math.floor(100 / items.length)
                    }));
                    this.saveItems();
                } else {
                    this.wheelItems = items;
                }
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
        
        if (this.confettiAnimationId) {
            cancelAnimationFrame(this.confettiAnimationId);
        }
        
        this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        this.confettiCanvas.style.display = 'block';
        
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD', '#F7DC6F'];
        const confettiCount = 100;
        const confettiParticles = [];
        
        for (let i = 0; i < confettiCount; i++) {
            confettiParticles.push({
                x: Math.random() * this.confettiCanvas.width,
                y: -20,
                size: Math.random() * 12 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 3 + 2,
                rotation: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.1
            });
        }
        
        const animateConfetti = () => {
            this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
            
            let particlesAlive = false;
            
            confettiParticles.forEach(particle => {
                if (particle.y < this.confettiCanvas.height) {
                    particlesAlive = true;
                    
                    particle.y += particle.speed;
                    particle.x += Math.sin(particle.rotation) * 1;
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
                this.confettiAnimationId = requestAnimationFrame(animateConfetti);
            } else {
                setTimeout(() => {
                    this.confettiCanvas.style.display = 'none';
                }, 1000);
            }
        };
        
        animateConfetti();
    }
}

// Start the application
const wheelApp = new WheelOfFortune();
