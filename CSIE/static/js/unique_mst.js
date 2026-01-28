document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedRange = document.getElementById('speedRange');
    const stepExplanation = document.getElementById('step-explanation');
    const canvas = document.getElementById('algoCanvas');
    const ctx = canvas.getContext('2d');

    let steps = [];
    let currentStep = 0;
    let autoPlayInterval = null;
    let isPlaying = false;

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
        fetch('/api/unique_mst', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            steps = data;
            currentStep = 0;
            
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
        
        if (currentStep < steps.length) nextBtn.disabled = false;
        if (currentStep > 1) prevBtn.disabled = false;
        
        const speed = getSpeed();
        
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            if (currentStep < steps.length) {
                nextStep(true);
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
            startAutoPlay();
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
        stepExplanation.textContent = "點擊「開始演示」以執行過程。";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function showStep(step) {
        stepExplanation.innerHTML = step.msg;
        draw(step);
    }

    function draw(step) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Cut (if exists)
        if (step.cut_nodes) {
            drawCut(step.cut_nodes);
        }
        
        // Draw Edges
        if (step.edges) {
            step.edges.forEach(edge => {
                let color = '#999';
                let width = 2;
                
                // Check if MST edge
                if (step.mst_edges) {
                    const isMst = step.mst_edges.some(e => 
                        (e.u === edge.u && e.v === edge.v) || (e.u === edge.v && e.v === edge.u)
                    );
                    if (isMst) {
                        color = 'blue';
                        width = 4;
                    }
                }
                
                // Check if Crossing edge
                if (step.crossing_edges) {
                    const isCrossing = step.crossing_edges.some(e => 
                        (e.u === edge.u && e.v === edge.v) || (e.u === edge.v && e.v === edge.u)
                    );
                    if (isCrossing) {
                        color = 'red';
                        width = 4;
                    }
                }
                
                drawEdge(step.nodes[edge.u], step.nodes[edge.v], edge.w, color, width);
            });
        }
        
        // Draw Nodes
        if (step.nodes) {
            step.nodes.forEach(node => {
                let color = 'white';
                if (step.cut_nodes && step.cut_nodes.includes(node.id)) {
                    color = '#ffcccc'; // Light red for S
                } else if (step.other_nodes && step.other_nodes.includes(node.id)) {
                    color = '#ccffcc'; // Light green for V-S
                }
                drawNode(node, color);
            });
        }
    }

    function drawNode(node, color) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
    }

    function drawEdge(node1, node2, weight, color, width) {
        ctx.beginPath();
        ctx.moveTo(node1.x, node1.y);
        ctx.lineTo(node2.x, node2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
        
        // Draw weight
        const midX = (node1.x + node2.x) / 2;
        const midY = (node1.y + node2.y) / 2;
        
        // Offset weight slightly
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        const nx = -dy / len;
        const ny = dx / len;
        
        const wx = midX + nx * 15;
        const wy = midY + ny * 15;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(wx, wy, 10, 0, 2*Math.PI);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(weight, wx, wy);
    }
    
    function drawCut(cutNodes) {
        // Hardcoded for this specific triangle layout
        // b (1) is at (300, 100), a (0) at (100, 300), c (2) at (500, 300)
        // Cut separates b from a,c
        
        if (cutNodes.includes(1)) {
            ctx.beginPath();
            ctx.setLineDash([10, 10]);
            ctx.moveTo(50, 200);
            ctx.lineTo(550, 200);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#888';
            ctx.font = '14px Arial';
            ctx.fillText("Cut (S, V-S)", 100, 190);
        }
    }
});
