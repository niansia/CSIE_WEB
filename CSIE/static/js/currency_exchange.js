document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('proofCanvas');
    const ctx = canvas.getContext('2d');
    const stepTitle = document.getElementById('step-title');
    const stepDescription = document.getElementById('step-description');
    const mathDisplay = document.getElementById('math-display');
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
        fetch('/api/currency_exchange')
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
        stepTitle.textContent = step.title || "證明演示";
        stepDescription.innerHTML = step.msg;
        
        if (step.math) {
            mathDisplay.innerHTML = `$$${step.math}$$`;
        } else {
            mathDisplay.innerHTML = "";
        }
        
        if (window.MathJax) {
            MathJax.typesetPromise([stepDescription, mathDisplay]);
        }
        
        prevBtn.disabled = currentStepIndex === 0;
        nextBtn.disabled = currentStepIndex === steps.length - 1;
    }

    function drawArrow(fromX, fromY, toX, toY, color, curveOffset = 0) {
        const headlen = 10; // length of head in pixels
        let angle;
        let endX = toX;
        let endY = toY;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;

        if (curveOffset !== 0) {
            // Quadratic Bezier
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            
            // Calculate normal vector for offset
            const dx = toX - fromX;
            const dy = toY - fromY;
            const len = Math.sqrt(dx*dx + dy*dy);
            const nx = -dy / len;
            const ny = dx / len;
            
            const cpX = midX + nx * curveOffset;
            const cpY = midY + ny * curveOffset;
            
            ctx.moveTo(fromX, fromY);
            ctx.quadraticCurveTo(cpX, cpY, toX, toY);
            ctx.stroke();

            // Calculate angle at the end for arrow head
            // Derivative of quadratic bezier at t=1
            // B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
            // at t=1: 2(P2-P1)
            const tangentX = toX - cpX;
            const tangentY = toY - cpY;
            angle = Math.atan2(tangentY, tangentX);
            
            // Adjust end point slightly back so arrow tip touches node edge
            // Assuming node radius ~20
            endX = toX - 20 * Math.cos(angle);
            endY = toY - 20 * Math.sin(angle);
            
        } else {
            // Straight line
            angle = Math.atan2(toY - fromY, toX - fromX);
            
            // Adjust start/end to be on circle edge
            const startX = fromX + 20 * Math.cos(angle);
            const startY = fromY + 20 * Math.sin(angle);
            endX = toX - 20 * Math.cos(angle);
            endY = toY - 20 * Math.sin(angle);

            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Draw Arrow Head
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(endX, endY);
        ctx.fill();
    }

    function draw() {
        if (steps.length === 0) return;
        const step = steps[currentStepIndex];
        const graph = step.graph;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Edges
        if (graph.edges) {
            graph.edges.forEach(edge => {
                const fromNode = graph.nodes.find(n => n.id == edge.from);
                const toNode = graph.nodes.find(n => n.id == edge.to);
                
                if (fromNode && toNode) {
                    let color = edge.color || "#000";
                    
                    // Check if this edge is part of highlight_path
                    if (step.highlight_path) {
                        // Check if edge connects two consecutive nodes in highlight_path
                        for (let i = 0; i < step.highlight_path.length - 1; i++) {
                            const u = step.highlight_path[i];
                            const v = step.highlight_path[i+1];
                            if (u == edge.from && v == edge.to) {
                                color = "red";
                                ctx.lineWidth = 4;
                                break;
                            }
                        }
                    }
                    
                    if (edge.style === "dashed") {
                        ctx.setLineDash([5, 5]);
                    } else {
                        ctx.setLineDash([]);
                    }
                    
                    drawArrow(fromNode.x, fromNode.y, toNode.x, toNode.y, color, edge.curve || 0);
                    
                    // Draw Label
                    ctx.fillStyle = "#000";
                    ctx.font = "14px Arial";
                    const midX = (fromNode.x + toNode.x) / 2;
                    const midY = (fromNode.y + toNode.y) / 2;
                    
                    let labelX = midX;
                    let labelY = midY;
                    
                    if (edge.curve) {
                        // Adjust label position for curve
                        const dx = toNode.x - fromNode.x;
                        const dy = toNode.y - fromNode.y;
                        const len = Math.sqrt(dx*dx + dy*dy);
                        const nx = -dy / len;
                        const ny = dx / len;
                        labelX += nx * (edge.curve / 2);
                        labelY += ny * (edge.curve / 2);
                    }
                    
                    // Add white background for text
                    const textWidth = ctx.measureText(edge.label).width;
                    ctx.fillStyle = "rgba(255,255,255,0.8)";
                    ctx.fillRect(labelX - textWidth/2 - 2, labelY - 10, textWidth + 4, 20);
                    
                    ctx.fillStyle = "#000";
                    ctx.fillText(edge.label, labelX - textWidth/2, labelY + 5);
                }
            });
        }
        
        ctx.setLineDash([]); // Reset

        // Draw Nodes
        if (graph.nodes) {
            graph.nodes.forEach(node => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
                ctx.fillStyle = "#fff";
                ctx.fill();
                ctx.strokeStyle = "#333";
                ctx.lineWidth = 2;
                
                // Highlight node if in path
                if (step.highlight_path && step.highlight_path.includes(node.id)) {
                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 3;
                }
                
                ctx.stroke();
                
                ctx.fillStyle = "#000";
                ctx.font = "bold 16px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(node.label, node.x, node.y);
            });
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
