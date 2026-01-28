document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('proofCanvas');
    const ctx = canvas.getContext('2d');
    const stepDescription = document.getElementById('step-description');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedRange = document.getElementById('speedRange');
    const speedValue = document.getElementById('speedValue');

    let steps = [];
    let currentStepIndex = 0;
    let isPlaying = false;
    let animationInterval = null;

    function fetchSteps() {
        fetch('/api/lis_proof')
            .then(response => response.json())
            .then(data => {
                steps = data;
                currentStepIndex = 0;
                draw();
                updateUI();
            });
    }

    function updateUI() {
        if (steps.length === 0) return;
        
        const step = steps[currentStepIndex];
        stepDescription.textContent = step.msg;
        
        prevBtn.disabled = currentStepIndex === 0;
        nextBtn.disabled = currentStepIndex === steps.length - 1;
    }

    function draw() {
        if (steps.length === 0) return;
        const step = steps[currentStepIndex];
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const a = step.a;
        const tails_values = step.tails_values;
        const tails_indices = step.tails_indices;
        const pred = step.pred;
        const highlight = step.highlight || {};
        
        const boxSize = 40;
        const gap = 10;
        const startX = 50;
        const startY_A = 80;
        const startY_Tails = 250;
        
        // Draw Array A
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        ctx.fillStyle = "#000";
        ctx.fillText("Input Array A:", startX, startY_A - 30);
        
        a.forEach((val, idx) => {
            const x = startX + idx * (boxSize + gap);
            const y = startY_A;
            
            // Highlight logic for A
            let bgColor = "#fff";
            if (highlight.type === "current" && highlight.index === idx) bgColor = "#ffff99"; // Yellow
            if (highlight.type === "search" && highlight.index === idx) bgColor = "#ffff99";
            if (highlight.type === "update" && highlight.index === idx) bgColor = "#aaffaa"; // Green
            if ((highlight.type === "backtrack" || highlight.type === "final") && highlight.path.includes(idx)) bgColor = "#ffcc00"; // Orange
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, boxSize, boxSize);
            ctx.strokeRect(x, y, boxSize, boxSize);
            
            ctx.fillStyle = "#000";
            ctx.fillText(val, x + boxSize/2, y + boxSize/2);
            
            // Index label
            ctx.fillStyle = "#666";
            ctx.font = "12px Arial";
            ctx.fillText(idx, x + boxSize/2, y + boxSize + 15);
            ctx.font = "16px Arial";
            
            // Draw Pred Arrow (if exists and not -1)
            if (pred[idx] !== -1) {
                // Draw curved arrow to predecessor
                const pIdx = pred[idx];
                const pX = startX + pIdx * (boxSize + gap) + boxSize/2;
                const cX = x + boxSize/2;
                
                // Only draw arrows during backtrack or final
                if (highlight.type === "backtrack" || highlight.type === "final") {
                    if (highlight.path.includes(idx) && highlight.path.includes(pIdx)) {
                        // Check if pIdx is actually the predecessor in the path
                        // Find idx in path
                        const pathPos = highlight.path.indexOf(idx);
                        if (pathPos > 0 && highlight.path[pathPos-1] === pIdx) {
                            ctx.beginPath();
                            ctx.moveTo(cX, y);
                            ctx.quadraticCurveTo((cX+pX)/2, y - 40, pX, y);
                            ctx.strokeStyle = "red";
                            ctx.lineWidth = 2;
                            ctx.stroke();
                            ctx.lineWidth = 1;
                        }
                    }
                }
            }
        });
        
        // Draw Tails Array
        ctx.fillStyle = "#000";
        ctx.fillText("Tails Array (Values):", startX, startY_Tails - 30);
        
        // Draw placeholder slots for tails (up to n)
        // Or just draw current tails
        tails_values.forEach((val, idx) => {
            const x = startX + idx * (boxSize + gap);
            const y = startY_Tails;
            
            let bgColor = "#f0f0f0";
            
            // Highlight logic for Tails
            if (highlight.type === "search") {
                // Maybe highlight the one being compared or the range?
                // Let's highlight the target insertion point
                if (highlight.target_idx === idx) bgColor = "#aaddff"; // Blueish
            }
            if (highlight.type === "update" && highlight.tail_idx === idx) bgColor = "#aaffaa";
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, boxSize, boxSize);
            ctx.strokeRect(x, y, boxSize, boxSize);
            
            ctx.fillStyle = "#000";
            ctx.fillText(val, x + boxSize/2, y + boxSize/2);
            
            // Length label
            ctx.fillStyle = "#666";
            ctx.font = "12px Arial";
            ctx.fillText(`Len ${idx+1}`, x + boxSize/2, y + boxSize + 15);
            ctx.font = "16px Arial";
        });
        
        // Draw ghost slot for append
        if (highlight.type === "search" && highlight.target_idx === tails_values.length) {
             const x = startX + tails_values.length * (boxSize + gap);
             const y = startY_Tails;
             ctx.strokeStyle = "#aaa";
             ctx.setLineDash([5, 5]);
             ctx.strokeRect(x, y, boxSize, boxSize);
             ctx.setLineDash([]);
             ctx.fillStyle = "#aaa";
             ctx.fillText("?", x + boxSize/2, y + boxSize/2);
        }
    }

    function nextStep() {
        if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            draw();
            updateUI();
        } else {
            isPlaying = false;
            playPauseBtn.textContent = '播放';
            clearInterval(animationInterval);
        }
    }

    function prevStep() {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            draw();
            updateUI();
        }
    }

    function togglePlay() {
        isPlaying = !isPlaying;
        playPauseBtn.textContent = isPlaying ? '暫停' : '播放';
        
        if (isPlaying) {
            const speed = 3000 / speedRange.value;
            animationInterval = setInterval(nextStep, speed);
            if (currentStepIndex === steps.length - 1) {
                currentStepIndex = -1; // Restart loop
                nextStep();
            }
        } else {
            clearInterval(animationInterval);
        }
    }

    playPauseBtn.addEventListener('click', togglePlay);
    nextBtn.addEventListener('click', () => {
        isPlaying = false;
        playPauseBtn.textContent = '播放';
        clearInterval(animationInterval);
        nextStep();
    });
    prevBtn.addEventListener('click', () => {
        isPlaying = false;
        playPauseBtn.textContent = '播放';
        clearInterval(animationInterval);
        prevStep();
    });
    resetBtn.addEventListener('click', fetchSteps);
    
    speedRange.addEventListener('input', () => {
        speedValue.textContent = speedRange.value;
        if (isPlaying) {
            clearInterval(animationInterval);
            const speed = 3000 / speedRange.value;
            animationInterval = setInterval(nextStep, speed);
        }
    });

    // Initial load
    fetchSteps();
});
