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

    startBtn.addEventListener('click', startAlgorithm);
    prevBtn.addEventListener('click', prevStep);
    nextBtn.addEventListener('click', nextStep);
    autoBtn.addEventListener('click', toggleAuto);
    resetBtn.addEventListener('click', reset);

    function startAlgorithm() {
        const s1 = document.getElementById('inputStr1').value;
        const s2 = document.getElementById('inputStr2').value;

        if (!s1 || !s2) {
            alert("請輸入兩個字串");
            return;
        }

        fetch('/api/med', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ s1: s1, s2: s2 }),
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
            stepExplanation.textContent = "發生錯誤，請檢查輸入。";
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
            }, 500); // Faster speed for table filling
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
        stepExplanation.textContent = "請輸入兩個字串，點擊「開始計算」。";
        dpTable.innerHTML = "";
    }

    function renderTable(dp, s1, s2, highlight = null, path = null) {
        dpTable.innerHTML = "";
        const n = dp.length;
        const m = dp[0].length;

        // Header Row (s2)
        let headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th></th><th>""</th>'; // Corner + Empty string
        for (let j = 0; j < m - 1; j++) {
            headerRow.innerHTML += `<th>${s2[j]}</th>`;
        }
        dpTable.appendChild(headerRow);

        for (let i = 0; i < n; i++) {
            let row = document.createElement('tr');
            // Row Label (s1)
            let label = (i === 0) ? '""' : s1[i-1];
            let th = document.createElement('th');
            th.textContent = label;
            row.appendChild(th);

            for (let j = 0; j < m; j++) {
                let td = document.createElement('td');
                td.textContent = dp[i][j];
                td.id = `cell-${i}-${j}`;
                
                // Basic styling
                if (i === 0 || j === 0) {
                    td.style.backgroundColor = "#f8f9fa"; // Base cases
                }

                // Highlight current cell
                if (highlight && highlight.i === i && highlight.j === j) {
                    td.style.backgroundColor = "#fff3cd"; // Yellow
                    td.style.border = "2px solid #ffc107";
                }
                
                // Highlight dependencies
                if (highlight && highlight.i === i && highlight.j === j) {
                    // Mark neighbors
                    // We can't easily access neighbors here without re-selecting, 
                    // but we can do it after appending.
                }
                
                // Highlight path
                if (path) {
                    // path is array of [i, j]
                    const inPath = path.some(p => p[0] === i && p[1] === j);
                    if (inPath) {
                        td.style.backgroundColor = "#d1e7dd"; // Green
                        td.style.fontWeight = "bold";
                        td.style.color = "#0f5132";
                    }
                }

                row.appendChild(td);
            }
            dpTable.appendChild(row);
        }
        
        // Post-render highlighting for dependencies
        if (highlight) {
            const {i, j} = highlight;
            if (i > 0) document.getElementById(`cell-${i-1}-${j}`).style.backgroundColor = "#e2e3e5";
            if (j > 0) document.getElementById(`cell-${i}-${j-1}`).style.backgroundColor = "#e2e3e5";
            if (i > 0 && j > 0) document.getElementById(`cell-${i-1}-${j-1}`).style.backgroundColor = "#e2e3e5";
        }
    }

    function showStep(step) {
        stepExplanation.innerHTML = step.msg;
        if (window.MathJax) {
            MathJax.typesetPromise([stepExplanation]).catch((err) => console.log(err));
        }

        if (step.type === 'init') {
            renderTable(step.dp, step.s1, step.s2);
            // Store strings for later use if needed, or just pass them in every step?
            // The step object doesn't have s1/s2 in 'step' type.
            // We should store them globally or pass them.
            window.currentS1 = step.s1;
            window.currentS2 = step.s2;
        } else if (step.type === 'step') {
            renderTable(step.dp, window.currentS1, window.currentS2, {i: step.i, j: step.j});
        } else if (step.type === 'finish') {
            renderTable(step.dp, window.currentS1, window.currentS2, null, step.path);
        }
    }
});
