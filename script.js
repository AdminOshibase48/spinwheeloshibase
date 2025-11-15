// Data untuk wheel
let wheelItems = [
    { name: "Hadiah 1", probability: 25, color: "#4a6fa5" },
    { name: "Hadiah 2", probability: 25, color: "#6b8cbc" },
    { name: "Hadiah 3", probability: 25, color: "#ff6b6b" },
    { name: "Hadiah 4", probability: 25, color: "#4ecdc4" }
];

// Variabel global
let canvas, ctx;
let spinning = false;
let currentRotation = 0;
let totalProbability = 100;

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    // Setup canvas
    canvas = document.getElementById('wheel');
    ctx = canvas.getContext('2d');
    
    // Setup event listeners
    document.getElementById('spin-btn').addEventListener('click', spinWheel);
    document.getElementById('add-item').addEventListener('click', addItem);
    document.getElementById('settings-toggle').addEventListener('click', toggleSettings);
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // Inisialisasi wheel
    updateTotalProbability();
    drawWheel();
    renderItemsList();
});

// Fungsi untuk menggambar wheel
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Hitung total probabilitas
    const total = wheelItems.reduce((sum, item) => sum + item.probability, 0);
    
    // Gambar setiap segmen
    let startAngle = 0;
    
    wheelItems.forEach(item => {
        const sliceAngle = (2 * Math.PI * item.probability) / total;
        
        // Gambar segmen
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.stroke();
        
        // Tambah teks
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(item.name, radius - 20, 5);
        ctx.restore();
        
        startAngle += sliceAngle;
    });
    
    // Gambar lingkaran tengah
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();
}

// Fungsi untuk memutar wheel
function spinWheel() {
    if (spinning || wheelItems.length < 2) return;
    
    spinning = true;
    document.getElementById('spin-btn').disabled = true;
    
    // Hitung total probabilitas
    const total = wheelItems.reduce((sum, item) => sum + item.probability, 0);
    
    // Generate angka acak berdasarkan probabilitas
    const random = Math.random() * total;
    
    // Tentukan pemenang berdasarkan probabilitas
    let cumulativeProbability = 0;
    let winningIndex = 0;
    
    for (let i = 0; i < wheelItems.length; i++) {
        cumulativeProbability += wheelItems[i].probability;
        if (random <= cumulativeProbability) {
            winningIndex = i;
            break;
        }
    }
    
    // Hitung sudut untuk pemenang
    const sliceAngle = (2 * Math.PI) / wheelItems.length;
    const targetAngle = (winningIndex * sliceAngle) + (Math.PI * 3) - (sliceAngle / 2);
    
    // Hitung rotasi yang diperlukan
    const rotations = 5; // Jumlah putaran penuh
    const targetRotation = currentRotation + (rotations * 2 * Math.PI) + targetAngle;
    
    // Animasi wheel
    const startTime = Date.now();
    const duration = 5000; // 5 detik
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function untuk efek perlambatan
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = easeOut * (targetRotation - currentRotation) + currentRotation;
        
        // Apply rotation ke canvas
        canvas.style.transform = `rotate(${currentRotation}rad)`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Selesai memutar
            setTimeout(() => {
                showResult(wheelItems[winningIndex]);
                spinning = false;
                document.getElementById('spin-btn').disabled = false;
            }, 500);
        }
    }
    
    animate();
}

// Fungsi untuk menampilkan hasil
function showResult(item) {
    document.getElementById('result-text').textContent = item.name;
    document.getElementById('result-modal').style.display = 'flex';
}

// Fungsi untuk menutup modal
function closeModal() {
    document.getElementById('result-modal').style.display = 'none';
}

// Fungsi untuk menambah item
function addItem() {
    const nameInput = document.getElementById('item-name');
    const probabilityInput = document.getElementById('item-probability');
    const colorInput = document.getElementById('item-color');
    
    const name = nameInput.value.trim();
    const probability = parseInt(probabilityInput.value);
    const color = colorInput.value;
    
    // Validasi input
    if (!name) {
        alert('Nama item tidak boleh kosong!');
        return;
    }
    
    if (isNaN(probability) || probability < 1 || probability > 100) {
        alert('Probabilitas harus antara 1 dan 100!');
        return;
    }
    
    if (totalProbability + probability > 100) {
        alert('Total probabilitas tidak boleh lebih dari 100%!');
        return;
    }
    
    // Tambah item ke array
    wheelItems.push({
        name: name,
        probability: probability,
        color: color
    });
    
    // Reset form
    nameInput.value = '';
    probabilityInput.value = '20';
    colorInput.value = '#4a6fa5';
    
    // Update UI
    updateTotalProbability();
    drawWheel();
    renderItemsList();
}

// Fungsi untuk menghapus item
function deleteItem(index) {
    wheelItems.splice(index, 1);
    updateTotalProbability();
    drawWheel();
    renderItemsList();
}

