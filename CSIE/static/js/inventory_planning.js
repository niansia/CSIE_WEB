document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const autoBtn = document.getElementById('autoBtn');
    const resetBtn = document.getElementById('resetBtn');
    const stepExplanation = document.getElementById('step-explanation');
    const dpTable = document.getElementById('dpTable');

    let steps = [];
    let currentStep = 0;
    let autoInterval = null;
    let n = 0;
    let D = 0;

    startBtn.addEventListener('click', startAlgorithm);
    prevBtn.addEventListener('click', prevStep);
    nextBtn.addEventListener('click', nextStep);
    autoBtn.addEventListener('click', toggleAuto);
    resetBtn.addEventListener('click', reset);

    function startAlgorithm() {
        fetch('/api/inventory_planning', {
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
            
            if (steps.length > 0 && steps[0].type === 'init') {
                n = steps[0].n;
                D = steps[0].D;
                renderTable(steps[0]);
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
            }, 1000);
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
        stepExplanation.textContent = "點擊「開始演示」以執行演算法。";
        dpTable.innerHTML = "";
    }

    function renderTable(step) {
        dpTable.innerHTML = "";
        
        // Header Row: Inventory j = 0 to D
        let thead = document.createElement('thead');
        let headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Month \\ Inv</th>';
        for (let j = 0; j <= D; j++) {
            headerRow.innerHTML += `<th>${j}</th>`;
        }
        thead.appendChild(headerRow);
        dpTable.appendChild(thead);
        
        let tbody = document.createElement('tbody');
        
        // Rows: Month i = 0 to n
        const f = step.f || [];
        
        for (let i = 0; i <= n; i++) {
            let row = document.createElement('tr');
            row.innerHTML = `<th>i=${i}</th>`;
            
            for (let j = 0; j <= D; j++) {
                let td = document.createElement('td');
                let val = (f[i] && f[i][j] !== null) ? f[i][j] : "∞";
                td.textContent = val;
                
                // Styling
                if (step.type === 'calc_cell') {
                    if (step.i === i && step.j === j) {
                        td.style.backgroundColor = '#fff3cd'; // Current cell (Yellow)
                        td.style.border = '2px solid orange';
                    } else if (step.i === i && step.j !== j) {
                        // Other cells in current row
                    } else if (step.i - 1 === i) {
                        // Previous row
                        if (step.best_s === j) {
                            td.style.backgroundColor = '#d1e7dd'; // Chosen parent (Green)
                            td.style.border = '2px solid green';
                        } else if (step.candidates && step.candidates.some(c => c.s === j)) {
                            td.style.backgroundColor = '#f8f9fa'; // Candidate parent
                        }
                    }
                } else if (step.type === 'result') {
                    // Highlight path
                    let inPath = step.path.some(p => p.month === i && p.inventory_end === j);
                    if (i === 0 && step.path.length > 0 && step.path[0].inventory_start === j) inPath = true; // Start point
                    
                    if (inPath) {
                        td.style.backgroundColor = '#ffc107'; // Path (Gold)
                    }
                }
                
                row.appendChild(td);
            }
            tbody.appendChild(row);
        }
        dpTable.appendChild(tbody);
    }

    function showStep(step) {
        stepExplanation.innerHTML = step.msg;
        if (window.MathJax) {
            MathJax.typesetPromise([stepExplanation]).catch((err) => console.log(err));
        }
        
        renderTable(step);
    }
});
