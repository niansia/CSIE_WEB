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
    let animationFrameId = null;
    
    // Animation state for smooth transitions (e.g. moving point)
    let animState = {
        t: 0, // 0 to 1
        active: false
    };

    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    const graphHeight = 150; // Height reserved for f(x) graph
    const intervalAreaTop = graphHeight + 50;

    function fetchSteps() {
        fetch('/api/max_overlap')
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
        stepDescription.innerHTML = step.msg;
        
        if (window.MathJax) {
            MathJax.typesetPromise([stepDescription]);
        }
        
        prevBtn.disabled = currentStepIndex === 0;
        nextBtn.disabled = currentStepIndex === steps.length - 1;
        
        if (currentStepIndex === steps.length - 1 && isPlaying) {
            // Auto loop or stop? User asked for loop/cycle play.
            // Let's pause for a moment then loop back to start if playing
            setTimeout(() => {
                if (isPlaying) {
                    currentStepIndex = 0;
                    draw();
                    updateUI();
                }
            }, 2000);
        }
    }

    function scaleX(val) {
        // Map 0-100 to padding-(width-padding)
        return padding + (val / 100) * (width - 2 * padding);
    }

    function scaleY_Fx(count) {
        // Map count 0-max to graph area
        // Max count usually won't exceed num_intervals (5)
        const maxCount = 6; 
        return graphHeight - (count / maxCount) * (graphHeight - 20);
    }

    function draw() {
        if (steps.length === 0) return;
        const step = steps[currentStepIndex];
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw Axis
        ctx.beginPath();
        ctx.moveTo(padding, intervalAreaTop - 20);
        ctx.lineTo(width - padding, intervalAreaTop - 20);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw Intervals
        step.intervals.forEach(interval => {
            const x1 = scaleX(interval.start);
            const x2 = scaleX(interval.end);
            const y = intervalAreaTop + (interval.id * 30); // Spacing
            
            // Line
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Endpoints dots
            ctx.fillStyle = '#007bff';
            ctx.beginPath();
            ctx.arc(x1, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x2, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Labels
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(interval.start, x1 - 10, y + 4);
            ctx.fillText(interval.end, x2 + 5, y + 4);
        });

        // Phase 2+: Draw vertical dashed lines for endpoints
        if (parseInt(step.phase) >= 2) {
            step.endpoints.forEach(ep => {
                const x = scaleX(ep.val);
                ctx.beginPath();
                ctx.setLineDash([5, 5]);
                ctx.moveTo(x, graphHeight); // Start from graph bottom
                ctx.lineTo(x, height - 20);
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Label e_j
                ctx.fillStyle = '#999';
                ctx.fillText('e', x - 3, height - 5);
            });
        }

        // Phase 3+: Draw f(x) graph
        if (parseInt(step.phase) >= 3) {
            // Draw axes for graph
            ctx.beginPath();
            ctx.moveTo(padding, graphHeight);
            ctx.lineTo(width - padding, graphHeight); // X axis for graph
            ctx.moveTo(padding, graphHeight);
            ctx.lineTo(padding, 10); // Y axis
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.fillStyle = '#000';
            ctx.fillText('f(x)', padding - 30, 20);
            ctx.fillText('Overlap Count', padding - 40, graphHeight + 15);

            // Draw segments
            step.fx.forEach(seg => {
                const x1 = scaleX(seg.start);
                const x2 = scaleX(seg.end);
                const y = scaleY_Fx(seg.count);
                
                ctx.beginPath();
                ctx.moveTo(x1, y);
                ctx.lineTo(x2, y);
                ctx.strokeStyle = '#dc3545'; // Red for f(x)
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Draw vertical connectors (jumps)
                // This is implicit in step function, but nice to visualize
            });
        }

        // Phase 4: Highlight Max Regions
        if (step.highlight && step.highlight.type === 'max_regions') {
            step.highlight.segments.forEach(seg => {
                const x1 = scaleX(seg.start);
                const x2 = scaleX(seg.end);
                const y = scaleY_Fx(seg.count);
                
                // Highlight area under graph
                ctx.fillStyle = 'rgba(255, 193, 7, 0.3)'; // Yellow
                ctx.fillRect(x1, y, x2 - x1, graphHeight - y);
                
                ctx.fillStyle = '#d63384';
                ctx.font = 'bold 14px Arial';
                ctx.fillText('Max', (x1+x2)/2 - 10, y - 10);
            });
        }

        // Phase 5: Move Demo
        if (step.highlight && step.highlight.type === 'move_demo') {
            const seg = step.highlight.segment;
            const x1 = scaleX(seg.start);
            const x2 = scaleX(seg.end);
            const y = scaleY_Fx(seg.count);
            
            // Animate a point moving from center to left endpoint
            // We use a simple oscillation or one-way move based on time
            const time = Date.now() / 1000;
            const progress = (Math.sin(time * 3) + 1) / 2; // 0 to 1 oscillating
            
            const currentX = x1 + (x2 - x1) * 0.5 * (1 - progress); // Move from center to left
            
            // Draw the point
            ctx.beginPath();
            ctx.arc(currentX, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#28a745'; // Green
            ctx.fill();
            
            // Draw arrow
            ctx.beginPath();
            ctx.moveTo((x1+x2)/2, y + 10);
            ctx.lineTo(x1, y + 10);
            ctx.strokeStyle = '#28a745';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#28a745';
            ctx.fillText('Move to endpoint', (x1+x2)/2 - 40, y + 25);
            
            // Request next frame for animation
            if (!isPlaying) { // If global playing is off, we still need local animation for this step
                 requestAnimationFrame(draw);
            }
        }

        // Phase 6: Conclusion
        if (step.highlight && step.highlight.type === 'conclusion') {
             const points = step.highlight.points;
             points.forEach(val => {
                 const x = scaleX(val);
                 // Draw big star or circle at endpoints on the graph
                 // Find the max count for y
                 // We need to find the segment that has this endpoint to get Y
                 // Simplified: just look at max overlap from fx
                 let maxC = 0;
                 step.fx.forEach(s => maxC = Math.max(maxC, s.count));
                 const y = scaleY_Fx(maxC);

                 ctx.beginPath();
                 ctx.arc(x, y, 8, 0, Math.PI * 2);
                 ctx.fillStyle = '#fd7e14'; // Orange
                 ctx.fill();
                 ctx.strokeStyle = '#fff';
                 ctx.lineWidth = 2;
                 ctx.stroke();
             });
             
             ctx.fillStyle = '#000';
             ctx.font = '20px Arial';
             ctx.fillText('Solution Found!', width/2 - 70, height/2);
        }
    }

    function nextStep() {
        if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            draw();
            updateUI();
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
            const speed = 3000 / parseInt(speedRange.value); // 1s to 3s per step
            
            // Clear any existing interval
            if (animationInterval) clearInterval(animationInterval);
            
            animationInterval = setInterval(() => {
                if (currentStepIndex < steps.length - 1) {
                    nextStep();
                } else {
                    // Loop handled in updateUI
                }
            }, speed);
            
            // Also start render loop for smooth animations (Phase 5)
            (function renderLoop() {
                if (isPlaying) {
                    draw();
                    requestAnimationFrame(renderLoop);
                }
            })();
            
        } else {
            if (animationInterval) clearInterval(animationInterval);
        }
    }

    playPauseBtn.addEventListener('click', togglePlay);
    nextBtn.addEventListener('click', () => {
        isPlaying = false;
        playPauseBtn.textContent = '播放';
        if (animationInterval) clearInterval(animationInterval);
        nextStep();
    });
    prevBtn.addEventListener('click', () => {
        isPlaying = false;
        playPauseBtn.textContent = '播放';
        if (animationInterval) clearInterval(animationInterval);
        prevStep();
    });
    resetBtn.addEventListener('click', fetchSteps);
    
    speedRange.addEventListener('input', () => {
        speedValue.textContent = speedRange.value;
        if (isPlaying) {
            togglePlay(); // Stop
            togglePlay(); // Restart with new speed
        }
    });

    // Initial load
    fetchSteps();
});
