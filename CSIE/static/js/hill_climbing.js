document.addEventListener('DOMContentLoaded', function() {
    // --- Shared Variables ---
    let currentSteps = [];
    let currentStepIndex = -1;
    let animationInterval = null;
    let isPlaying = false;
    
    // --- Simple Graph Variables ---
    const canvasSimple = document.getElementById('canvas-simple');
    const ctxSimple = canvasSimple.getContext('2d');
    let simpleGraph = { nodes: [], edges: [] };
    
    // --- 8-Puzzle Variables ---
    const canvasPuzzle = document.getElementById('canvas-puzzle');
    const ctxPuzzle = canvasPuzzle.getContext('2d');
    
    // --- Initialization ---
    initPuzzleInputs();
    
    // Speed Slider Listeners
    ['simple', 'puzzle'].forEach(type => {
        const range = document.getElementById(`speed-${type}`);
        const display = document.getElementById(`speedDisplay-${type}`);
        if (range && display) {
            range.addEventListener('input', function() {
                const val = parseInt(this.value);
                const delay = 5100 - val;
                display.innerText = delay + " ms";
                
                // If playing, restart interval with new speed
                if (isPlaying) {
                    stopPlay();
                    togglePlay(type);
                }
            });
        }
    });
    
    // --- Event Listeners ---
    
    // Simple Graph
    document.getElementById('btn-gen-graph').addEventListener('click', generateSimpleGraph);
    document.getElementById('btn-solve-simple').addEventListener('click', solveSimpleGraph);
    document.getElementById('btn-prev-simple').addEventListener('click', () => stepSimple(-1));
    document.getElementById('btn-next-simple').addEventListener('click', () => stepSimple(1));
    document.getElementById('btn-play-simple').addEventListener('click', () => togglePlay('simple'));
    
    // 8-Puzzle
    document.getElementById('btn-random-puzzle').addEventListener('click', randomizePuzzle);
    document.getElementById('btn-solve-puzzle').addEventListener('click', solvePuzzle);
    document.getElementById('btn-prev-puzzle').addEventListener('click', () => stepPuzzle(-1));
    document.getElementById('btn-next-puzzle').addEventListener('click', () => stepPuzzle(1));
    document.getElementById('btn-play-puzzle').addEventListener('click', () => togglePlay('puzzle'));

    // --- Simple Graph Functions ---
    
    function generateSimpleGraph() {
        // Generate random nodes
        simpleGraph.nodes = [];
        simpleGraph.edges = [];
        const numNodes = 10;
        const width = canvasSimple.width;
        const height = canvasSimple.height;
        
        for (let i = 0; i < numNodes; i++) {
            simpleGraph.nodes.push({
                id: String(i),
                x: Math.random() * (width - 100) + 50,
                y: Math.random() * (height - 100) + 50,
                h: Math.floor(Math.random() * 20) + 1 // Heuristic
            });
        }
        
        // Set Goal (Node 0 for simplicity, or random)
        const goalIndex = Math.floor(Math.random() * numNodes);
        simpleGraph.nodes[goalIndex].h = 0;
        simpleGraph.goalId = simpleGraph.nodes[goalIndex].id;
        simpleGraph.startId = simpleGraph.nodes[(goalIndex + 1) % numNodes].id; // Ensure start != goal
        
        // Generate edges (ensure connectivity somewhat)
        for (let i = 0; i < numNodes; i++) {
            const numEdges = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < numEdges; j++) {
                const target = Math.floor(Math.random() * numNodes);
                if (target !== i) {
                    // Check if edge exists
                    const exists = simpleGraph.edges.some(e => (e.u === String(i) && e.v === String(target)) || (e.u === String(target) && e.v === String(i)));
                    if (!exists) {
                        simpleGraph.edges.push({ u: String(i), v: String(target) });
                    }
                }
            }
        }
        
        drawSimpleGraph();
    }
    
    function drawSimpleGraph(stepData = null) {
        ctxSimple.clearRect(0, 0, canvasSimple.width, canvasSimple.height);
        
        // Draw Edges
        ctxSimple.strokeStyle = '#aaa';
        ctxSimple.lineWidth = 2;
        simpleGraph.edges.forEach(e => {
            const u = simpleGraph.nodes.find(n => n.id === e.u);
            const v = simpleGraph.nodes.find(n => n.id === e.v);
            ctxSimple.beginPath();
            ctxSimple.moveTo(u.x, u.y);
            ctxSimple.lineTo(v.x, v.y);
            ctxSimple.stroke();
        });
        
        // Draw Nodes
        simpleGraph.nodes.forEach(n => {
            ctxSimple.beginPath();
            ctxSimple.arc(n.x, n.y, 20, 0, 2 * Math.PI);
            
            // Color logic
            if (stepData) {
                if (stepData.current_node === n.id) {
                    ctxSimple.fillStyle = '#ffeb3b'; // Current: Yellow
                } else if (stepData.stack.includes(n.id)) {
                    ctxSimple.fillStyle = '#2196f3'; // Stack: Blue
                } else if (stepData.visited.includes(n.id)) {
                    ctxSimple.fillStyle = '#bdbdbd'; // Visited: Grey
                } else {
                    ctxSimple.fillStyle = 'white';
                }
                
                if (n.id === simpleGraph.goalId) {
                    ctxSimple.strokeStyle = '#4caf50'; // Goal border green
                    ctxSimple.lineWidth = 4;
                } else if (n.id === simpleGraph.startId) {
                    ctxSimple.strokeStyle = '#f44336'; // Start border red
                    ctxSimple.lineWidth = 4;
                } else {
                    ctxSimple.strokeStyle = '#000';
                    ctxSimple.lineWidth = 2;
                }
            } else {
                ctxSimple.fillStyle = 'white';
                ctxSimple.strokeStyle = '#000';
                if (n.id === simpleGraph.goalId) ctxSimple.strokeStyle = '#4caf50';
                if (n.id === simpleGraph.startId) ctxSimple.strokeStyle = '#f44336';
            }
            
            ctxSimple.fill();
            ctxSimple.stroke();
            
            // Text
            ctxSimple.fillStyle = 'black';
            ctxSimple.textAlign = 'center';
            ctxSimple.textBaseline = 'middle';
            ctxSimple.font = '12px Arial';
            ctxSimple.fillText(n.id, n.x, n.y - 5);
            ctxSimple.font = '10px Arial';
            ctxSimple.fillText(`h=${n.h}`, n.x, n.y + 8);
        });
    }
    
    function solveSimpleGraph() {
        if (simpleGraph.nodes.length === 0) {
            alert("Please generate a graph first.");
            return;
        }
        
        fetch('/api/hill_climbing/simple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nodes: simpleGraph.nodes,
                edges: simpleGraph.edges,
                start: simpleGraph.startId,
                goal: simpleGraph.goalId
            })
        })
        .then(response => response.json())
        .then(data => {
            currentSteps = data;
            currentStepIndex = -1;
            stepSimple(1);
        });
    }
    
    function stepSimple(direction) {
        if (!currentSteps.length) return;
        
        currentStepIndex += direction;
        if (currentStepIndex < 0) currentStepIndex = 0;
        if (currentStepIndex >= currentSteps.length) {
            currentStepIndex = currentSteps.length - 1;
            stopPlay();
        }
        
        const step = currentSteps[currentStepIndex];
        document.getElementById('status-simple').innerText = step.msg;
        updateStackList('stack-list-simple', step.stack);
        drawSimpleGraph(step);
    }

    // --- 8-Puzzle Functions ---
    
    function initPuzzleInputs() {
        const startGrid = document.getElementById('start-grid');
        const goalGrid = document.getElementById('goal-grid');
        
        for (let i = 0; i < 9; i++) {
            startGrid.appendChild(createInput(i));
            goalGrid.appendChild(createInput(i, true));
        }
        
        // Default Goal: 1 2 3 8 0 4 7 6 5 (Spiral)
        const defaultGoal = [1, 2, 3, 8, 0, 4, 7, 6, 5];
        const inputs = goalGrid.querySelectorAll('input');
        inputs.forEach((inp, idx) => inp.value = defaultGoal[idx]);
        
        // Default Start: Random solvable or specific
        const defaultStart = [2, 8, 3, 1, 6, 4, 7, 0, 5];
        const startInputs = startGrid.querySelectorAll('input');
        startInputs.forEach((inp, idx) => inp.value = defaultStart[idx]);
    }
    
    function createInput(idx, isGoal=false) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0;
        input.max = 8;
        input.className = 'form-control p-1';
        return input;
    }
    
    function getBoardFromInputs(gridId) {
        const inputs = document.querySelectorAll(`#${gridId} input`);
        const board = [];
        let row = [];
        inputs.forEach((inp, idx) => {
            row.push(parseInt(inp.value) || 0);
            if ((idx + 1) % 3 === 0) {
                board.push(row);
                row = [];
            }
        });
        return board;
    }
    
    function setBoardToInputs(gridId, board) {
        const inputs = document.querySelectorAll(`#${gridId} input`);
        let idx = 0;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                inputs[idx].value = board[r][c];
                idx++;
            }
        }
    }
    
    function randomizePuzzle() {
        // Simple shuffle (might be unsolvable, but for hill climbing it's fine to fail)
        // Better: Start from goal and make random moves
        let board = getBoardFromInputs('goal-grid');
        // Flatten
        let flat = [];
        board.forEach(r => flat.push(...r));
        
        // Random moves
        for (let i = 0; i < 20; i++) {
            // Find 0
            let z = flat.indexOf(0);
            let r = Math.floor(z / 3);
            let c = z % 3;
            let neighbors = [];
            if (r > 0) neighbors.push(z - 3);
            if (r < 2) neighbors.push(z + 3);
            if (c > 0) neighbors.push(z - 1);
            if (c < 2) neighbors.push(z + 1);
            
            let swap = neighbors[Math.floor(Math.random() * neighbors.length)];
            [flat[z], flat[swap]] = [flat[swap], flat[z]];
        }
        
        // Reconstruct
        let newBoard = [];
        for (let i = 0; i < 9; i += 3) {
            newBoard.push(flat.slice(i, i+3));
        }
        setBoardToInputs('start-grid', newBoard);
    }
    
    function solvePuzzle() {
        const start = getBoardFromInputs('start-grid');
        const goal = getBoardFromInputs('goal-grid');
        
        fetch('/api/hill_climbing/puzzle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, goal })
        })
        .then(response => response.json())
        .then(data => {
            currentSteps = data;
            currentStepIndex = -1;
            stepPuzzle(1);
        });
    }
    
    function stepPuzzle(direction) {
        if (!currentSteps.length) return;
        
        currentStepIndex += direction;
        if (currentStepIndex < 0) currentStepIndex = 0;
        if (currentStepIndex >= currentSteps.length) {
            currentStepIndex = currentSteps.length - 1;
            stopPlay();
        }
        
        const step = currentSteps[currentStepIndex];
        document.getElementById('status-puzzle').innerText = step.msg;
        updateStackList('stack-list-puzzle', step.stack);
        drawPuzzleTree(step.tree_nodes, step.current_node, step.stack);
    }
    
    function drawPuzzleTree(nodes, currentId, stackIds) {
        ctxPuzzle.clearRect(0, 0, canvasPuzzle.width, canvasPuzzle.height);
        
        if (!nodes || nodes.length === 0) return;
        
        // Tree Layout Logic
        // We need to assign x, y to nodes.
        // Simple approach: Layered layout.
        // Group by depth.
        const levels = {};
        nodes.forEach(n => {
            if (!levels[n.depth]) levels[n.depth] = [];
            levels[n.depth].push(n);
        });
        
        const nodeWidth = 60;
        const nodeHeight = 60;
        const hGap = 20;
        const vGap = 80;
        
        // Calculate positions
        // This is tricky for a general tree.
        // Let's use a simple recursive width calculation.
        
        // Build hierarchy
        const nodeMap = {};
        nodes.forEach(n => {
            n.children = [];
            nodeMap[n.id] = n;
        });
        
        let root = null;
        nodes.forEach(n => {
            if (n.parent_id) {
                if (nodeMap[n.parent_id]) {
                    nodeMap[n.parent_id].children.push(n);
                }
            } else {
                root = n;
            }
        });
        
        if (!root) return;
        
        // Calculate subtree widths
        function calcWidth(node) {
            if (node.children.length === 0) {
                node.width = nodeWidth + hGap;
            } else {
                node.width = 0;
                node.children.forEach(c => {
                    node.width += calcWidth(c);
                });
            }
            return node.width;
        }
        
        calcWidth(root);
        
        // Assign coordinates
        function assignCoords(node, x, y) {
            node.x = x;
            node.y = y;
            
            let currentX = x - node.width / 2;
            node.children.forEach(c => {
                let childX = currentX + c.width / 2;
                assignCoords(c, childX, y + vGap);
                currentX += c.width;
            });
        }
        
        assignCoords(root, canvasPuzzle.width / 2, 50);
        
        // Draw Edges
        nodes.forEach(n => {
            if (n.parent_id && nodeMap[n.parent_id]) {
                const p = nodeMap[n.parent_id];
                ctxPuzzle.beginPath();
                ctxPuzzle.moveTo(p.x, p.y + nodeHeight/2);
                ctxPuzzle.lineTo(n.x, n.y - nodeHeight/2);
                ctxPuzzle.strokeStyle = '#555';
                ctxPuzzle.stroke();
            }
        });
        
        // Draw Nodes
        nodes.forEach(n => {
            drawPuzzleNode(n, currentId, stackIds);
        });
    }
    
    function drawPuzzleNode(node, currentId, stackIds) {
        const x = node.x - 30;
        const y = node.y - 30;
        const size = 60;
        
        // Background
        if (node.id === currentId) {
            ctxPuzzle.fillStyle = '#ffeb3b';
        } else if (stackIds.includes(node.id)) {
            ctxPuzzle.fillStyle = '#bbdefb';
        } else if (node.status === 'visited') {
            ctxPuzzle.fillStyle = '#e0e0e0';
        } else {
            ctxPuzzle.fillStyle = 'white';
        }
        
        ctxPuzzle.fillRect(x, y, size, size);
        ctxPuzzle.strokeRect(x, y, size, size);
        
        // Grid
        const cellSize = size / 3;
        ctxPuzzle.fillStyle = 'black';
        ctxPuzzle.font = '10px Arial';
        ctxPuzzle.textAlign = 'center';
        ctxPuzzle.textBaseline = 'middle';
        
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const val = node.board[r][c];
                if (val !== 0) {
                    ctxPuzzle.fillText(val, x + c * cellSize + cellSize/2, y + r * cellSize + cellSize/2);
                }
            }
        }
        
        // Info
        ctxPuzzle.fillStyle = 'red';
        ctxPuzzle.fillText(`h=${node.h}`, x + size/2, y + size + 10);
        ctxPuzzle.fillStyle = 'blue';
        ctxPuzzle.fillText(node.id, x + size/2, y - 10);
    }
    
    // --- Shared Helpers ---
    
    function updateStackList(elementId, stack) {
        const list = document.getElementById(elementId);
        list.innerHTML = '';
        // Stack is LIFO, show top at top
        [...stack].reverse().forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerText = item;
            list.appendChild(li);
        });
    }
    
    function togglePlay(type) {
        if (isPlaying) {
            stopPlay();
        } else {
            isPlaying = true;
            const btn = document.getElementById(`btn-play-${type}`);
            btn.innerText = '暫停 (Pause)';
            const val = parseInt(document.getElementById(`speed-${type}`).value);
            const delay = 5100 - val;
            
            animationInterval = setInterval(() => {
                if (type === 'simple') stepSimple(1);
                else stepPuzzle(1);
                
                if (currentStepIndex >= currentSteps.length - 1) {
                    stopPlay();
                }
            }, delay);
        }
    }
    
    function stopPlay() {
        isPlaying = false;
        clearInterval(animationInterval);
        document.getElementById('btn-play-simple').innerText = '播放 (Play)';
        document.getElementById('btn-play-puzzle').innerText = '播放 (Play)';
    }
});
