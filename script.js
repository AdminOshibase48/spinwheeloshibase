// Konfigurasi Aplikasi
const config = {
    items: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6'],
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

// Variabel Global
let wheelItems = [];
let spinning = false;
let currentRotation = 0;
let canvas, ctx;
let confettiCanvas, confettiCtx;

// Inisialisasi Aplikasi
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadItems();
});

// Inisialisasi Komponen
function initializeApp() {
    // Setup canvas wheel
    canvas = document.getElementById('wheel');
    ctx = canvas.getContext('2d');
    
    // Setup confetti canvas
    confettiCanvas = document.getElementById('confetti-canvas');
    confettiCtx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    // Load konfigurasi dari localStorage
    loadConfig();
    
    // Inisialisasi wheel
    initializeWheel();
}

// Setup Event Listeners
function setupEventListeners() {
    // Tombol utama
    document.getElementById('spin-btn').addEventListener('click', spinWheel);
    document.getElementById('reset-btn').addEventListener('click', resetWheel);
    document.getElementById('add-item-btn').addEventListener('click', addItem);
    document.getElementById('clear-all-btn').addEventListener('click', clearAllItems);
    
    // Input item dengan Enter
    document.getElementById('item-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addItem();
    });
    
    // Modal controls
    document.getElementById('secret-trigger').addEventListener('click', openSecretSettings);
    document.getElementById('save-settings').addEventListener('click', saveSecretSettings);
    document.getElementById('reset-settings').addEventListener('click', resetSecretSettings);
    document.getElementById('close-result').addEventListener('click', closeResultModal);
    document.getElementById('spin-again').addEventListener('click', spinAgain);
    
    // Range inputs
    document.getElementById('win-probability').addEventListener('input', updateRangeValue);
    document.getElementById('spin-duration').addEventListener('input', updateRangeValue);
    
    // Close modal dengan tombol close
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modal dengan klik di luar
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Responsive canvas
    window.addEventListener('resize', function() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });
}

// Inisialisasi Wheel
function initializeWheel() {
    if (wheelItems.length === 0) {
        wheelItems = [...config.items];
    }
    drawWheel();
}

// Gambar Wheel
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 30;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (wheelItems.length === 0) {
        // Tampilkan pesan jika tidak ada item
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#666';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Tambahkan item terlebih dahulu', centerX, centerY);
        return;
    }
    
    // Gambar setiap segmen
    const sliceAngle = (2 * Math.PI) / wheelItems.length;
    let startAngle = 0;
    
    const colors = generateColors(wheelItems.length);
    
    wheelItems.forEach((item, index) => {
        const endAngle = startAngle + sliceAngle;
        
        // Gambar segmen
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index];
        ctx.fill();
        
        // Border segmen
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Tambah teks
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(item, radius - 40, 5);
        ctx.restore();
        
        startAngle = endAngle;
    });
    
    // Gambar lingkaran tengah
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Gambar icon settings di tengah
    ctx.fillStyle = '#2c3e50';
    ctx.font = '20px FontAwesome';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\uf013', centerX, centerY);
}

// Generate warna untuk segmen
function generateColors(count) {
    const colors = [];
    const hueStep = 360 / count;
    
    for (let i = 0; i < count; i++) {
        const hue = (i * hueStep) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    
    return colors;
}

// Putar Wheel
function spinWheel() {
    if (spinning || wheelItems.length === 0) return;
    
    spinning = true;
    document.getElementById('spin-btn').disabled = true;
    
    // Tentukan pemenang berdasarkan probabilitas rahasia
    const winnerIndex = determineWinner();
    const sliceAngle = (2 * Math.PI) / wheelItems.length;
    
    // Hitung sudut target dengan beberapa putaran penuh
    const targetAngle = (winnerIndex * sliceAngle) + (Math.PI * 8) - (sliceAngle / 2);
    
    const duration = config.secretSettings.spinDuration * 1000;
    const startTime = Date.now();
    const startRotation = currentRotation;
    const targetRotation = startRotation + (8 * 2 * Math.PI) + targetAngle;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function untuk efek perlambatan
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = startRotation + easeOut * (targetRotation - startRotation);
        
        // Apply rotation
        canvas.style.transform = `rotate(${currentRotation}rad)`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Selesai memutar
            finishSpin(winnerIndex);
        }
    }
    
    animate();
    
    // Play sound effect jika diaktifkan
    if (config.secretSettings.soundEnabled) {
        playSpinSound();
    }
}

