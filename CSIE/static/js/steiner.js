
let nodes = [];
let edges = [];
let terminals = new Set();
let currentSteps = [];
let currentStepIdx = -1;
let isPlaying = false;
let playTimer = null;

const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

// Interaction State
let selectedNode = null;
let dragNode = null;
let tempEdgeStart = null;
let mode = 'move'; // move, node, edge, terminal, delete
let pendingEdge = null; // {u, v} waiting for weight

// Load Example on Start
window.onload = function() {
    loadExample();
    
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

// Event Listeners
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        mode = e.target.value;
        selectedNode = null;
        tempEdgeStart = null;
        draw();
    });
});

canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function findNode(x, y) {
    return nodes.find(n => {
        const dx = n.x - x;
        const dy = n.y - y;
        return dx*dx + dy*dy < 400; // Radius 20 squared
    });
}

function handleMouseDown(e) {
    const pos = getMousePos(e);
    const node = findNode(pos.x, pos.y);

    if (mode === 'move') {
        if (node) {
            dragNode = node;
        }
    } else if (mode === 'node') {
        if (!node) {
            const id = 'v' + (nodes.length + 1);
            nodes.push({ id: id, x: pos.x, y: pos.y });
            draw();
        }
    } else if (mode === 'edge') {
        if (node) {
            tempEdgeStart = node;
        }
    } else if (mode === 'terminal') {
        if (node) {
            if (terminals.has(node.id)) {
                terminals.delete(node.id);
            } else {
                terminals.add(node.id);
            }
            draw();
        }
    } else if (mode === 'delete') {
        if (node) {
            // Delete node and connected edges
            nodes = nodes.filter(n => n.id !== node.id);
            edges = edges.filter(e => e.u !== node.id && e.v !== node.id);
            terminals.delete(node.id);
            draw();
        } else {
            // Check edges? (Simplified: only delete nodes for now or implement edge click detection)
        }
    }
}

function handleMouseMove(e) {
    const pos = getMousePos(e);
    if (mode === 'move' && dragNode) {
        dragNode.x = pos.x;
        dragNode.y = pos.y;
        draw();
    } else if (mode === 'edge' && tempEdgeStart) {
        draw();
        ctx.beginPath();
        ctx.moveTo(tempEdgeStart.x, tempEdgeStart.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#999';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function handleMouseUp(e) {
    const pos = getMousePos(e);
    if (mode === 'move') {
        dragNode = null;
    } else if (mode === 'edge' && tempEdgeStart) {
        const node = findNode(pos.x, pos.y);
        if (node && node !== tempEdgeStart) {
            // Check if edge exists
            const exists = edges.some(e => 
                (e.u === tempEdgeStart.id && e.v === node.id) || 
                (e.u === node.id && e.v === tempEdgeStart.id)
            );
            if (!exists) {
                pendingEdge = { u: tempEdgeStart.id, v: node.id };
                const modal = new bootstrap.Modal(document.getElementById('weightModal'));
                document.getElementById('edgeWeightInput').value = 1;
                modal.show();
            }
        }
        tempEdgeStart = null;
        draw();
    }
}

function confirmWeight() {
    const w = parseInt(document.getElementById('edgeWeightInput').value) || 1;
    if (pendingEdge) {
        edges.push({ ...pendingEdge, w: w });
        pendingEdge = null;
        bootstrap.Modal.getInstance(document.getElementById('weightModal')).hide();
        draw();
    }
}

function loadExample() {
    // Example from the user description
    // Terminals: v1..v5, Non-terminals: u1..u4
    // Let's approximate the layout from Figure 2 description
    nodes = [
        { id: 'v1', x: 100, y: 100 },
        { id: 'v2', x: 300, y: 100 },
        { id: 'v3', x: 500, y: 100 },
        { id: 'v4', x: 100, y: 300 },
        { id: 'v5', x: 300, y: 300 },
        { id: 'u1', x: 200, y: 100 }, // Between v1, v2
        { id: 'u2', x: 200, y: 200 }, // Centerish
        { id: 'u3', x: 400, y: 100 }, // Between v2, v3
        { id: 'u4', x: 400, y: 200 }  // ? Just guessing structure based on paths
    ];
    
    // Let's make a structure that fits the paths:
    // (v1 u1 u2 v4) -> v1-u1-u2-v4
    // (v2 u1 u2 v3) -> v2-u1-u2-v3 (Wait, u1 is shared)
    // (v2 v5) -> direct
    
    // Redefine for a clear graph
    nodes = [
        { id: 'v1', x: 100, y: 100 },
        { id: 'u1', x: 200, y: 100 },
        { id: 'v2', x: 300, y: 100 },
        { id: 'u3', x: 400, y: 100 },
        { id: 'v3', x: 500, y: 100 },
        
        { id: 'u2', x: 200, y: 250 },
        { id: 'v4', x: 100, y: 400 },
        { id: 'v5', x: 300, y: 250 }
    ];
    
    terminals = new Set(['v1', 'v2', 'v3', 'v4', 'v5']);
    
    edges = [
        { u: 'v1', v: 'u1', w: 2 },
        { u: 'u1', v: 'v2', w: 2 },
        { u: 'v2', v: 'u3', w: 2 },
        { u: 'u3', v: 'v3', w: 2 },
        
        { u: 'u1', v: 'u2', w: 1 },
        { u: 'u2', v: 'v4', w: 3 },
        
        { u: 'v2', v: 'v5', w: 4 },
        { u: 'u2', v: 'v5', w: 5 } // Extra edge
    ];
    
    draw();
}

function clearGraph() {
    nodes = [];
    edges = [];
    terminals = new Set();
    currentSteps = [];
    currentStepIdx = -1;
    stopAutoPlay();
    draw();
}

function runSteiner() {
    if (terminals.size < 2) {
        alert("請至少選擇 2 個終端節點 (Terminal)！");
        return;
    }
    
    const payload = {
        nodes: nodes,
        edges: edges,
        terminals: Array.from(terminals)
    };
    
    fetch('/api/steiner/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        currentSteps = data;
        currentStepIdx = 0;
        drawStep(currentSteps[0]);
        startAutoPlay();
    });
}

// Playback Controls (Same as others)
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
    if (isPlaying) stopAutoPlay();
    else startAutoPlay();
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
    draw(step);
}

