let currentStep = 0;
let steps = [];
let isPlaying = false;
let timer = null;
let speed = 500;
let n = 0;

// Data storage
let keysList = [];
// Initial q0 default
let defaultQ0 = 0.05;

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    renderKeysTable();
    toggleQMode();
    renderEmptyTables();
});

function toggleQMode() {
    const mode = document.querySelector('input[name="inputMode"]:checked').value;
    const withQ = (mode === 'withQ');
    
    document.getElementById('q0InputGroup').style.display = withQ ? 'block' : 'none';
    document.getElementById('newQInputGroup').style.display = withQ ? 'block' : 'none';
    
    // Toggle table column
    const qCols = document.querySelectorAll('.q-col');
    qCols.forEach(col => col.style.display = withQ ? '' : 'none');
}

function renderKeysTable() {
    const tbody = document.getElementById('keysTableBody');
    tbody.innerHTML = '';
    
    const mode = document.querySelector('input[name="inputMode"]:checked') ? document.querySelector('input[name="inputMode"]:checked').value : 'withQ';
    const withQ = (mode === 'withQ');

    keysList.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>k${index + 1}</td>
            <td>${item.p}</td>
            <td class="q-col" style="display: ${withQ ? '' : 'none'}">${item.q}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeKey(${index})">刪除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEmptyTables() {
    const n = keysList.length;
    createTable('table-w', n, 'w');
    createTable('table-e', n, 'e');
    createTable('table-root', n, 'root');
}

function addKey() {
    const p = parseFloat(document.getElementById('newPInput').value);
    const q = parseFloat(document.getElementById('newQInput').value);
    
    if (isNaN(p)) {
        alert("請輸入有效的成功機率 p");
        return;
    }
    
    // q is optional if mode is withoutQ, but we store it anyway or 0
    const mode = document.querySelector('input[name="inputMode"]:checked').value;
    let finalQ = 0;
    if (mode === 'withQ') {
        if (isNaN(q)) {
            alert("請輸入有效的失敗機率 q");
            return;
        }
        finalQ = q;
    }

    keysList.push({ p: p, q: finalQ });
    
    // Clear inputs
    document.getElementById('newPInput').value = '';
    document.getElementById('newQInput').value = '';
    
    renderKeysTable();
    renderEmptyTables();
}

function removeKey(index) {
    keysList.splice(index, 1);
    renderKeysTable();
    renderEmptyTables();
}

function resetData() {
    keysList = [];
    document.getElementById('q0Input').value = 0.05;
    renderKeysTable();
    renderEmptyTables();
}

function resizeCanvas() {
    const container = document.getElementById('tree-container');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function updateSpeedDisplay(val) {
    speed = parseInt(val);
    document.getElementById('speedValue').innerText = val;
    if (isPlaying) {
        clearInterval(timer);
        timer = setInterval(nextStep, speed);
    }
}

function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        timer = setInterval(nextStep, speed);
    } else {
        clearInterval(timer);
    }
}

function reset() {
    isPlaying = false;
    clearInterval(timer);
    currentStep = 0;
    
    // Clear tables
    document.querySelectorAll('.dp-table td').forEach(td => {
        td.innerText = '';
        td.className = '';
    });
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    document.getElementById('status').innerText = "準備就緒 (Ready)";
}

