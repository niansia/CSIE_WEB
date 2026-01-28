let steps = [];
let currentStepIndex = 0;
let isPlaying = false;
let animationInterval = null;
let canvas, ctx;
let matrices = []; // Stores {name: 'A1', rows: 30, cols: 35}
let dims = []; // [30, 35, 15, 5]

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('mcmCanvas');
    ctx = canvas.getContext('2d');
    
    // Initial setup
    resetDefault();
    
    // Speed control
    const speedRange = document.getElementById('speedRange');
    const speedDisplay = document.getElementById('speedDisplay');
    speedRange.addEventListener('input', function() {
        speedDisplay.textContent = this.value + ' ms';
        if (isPlaying) {
            togglePlay(); 
            togglePlay(); 
        }
    });
});

function resetDefault() {
    matrices = [];
    dims = [];
    steps = [];
    currentStepIndex = 0;
    stopAutoPlay();
    
    // No default example
    
    renderMatrixTable();
    drawPreview(); 
    document.getElementById('msgContent').textContent = "請設定參數並點擊執行。";
    document.getElementById('parensDisplay').textContent = "尚未計算";
    document.getElementById('statusText').textContent = "準備就緒";
    
    updateInputState();
}

function updateInputState() {
    const rowsInput = document.getElementById('rowsInput');
    const colsInput = document.getElementById('colsInput');
    const dimHint = document.getElementById('dimHint');
    
    if (matrices.length === 0) {
        rowsInput.disabled = false;
        rowsInput.value = '';
        colsInput.value = '';
        dimHint.textContent = "請輸入第一個矩陣的維度。";
    } else {
        const lastMat = matrices[matrices.length - 1];
        rowsInput.value = lastMat.cols;
        rowsInput.disabled = true; // Fixed to prev cols
        colsInput.value = '';
        dimHint.textContent = `下一個矩陣的 Rows 必須為 ${lastMat.cols}。`;
    }
}

function addMatrix() {
    const rowsInput = document.getElementById('rowsInput');
    const colsInput = document.getElementById('colsInput');
    
    const r = parseInt(rowsInput.value);
    const c = parseInt(colsInput.value);
    
    if (isNaN(r) || r <= 0 || isNaN(c) || c <= 0) {
        alert("請輸入有效的維度 (正整數)");
        return;
    }
    
    if (matrices.length > 0) {
        const lastMat = matrices[matrices.length - 1];
        if (r !== lastMat.cols) {
            alert(`維度不匹配！上一個矩陣是 ${lastMat.rows}x${lastMat.cols}，新矩陣的 Rows 必須是 ${lastMat.cols}。`);
            return;
        }
    }
    
    addMatrixDirect(r, c);
    renderMatrixTable();
    drawPreview();
    updateInputState();
    
    // Focus on cols input for next entry
    document.getElementById('colsInput').focus();
}

function addMatrixDirect(r, c) {
    const idx = matrices.length + 1;
    matrices.push({name: `A${idx}`, rows: r, cols: c});
    
    // Update dims array
    if (dims.length === 0) {
        dims.push(r);
        dims.push(c);
    } else {
        dims.push(c);
    }
}

function removeMatrix(index) {
    // Removing a matrix in the middle breaks the chain.
    // For simplicity, let's just allow resetting or removing from end?
    // Or we can just rebuild the list.
    // If user removes index i, then A(i-1) connects to A(i+1)? Only if dims match.
    // To avoid complexity, let's just say "Reset" is better, or only remove last.
    // But user might want to remove specific.
    // Let's implement "Remove Last" logic for simplicity in this UI pattern, 
    // or just rebuild dims.
    
    // Actually, if we remove item at index, we remove matrices[index].
    // Then we need to check if chain is valid.
    // If not valid, we might need to clear subsequent or ask user to fix.
    // Simplest: Only allow removing the last one.
    
    if (index !== matrices.length - 1) {
        alert("為保持矩陣鏈連續性，目前僅支援刪除最後一個矩陣。若需修改中間矩陣，請重置或依序刪除。");
        return;
    }
    
    matrices.pop();
    dims.pop(); // Remove last col dimension
    // If matrices is empty, dims should be empty
    if (matrices.length === 0) dims = [];
    
    renderMatrixTable();
    drawPreview();
    updateInputState();
}

