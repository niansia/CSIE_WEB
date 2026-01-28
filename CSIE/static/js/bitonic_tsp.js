let currentStep = 0;
let steps = [];
let isPlaying = false;
let timer = null;
let speed = 1000;

const canvas = document.getElementById('tspCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = document.getElementById('canvas-wrapper');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
}
window.addEventListener('resize', resizeCanvas);

document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    initProof();
});

document.getElementById('speedRange').addEventListener('input', function() {
    speed = parseInt(this.value);
    document.getElementById('speedDisplay').innerText = speed + " ms";
    if (isPlaying) {
        clearInterval(timer);
        timer = setInterval(nextStep, speed);
    }
});

async function initProof() {
    isPlaying = false;
    clearInterval(timer);
    document.getElementById('playBtn').innerHTML = "⏵ 自動播放";
    currentStep = 0;
    
    try {
        const response = await fetch('/api/bitonic_tsp');
        const data = await response.json();
        steps = data;
        renderStep(steps[0]);
    } catch (e) {
        console.error(e);
        alert("無法載入資料");
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
    drawScene(step);
}

function drawScene(step) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const points = step.points;
    
    // Draw grid lines (optional)
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    // ...
    
    // Draw points
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#333';
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(p.label, p.x, p.y - 10);
    });
    
    // Highlight active points (i and j)
    if (step.current_i > 0 && step.current_j > 0) {
        const pi = points[step.current_i - 1];
        const pj = points[step.current_j - 1];
        
        // Highlight i
        ctx.beginPath();
        ctx.arc(pi.x, pi.y, 10, 0, 2 * Math.PI);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Highlight j
        ctx.beginPath();
        ctx.arc(pj.x, pj.y, 10, 0, 2 * Math.PI);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Draw edges
    // If final step, draw all edges in highlight_edges
    if (step.type === 'final') {
        ctx.strokeStyle = '#28a745'; // Green for final tour
        ctx.lineWidth = 3;
        step.highlight_edges.forEach(edge => {
            const p1 = points[edge.from - 1];
            const p2 = points[edge.to - 1];
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        });
    } else {
        // Intermediate steps
        // Draw candidate edges if any (dashed)
        if (step.candidates) {
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            step.candidates.forEach(cand => {
                const pk = points[cand.k - 1];
                const pj = points[step.current_j - 1];
                ctx.beginPath();
                ctx.moveTo(pk.x, pk.y);
                ctx.lineTo(pj.x, pj.y);
                ctx.stroke();
            });
            ctx.setLineDash([]);
        }
        
        // Draw the chosen edge or simple extension edge
        if (step.highlight_edges) {
            ctx.strokeStyle = '#ff9800'; // Orange for current action
            ctx.lineWidth = 3;
            step.highlight_edges.forEach(edge => {
                const p1 = points[edge.from - 1];
                const p2 = points[edge.to - 1];
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            });
        }
    }
}