// Fungsi untuk merender daftar item
function renderItemsList() {
    const container = document.getElementById('items-container');
    container.innerHTML = '';
    
    wheelItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.style.borderLeftColor = item.color;
        
        itemElement.innerHTML = `
            <div class="item-info">
                <div class="item-color" style="background-color: ${item.color}"></div>
                <span class="item-name">${item.name}</span>
            </div>
            <div class="item-details">
                <span class="item-probability">${item.probability}%</span>
                <button class="delete-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(itemElement);
    });
    
    // Tambah event listener untuk tombol hapus
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            deleteItem(index);
        });
    });
}

// Fungsi untuk update total probabilitas
function updateTotalProbability() {
    totalProbability = wheelItems.reduce((sum, item) => sum + item.probability, 0);
    document.getElementById('total-probability').textContent = totalProbability;
    
    // Update status tombol spin
    document.getElementById('spin-btn').disabled = wheelItems.length < 2 || totalProbability !== 100;
}

// Fungsi untuk toggle pengaturan
function toggleSettings() {
    const content = document.getElementById('settings-content');
    const toggleIcon = document.querySelector('.settings-toggle i');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.style.maxHeight = content.scrollHeight + 'px';
        toggleIcon.className = 'fas fa-chevron-up';
    } else {
        content.classList.add('collapsed');
        content.style.maxHeight = '0';
        toggleIcon.className = 'fas fa-chevron-down';
    }
}
// Konfigurasi Rahasia
let secretConfig = {
    winProbability: 50,        // Probabilitas menang dalam persen
    itemCount: 6,              // Jumlah item default
    winningItem: "Jackpot",    // Nama item kemenangan
    losingItem: "Coba Lagi",   // Nama item kekalahan
    animationSpeed: "normal",  // Kecepatan animasi
    autoWin: false             // Mode auto win untuk testing
};

// Data wheel
let wheelItems = [];
let spinning = false;
let currentRotation = 0;
let canvas, ctx;

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    // Setup canvas
    canvas = document.getElementById('wheel');
    ctx = canvas.getContext('2d');
    
    // Load konfigurasi dari localStorage
    loadSecretConfig();
    
    // Inisialisasi wheel
    initializeWheel();
    
    // Setup event listeners
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('spin-btn').addEventListener('click', spinWheel);
    document.getElementById('secret-settings').addEventListener('click', openSecretSettings);
    document.getElementById('save-secret').addEventListener('click', saveSecretConfig);
    document.getElementById('reset-secret').addEventListener('click', resetSecretConfig);
    document.getElementById('close-modal').addEventListener('click', closeResultModal);
    
    // Close modal ketika klik di luar
    window.addEventListener('click', function(event) {
        const secretModal = document.getElementById('secret-modal');
        const resultModal = document.getElementById('result-modal');
        
        if (event.target === secretModal) {
            secretModal.style.display = 'none';
        }
        if (event.target === resultModal) {
            closeResultModal();
        }
    });
    
    // Close modal dengan tombol close
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
}

// Inisialisasi wheel dengan konfigurasi rahasia
function initializeWheel() {
    generateWheelItems();
    drawWheel();
}

// Generate item berdasarkan konfigurasi rahasia
function generateWheelItems() {
    wheelItems = [];
    const colors = [
        '#4a6fa5', '#6b8cbc', '#ff6b6b', '#4ecdc4', 
        '#ffbe0b', '#9b59b6', '#2ecc71', '#e74c3c',
        '#3498db', '#f39c12', '#1abc9c', '#d35400'
    ];
    
    // Hitung jumlah item menang berdasarkan probabilitas
    const winCount = Math.max(1, Math.floor(secretConfig.itemCount * secretConfig.winProbability / 100));
    const loseCount = secretConfig.itemCount - winCount;
    
    // Tambah item menang
    for (let i = 0; i < winCount; i++) {
        wheelItems.push({
            name: i === 0 ? secretConfig.winningItem : `Hadiah ${i+1}`,
            probability: 100 / secretConfig.itemCount,
            color: colors[i % colors.length],
            isWin: true
        });
    }
    
    // Tambah item kalah
    for (let i = 0; i < loseCount; i++) {
        wheelItems.push({
            name: secretConfig.losingItem,
            probability: 100 / secretConfig.itemCount,
            color: colors[(winCount + i) % colors.length],
            isWin: false
        });
    }
    
    // Acak urutan item
    wheelItems = shuffleArray(wheelItems);
}

// Acak array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Gambar wheel
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 20;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Gambar setiap segmen
    let startAngle = 0;
    const sliceAngle = (2 * Math.PI) / wheelItems.length;
    
    wheelItems.forEach((item, index) => {
        // Gambar segmen
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = item.color;
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
        ctx.fillText(item.name, radius - 30, 5);
        ctx.restore();
        
        startAngle += sliceAngle;
    });
    
    // Gambar lingkaran tengah
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = var(--dark-color);
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Putar wheel
function spinWheel() {
    if (spinning) return;
    
    spinning = true;
    document.getElementById('spin-btn').disabled = true;
    
    // Mode auto win untuk testing
    if (secretConfig.autoWin) {
        const winningItem = wheelItems.find(item => item.isWin);
        animateWheel(winningItem);
        return;
    }
    
    // Tentukan hasil berdasarkan probabilitas
    const random = Math.random() * 100;
    let resultItem;
    
    if (random <= secretConfig.winProbability) {
        // Pilih item menang secara acak
        const winItems = wheelItems.filter(item => item.isWin);
        resultItem = winItems[Math.floor(Math.random() * winItems.length)];
    } else {
        // Pilih item kalah secara acak
        const loseItems = wheelItems.filter(item => !item.isWin);
        resultItem = loseItems[Math.floor(Math.random() * loseItems.length)];
    }
    
    animateWheel(resultItem);
}

// Animasi wheel
function animateWheel(resultItem) {
    const resultIndex = wheelItems.findIndex(item => item === resultItem);
    const sliceAngle = (2 * Math.PI) / wheelItems.length;
    
    // Hitung sudut target
    const targetAngle = (resultIndex * sliceAngle) + (Math.PI * 5) - (sliceAngle / 2);
    
    // Tentukan durasi berdasarkan kecepatan
    let duration;
    switch(secretConfig.animationSpeed) {
        case 'slow': duration = 7000; break;
        case 'fast': duration = 3000; break;
        default: duration = 5000;
    }
    
    const startTime = Date.now();
    const startRotation = currentRotation;
    const targetRotation = startRotation + (5 * 2 * Math.PI) + targetAngle;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function untuk efek perlambatan
        const easeOut = 1 - Math.pow(1 - progress, 4);
        
        currentRotation = startRotation + easeOut * (targetRotation - startRotation);
        
        // Apply rotation
        canvas.style.transform = `rotate(${currentRotation}rad)`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Selesai memutar
            setTimeout(() => {
                showResult(resultItem);
                spinning = false;
                document.getElementById('spin-btn').disabled = false;
            }, 1000);
        }
    }
    
    animate();
}

// Tampilkan hasil
function showResult(item) {
    document.getElementById('result-text').textContent = item.name;
    
    const message = item.isWin 
        ? "🎉 Selamat! Anda memenangkan hadiah!" 
        : "😔 Sayang sekali, coba lagi ya!";
    
    document.getElementById('result-message').textContent = message;
    document.getElementById('result-modal').style.display = 'flex';
}

// Tutup modal hasil
function closeResultModal() {
    document.getElementById('result-modal').style.display = 'none';
}

// Buka pengaturan rahasia
function openSecretSettings() {
    // Isi form dengan konfigurasi saat ini
    document.getElementById('secret-probability').value = secretConfig.winProbability;
    document.getElementById('secret-items').value = secretConfig.itemCount;
    document.getElementById('winning-item').value = secretConfig.winningItem;
    document.getElementById('losing-item').value = secretConfig.losingItem;
    document.getElementById('animation-speed').value = secretConfig.animationSpeed;
    document.getElementById('auto-win').checked = secretConfig.autoWin;
    
    document.getElementById('secret-modal').style.display = 'flex';
}

// Simpan konfigurasi rahasia
function saveSecretConfig() {
    secretConfig.winProbability = parseInt(document.getElementById('secret-probability').value);
    secretConfig.itemCount = parseInt(document.getElementById('secret-items').value);
    secretConfig.winningItem = document.getElementById('winning-item').value;
    secretConfig.losingItem = document.getElementById('losing-item').value;
    secretConfig.animationSpeed = document.getElementById('animation-speed').value;
    secretConfig.autoWin = document.getElementById('auto-win').checked;
    
    // Simpan ke localStorage
    localStorage.setItem('wheelSecretConfig', JSON.stringify(secretConfig));
    
    // Update wheel
    initializeWheel();
    
    // Tutup modal
    document.getElementById('secret-modal').style.display = 'none';
    
    // Tampilkan konfirmasi
    alert('Pengaturan rahasia telah disimpan!');
}

// Reset konfigurasi rahasia
function resetSecretConfig() {
    secretConfig = {
        winProbability: 50,
        itemCount: 6,
        winningItem: "Jackpot",
        losingItem: "Coba Lagi",
        animationSpeed: "normal",
        autoWin: false
    };
    
    localStorage.removeItem('wheelSecretConfig');
    initializeWheel();
    document.getElementById('secret-modal').style.display = 'none';
    alert('Pengaturan telah direset ke default!');
}

// Load konfigurasi dari localStorage
function loadSecretConfig() {
    const savedConfig = localStorage.getItem('wheelSecretConfig');
    if (savedConfig) {
        secretConfig = JSON.parse(savedConfig);
    }
}