// Tentukan pemenang berdasarkan probabilitas rahasia
function determineWinner() {
    if (config.secretSettings.weightedMode && wheelItems.length > 1) {
        // Mode probabilitas tertimbang - item pertama lebih mungkin menang
        const weights = wheelItems.map((_, index) => 
            Math.max(0.1, 1 - (index * 0.8 / wheelItems.length))
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
    
    // Mode normal - semua item memiliki probabilitas sama
    // Tapi kita manipulasi berdasarkan winProbability
    const shouldWin = Math.random() * 100 <= config.secretSettings.winProbability;
    
    if (shouldWin) {
        // Pilih dari item yang "menang" (kita anggap semua bisa menang untuk simplicity)
        return Math.floor(Math.random() * wheelItems.length);
    } else {
        // Jika tidak menang, pilih item secara acak
        return Math.floor(Math.random() * wheelItems.length);
    }
}

// Selesaikan putaran
function finishSpin(winnerIndex) {
    setTimeout(() => {
        const winner = wheelItems[winnerIndex];
        
        // Tampilkan hasil
        showResult(winner);
        
        // Aktifkan tombol spin lagi
        spinning = false;
        document.getElementById('spin-btn').disabled = false;
        
        // Hapus item jika diaktifkan
        if (config.secretSettings.removeAfterWin) {
            removeItem(winnerIndex);
        }
        
        // Tampilkan confetti jika diaktifkan
        if (config.secretSettings.confettiEnabled) {
            launchConfetti();
        }
    }, 1000);
}

// Tampilkan hasil
function showResult(winner) {
    document.getElementById('winner-name').textContent = winner;
    document.getElementById('winner-name').style.color = config.secretSettings.winnerColor;
    document.getElementById('result-modal').style.display = 'flex';
}

// Tutup modal hasil
function closeResultModal() {
    document.getElementById('result-modal').style.display = 'none';
}

// Putar lagi
function spinAgain() {
    closeResultModal();
    if (config.secretSettings.autoSpin) {
        setTimeout(spinWheel, 500);
    }
}

// Reset wheel
function resetWheel() {
    currentRotation = 0;
    canvas.style.transform = 'rotate(0rad)';
    initializeWheel();
}

// Tambah item
function addItem() {
    const input = document.getElementById('item-input');
    const itemName = input.value.trim();
    
    if (itemName) {
        wheelItems.push(itemName);
        input.value = '';
        drawWheel();
        renderItemsList();
        saveItems();
    }
}

// Hapus item
function removeItem(index) {
    wheelItems.splice(index, 1);
    drawWheel();
    renderItemsList();
    saveItems();
}

// Hapus semua item
function clearAllItems() {
    if (wheelItems.length > 0 && confirm('Apakah Anda yakin ingin menghapus semua item?')) {
        wheelItems = [];
        drawWheel();
        renderItemsList();
        saveItems();
    }
}

// Render daftar item
function renderItemsList() {
    const container = document.getElementById('items-container');
    container.innerHTML = '';
    
    wheelItems.forEach((item, index) => {
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
    
    // Add event listeners untuk tombol hapus
    document.querySelectorAll('.delete-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeItem(index);
        });
    });
}

// Buka pengaturan rahasia
function openSecretSettings() {
    // Isi form dengan konfigurasi saat ini
    document.getElementById('win-probability').value = config.secretSettings.winProbability;
    document.getElementById('win-probability-value').textContent = config.secretSettings.winProbability + '%';
    document.getElementById('auto-spin').checked = config.secretSettings.autoSpin;
    document.getElementById('spin-duration').value = config.secretSettings.spinDuration;
    document.getElementById('spin-duration-value').textContent = config.secretSettings.spinDuration + 's';
    document.getElementById('sound-effect').checked = config.secretSettings.soundEnabled;
    document.getElementById('winner-color').value = config.secretSettings.winnerColor;
    document.getElementById('confetti-effect').checked = config.secretSettings.confettiEnabled;
    document.getElementById('weighted-mode').checked = config.secretSettings.weightedMode;
    document.getElementById('remove-after-win').checked = config.secretSettings.removeAfterWin;
    
    document.getElementById('secret-modal').style.display = 'flex';
}

// Simpan pengaturan rahasia
function saveSecretSettings() {
    config.secretSettings.winProbability = parseInt(document.getElementById('win-probability').value);
    config.secretSettings.autoSpin = document.getElementById('auto-spin').checked;
    config.secretSettings.spinDuration = parseInt(document.getElementById('spin-duration').value);
    config.secretSettings.soundEnabled = document.getElementById('sound-effect').checked;
    config.secretSettings.winnerColor = document.getElementById('winner-color').value;
    config.secretSettings.confettiEnabled = document.getElementById('confetti-effect').checked;
    config.secretSettings.weightedMode = document.getElementById('weighted-mode').checked;
    config.secretSettings.removeAfterWin = document.getElementById('remove-after-win').checked;
    
    // Simpan ke localStorage
    localStorage.setItem('wheelSecretConfig', JSON.stringify(config.secretSettings));
    
    document.getElementById('secret-modal').style.display = 'none';
    alert('Pengaturan rahasia telah disimpan!');
}

// Reset pengaturan rahasia
function resetSecretSettings() {
    if (confirm('Reset semua pengaturan ke default?')) {
        config.secretSettings = {
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
        alert('Pengaturan telah direset ke default!');
    }
}

// Update nilai range
function updateRangeValue(e) {
    const value = e.target.value;
    if (e.target.id === 'win-probability') {
        document.getElementById('win-probability-value').textContent = value + '%';
    } else if (e.target.id === 'spin-duration') {
        document.getElementById('spin-duration-value').textContent = value + 's';
    }
}

// Load konfigurasi dari localStorage
function loadConfig() {
    const savedConfig = localStorage.getItem('wheelSecretConfig');
    if (savedConfig) {
        config.secretSettings = JSON.parse(savedConfig);
    }
}

// Load items dari localStorage
function loadItems() {
    const savedItems = localStorage.getItem('wheelItems');
    if (savedItems) {
        wheelItems = JSON.parse(savedItems);
    }
    renderItemsList();
}

// Simpan items ke localStorage
function saveItems() {
    localStorage.setItem('wheelItems', JSON.stringify(wheelItems));
}

// Play sound effect
function playSpinSound() {
    // Create audio context untuk sound effect sederhana
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 5);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 5);
}

// Confetti effect
function launchConfetti() {
    const confettiCount = 200;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            createConfettiPiece();
        }, i * 10);
    }
}

function createConfettiPiece() {
    const x = Math.random() * confettiCanvas.width;
    const y = -20;
    const size = Math.random() * 10 + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const speed = Math.random() * 3 + 2;
    const angle = Math.random() * Math.PI * 2;
    const spin = Math.random() * 0.2 - 0.1;
    
    let rotation = 0;
    
    function animate() {
        confettiCtx.save();
        confettiCtx.translate(x, y);
        confettiCtx.rotate(rotation);
        
        confettiCtx.fillStyle = color;
        confettiCtx.fillRect(-size/2, -size/2, size, size);
        
        confettiCtx.restore();
        
        y += speed;
        rotation += spin;
        
        if (y < confettiCanvas.height) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}
