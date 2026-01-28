let currentStep = 0;
let steps = [];
let isPlaying = false;
let timer = null;
let speed = 1000;

const canvas = document.getElementById('dagCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas
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
        const response = await fetch('/api/dag_longest_path');
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
    updateLTable(step.L, step.nodes, step.current_node);
    drawGraph(step);
}

function updateLTable(L, nodes, currentNode) {
    const tbody = document.getElementById('lTableBody');
    tbody.innerHTML = '';
    
    nodes.forEach(node => {
        const tr = document.createElement('tr');
        if (node === currentNode) {
            tr.classList.add('table-warning');
        }
        
        const val = L[node];
        tr.innerHTML = `
            <td>${node}</td>
            <td>${val}</td>
        `;
        tbody.appendChild(tr);
    });
}

function drawGraph(step) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const nodes = step.nodes;
    const coords = step.node_coords;
    const adj = step.adj;
    
    // Draw edges
    // adj is { index: [[neighbor_idx, weight], ...] }
    // But wait, logic file sends adj as { 0: [[1, 2], ...]}
    // Let's iterate through all nodes to draw edges
    
    ctx.lineWidth = 2;
    
    for (let uIdx in adj) {
        uIdx = parseInt(uIdx);
        const uCoord = coords[uIdx];
        
        adj[uIdx].forEach(edge => {
            const vIdx = edge[0];
            const weight = edge[1];
            const vCoord = coords[vIdx];
            
            // Check highlight
            let isHighlighted = false;
            if (step.highlight_edges) {
                step.highlight_edges.forEach(h => {
                    if (h.from === uIdx && h.to === vIdx) isHighlighted = true;
                });
            }
            
            ctx.strokeStyle = isHighlighted ? '#ff0000' : '#999';
            ctx.lineWidth = isHighlighted ? 4 : 2;
            
            drawArrow(ctx, uCoord.x, uCoord.y, vCoord.x, vCoord.y);
            
            // Draw weight
            const midX = (uCoord.x + vCoord.x) / 2;
            const midY = (uCoord.y + vCoord.y) / 2;
            
            ctx.fillStyle = '#fff';
            ctx.fillRect(midX - 10, midY - 10, 20, 20);
            
            ctx.fillStyle = isHighlighted ? '#ff0000' : '#000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(weight, midX, midY);
        });
    }
    
    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
        const coord = coords[i];
        const name = nodes[i];
        
        let isHighlighted = step.highlight_nodes.includes(i);
        let isCurrent = (step.current_node === name);
        
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, 25, 0, 2 * Math.PI);
        
        if (isCurrent) ctx.fillStyle = '#ffeb3b';
        else if (isHighlighted) ctx.fillStyle = '#ffcc80';
        else ctx.fillStyle = '#e0f7fa';
        
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, coord.x, coord.y);
        
        // Draw L value above node
        const lVal = step.L[name];
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.fillText(`L=${lVal}`, coord.x, coord.y - 35);
    }
}

function drawArrow(ctx, fromX, fromY, toX, toY) {
    const headlen = 10; // length of head in pixels
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    // Adjust start and end to be on the circle edge (radius 25)
    const r = 25;
    const startX = fromX + r * Math.cos(angle);
    const startY = fromY + r * Math.sin(angle);
    const endX = toX - r * Math.cos(angle);
    const endY = toY - r * Math.sin(angle);
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(endX, endY);
    ctx.fill();
}
