let currentSteps = [];
let currentStepIdx = -1;
let isPlaying = false;
let playTimer = null;
const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');

// Initialize
window.onload = function() {
    fetch('/api/rbtree/init', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            currentSteps = data;
            currentStepIdx = 0;
            drawStep(currentSteps[0]);
        });
        
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

function insertKey() {
    const key = document.getElementById('keyInput').value.trim();
    if (!key) return;
    
    fetch('/api/rbtree/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key })
    })
    .then(res => res.json())
    .then(data => {
        if (data.length > 0) {
            currentSteps = data;
            currentStepIdx = -1;
            document.getElementById('keyInput').value = '';
            startAutoPlay();
        }
    });
}

function deleteKey() {
    const key = document.getElementById('keyInput').value.trim();
    if (!key) return;
    
    fetch('/api/rbtree/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key })
    })
    .then(res => res.json())
    .then(data => {
        if (data.length > 0) {
            currentSteps = data;
            currentStepIdx = -1;
            document.getElementById('keyInput').value = '';
            startAutoPlay();
        }
    });
}

function clearTree() {
    if (!confirm("確定要清除嗎？")) return;
    fetch('/api/rbtree/init', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            currentSteps = data;
            currentStepIdx = 0;
            drawStep(currentSteps[0]);
            stopAutoPlay();
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
    
    // Update Text
    document.getElementById('msgContent').innerText = step.msg;
    document.getElementById('statusText').innerText = `步驟 ${currentStepIdx + 1} / ${currentSteps.length}`;
    
    const snap = step.snap;
    const nodes = snap.nodes;
    const edges = snap.edges;
    
    // Helper map for coordinates
    const nodeMap = {};
    let maxX = 0;
    let maxY = 0;
    
    nodes.forEach(n => {
        nodeMap[n.id] = n;
        if (n.x > maxX) maxX = n.x;
        if (n.y > maxY) maxY = n.y;
    });
    
    // Resize canvas if needed
    const requiredWidth = Math.max(2000, maxX + 100);
    const requiredHeight = Math.max(1500, maxY + 100);
    if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
        canvas.width = requiredWidth;
        canvas.height = requiredHeight;
    }

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Edges
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#555";
    edges.forEach(edge => {
        const u = nodeMap[edge.u];
        const v = nodeMap[edge.v];
        if (u && v) {
            ctx.beginPath();
            ctx.moveTo(u.x, u.y);
            ctx.lineTo(v.x, v.y);
            ctx.stroke();
        }
    });
    
    // Draw Nodes
    nodes.forEach(node => {
        ctx.beginPath();
        const r = 20;
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
        
        // Fill Color
        if (node.color === "RED") {
            ctx.fillStyle = "#ff4444";
        } else {
            ctx.fillStyle = "#333333";
        }
        ctx.fill();
        
        // Border
        ctx.lineWidth = node.is_highlight ? 4 : 2;
        ctx.strokeStyle = node.is_highlight ? "#FFFF00" : "#000"; // Yellow highlight for better visibility
        ctx.stroke();
        
        // Text
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.key, node.x, node.y);
    });

    // Draw Canvas Message (Visual Cue)
    if (step.canvas_msg) {
        ctx.font = "bold 24px Microsoft JhengHei";
        ctx.fillStyle = "blue";
        ctx.textAlign = "left";
        ctx.fillText(step.canvas_msg, 50, 50);
    }

    // Draw Rotation Indicator
    if (step.rotation) {
        const node = nodeMap[step.rotation.id];
        if (node) {
            drawRotationArrow(ctx, node.x, node.y, step.rotation.type);
        }
    }
}

function drawRotationArrow(ctx, x, y, type) {
    const r = 35; // Radius slightly larger than node
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "blue";
    
    if (type === "left") {
        // Counter-clockwise arrow for left rotate
        ctx.arc(x, y, r, Math.PI * 0.2, Math.PI * 1.8, true); // Draw most of circle
        
        // Arrowhead
        // End point is at 0.2 PI
        const endAngle = Math.PI * 0.2;
        const endX = x + r * Math.cos(endAngle);
        const endY = y + r * Math.sin(endAngle);
        
        // Draw arrow head manually
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX + 10, endY - 5);
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX + 5, endY + 10);
        
    } else {
        // Clockwise arrow for right rotate
        ctx.arc(x, y, r, Math.PI * 0.8, Math.PI * 1.2, false); 
        
        // Arrowhead
        const endAngle = Math.PI * 1.2; // roughly bottom left
        const endX = x + r * Math.cos(endAngle);
        const endY = y + r * Math.sin(endAngle);
        
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - 10, endY - 5);
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - 5, endY + 10);
    }
    ctx.stroke();
    
    // Add text label
    ctx.fillStyle = "blue";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(type === "left" ? "Left Rotate" : "Right Rotate", x, y - 45);
}
