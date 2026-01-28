document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedRange = document.getElementById('speedRange');
    const stepExplanation = document.getElementById('step-explanation');
    const canvas = document.getElementById('proofCanvas');
    const ctx = canvas.getContext('2d');

    let steps = [];
    let currentStep = 0;
    let autoPlayInterval = null;
    let isPlaying = false;
    
    // Node positions for visualization (Wheel Graph)
    const cx = 300;
    const cy = 200;
    const r = 150;
    
    const nodePositions = {
        2: {x: cx, y: cy},
        0: {x: cx - r*0.8, y: cy - r*0.8}, // Top Left
        3: {x: cx + r*0.8, y: cy - r*0.8}, // Top Right
        1: {x: cx - r*0.8, y: cy + r*0.8}, // Bottom Left
        4: {x: cx + r*0.8, y: cy + r*0.8}  // Bottom Right
    };

    startBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevStep);
    nextBtn.addEventListener('click', nextStep);
    resetBtn.addEventListener('click', reset);
    speedRange.addEventListener('input', updateSpeed);

    function togglePlay() {
        if (steps.length === 0) {
            startAlgorithm();
        } else {
            if (isPlaying) {
                pauseAutoPlay();
            } else {
                startAutoPlay();
            }
        }
    }

    function startAlgorithm() {
        fetch('/api/spanning_tree_proof', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            steps = data;
            currentStep = 0;
            
            // Initial UI State
            prevBtn.disabled = true;
            nextBtn.disabled = false;
            
            showStep(steps[0]);
            currentStep++;
            startAutoPlay();
        })
        .catch(error => {
            console.error('Error:', error);
            stepExplanation.textContent = "發生錯誤。";
        });
    }

    function startAutoPlay() {
        isPlaying = true;
        startBtn.textContent = "暫停";
        startBtn.classList.remove('btn-primary', 'btn-success');
        startBtn.classList.add('btn-warning');
        
        // Allow manual navigation during auto-play (will pause it)
        if (currentStep < steps.length) nextBtn.disabled = false;
        if (currentStep > 1) prevBtn.disabled = false;
        
        const speed = getSpeed();
        
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            if (currentStep < steps.length) {
                nextStep(true); // true = from auto play
            } else {
                pauseAutoPlay();
                startBtn.textContent = "演示結束";
                startBtn.disabled = true;
            }
        }, speed);
    }

    function pauseAutoPlay() {
        isPlaying = false;
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
        startBtn.textContent = "繼續";
        startBtn.classList.remove('btn-warning');
        startBtn.classList.add('btn-success');
        
        if (currentStep < steps.length) nextBtn.disabled = false;
        if (currentStep > 1) prevBtn.disabled = false;
    }
    
    function updateSpeed() {
        if (isPlaying) {
            startAutoPlay(); // Restart with new speed
        }
    }
    
    function getSpeed() {
        const val = parseInt(speedRange.value);
        return 3000 - (val - 1) * 250; 
    }

    function prevStep() {
        if (isPlaying) pauseAutoPlay();

        if (currentStep > 1) {
            currentStep--;
            showStep(steps[currentStep - 1]);
            nextBtn.disabled = false;
            
            // If we were at the end, re-enable start button
            if (startBtn.disabled) {
                startBtn.disabled = false;
                startBtn.textContent = "繼續";
                startBtn.classList.remove('btn-warning');
                startBtn.classList.add('btn-success');
            }
        }
        if (currentStep <= 1) {
            prevBtn.disabled = true;
        }
    }

    function nextStep(fromAuto = false) {
        if (!fromAuto && isPlaying) pauseAutoPlay();

        if (currentStep < steps.length) {
            showStep(steps[currentStep]);
            currentStep++;
            prevBtn.disabled = false;
        } 
        
        if (currentStep >= steps.length) {
            nextBtn.disabled = true;
            if (isPlaying) {
                 pauseAutoPlay();
                 startBtn.textContent = "演示結束";
                 startBtn.disabled = true;
            } else if (!fromAuto) {
                 startBtn.textContent = "演示結束";
                 startBtn.disabled = true;
            }
        }
    }

    function reset() {
        pauseAutoPlay();
        steps = [];
        currentStep = 0;
        startBtn.disabled = false;
        startBtn.textContent = "開始演示";
        startBtn.classList.remove('btn-warning', 'btn-success');
        startBtn.classList.add('btn-primary');
        
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        stepExplanation.textContent = "點擊「開始演示」以執行證明過程。";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawGraph(step) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw T1 edges (Red, offset -3)
        if (step.t1) {
            step.t1.forEach(edge => {
                drawOffsetEdge(edge[0], edge[1], 'rgba(255, 0, 0, 0.7)', 3, -3);
            });
        }
        
        // Draw T2 edges (Blue, offset +3)
        if (step.t2) {
            step.t2.forEach(edge => {
                drawOffsetEdge(edge[0], edge[1], 'rgba(0, 0, 255, 0.7)', 3, 3);
            });
        }

        // Draw T1' edges (Red, offset -3)
        if (step.t1_prime) {
            step.t1_prime.forEach(edge => {
                drawOffsetEdge(edge[0], edge[1], 'rgba(255, 0, 0, 0.7)', 3, -3);
            });
        }

        // Draw T2' edges (Blue, offset +3)
        if (step.t2_prime) {
            step.t2_prime.forEach(edge => {
                drawOffsetEdge(edge[0], edge[1], 'rgba(0, 0, 255, 0.7)', 3, 3);
            });
        }

        // Highlight Cycle (Yellow, center, thick)
        if (step.cycle_edges) {
            step.cycle_edges.forEach(edge => {
                drawEdge(edge[0], edge[1], 'rgba(255, 255, 0, 0.5)', 10);
            });
        }

        // Highlight 'a' (Orange)
        if (step.a) {
            drawEdge(step.a[0], step.a[1], 'orange', 5);
            drawLabel(step.a[0], step.a[1], 'a', 'orange');
            drawArrow(step.a[0], step.a[1], 'orange');
        }

        // Highlight 'b' (Purple)
        if (step.b) {
            drawEdge(step.b[0], step.b[1], 'purple', 5);
            drawLabel(step.b[0], step.b[1], 'b', 'purple');
            drawArrow(step.b[0], step.b[1], 'purple');
        }

        // Draw Nodes
        for (let id in nodePositions) {
            drawNode(id, nodePositions[id].x, nodePositions[id].y);
        }
        
        // Legend
        drawLegend();
    }

    function drawEdge(u, v, color, width) {
        const p1 = nodePositions[u];
        const p2 = nodePositions[v];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    function drawOffsetEdge(u, v, color, width, offset) {
        const p1 = nodePositions[u];
        const p2 = nodePositions[v];
        
        // Calculate normal vector
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        const nx = -dy / len;
        const ny = dx / len;
        
        const ox = nx * offset;
        const oy = ny * offset;
        
        ctx.beginPath();
        ctx.moveTo(p1.x + ox, p1.y + oy);
        ctx.lineTo(p2.x + ox, p2.y + oy);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    function drawNode(id, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(id, x, y);
    }

    function drawLabel(u, v, text, color) {
        const p1 = nodePositions[u];
        const p2 = nodePositions[v];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        
        // Offset label slightly perpendicular to edge
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        const nx = -dy / len;
        const ny = dx / len;
        
        // Push label out by 20px
        const lx = midX + nx * 20;
        const ly = midY + ny * 20;

        ctx.fillStyle = 'white'; 
        ctx.beginPath();
        ctx.arc(lx, ly, 10, 0, 2*Math.PI);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, lx, ly);
    }
    
    function drawArrow(u, v, color) {
        const p1 = nodePositions[u];
        const p2 = nodePositions[v];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        
        // Vector along edge
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        
        // Normal vector
        const nx = -dy / len;
        const ny = dx / len;
        
        // Arrow position: 30px away from midpoint along normal
        const ax = midX + nx * 30;
        const ay = midY + ny * 30;
        
        // Draw arrow pointing to midpoint
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(midX + nx * 5, midY + ny * 5); // Stop a bit before edge
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(midY - ay, midX - ax);
        const headLen = 10;
        ctx.beginPath();
        ctx.moveTo(midX + nx * 5, midY + ny * 5);
        ctx.lineTo((midX + nx * 5) - headLen * Math.cos(angle - Math.PI / 6), (midY + ny * 5) - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo((midX + nx * 5) - headLen * Math.cos(angle + Math.PI / 6), (midY + ny * 5) - headLen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(midX + nx * 5, midY + ny * 5);
        ctx.fillStyle = color;
        ctx.fill();
    }
    
    function drawLegend() {
        const x = 10;
        const y = 10;
        const lh = 20;
        
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        // T1
        ctx.fillStyle = 'red';
        ctx.fillRect(x, y, 15, 10);
        ctx.fillStyle = 'black';
        ctx.fillText('T1 (Red)', x + 20, y + 10);
        
        // T2
        ctx.fillStyle = 'blue';
        ctx.fillRect(x, y + lh, 15, 10);
        ctx.fillStyle = 'black';
        ctx.fillText('T2 (Blue)', x + 20, y + lh + 10);
        
        // a
        ctx.fillStyle = 'orange';
        ctx.fillRect(x, y + 2*lh, 15, 10);
        ctx.fillStyle = 'black';
        ctx.fillText('Edge a', x + 20, y + 2*lh + 10);
        
        // b
        ctx.fillStyle = 'purple';
        ctx.fillRect(x, y + 3*lh, 15, 10);
        ctx.fillStyle = 'black';
        ctx.fillText('Edge b', x + 20, y + 3*lh + 10);
    }

    function showStep(step) {
        stepExplanation.innerHTML = step.msg;
        
        // Draw graph first
        drawGraph(step);

        // Render MathJax
        if (window.MathJax) {
            if (typeof MathJax.typesetPromise === 'function') {
                MathJax.typesetPromise([stepExplanation]).catch((err) => console.log('MathJax error:', err));
            } else if (typeof MathJax.typeset === 'function') {
                MathJax.typeset([stepExplanation]);
            }
        }
    }
});
