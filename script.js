// Konfigurasi Aplikasi
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
        console.log('🚀 Menginisialisasi Wheel of Fortune...');
        
        // Tunggu DOM siap
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
            
            console.log('✅ Aplikasi berhasil diinisialisasi');
        } catch (error) {
            console.error('❌ Error saat setup:', error);
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('wheel');
        if (!this.canvas) {
            throw new Error('Canvas wheel tidak ditemukan!');
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Tidak bisa mendapatkan context 2D dari canvas!');
        }

        console.log('✅ Canvas berhasil disetup');
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
        console.log('🔧 Setup event listeners...');

        // Tombol utama
        this.addEventListener('spin-btn', 'click', () => this.spinWheel());
        this.addEventListener('reset-btn', 'click', () => this.resetWheel());
        this.addEventListener('add-item-btn', 'click', () => this.addItem());
        this.addEventListener('clear-all-btn', 'click', () => this.clearAllItems());
        
        // Input item dengan Enter
        this.addEventListener('item-input', 'keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });
        
        // Modal controls
        this.addEventListener('secret-trigger', 'click', () => this.openSecretSettings());
        this.addEventListener('save-settings', 'click', () => this.saveSecretSettings());
        this.addEventListener('reset-settings', 'click', () => this.resetSecretSettings());
        this.addEventListener('close-result', 'click', () => this.closeResultModal());
        this.addEventListener('spin-again', 'click', () => this.spinAgain());
        
        // Range inputs
        this.addEventListener('win-probability', 'input', (e) => this.updateRangeValue(e));
        this.addEventListener('spin-duration', 'input', (e) => this.updateRangeValue(e));
        
        // Close modal dengan tombol close
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = btn.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
        
        // Close modal dengan klik di luar
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Responsive confetti
        window.addEventListener('resize', () => this.updateConfettiSize());

        console.log('✅ Event listeners berhasil disetup');
    }

    addEventListener(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element dengan id '${id}' tidak ditemukan`);
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
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.wheelItems.length === 0) {
            // Tampilkan pesan jika tidak ada item
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
        
        // Gambar setiap segmen
        const sliceAngle = (2 * Math.PI) / this.wheelItems.length;
        let startAngle = 0;
        
        const colors = this.generateColors(this.wheelItems.length);
        
        this.wheelItems.forEach((item, index) => {
            const endAngle = startAngle + sliceAngle;
            
            // Gambar segmen
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = colors[index];
            this.ctx.fill();
            
            // Border segmen
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Tambah teks
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Arial';
            
            // Potong teks jika terlalu panjang
            const maxTextLength = 12;
            const displayText = item.length > maxTextLength ? 
                item.substring(0, maxTextLength) + '...' : item;
                
            this.ctx.fillText(displayText, radius - 35, 5);
            this.ctx.restore();
            
            startAngle = endAngle;
        });
        
        // Gambar lingkaran tengah
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
    }

    generateColors(count) {
        const colors = [];
        const hueStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const hue = (i * hueStep) % 360;
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }
        
        return colors;
    }

    spinWheel() {
        if (this.spinning || this.wheelItems.length === 0) {
            if (this.wheelItems.length === 0) {
                alert('Tambahkan item terlebih dahulu!');
            }
            return;
        }
        
        this.spinning = true;
        const spinBtn = document.getElementById('spin-btn');
        if (spinBtn) spinBtn.disabled = true;

        // Tentukan pemenang
        const winnerIndex = this.determineWinner();
        const sliceAngle = (2 * Math.PI) / this.wheelItems.length;
        
        // Hitung sudut target
        const targetAngle = (winnerIndex * sliceAngle) + (Math.PI * 8) - (sliceAngle / 2);
        
        const duration = this.config.secretSettings.spinDuration * 1000;
        const startTime = Date.now();
        const startRotation = this.currentRotation;
        const targetRotation = startRotation + (8 * 2 * Math.PI) + targetAngle;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function untuk efek perlambatan
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            this.currentRotation = startRotation + easeOut * (targetRotation - startRotation);
            
            // Apply rotation
            this.canvas.style.transform = `rotate(${this.currentRotation}rad)`;
            
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.finishSpin(winnerIndex);
            }
        };
        
        animate();
        
        // Play sound effect
        if (this.config.secretSettings.soundEnabled) {
            this.playSpinSound();
        }
    }

    determineWinner() {
        if (this.config.secretSettings.weightedMode && this.wheelItems.length > 1) {
            // Mode probabilitas tertimbang
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
        
        // Mode normal dengan probabilitas menang
        const shouldWin = Math.random() * 100 <= this.config.secretSettings.winProbability;
        
        if (shouldWin) {
            return Math.floor(Math.random() * this.wheelItems.length);
        } else {
            return Math.floor(Math.random() * this.wheelItems.length);
        }
    }

    finishSpin(winnerIndex) {
        setTimeout(() => {
            const winner = this.wheelItems[winnerIndex];
            
            this.showResult(winner);
            
            // Aktifkan tombol spin lagi
            this.spinning = false;
            const spinBtn = document.getElementById('spin-btn');
            if (spinBtn) spinBtn.disabled = false;
            
            // Hapus item jika diaktifkan
            if (this.config.secretSettings.removeAfterWin) {
                this.removeItem(winnerIndex);
            }
            
            // Tampilkan confetti
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
                <button class="delete-item" data-index="${index}" title="Hapus item">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(itemElement);
        });
        
        // Add event listeners untuk tombol hapus
        container.querySelectorAll('.delete-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(btn.getAttribute('data-index'));
                this.removeItem(index);
            });
        });
    }

    openSecretSettings() {
        // Isi form dengan konfigurasi saat ini
        this.setElementValue('win-probability', this.config.secretSettings.winProbability);
        this.setElementText('win-probability-value', this.config.secretSettings.winProbability + '%');
        this.setElementChecked('auto-spin', this.config.secretSettings.autoSpin);
        this.setElementValue('spin-duration', this.config.secretSettings.spinDuration);
        this.setElementText('spin-duration-value', this.config.secretSettings.spinDuration + 's');
        this.setElementChecked('sound-effect', this.config.secretSettings.soundEnabled);
        this.setElementValue('winner-color', this.config.secretSettings.winnerColor);
        this.setElementChecked('confetti-effect', this.config.secretSettings.confettiEnabled);
        this.setElementChecked('weighted-mode', this.config.secretSettings.weightedMode);
        this.setElementChecked('remove-after-win', this.config.secretSettings.removeAfterWin);
        
        const secretModal = document.getElementById('secret-modal');
        if (secretModal) secretModal.style.display = 'flex';
    }

    setElementValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }

    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }

    setElementChecked(id, checked) {
        const element = document.getElementById(id);
        if (element) element.checked = checked;
    }

    saveSecretSettings() {
        this.config.secretSettings.winProbability = this.getElementValue('win-probability', 50);
        this.config.secretSettings.autoSpin = this.getElementChecked('auto-spin', false);
        this.config.secretSettings.spinDuration = this.getElementValue('spin-duration', 5);
        this.config.secretSettings.soundEnabled = this.getElementChecked('sound-effect', true);
        this.config.secretSettings.winnerColor = this.getElementValue('winner-color', '#FFD700');
        this.config.secretSettings.confettiEnabled = this.getElementChecked('confetti-effect', true);
        this.config.secretSettings.weightedMode = this.getElementChecked('weighted-mode', false);
        this.config.secretSettings.removeAfterWin = this.getElementChecked('remove-after-win', false);
        
        // Simpan ke localStorage
        localStorage.setItem('wheelSecretConfig', JSON.stringify(this.config.secretSettings));
        
        const secretModal = document.getElementById('secret-modal');
        if (secretModal) secretModal.style.display = 'none';
        
        alert('✅ Pengaturan rahasia telah disimpan!');
    }

    getElementValue(id, defaultValue) {
        const element = document.getElementById(id);
        return element ? parseInt(element.value) || defaultValue : defaultValue;
    }

    getElementChecked(id, defaultValue) {
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
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
            const secretModal = document.getElementById('secret-modal');
            if (secretModal) secretModal.style.display = 'none';
            
            alert('✅ Pengaturan telah direset ke default!');
        }
    }

    updateRangeValue(e) {
        const value = e.target.value;
        if (e.target.id === 'win-probability') {
            this.setElementText('win-probability-value', value + '%');
        } else if (e.target.id === 'spin-duration') {
            this.setElementText('spin-duration-value', value + 's');
        }
    }

    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('wheelSecretConfig');
            if (savedConfig) {
                this.config.secretSettings = JSON.parse(savedConfig);
                console.log('✅ Konfigurasi loaded dari localStorage');
            }
        } catch (error) {
            console.error('❌ Error loading config:', error);
        }
    }

    loadItems() {
        try {
            const savedItems = localStorage.getItem('wheelItems');
            if (savedItems) {
                this.wheelItems = JSON.parse(savedItems);
                console.log('✅ Items loaded dari localStorage:', this.wheelItems.length);
            }
        } catch (error) {
            console.error('❌ Error loading items:', error);
        }
    }

    saveItems() {
        try {
            localStorage.setItem('wheelItems', JSON.stringify(this.wheelItems));
            console.log('💾 Items disimpan:', this.wheelItems.length);
        } catch (error) {
            console.error('❌ Error saving items:', error);
        }
    }

    playSpinSound() {
        try {
            // Sound effect sederhana menggunakan Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Sound effect spinning
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 5);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 5);
        } catch (error) {
            console.warn('🔇 Sound effect tidak tersedia:', error);
        }
    }

    launchConfetti() {
        if (!this.confettiCanvas || !this.confettiCtx) return;
        
        this.confettiCanvas.style.display = 'block';
        this.confettiParticles = [];
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        // Buat partikel confetti
        for (let i = 0; i < 200; i++) {
            this.confettiParticles.push({
                x: Math.random() * this.confettiCanvas.width,
                y: Math.random() * -100,
                size: Math.random() * 12 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 5 + 2,
                rotation: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.2,
                sway: Math.random() * 2 - 1
            });
        }
        
        this.animateConfetti();
    }

    animateConfetti() {
        if (!this.confettiCtx || !this.confettiCanvas) return;
        
        // Clear canvas dengan transparansi untuk efek fade
        this.confettiCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.confettiCtx.fillRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
        
        let particlesAlive = false;
        
        this.confettiParticles.forEach(particle => {
            if (particle.y < this.confettiCanvas.height) {
                particlesAlive = true;
                
                // Update posisi
                particle.y += particle.speed;
                particle.x += Math.sin(particle.rotation) * 2 + particle.sway;
                particle.rotation += particle.spin;
                
                // Gambar partikel
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
            // Clear canvas ketika selesai
            setTimeout(() => {
                if (this.confettiCtx) {
                    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
                    this.confettiCanvas.style.display = 'none';
                }
            }, 1000);
        }
    }
}

// Inisialisasi aplikasi
const wheelApp = new WheelOfFortune();

// Export untuk akses global (jika diperlukan)
window.wheelApp = wheelApp;
