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
        fetch('/api/min_weight_subset', {
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
            stepExplanation.textContent = "發生錯誤，請稍後再試。";
        });
    }

    function startAutoPlay() {
        isPlaying = true;
        startBtn.textContent = "暫停";
        startBtn.classList.remove('btn-primary', 'btn-success');
        startBtn.classList.add('btn-warning');
        
        // Disable manual navigation during autoplay
        prevBtn.disabled = true;
        nextBtn.disabled = true;

        const speed = parseInt(speedRange.value);
        const delay = 3000 / speed; // Base delay 3000ms

        autoPlayInterval = setInterval(() => {
            if (currentStep < steps.length) {
                showStep(steps[currentStep]);
                currentStep++;
            } else {
                pauseAutoPlay();
                startBtn.textContent = "重新演示";
                startBtn.classList.remove('btn-warning');
                startBtn.classList.add('btn-success');
                currentStep = 0; // Reset for replay
                prevBtn.disabled = true; // Can't go back from end in this logic easily without full history
                nextBtn.disabled = false; // Allow manual restart
            }
        }, delay);
    }

    function pauseAutoPlay() {
        isPlaying = false;
        clearInterval(autoPlayInterval);
        startBtn.textContent = "繼續";
        startBtn.classList.remove('btn-warning');
        startBtn.classList.add('btn-primary');
        
        // Enable manual navigation
        updateButtonStates();
    }

    function updateSpeed() {
        if (isPlaying) {
            pauseAutoPlay();
            startAutoPlay();
        }
    }

    function nextStep() {
        if (currentStep < steps.length) {
            showStep(steps[currentStep]);
            currentStep++;
            updateButtonStates();
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep -= 2; // Go back to previous step index
            showStep(steps[currentStep]);
            currentStep++; // Advance to next ready state
            updateButtonStates();
        }
    }
    
    function updateButtonStates() {
        prevBtn.disabled = currentStep <= 1;
        nextBtn.disabled = currentStep >= steps.length;
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
        stepExplanation.textContent = "點擊「開始演示」以查看證明過程。";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function showStep(step) {
        stepExplanation.innerHTML = step.msg;
        draw(step);
    }

    function draw(step) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Edges
        if (step.edges) {
            step.edges.forEach(edge => {
                let color = '#ccc';
                let width = 2;
                
                // Check if highlighted
                if (step.highlight_edges && step.highlight_edges.includes(edge.id)) {
                    color = 'blue';
                    width = 4;
                }
                
                // Don't draw removed edge if specified (though usually we just don't highlight it, 
                // but if we want to show it removed from the set H, we can make it gray again)
                // In this logic, 'highlight_edges' defines H. Non-highlighted are not in H.
                
                drawEdge(step.nodes[edge.u], step.nodes[edge.v], edge.w, color, width);
            });
        }
        
        // Draw Nodes
        if (step.nodes) {
            step.nodes.forEach(node => {
                drawNode(node, 'white');
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
        ctx.arc(wx, wy, 12, 0, 2*Math.PI);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(weight, wx, wy);
    }
});
