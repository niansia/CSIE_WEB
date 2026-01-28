document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const autoBtn = document.getElementById('autoBtn');
    const resetBtn = document.getElementById('resetBtn');
    const stepExplanation = document.getElementById('step-explanation');
    const dpTable = document.getElementById('dpTable');
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');

    let steps = [];
    let currentStep = 0;
    let autoInterval = null;
    
    // Graph layout
    const nodePositions = {
        'v0': {x: 50, y: 190},
        'v1': {x: 200, y: 100},
        'v2': {x: 200, y: 280},
        'v3': {x: 400, y: 100},
        'v4': {x: 400, y: 280}
    };
    let graphData = null; // Will store nodes and edges from init step

    startBtn.addEventListener('click', startAlgorithm);
    prevBtn.addEventListener('click', prevStep);
    nextBtn.addEventListener('click', nextStep);
    autoBtn.addEventListener('click', toggleAuto);
    resetBtn.addEventListener('click', reset);

    function startAlgorithm() {
        fetch('/api/viterbi', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            steps = data;
            currentStep = 0;
            
            // Initialize UI
            startBtn.disabled = true;
            prevBtn.disabled = true;
            nextBtn.disabled = false;
            autoBtn.disabled = false;
            
            showStep(steps[0]);
            currentStep++;
        })
        .catch(error => {
            console.error('Error:', error);
            stepExplanation.textContent = "發生錯誤。";
        });
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
            showStep(steps[currentStep - 1]);
            nextBtn.disabled = false;
            autoBtn.disabled = false;
        }
        if (currentStep <= 1) {
            prevBtn.disabled = true;
        }
    }

    function nextStep() {
        if (currentStep < steps.length) {
            showStep(steps[currentStep]);
            currentStep++;
            prevBtn.disabled = false;
        } 
        
        if (currentStep >= steps.length) {
            nextBtn.disabled = true;
            autoBtn.disabled = true;
            if (autoInterval) clearInterval(autoInterval);
        }
    }

    function toggleAuto() {
        if (autoInterval) {
            clearInterval(autoInterval);
            autoInterval = null;
            autoBtn.textContent = "自動播放";
            autoBtn.classList.remove('btn-warning');
            autoBtn.classList.add('btn-success');
        } else {
            autoBtn.textContent = "暫停";
            autoBtn.classList.remove('btn-success');
            autoBtn.classList.add('btn-warning');
            autoInterval = setInterval(() => {
                if (currentStep < steps.length) {
                    nextStep();
                } else {
                    clearInterval(autoInterval);
                    autoInterval = null;
                    autoBtn.textContent = "自動播放";
                    autoBtn.classList.remove('btn-warning');
                    autoBtn.classList.add('btn-success');
                }
            }, 1500);
        }
    }

    function reset() {
        if (autoInterval) clearInterval(autoInterval);
        steps = [];
        currentStep = 0;
        startBtn.disabled = false;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        autoBtn.disabled = true;
        stepExplanation.textContent = "點擊「開始演示」以執行 Viterbi 演算法。";
        dpTable.innerHTML = "";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawGraph(highlightEdges = [], highlightNodes = [], path = []) {
        if (!graphData) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw edges
        graphData.edges.forEach(edge => {
            const start = nodePositions[edge.u];
            const end = nodePositions[edge.v];
            
            let color = '#ccc';
            let width = 1;
            
            // Check if in path
            let isPath = false;
            if (path.length > 0) {
                for (let i = 0; i < path.length - 1; i++) {
                    if (path[i] === edge.u && path[i+1] === edge.v) {
                        isPath = true;
                        break;
                    }
                }
            }
            
            // Check if highlighted
            const isHighlighted = highlightEdges.some(e => e.u === edge.u && e.v === edge.v);
            
            if (isPath) {
                color = '#28a745'; // Green
                width = 3;
            } else if (isHighlighted) {
                color = '#ffc107'; // Yellow/Orange
                width = 2;
            }
            
            drawArrow(ctx, start.x, start.y, end.x, end.y, color, width);
            
            // Draw label
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.fillText(`${edge.label} (${edge.prob})`, midX, midY);
        });
        
        // Draw nodes
        graphData.nodes.forEach(node => {
            const pos = nodePositions[node];
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            
            // Highlight node
            if (highlightNodes.includes(node)) {
                ctx.fillStyle = '#cfe2ff'; // Light blue
            }
            if (path.includes(node)) {
                ctx.fillStyle = '#d1e7dd'; // Light green
            }
            
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node, pos.x, pos.y);
        });
    }
    
    function drawArrow(ctx, fromx, fromy, tox, toy, color, width) {
        const headlen = 10;
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        
        // Shorten line to not overlap with node circle (radius 20)
        const dist = Math.sqrt(dx*dx + dy*dy);
        const shorten = 20;
        const startX = fromx + (dx/dist) * shorten;
        const startY = fromy + (dy/dist) * shorten;
        const endX = tox - (dx/dist) * shorten;
        const endY = toy - (dy/dist) * shorten;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(endX, endY);
        ctx.fillStyle = color;
        ctx.fill();
    }

    function renderDPTable(step) {
        dpTable.innerHTML = "";
        
        if (!graphData) return;

        // Header
        let headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Time</th>';
        graphData.nodes.forEach(node => {
            headerRow.innerHTML += `<th>${node}</th>`;
        });
        dpTable.appendChild(headerRow);
        
        // Rows
        const dataMatrix = (step.part === 'a') ? step.reachable : step.P;
        
        if (!dataMatrix) return;
        
        const k = dataMatrix.length;
        
        for (let i = 0; i < k; i++) {
            let row = document.createElement('tr');
            row.innerHTML = `<th>t=${i}</th>`;
            
            for (let j = 0; j < graphData.nodes.length; j++) {
                let val = dataMatrix[i][j];
                let displayVal = "";
                let cellClass = "";
                
                if (val === null) {
                    displayVal = ""; // Empty for uncomputed
                } else {
                    if (step.part === 'a') {
                        displayVal = val ? "T" : "F";
                        if (val) cellClass = "table-success";
                    } else {
                        displayVal = (val === 0) ? "0" : val.toFixed(4);
                        if (val > 0) cellClass = "table-info";
                    }
                }
                
                let td = document.createElement('td');
                td.textContent = displayVal;
                if (cellClass) td.classList.add(cellClass);
                
                // Highlight specific cell if relevant
                if (step.i === i) {
                    // If we are targeting a specific node v
                    if (step.v && graphData.nodes[j] === step.v) {
                         td.style.backgroundColor = "#fff3cd"; // Highlight target cell
                         td.style.border = "2px solid orange";
                    }
                }
                
                row.appendChild(td);
            }
            dpTable.appendChild(row);
        }
    }

    function showStep(step) {
        stepExplanation.innerHTML = step.msg;
        if (window.MathJax) {
            MathJax.typesetPromise([stepExplanation]).catch((err) => console.log(err));
        }

        if (step.type === 'init' || step.type === 'init_b') {
            if (step.type === 'init') {
                graphData = { nodes: step.nodes, edges: step.edges };
            }
            drawGraph([], ['v0']); 
            renderDPTable(step);
        } 
        else if (step.type === 'result_a' || step.type === 'result_b') {
             drawGraph([], [], step.path);
             // Don't clear table, keep last state
        }
        else {
            // General steps: start_time, check_edge, update, calc, mismatch, no_update
            let highlightEdges = [];
            let highlightNodes = [];
            
            if (step.u && step.v) {
                highlightEdges.push({u: step.u, v: step.v});
                highlightNodes.push(step.u); 
                highlightNodes.push(step.v);
            }
            
            drawGraph(highlightEdges, highlightNodes);
            renderDPTable(step);
        }
    }
});