async function startOBST() {
    const mode = document.querySelector('input[name="inputMode"]:checked').value;
    
    if (keysList.length === 0) {
        alert("請至少加入一個鍵值 (Please add at least one key)");
        return;
    }

    const p = keysList.map(item => item.p);
    let q = null;
    
    if (mode === 'withQ') {
        const q0 = parseFloat(document.getElementById('q0Input').value);
        if (isNaN(q0)) {
            alert("請輸入有效的初始失敗機率 q0");
            return;
        }
        // q array = [q0, q1, q2, ... qn]
        // keysList items have q which corresponds to q1...qn
        q = [q0, ...keysList.map(item => item.q)];
    }

    const payload = {
        p: p,
        q: q
    };

    try {
        const response = await fetch('/api/obst', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (data.error) {
            alert(data.error);
            return;
        }

        initVisualization(data);

    } catch (e) {
        console.error(e);
        alert("Error fetching data");
    }
}

function initVisualization(data) {
    n = data.n;
    steps = data.steps;
    
    createTable('table-w', n, 'w');
    createTable('table-e', n, 'e');
    createTable('table-root', n, 'root');
    
    reset();
    document.getElementById('status').innerText = "初始化完成，請按播放開始 (Initialized. Press Play).";
    
    // Render first step immediately if available
    if (steps.length > 0) {
        renderStep(steps[0]);
    }
}

function createTable(containerId, n, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'dp-table';
    
    const trHead = document.createElement('tr');
    trHead.appendChild(document.createElement('th'));
    for (let j = 0; j <= n; j++) {
        const th = document.createElement('th');
        th.innerText = j;
        trHead.appendChild(th);
    }
    table.appendChild(trHead);

    for (let i = 1; i <= n + 1; i++) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.innerText = i;
        tr.appendChild(th);
        
        for (let j = 0; j <= n; j++) {
            const td = document.createElement('td');
            td.id = `${type}-${i}-${j}`;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    container.appendChild(table);
}

function nextStep() {
    if (currentStep >= steps.length - 1) {
        isPlaying = false;
        clearInterval(timer);
        document.getElementById('status').innerText = "執行完成 (Finished)";
        return;
    }
    currentStep++;
    renderStep(steps[currentStep]);
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        renderStep(steps[currentStep]);
    }
}

function renderStep(step) {
    document.getElementById('status').innerText = step.msg;
    
    // Update tables
    updateTable('e', step.e);
    updateTable('w', step.w);
    updateTable('root', step.root);
    
    // Clear highlights
    document.querySelectorAll('.highlight-cell, .check-cell, .final-cell').forEach(el => {
        el.classList.remove('highlight-cell', 'check-cell', 'final-cell');
    });
    
    // Apply highlights
    if (step.highlight) {
        step.highlight.forEach(h => {
            const cell = document.getElementById(`${h.type === 'target' ? 'e' : 'e'}-${h.r}-${h.c}`);
            // Actually we might want to highlight different tables based on context
            // But logic mostly highlights 'e' table cells.
            // Let's try to be smart.
            // If type is target, highlight e, w, root?
            // Usually we highlight e[i][j].
            
            // Let's just highlight e table for now as it's the main DP table
            const cellE = document.getElementById(`e-${h.r}-${h.c}`);
            if (cellE) {
                if (h.type === 'target') cellE.classList.add('highlight-cell');
                else if (h.type === 'left' || h.type === 'right') cellE.classList.add('check-cell');
                else if (h.type === 'root') {
                    // Highlight root table cell
                    const cellRoot = document.getElementById(`root-${h.r}-${h.c}`);
                    if (cellRoot) cellRoot.classList.add('final-cell');
                }
                else if (h.type === 'leaf') {
                     const cellE = document.getElementById(`e-${h.r}-${h.c}`);
                     if(cellE) cellE.classList.add('final-cell');
                }
            }
        });
    }
    
    // Draw Tree
    drawTree(step.tree_nodes, step.tree_edges);
}

function updateTable(type, data) {
    // data is 2D array
    // data rows are 0..n+1, cols 0..n+1
    // Table in DOM: rows 1..n+1, cols 0..n
    
    for (let i = 1; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            const cell = document.getElementById(`${type}-${i}-${j}`);
            if (cell) {
                const val = data[i][j];
                if (val === -1) {
                    cell.innerText = '∞';
                } else if (typeof val === 'number') {
                    cell.innerText = Number.isInteger(val) ? val : val.toFixed(2);
                } else {
                    cell.innerText = val;
                }
            }
        }
    }
}

function drawTree(nodes, edges) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!nodes || nodes.length === 0) return;
    
    // Calculate scaling factors to fit the canvas
    // Backend assumes X in [0, 1000]
    const padding = 30;
    const backendWidth = 1000;
    const scaleX = (canvas.width - 2 * padding) / backendWidth;
    
    // For Y, check if we need to scale vertically
    let maxY = 0;
    nodes.forEach(n => { if (n.y > maxY) maxY = n.y; });
    
    const requiredHeight = maxY + 40; // +40 for bottom padding/radius
    let scaleY = 1;
    if (requiredHeight > canvas.height) {
        scaleY = canvas.height / requiredHeight;
    }
    
    // Use the smaller scale to maintain aspect ratio if desired, 
    // but usually we want to stretch X and Y independently to maximize space usage
    // or keep Y scale 1 unless necessary.
    
    const getX = (x) => padding + x * scaleX;
    const getY = (y) => y * scaleY;

    // Draw edges
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    edges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        if (fromNode && toNode) {
            ctx.beginPath();
            ctx.moveTo(getX(fromNode.x), getY(fromNode.y));
            ctx.lineTo(getX(toNode.x), getY(toNode.y));
            ctx.stroke();
        }
    });
    
    // Draw nodes
    nodes.forEach(node => {
        const nx = getX(node.x);
        const ny = getY(node.y);
        
        ctx.beginPath();
        ctx.arc(nx, ny, 20, 0, 2 * Math.PI);
        ctx.fillStyle = node.type === 'key' ? '#fff9c4' : '#e1bee7'; 
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, nx, ny);
    });
}
