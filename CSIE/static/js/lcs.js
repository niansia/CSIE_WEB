let currentSteps = [];
let currentStepIdx = -1;
let isPlaying = false;
let playTimer = null;
const canvas = document.getElementById('lcsCanvas');
const ctx = canvas.getContext('2d');

window.onload = function() {
    updatePreview();
    
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
    if (currentSteps.length > 0 && currentStepIdx >= 0) {
        currentSteps = [];
        currentStepIdx = -1;
        stopAutoPlay();
        document.getElementById('msgContent').innerText = "設定已變更，請重新執行。";
    }

    const text1 = document.getElementById('text1Input').value || "";
    const text2 = document.getElementById('text2Input').value || "";
    
    const m = text1.length;
    const n = text2.length;
    
    // Dummy table
    const c_table = Array(m + 1).fill().map(() => Array(n + 1).fill(""));
    const b_table = Array(m + 1).fill().map(() => Array(n + 1).fill(""));
    
    const dummyStep = {
        c_table: c_table,
        b_table: b_table,
        text1: text1,
        text2: text2,
        current: null,
        highlights: [],
        msg: "預覽模式：請輸入序列並點擊執行以開始計算。"
    };
    
    drawStep(dummyStep);
}

function clearAll() {
    document.getElementById('text1Input').value = "";
    document.getElementById('text2Input').value = "";
    currentSteps = [];
    currentStepIdx = -1;
    updatePreview();
    document.getElementById('msgContent').innerText = "已清除。";
    stopAutoPlay();
}

function runLCS() {
    const text1 = document.getElementById('text1Input').value;
    const text2 = document.getElementById('text2Input').value;
    
    if (!text1 || !text2) {
        alert("請輸入兩個序列！");
        return;
    }

    fetch('/api/lcs/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text1: text1, text2: text2 })
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

    const c_table = step.c_table;
    const b_table = step.b_table;
    const text1 = step.text1;
    const text2 = step.text2;
    
    const m = text1.length;
    const n = text2.length;
    
    const cellWidth = 50;
    const cellHeight = 50;
    const headerWidth = 50;
    const headerHeight = 50;
    
    const totalWidth = headerWidth + (n + 1) * cellWidth + 50;
    const totalHeight = headerHeight + (m + 1) * cellHeight + 50;
    
    if (canvas.width !== totalWidth || canvas.height !== totalHeight) {
        canvas.width = totalWidth;
        canvas.height = totalHeight;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw Top Header (Y sequence)
    // j=0 is empty/0 column. j=1..n corresponds to text2[0..n-1]
    for (let j = 1; j <= n; j++) {
        const x = headerWidth + j * cellWidth;
        const y = 0;
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(x, y, cellWidth, headerHeight);
        ctx.strokeRect(x, y, cellWidth, headerHeight);
        ctx.fillStyle = "#333";
        ctx.font = "bold 18px Arial";
        ctx.fillText(text2[j-1], x + cellWidth/2, y + headerHeight/2);
    }
    
    // Draw Left Header (X sequence)
    // i=0 is empty/0 row. i=1..m corresponds to text1[0..m-1]
    for (let i = 1; i <= m; i++) {
        const y = headerHeight + i * cellHeight;
        const x = 0;
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(x, y, headerWidth, cellHeight);
        ctx.strokeRect(x, y, headerWidth, cellHeight);
        ctx.fillStyle = "#333";
        ctx.font = "bold 18px Arial";
        ctx.fillText(text1[i-1], x + headerWidth/2, y + cellHeight/2);
    }
    
    // Draw Corner
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(0, 0, headerWidth, headerHeight);
    ctx.strokeRect(0, 0, headerWidth, headerHeight);
    ctx.fillStyle = "#000";
    ctx.font = "14px Arial";
    ctx.fillText("X \\ Y", headerWidth/2, headerHeight/2);
    
    // Draw Table Cells
    for (let i = 0; i <= m; i++) {
        for (let j = 0; j <= n; j++) {
            const x = headerWidth + j * cellWidth;
            const y = headerHeight + i * cellHeight;
            
            let bgColor = "white";
            
            // Highlights
            if (step.highlights) {
                const hl = step.highlights.find(h => h.r === i && h.c === j);
                if (hl) {
                    bgColor = hl.color;
                }
            }
            
            if (step.current && step.current.r === i && step.current.c === j) {
                bgColor = "#ffff99"; // Yellow
            }
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, cellWidth, cellHeight);
            ctx.strokeRect(x, y, cellWidth, cellHeight);
            
            // Draw Value
            ctx.fillStyle = "black";
            ctx.font = "16px Arial";
            const val = c_table[i][j];
            // If val is 0 and it's not initialized (empty string in dummy), don't draw
            if (val !== "") {
                ctx.fillText(val, x + cellWidth/2 + 5, y + cellHeight/2 + 5);
            }
            
            // Draw Arrow
            const arrow = b_table[i][j];
            if (arrow) {
                ctx.font = "14px Arial";
                ctx.fillStyle = "#555";
                // Position arrow slightly top-left of center
                ctx.fillText(arrow, x + cellWidth/2 - 10, y + cellHeight/2 - 10);
            }
        }
    }
}
