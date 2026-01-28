
let items = [];
let currentSteps = [];
let currentStepIdx = -1;
let isPlaying = false;
let playTimer = null;
const canvas = document.getElementById('dpCanvas');
const ctx = canvas.getContext('2d');

// Initialize preview on load
window.onload = function() {
    updatePreview();
    
    // Speed Slider Listener
    const speedRange = document.getElementById('speedRange');
    const speedDisplay = document.getElementById('speedDisplay');
    if (speedRange && speedDisplay) {
        speedRange.addEventListener('input', function() {
            const val = parseInt(this.value);
            const delay = 5100 - val;
            speedDisplay.innerText = delay + " ms";
        });
    }
};

function updatePreview() {
    // If we are playing or showing results, don't override with preview unless explicitly reset?
    // Actually user said "update DP table data... wait until execute to fill".
    // So we should show the grid structure.
    
    if (currentSteps.length > 0 && currentStepIdx >= 0) {
        // If simulation is running/done, maybe we shouldn't disturb it unless user changes inputs?
        // But if user adds item, the simulation is invalid anyway.
        // So let's reset simulation if inputs change.
        currentSteps = [];
        currentStepIdx = -1;
        stopAutoPlay();
        document.getElementById('msgContent').innerText = "設定已變更，請重新執行。";
    }

    const capacity = parseInt(document.getElementById('capacityInput').value) || 0;
    
    // Create dummy table
    const rows = items.length + 1;
    const cols = capacity + 1;
    const dummyTable = Array(rows).fill().map(() => Array(cols).fill("")); // Empty strings or 0
    
    // Initialize first row/col with 0 if we want to look like init state, 
    // but user said "wait until execute to start filling". 
    // So maybe just empty grid is better, or 0s. 
    // Let's fill with empty strings to show it's not calculated yet.
    
    const dummyStep = {
        table: dummyTable,
        items: items,
        capacity: capacity,
        current: null,
        highlights: [],
        msg: "預覽模式：請輸入物品並點擊執行以開始計算。"
    };
    
    drawStep(dummyStep);
}

function addItem() {
    const w = document.getElementById('weightInput').value;
    const v = document.getElementById('valueInput').value;
    if (!w || !v) return;
    
    items.push({ w: parseInt(w), v: parseInt(v) });
    renderItemsTable();
    updatePreview(); // Update table grid
    
    document.getElementById('weightInput').value = '';
    document.getElementById('valueInput').value = '';
    document.getElementById('valueInput').focus(); // Focus on Value first as it is now first
}

function renderItemsTable() {
    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';
    items.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${item.w}</td>
            <td>${item.v}</td>
            <td><button class="btn btn-sm btn-danger" onclick="removeItem(${idx})">x</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function removeItem(idx) {
    items.splice(idx, 1);
    renderItemsTable();
    updatePreview(); // Update table grid
}

function clearAll() {
    items = [];
    renderItemsTable();
    currentSteps = [];
    currentStepIdx = -1;
    document.getElementById('capacityInput').value = 10;
    updatePreview();
    document.getElementById('msgContent').innerText = "已清除。";
    stopAutoPlay();
}

function runKnapsack() {
    const capacity = document.getElementById('capacityInput').value;
    if (!capacity || items.length === 0) {
        alert("請輸入容量並至少加入一個物品！");
        return;
    }

    fetch('/api/knapsack/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: parseInt(capacity), items: items })
    })
    .then(res => res.json())
    .then(data => {
        currentSteps = data;
        currentStepIdx = 0;
        drawStep(currentSteps[0]);
        startAutoPlay();
    });
}

function prevStep() {
    stopAutoPlay();
    if (currentStepIdx > 0) {
        currentStepIdx--;
        drawStep(currentSteps[currentStepIdx]);
    }
}

function nextStep() {
    stopAutoPlay();
    if (currentStepIdx < currentSteps.length - 1) {
        currentStepIdx++;
        drawStep(currentSteps[currentStepIdx]);
    }
}

