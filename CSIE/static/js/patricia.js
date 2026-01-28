let currentSteps = [];
let currentStepIdx = -1;
let isPlaying = false;
let playTimer = null;
const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_MARGIN_X = 60; // padding from left edge so text won't be cut off
const CANVAS_GRID_Y = 70;
const CANVAS_MSG_Y = 140;
const TREE_OFFSET_X = 30;
const TREE_OFFSET_Y = 120; // move tree lower so text doesn't overlap

// Initialize
window.onload = function() {
    fetch('/api/patricia/init', { method: 'POST' })
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
    
    fetch('/api/patricia/insert', {
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
    
    fetch('/api/patricia/delete', {
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
    fetch('/api/patricia/init', { method: 'POST' })
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
    
    const layout = step.layout;
    const hl_bit = step.hl_bit;
    const check_idx = step.check_idx;
    const key_str = step.key;
    const canvas_msg = step.canvas_msg;

    // --- 1. Calculate Layout & Dimensions ---
    
    // Calculate Tree Dimensions & Map
    const nodeMap = {};
    let maxX = 0;
    let maxY = 0;
    if (layout.root_id !== null && layout.root_id !== undefined) {
        layout.nodes.forEach(n => {
            const adjusted = { ...n };
            adjusted.x += TREE_OFFSET_X;
            adjusted.y += TREE_OFFSET_Y;
            nodeMap[n.id] = adjusted;
            if (adjusted.x > maxX) maxX = adjusted.x;
            if (adjusted.y > maxY) maxY = adjusted.y;
        });
    }

    // Calculate Text Dimensions
    ctx.font = "bold 20px sans-serif";
    const msgWidth = canvas_msg ? ctx.measureText(canvas_msg).width + CANVAS_MARGIN_X + 100 : 0;

    // Calculate Grid Dimensions
    const gridWidth = key_str ? (CANVAS_MARGIN_X + key_str.length * 40 + 100) : 0;

    // Determine Required Canvas Size
    const requiredWidth = Math.max(2000, maxX + 200, msgWidth, gridWidth);
    const requiredHeight = Math.max(1500, maxY + 200);

    // Resize if needed
    if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
        canvas.width = requiredWidth;
        canvas.height = requiredHeight;
    }

    // --- 2. Clear & Reset ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // --- 3. Draw Elements ---

    // Draw Canvas Msg
    if (canvas_msg) {
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = "#0000aa";
        ctx.fillText(canvas_msg, CANVAS_MARGIN_X, CANVAS_MSG_Y);
    }

    // Draw Key Grid
    const gridCenters = {};
    if (key_str) {
        const startX = CANVAS_MARGIN_X, startY = CANVAS_GRID_Y, boxW = 40;
        ctx.textAlign = "start"; 
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = "#555";
        ctx.fillText("Input Key:", startX, startY - 10);
        
        for (let i = 0; i < key_str.length; i++) {
            const idx = i + 1;
            const x = startX + i * boxW;
            const isChecking = (check_idx !== null && idx === check_idx);
            
            ctx.fillStyle = isChecking ? "#ffcccc" : "#f0f0f0";
            ctx.fillRect(x, startY, boxW, boxW);
            ctx.strokeStyle = isChecking ? "red" : "#999";
            ctx.lineWidth = isChecking ? 3 : 1;
            ctx.strokeRect(x, startY, boxW, boxW);
            
            ctx.fillStyle = "black";
            ctx.font = "bold 20px Consolas";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(key_str[i], x + boxW/2, startY + boxW/2);
            
            ctx.fillStyle = "#666";
            ctx.font = "10px Arial";
            ctx.fillText(idx, x + boxW/2, startY - 8);
            
            gridCenters[idx] = {x: x + boxW/2, y: startY + boxW};
            
            if (isChecking) {
                ctx.fillStyle = "red";
                ctx.font = "16px Arial";
                ctx.fillText("▼", x + boxW/2, startY - 25);
            }
        }
    }

    if (layout.root_id === null || layout.root_id === undefined) return;

    // Draw Edges
    layout.edges.forEach(edge => {
        const u = nodeMap[edge.u];
        const v = nodeMap[edge.v];
        if (!u || !v) return;
        
        ctx.beginPath();
        ctx.lineWidth = 2;
        
        let endX = v.x;
        let endY = v.y;
        
        if (edge.is_thread) {
            ctx.strokeStyle = "#888";
            ctx.setLineDash([5, 5]);
            
            // Curve for thread
            if (edge.u === edge.v) {
                // Self loop
                const r = 25;
                const angle = (edge.type === 'L') ? Math.PI : 0;
                const cx = u.x + (edge.type === 'L' ? -r : r);
                const cy = u.y;
                
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                ctx.stroke();
            } else {
                // Curve to ancestor
                ctx.beginPath();
                ctx.moveTo(u.x, u.y);
                const cpX = (u.x + v.x) / 2 + (edge.type === 'L' ? -40 : 40);
                const cpY = Math.min(u.y, v.y) - 60;
                ctx.quadraticCurveTo(cpX, cpY, v.x, v.y);
                ctx.stroke();
                
                // Arrow head at v
                const dx = v.x - cpX;
                const dy = v.y - cpY;
                const angle = Math.atan2(dy, dx);
                drawArrowHead(ctx, v.x, v.y, angle);
            }
        } else {
            ctx.strokeStyle = "#000";
            ctx.setLineDash([]);
            ctx.moveTo(u.x, u.y);
            ctx.lineTo(v.x, v.y);
            ctx.stroke();
            
            // Draw bit label on edge (0 or 1)
            const midX = (u.x + v.x) / 2;
            const midY = (u.y + v.y) / 2;
            ctx.fillStyle = "#222";
            ctx.font = "bold 14px Arial";
            // Left means bit 1, Right means bit 0
            const label = (edge.type === 'L') ? "1" : "0";
            
            // Draw a small white background for the text
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(midX - textWidth/2 - 2, midY - 20, textWidth + 4, 14);
            
            ctx.fillStyle = "#000";
            ctx.fillText(label, midX, midY - 10);
            
            // Arrow head
            const angle = Math.atan2(v.y - u.y, v.x - u.x);
            drawArrowHead(ctx, v.x, v.y, angle);
        }
    });

    // Draw Root 't' pointer
    const root = nodeMap[layout.root_id];
    if (root) {
        ctx.fillStyle = "black";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center"; // Center 't'
        ctx.fillText("t", root.x, root.y - 50);
        ctx.beginPath();
        ctx.moveTo(root.x - 20, root.y - 60);
        ctx.lineTo(root.x, root.y - 35);
        ctx.stroke();
    }

    // Draw Red Arrow from Grid
    const highlightId = step.layout.highlight_id;
    if (check_idx && gridCenters[check_idx] && highlightId !== null && highlightId !== undefined) {
        const target = nodeMap[highlightId];
        if (target) {
            const start = gridCenters[check_idx];
            ctx.beginPath();
            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 3]);
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(target.x, target.y - 40);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // Draw Nodes (Moved to end to ensure visibility)
    layout.nodes.forEach(rawNode => {
        const node = nodeMap[rawNode.id];
        ctx.save(); // Save context state for each node
        
        const w = 23; // Radius
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, w, 0, 2 * Math.PI);
        ctx.fillStyle = node.is_highlight ? "#ff9999" : "#ffd966";
        ctx.fill();
        
        ctx.lineWidth = node.is_highlight ? 4 : 2;
        ctx.strokeStyle = node.is_highlight ? "red" : "#555";
        ctx.setLineDash([]); // Ensure solid line
        ctx.stroke();
        
        ctx.fillStyle = "black";
        ctx.font = "14px Consolas";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.key, node.x, node.y);
        
        // Bit label above node
        ctx.fillStyle = (node.is_highlight && hl_bit !== null) ? "red" : "#333";
        ctx.font = (node.is_highlight && hl_bit !== null) ? "bold 16px Arial" : "bold 12px Arial";
        ctx.fillText(node.bit, node.x, node.y - 25);
        
        ctx.restore(); // Restore context state
    });
}

function drawArrowHead(ctx, x, y, angle) {
    const headLen = 10;
    // Offset by node radius (approx 15) so arrow touches node edge
    const offsetX = x - 15 * Math.cos(angle);
    const offsetY = y - 15 * Math.sin(angle);
    
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX - headLen * Math.cos(angle - Math.PI / 6), offsetY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(offsetX - headLen * Math.cos(angle + Math.PI / 6), offsetY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(offsetX, offsetY);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
}
