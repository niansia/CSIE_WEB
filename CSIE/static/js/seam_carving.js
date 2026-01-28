document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const autoBtn = document.getElementById('autoBtn');
    const resetBtn = document.getElementById('resetBtn');
    const stepExplanation = document.getElementById('step-explanation');
    const seamTable = document.getElementById('seamTable');

    let steps = [];
    let currentStep = 0;
    let autoInterval = null;
    let m = 0;
    let n = 0;
    let d_matrix = [];

    startBtn.addEventListener('click', startAlgorithm);
    prevBtn.addEventListener('click', prevStep);
    nextBtn.addEventListener('click', nextStep);
    autoBtn.addEventListener('click', toggleAuto);
    resetBtn.addEventListener('click', reset);

    function startAlgorithm() {
        fetch('/api/seam_carving', {
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
            
            // The first step is always init, which sets up dimensions
            if (steps.length > 0 && steps[0].type === 'init') {
                m = steps[0].m;
                n = steps[0].n;
                d_matrix = steps[0].d;
                renderGrid(steps[0]);
            }
            
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
            }, 1000); // 1 second per step
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
        stepExplanation.textContent = "點擊「開始演示」以執行 Seam Carving 演算法。";
        seamTable.innerHTML = "";
    }

    function renderGrid(step) {
        seamTable.innerHTML = "";
        
        // Use step.C if available, otherwise init with 0s
        const C = step.C || Array(m).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < m; i++) {
            let row = document.createElement('tr');
            for (let j = 0; j < n; j++) {
                let td = document.createElement('td');
                td.style.width = '60px';
                td.style.height = '60px';
                td.style.textAlign = 'center';
                td.style.verticalAlign = 'middle';
                td.style.position = 'relative';
                td.style.border = '1px solid #dee2e6';
                
                // Disruption value (small, top-left)
                let dVal = document.createElement('div');
                dVal.textContent = `d:${d_matrix[i][j]}`;
                dVal.style.fontSize = '10px';
                dVal.style.color = '#888';
                dVal.style.position = 'absolute';
                dVal.style.top = '2px';
                dVal.style.left = '2px';
                td.appendChild(dVal);
                
                // Cumulative value (large, center)
                let cVal = document.createElement('div');
                // Only show C value if it's computed (non-zero or if it's row 0 and initialized)
                // Actually, 0 is a valid cost if d is 0, but here d >= 1.
                // So if C[i][j] > 0, it's computed.
                if (C[i][j] > 0) {
                    cVal.textContent = C[i][j];
                    cVal.style.fontWeight = 'bold';
                    cVal.style.fontSize = '16px';
                } else {
                    cVal.textContent = "-";
                    cVal.style.color = '#ccc';
                }
                td.appendChild(cVal);
                
                // Styling based on step type
                if (step.type === 'calc_cell') {
                    if (i === step.row && j === step.col) {
                        td.style.backgroundColor = '#fff3cd'; // Current cell (Yellow)
                        td.style.border = '2px solid orange';
                    } else if (i === step.row - 1 && Math.abs(j - step.col) <= 1) {
                        // Potential parents
                        // Check if this parent was the chosen one
                        let isChosen = false;
                        // We need to know which one was chosen. 
                        // The step data has 'prev_col'.
                        if (j === step.prev_col) {
                            td.style.backgroundColor = '#d1e7dd'; // Chosen parent (Green)
                            td.style.border = '2px solid green';
                        } else {
                            td.style.backgroundColor = '#f8f9fa'; // Other candidates
                        }
                    }
                } else if (step.type === 'result') {
                    // Highlight path
                    let isPath = step.path.some(p => p[0] === i && p[1] === j);
                    if (isPath) {
                        td.style.backgroundColor = '#ffc107'; // Path (Gold)
                    }
                } else if (step.type === 'find_min') {
                    if (i === m - 1) {
                        if (j === step.min_col) {
                            td.style.backgroundColor = '#d1e7dd'; // Min in last row
                        }
                    }
                }
                
                row.appendChild(td);
            }
            seamTable.appendChild(row);
        }
    }

    function showStep(step) {
        stepExplanation.innerHTML = step.msg;
        if (window.MathJax) {
            MathJax.typesetPromise([stepExplanation]).catch((err) => console.log(err));
        }
        
        renderGrid(step);
    }
});