function draw(step = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If step provides graph state, use it? 
    // Actually graph structure doesn't change, only highlights.
    // But Metric Closure phase might show different edges.
    
    const showClosure = step && step.phase && (step.phase.startsWith('closure') || step.phase.startsWith('mst'));
    const showFinal = step && step.phase && (step.phase.startsWith('reconstruct') || step.phase === 'complete');
    
    // Draw Edges
    edges.forEach(e => {
        const u = nodes.find(n => n.id === e.u);
        const v = nodes.find(n => n.id === e.v);
        if (!u || !v) return;
        
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        
        // Default style
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#ccc";
        
        // Highlight logic
        if (showFinal && step.final_tree_edges) {
            const isFinal = step.final_tree_edges.some(fe => 
                (fe.u === e.u && fe.v === e.v) || (fe.u === e.v && fe.v === e.u)
            );
            if (isFinal) {
                ctx.lineWidth = 4;
                ctx.strokeStyle = "#28a745"; // Green
            }
        }
        
        ctx.stroke();
        
        // Weight Label
        const midX = (u.x + v.x) / 2;
        const midY = (u.y + v.y) / 2;
        ctx.fillStyle = "#666";
        ctx.font = "12px Arial";
        ctx.fillText(e.w, midX, midY);
    });
    
    // Draw Metric Closure Edges (Dashed)
    if (showClosure && step.closure_edges) {
        step.closure_edges.forEach(ce => {
            const u = nodes.find(n => n.id === ce.u);
            const v = nodes.find(n => n.id === ce.v);
            if (!u || !v) return;
            
            // Check if this edge is in MST
            let isMst = false;
            if (step.mst_edges) {
                isMst = step.mst_edges.some(me => 
                    (me.u === ce.u && me.v === ce.v) || (me.u === ce.v && me.v === ce.u)
                );
            }
            
            ctx.beginPath();
            ctx.moveTo(u.x, u.y);
            ctx.lineTo(v.x, v.y);
            ctx.lineWidth = isMst ? 3 : 1;
            ctx.strokeStyle = isMst ? "#007bff" : "rgba(0, 123, 255, 0.3)"; // Blue
            ctx.setLineDash([10, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw weight for closure edge if MST
            if (isMst) {
                const midX = (u.x + v.x) / 2;
                const midY = (u.y + v.y) / 2 - 10;
                ctx.fillStyle = "#007bff";
                ctx.font = "bold 12px Arial";
                ctx.fillText(ce.w, midX, midY);
            }
        });
    }

    // Draw Nodes
    nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 20, 0, 2 * Math.PI);
        
        const isTerminal = terminals.has(n.id);
        ctx.fillStyle = isTerminal ? "#dc3545" : "#fff"; // Red for terminal
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#333";
        if (selectedNode === n) ctx.strokeStyle = "blue";
        ctx.stroke();
        
        ctx.fillStyle = isTerminal ? "white" : "black";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.id, n.x, n.y);
    });
}
