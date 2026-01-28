let currentStep = 0;
let steps = [];
let isPlaying = false;
let timer = null;
let speed = 500;

const canvas = document.getElementById('lpsCanvas');
const ctx = canvas.getContext('2d');

// Configuration
const cellSize = 40;
const headerSize = 30;
const padding = 20;

document.getElementById('speedRange').addEventListener('input', function() {
    speed = parseInt(this.value);
    document.getElementById('speedDisplay').innerText = speed + " ms";
    if (isPlaying) {
        clearInterval(timer);
        timer = setInterval(nextStep, speed);
    }
});

function clearAll() {
    document.getElementById('textInput').value = '';
    resetVisualization();
}

function resetVisualization() {
    isPlaying = false;
    clearInterval(timer);
    document.getElementById('playBtn').innerHTML = "⏵ 自動播放";
    currentStep = 0;
    steps = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('statusText').innerText = "準備就緒";
}

async function runLPS() {
    const text = document.getElementById('textInput').value.trim();
    
    if (!text) {
        alert("請輸入字串");
        return;
    }

    try {
        const response = await fetch('/api/lps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        
        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }
        
        steps = data.steps;
        currentStep = 0;
        
        // Resize canvas based on input size
        const n = text.length;
        canvas.width = padding * 2 + headerSize + n * cellSize;
        canvas.height = padding * 2 + headerSize + n * cellSize;
        
        renderStep(steps[0]);
        
    } catch (e) {
        console.error(e);
        alert("發生錯誤");
    }
}

function togglePlay() {
    if (steps.length === 0) return;
    
    isPlaying = !isPlaying;
    const btn = document.getElementById('playBtn');
    
    if (isPlaying) {
        btn.innerHTML = "⏸ 暫停";
        timer = setInterval(nextStep, speed);
    } else {
        btn.innerHTML = "⏵ 自動播放";
        clearInterval(timer);
    }
}

function nextStep() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        renderStep(steps[currentStep]);
    } else {
        isPlaying = false;
        clearInterval(timer);
        document.getElementById('playBtn').innerHTML = "⏵ 自動播放";
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        renderStep(steps[currentStep]);
    }
}

function renderStep(step) {
    document.getElementById('statusText').innerText = step.msg;
    drawTable(step);
}

function drawTable(step) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const n = step.text.length;
    const L = step.L_table;
    const path = step.path_table;
    const text = step.text;
    
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw headers (Text characters)
    // Top header (j index)
    for (let j = 0; j < n; j++) {
        const x = padding + headerSize + j * cellSize + cellSize / 2;
        const y = padding + headerSize / 2;
        ctx.fillStyle = "#000";
        ctx.fillText(text[j], x, y);
        ctx.fillText(j, x, y - 15); // Index
    }
    
    // Left header (i index)
    for (let i = 0; i < n; i++) {
        const x = padding + headerSize / 2;
        const y = padding + headerSize + i * cellSize + cellSize / 2;
        ctx.fillStyle = "#000";
        ctx.fillText(text[i], x, y);
        ctx.fillText(i, x - 15, y); // Index
    }
    
    // Draw grid and values
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const x = padding + headerSize + j * cellSize;
            const y = padding + headerSize + i * cellSize;
            
            // Only draw upper triangle (i <= j)
            if (i <= j) {
                // Check highlight
                let bgColor = "white";
                let isCurrent = false;
                
                if (step.current && step.current.r === i && step.current.c === j) {
                    bgColor = "#ffeb3b"; // Current cell being calculated
                    isCurrent = true;
                } else {
                    // Check other highlights
                    const hl = step.highlights.find(h => h.r === i && h.c === j);
                    if (hl) {
                        bgColor = hl.color;
                    }
                }
                
                ctx.fillStyle = bgColor;
                ctx.fillRect(x, y, cellSize, cellSize);
                ctx.strokeRect(x, y, cellSize, cellSize);
                
                // Draw value
                ctx.fillStyle = "#000";
                ctx.fillText(L[i][j], x + cellSize / 2, y + cellSize / 2);
                
                // Draw arrow if exists (optional, based on path table)
                // path[i][j] can be "match", "left", "down", "base"
                // But for LPS, arrows might clutter. Let's skip arrows or make them subtle.
                // Or maybe just color coding is enough as per LCS style.
                // LCS style uses arrows. Let's add small indicators if needed.
                
            } else {
                // Lower triangle - gray out or leave empty
                ctx.fillStyle = "#f0f0f0";
                ctx.fillRect(x, y, cellSize, cellSize);
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }
    }
}
