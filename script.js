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