function togglePlay() {
    if (isPlaying) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

function startAutoPlay() {
    isPlaying = true;
    document.getElementById('playBtn').innerText = "⏸ 暫停";
    playNext();
}

function stopAutoPlay() {
    isPlaying = false;
    document.getElementById('playBtn').innerText = "⏵ 自動播放";
    if (playTimer) clearTimeout(playTimer);
}

function playNext() {
    if (!isPlaying) return;
    if (currentStepIdx < currentSteps.length - 1) {
        currentStepIdx++;
        drawStep(currentSteps[currentStepIdx]);
        const val = parseInt(document.getElementById('speedRange').value);
        const delay = 5100 - val;
        playTimer = setTimeout(playNext, delay);
    } else {
        stopAutoPlay();
    }
}

function drawStep(step) {
    if (!step) return;
    
    document.getElementById('msgContent').innerText = step.msg;
    document.getElementById('statusText').innerText = `步驟 ${currentStepIdx + 1} / ${currentSteps.length}`;

    const table = step.table;
    const items = step.items;
    const capacity = step.capacity;
    const rows = items.length + 1;
    const cols = capacity + 1;
    
    const cellWidth = 60;
    const cellHeight = 40;
    const headerWidth = 120; // For item labels
    const headerHeight = 40; // For capacity labels
    
    const totalWidth = headerWidth + cols * cellWidth + 50;
    const totalHeight = headerHeight + rows * cellHeight + 50;
    
    if (canvas.width !== totalWidth || canvas.height !== totalHeight) {
        canvas.width = totalWidth;
        canvas.height = totalHeight;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw Top-Left Corner (i \ k)
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(0, 0, headerWidth, headerHeight);
    ctx.strokeRect(0, 0, headerWidth, headerHeight);
    ctx.fillStyle = "#000";
    ctx.font = "bold 16px Arial";
    ctx.fillText("i \\ k", headerWidth/2, headerHeight/2);
    ctx.font = "14px Arial";

    // Draw Column Headers (Capacity)
    for (let j = 0; j <= capacity; j++) {
        const x = headerWidth + j * cellWidth;
        const y = 0;
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(x, y, cellWidth, headerHeight);
        ctx.strokeRect(x, y, cellWidth, headerHeight);
        ctx.fillStyle = "#333";
        ctx.fillText(j, x + cellWidth/2, y + headerHeight/2);
    }
    
    // Draw Row Headers (Items)
    for (let i = 0; i <= items.length; i++) {
        const y = headerHeight + i * cellHeight;
        const x = 0;
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(x, y, headerWidth, cellHeight);
        ctx.strokeRect(x, y, headerWidth, cellHeight);
        ctx.fillStyle = "#333";
        
        let label = `${i}`;
        if (i > 0) {
            label += ` (w:${items[i-1].w}, v:${items[i-1].v})`;
        }
        ctx.fillText(label, x + headerWidth/2, y + cellHeight/2);
    }
    
    // Draw Table Cells
    for (let i = 0; i <= items.length; i++) {
        for (let j = 0; j <= capacity; j++) {
            const x = headerWidth + j * cellWidth;
            const y = headerHeight + i * cellHeight;
            
            // Check highlights
            let bgColor = "white";
            
            // Highlight dependency cells first
            if (step.highlights) {
                const hl = step.highlights.find(h => h.r === i && h.c === j);
                if (hl) {
                    bgColor = hl.color;
                }
            }

            // Highlight current cell (override if needed, or blend?)
            // Usually current cell is the one being filled, so it's most important.
            if (step.current && step.current.r === i && step.current.c === j) {
                bgColor = "#ffff99"; // Yellow
            }
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, cellWidth, cellHeight);
            ctx.strokeRect(x, y, cellWidth, cellHeight);
            
            ctx.fillStyle = "black";
            ctx.fillText(table[i][j], x + cellWidth/2, y + cellHeight/2);
        }
    }
}
