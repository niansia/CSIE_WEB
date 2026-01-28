document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedRange = document.getElementById('speedRange');
    const stepExplanation = document.getElementById('step-explanation');
    const canvas = document.getElementById('algoCanvas');
    const ctx = canvas.getContext('2d');

    let steps = [];
    let currentStep = 0;
    let autoPlayInterval = null;
    let isPlaying = false;
    
    // Visualization Constants
    const k = 4;
    const n = 16;
    const boxSize = 40;
    const startX = 50;
    const startY = 50;
    
    // Bit visualization
    const bitSize = 30;
    const bitStartX = 300;
    const bitStartY = 200;

    startBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevStep);
    nextBtn.addEventListener('click', nextStep);
    resetBtn.addEventListener('click', reset);
    speedRange.addEventListener('input', updateSpeed);

    function togglePlay() {
        if (steps.length === 0) {
            startAlgorithm();
        } else {
            if (isPlaying) {
                pauseAutoPlay();
            } else {
                startAutoPlay();
            }
        }
    }

    function startAlgorithm() {
        fetch('/api/bit_reversed_counter', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            steps = data;
            currentStep = 0;
            
            prevBtn.disabled = true;
            nextBtn.disabled = false;
            
            showStep(steps[0]);
            currentStep++;
            startAutoPlay();
        })
        .catch(error => {
            console.error('Error:', error);
            stepExplanation.textContent = "發生錯誤。";
        });
    }

    function startAutoPlay() {
        isPlaying = true;
        startBtn.textContent = "暫停";
        startBtn.classList.remove('btn-primary', 'btn-success');
        startBtn.classList.add('btn-warning');
        
        if (currentStep < steps.length) nextBtn.disabled = false;
        if (currentStep > 1) prevBtn.disabled = false;
        
        const speed = getSpeed();
        
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            if (currentStep < steps.length) {
                nextStep(true);
            } else {
                pauseAutoPlay();
                startBtn.textContent = "演示結束";
                startBtn.disabled = true;
            }
        }, speed);
    }

    function pauseAutoPlay() {
        isPlaying = false;
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
        startBtn.textContent = "繼續";
        startBtn.classList.remove('btn-warning');
        startBtn.classList.add('btn-success');
        
        if (currentStep < steps.length) nextBtn.disabled = false;
        if (currentStep > 1) prevBtn.disabled = false;
    }
    
    function updateSpeed() {
        if (isPlaying) {
            startAutoPlay();
        }
    }
    
    function getSpeed() {
        const val = parseInt(speedRange.value);
        return 2000 - (val - 1) * 180; 
    }

    function prevStep() {
        if (isPlaying) pauseAutoPlay();

        if (currentStep > 1) {
            currentStep--;
            showStep(steps[currentStep - 1]);
            nextBtn.disabled = false;
            
            if (startBtn.disabled) {
                startBtn.disabled = false;
                startBtn.textContent = "繼續";
                startBtn.classList.remove('btn-warning');
                startBtn.classList.add('btn-success');
            }
        }
        if (currentStep <= 1) {
            prevBtn.disabled = true;
        }
    }

    function nextStep(fromAuto = false) {
        if (!fromAuto && isPlaying) pauseAutoPlay();

        if (currentStep < steps.length) {
            showStep(steps[currentStep]);
            currentStep++;
            prevBtn.disabled = false;
        } 
        
        if (currentStep >= steps.length) {
            nextBtn.disabled = true;
            if (isPlaying) {
                 pauseAutoPlay();
                 startBtn.textContent = "演示結束";
                 startBtn.disabled = true;
            } else if (!fromAuto) {
                 startBtn.textContent = "演示結束";
                 startBtn.disabled = true;
            }
        }
    }

    function reset() {
        pauseAutoPlay();
        steps = [];
        currentStep = 0;
        startBtn.disabled = false;
        startBtn.textContent = "開始演示";
        startBtn.classList.remove('btn-warning', 'btn-success');
        startBtn.classList.add('btn-primary');
        
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        stepExplanation.textContent = "點擊「開始演示」以執行過程。";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function showStep(step) {
        stepExplanation.innerHTML = step.msg;
        draw(step);
    }

    function draw(step) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Array
        if (step.arr) {
            drawArray(step.arr, step.x, step.y, step.type === 'swap');
        }
        
        // Draw Counters
        // We need x and y. If step doesn't have them (e.g. init), use defaults or previous
        let x = step.x !== undefined ? step.x : -1;
        let y = step.y !== undefined ? step.y : (step.prev_y !== undefined ? step.prev_y : 0);
        
        if (step.type === 'increment') {
            // Show the transition
            drawCounters(x, step.prev_y, step.new_y, step.scan_steps);
        } else {
            drawCounters(x, y, null, null);
        }
    }

    function drawArray(arr, activeX, activeY, isSwap) {
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < arr.length; i++) {
            const x = startX + i * boxSize;
            const y = startY;
            
            ctx.beginPath();
            ctx.rect(x, y, boxSize, boxSize);
            
            if (i === activeX || i === activeY) {
                if (isSwap && (i === activeX || i === activeY)) {
                    ctx.fillStyle = '#ffcccc'; // Red for swap
                } else if (i === activeX) {
                    ctx.fillStyle = '#ccffcc'; // Green for current x
                } else if (i === activeY) {
                    ctx.fillStyle = '#ccccff'; // Blue for current y
                }
                ctx.fill();
            }
            
            ctx.strokeStyle = 'black';
            ctx.stroke();
            
            ctx.fillStyle = 'black';
            ctx.fillText(arr[i], x + boxSize/2, y + boxSize/2);
            
            // Index label
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(i, x + boxSize/2, y + boxSize + 15);
            ctx.font = '14px Arial';
            ctx.fillStyle = 'black';
        }
        
        // Labels
        ctx.fillText("Array A:", startX - 30, startY + boxSize/2);
    }

    function drawCounters(x, y, nextY, scanSteps) {
        const labelX = 100;
        const valX = 200;
        const bitsX = 350;
        
        const yX = 200; // Y position for X counter
        const yY = 280; // Y position for Y counter
        
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        
        // Draw X (Normal Counter)
        if (x >= 0) {
            ctx.fillText(`Normal Counter x: ${x}`, labelX, yX);
            drawBits(x, bitsX, yX - 10, null);
        }
        
        // Draw Y (Bit-reversed Counter)
        ctx.fillText(`Bit-reversed y: ${y}`, labelX, yY);
        
        if (nextY !== null) {
            // We are incrementing
            // Draw bits of y, but highlight changes based on scanSteps
            // scanSteps: [{bit: 3, action: 'flip_to_0'}, ...]
            
            // Let's draw the bits of 'y' (the old value) but color code the ones being flipped
            drawBits(y, bitsX, yY - 10, scanSteps);
            
            // Draw arrow to new value
            ctx.fillText(`➔  ${nextY}`, bitsX + k * bitSize + 20, yY);
            
            // Draw bits of nextY
            drawBits(nextY, bitsX + k * bitSize + 80, yY - 10, null, true);
            
        } else {
            drawBits(y, bitsX, yY - 10, null);
        }
    }

    function drawBits(val, startX, startY, scanSteps, isResult = false) {
        for (let i = k - 1; i >= 0; i--) {
            const bitVal = (val >> i) & 1;
            const x = startX + (k - 1 - i) * bitSize;
            const y = startY;
            
            ctx.beginPath();
            ctx.rect(x, y, bitSize, bitSize);
            
            let fillColor = 'white';
            
            if (scanSteps) {
                // Check if this bit is in scanSteps
                const step = scanSteps.find(s => s.bit === i);
                if (step) {
                    if (step.action === 'flip_to_0') {
                        fillColor = '#ff9999'; // Redish for clearing 1->0
                    } else if (step.action === 'flip_to_1') {
                        fillColor = '#99ff99'; // Greenish for setting 0->1
                    }
                }
            } else if (isResult) {
                 // Just normal
            }
            
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.stroke();
            
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bitVal, x + bitSize/2, y + bitSize/2);
            
            // Bit index
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.fillText(i, x + bitSize/2, y - 10);
            ctx.font = '16px Arial';
            ctx.fillStyle = 'black';
        }
    }
});