function renderMatrixTable() {
    const tbody = document.getElementById('matrixTableBody');
    tbody.innerHTML = '';
    
    matrices.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.rows} x ${item.cols}</td>
            <td><button class="btn btn-sm btn-danger" onclick="removeMatrix(${index})">刪除</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function drawPreview() {
    // Draw empty tables
    const n = matrices.length;
    if (n === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '20px Arial';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText('請加入矩陣...', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Create dummy step
    const s_table = Array(n + 1).fill().map(() => Array(n + 1).fill(0));
    const c_table = Array(n + 1).fill().map(() => Array(n + 1).fill(0));
    
    const dummyStep = {
        s_table: s_table,
        c_table: c_table,
        dims: dims,
        msg: "請點擊執行開始計算。",
        highlight: [],
        parens: "..."
    };
    
    draw(dummyStep);
}

function runMatrixChain() {
    if (matrices.length < 2) {
        alert("請至少輸入兩個矩陣！");
        return;
    }

    fetch('/api/matrix_chain/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dims: dims }),
    })
    .then(response => response.json())
    .then(data => {
        steps = data;
        currentStepIndex = 0;
        stopAutoPlay();
        updateUI();
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('發生錯誤，請查看控制台。');
    });
}

function updateUI() {
    if (steps.length === 0) return;
    
    const step = steps[currentStepIndex];
    document.getElementById('msgContent').textContent = step.msg;
    document.getElementById('statusText').textContent = `步驟 ${currentStepIndex + 1} / ${steps.length}`;
    document.getElementById('parensDisplay').textContent = step.parens;
    
    draw(step);
}

function draw(step) {
    const n = step.dims.length - 1;
    const s = step.s_table;
    const c = step.c_table;
    
    // Layout: Two tables side by side
    // Table 1: s (Cost)
    // Table 2: c (Split)
    
    const padding = 20;
    const cellWidth = 40;
    const cellHeight = 30;
    const headerSize = 30;
    
    const tableWidth = headerSize + n * cellWidth;
    const tableHeight = headerSize + n * cellHeight;
    
    const totalWidth = tableWidth * 2 + padding * 3;
    const totalHeight = tableHeight + padding * 2;
    
    if (canvas.width !== totalWidth || canvas.height !== totalHeight) {
        canvas.width = totalWidth;
        canvas.height = totalHeight;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Table S
    drawTable(padding, padding, n, s, "s (Cost)", step, 's');
    
    // Draw Table C
    drawTable(padding * 2 + tableWidth, padding, n, c, "c (Split)", step, 'c');
}

function drawTable(startX, startY, n, data, title, step, type) {
    const cellWidth = 40;
    const cellHeight = 30;
    const headerSize = 30;
    
    // Title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, startX + (headerSize + n * cellWidth)/2, startY - 5);
    
    // Headers
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Col headers (j)
    for (let j = 1; j <= n; j++) {
        const x = startX + headerSize + (j - 1) * cellWidth;
        ctx.fillStyle = '#e9ecef';
        ctx.fillRect(x, startY, cellWidth, headerSize);
        ctx.strokeRect(x, startY, cellWidth, headerSize);
        ctx.fillStyle = 'black';
        ctx.fillText(j, x + cellWidth/2, startY + headerSize/2);
    }
    
    // Row headers (i)
    for (let i = 1; i <= n; i++) {
        const y = startY + headerSize + (i - 1) * cellHeight;
        ctx.fillStyle = '#e9ecef';
        ctx.fillRect(startX, y, headerSize, cellHeight);
        ctx.strokeRect(startX, y, headerSize, cellHeight);
        ctx.fillStyle = 'black';
        ctx.fillText(i, startX + headerSize/2, y + cellHeight/2);
    }
    
    // Cells
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= n; j++) {
            // Only draw upper triangle (i <= j)
            if (i > j) continue;
            
            const x = startX + headerSize + (j - 1) * cellWidth;
            const y = startY + headerSize + (i - 1) * cellHeight;
            
            let bgColor = 'white';
            
            // Highlight logic
            if (step.highlight) {
                step.highlight.forEach(h => {
                    if (h.r === i && h.c === j) {
                        if (h.type === 'target') bgColor = '#fff3cd'; // Yellow
                        if (h.type === 'dependency_left') bgColor = '#d1e7dd'; // Green
                        if (h.type === 'dependency_right') bgColor = '#d1e7dd'; // Green
                        if (h.type === 'final') bgColor = '#d4edda'; // Light Green
                        if (h.type === 'split') bgColor = '#cfe2ff'; // Blue (Bootstrap primary-light)
                        if (h.type === 'leaf') bgColor = '#e2e3e5'; // Grey (Bootstrap secondary-light)
                    }
                });
            }
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, cellWidth, cellHeight);
            ctx.strokeRect(x, y, cellWidth, cellHeight);
            
            ctx.fillStyle = 'black';
            let val = data[i][j];
            if (val === -1) val = '∞';
            if (val === 0 && i !== j) val = ''; // Don't show 0 for uncomputed
            if (i === j && type === 's') val = 0;
            
            ctx.fillText(val, x + cellWidth/2, y + cellHeight/2);
        }
    }
}

function nextStep() {
    if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        updateUI();
    } else {
        stopAutoPlay();
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        updateUI();
    }
}

function togglePlay() {
    isPlaying = !isPlaying;
    const btn = document.getElementById('playBtn');
    
    if (isPlaying) {
        btn.textContent = '⏸ 暫停';
        const speed = parseInt(document.getElementById('speedRange').value);
        animationInterval = setInterval(nextStep, speed);
    } else {
        stopAutoPlay();
    }
}

function stopAutoPlay() {
    isPlaying = false;
    document.getElementById('playBtn').textContent = '⏵ 自動播放';
    if (animationInterval) clearInterval(animationInterval);
}
