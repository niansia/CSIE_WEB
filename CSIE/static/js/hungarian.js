document.addEventListener('DOMContentLoaded', function() {
    const sizeSlider = document.getElementById('matrix-size');
    const sizeDisplay = document.getElementById('size-display');
    const inputGrid = document.getElementById('input-grid');
    const vizGrid = document.getElementById('viz-grid');
    const vizCanvas = document.getElementById('viz-canvas');
    const ctx = vizCanvas.getContext('2d');
    
    let currentSize = 4;
    let currentSteps = [];
    let currentStepIndex = -1;
    let animationInterval = null;
    let isPlaying = false;
    
    // Init
    updateInputGrid(currentSize);
    
    // Listeners
    sizeSlider.addEventListener('input', function() {
        currentSize = parseInt(this.value);
        sizeDisplay.innerText = `${currentSize}x${currentSize}`;
        updateInputGrid(currentSize);
    });
    
    document.getElementById('btn-random').addEventListener('click', randomizeInputs);
    document.getElementById('btn-solve').addEventListener('click', solve);
    
    document.getElementById('btn-prev').addEventListener('click', () => step(-1));
    document.getElementById('btn-next').addEventListener('click', () => step(1));
    document.getElementById('btn-play').addEventListener('click', togglePlay);
    
    // Speed Control
    const speedRange = document.getElementById('speed');
    const speedDisplay = document.getElementById('speedDisplay');
    speedRange.addEventListener('input', function() {
        const val = parseInt(this.value);
        const delay = 5100 - val;
        speedDisplay.innerText = delay + " ms";
        if (isPlaying) {
            stopPlay();
            togglePlay();
        }
    });
    
    function updateInputGrid(n) {
        inputGrid.style.display = 'grid';
        inputGrid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        inputGrid.style.gap = '5px';
        inputGrid.innerHTML = '';
        
        for (let i = 0; i < n * n; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control hungarian-input';
            input.value = Math.floor(Math.random() * 10) + 1;
            inputGrid.appendChild(input);
        }
    }
    
    function randomizeInputs() {
        const inputs = inputGrid.querySelectorAll('input');
        inputs.forEach(inp => {
            inp.value = Math.floor(Math.random() * 20) + 1;
        });
    }
    
    function getMatrix() {
        const inputs = inputGrid.querySelectorAll('input');
        const matrix = [];
        let row = [];
        inputs.forEach((inp, idx) => {
            row.push(parseInt(inp.value) || 0);
            if ((idx + 1) % currentSize === 0) {
                matrix.push(row);
                row = [];
            }
        });
        return matrix;
    }
    
    function solve() {
        const matrix = getMatrix();
        const problemType = document.querySelector('input[name="problemType"]:checked').value;
        
        fetch('/api/hungarian', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                matrix: matrix,
                problem_type: problemType
            })
        })
        .then(response => response.json())
        .then(data => {
            currentSteps = data;
            currentStepIndex = -1;
            step(1);
        });
    }
    
    function step(direction) {
        if (!currentSteps.length) return;
        
        currentStepIndex += direction;
        if (currentStepIndex < 0) currentStepIndex = 0;
        if (currentStepIndex >= currentSteps.length) {
            currentStepIndex = currentSteps.length - 1;
            stopPlay();
        }
        
        const stepData = currentSteps[currentStepIndex];
        renderStep(stepData);
    }
    
    function renderStep(data) {
        document.getElementById('status-text').innerText = data.msg;
        
        const n = data.matrix.length;
        const cellSize = 60;
        const gap = 5;
        
        // Setup Grid
        vizGrid.style.gridTemplateColumns = `repeat(${n}, ${cellSize}px)`;
        vizGrid.style.gap = `${gap}px`;
        vizGrid.innerHTML = '';
        
        // Setup Canvas
        const totalWidth = n * cellSize + (n - 1) * gap;
        const totalHeight = n * cellSize + (n - 1) * gap;
        vizCanvas.width = totalWidth;
        vizCanvas.height = totalHeight;
        ctx.clearRect(0, 0, totalWidth, totalHeight);
        
        // Render Cells
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const val = data.matrix[r][c];
                const cell = document.createElement('div');
                cell.className = 'viz-cell';
                cell.innerText = val;
                
                // Highlights
                // Check if this cell is involved in an operation
                if (data.highlights) {
                    const hl = data.highlights.find(h => h.r === r && h.c === c);
                    if (hl) {
                        if (hl.type === 'sub' || hl.type === 'sub_augment') {
                            cell.classList.add('highlight-sub');
                            // Optional: Show small -val
                        } else if (hl.type === 'add_augment') {
                            cell.classList.add('highlight-add');
                        }
                    }
                }
                
                // Assignment
                if (data.assignment) {
                    const assign = data.assignment.find(a => a.r === r && a.c === c);
                    if (assign) {
                        cell.classList.add('assigned');
                    }
                }
                
                vizGrid.appendChild(cell);
            }
        }
        
        // Draw Lines
        if (data.lines) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 4;
            
            data.lines.rows.forEach(r => {
                const y = r * (cellSize + gap) + cellSize / 2;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(totalWidth, y);
                ctx.stroke();
            });
            
            data.lines.cols.forEach(c => {
                const x = c * (cellSize + gap) + cellSize / 2;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, totalHeight);
                ctx.stroke();
            });
        }
    }
    
    function togglePlay() {
        if (isPlaying) {
            stopPlay();
        } else {
            isPlaying = true;
            document.getElementById('btn-play').innerText = '暫停 (Pause)';
            const val = parseInt(speedRange.value);
            const delay = 5100 - val;
            
            animationInterval = setInterval(() => {
                step(1);
                if (currentStepIndex >= currentSteps.length - 1) {
                    stopPlay();
                }
            }, delay);
        }
    }
    
    function stopPlay() {
        isPlaying = false;
        clearInterval(animationInterval);
        document.getElementById('btn-play').innerText = '播放 (Play)';
    }
});
