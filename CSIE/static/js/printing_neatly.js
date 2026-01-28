document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const autoBtn = document.getElementById('autoBtn');
    const resetBtn = document.getElementById('resetBtn');
    const stepExplanation = document.getElementById('step-explanation');
    const visualizationContainer = document.getElementById('visualization-container');
    const dpHeader = document.getElementById('dpHeader');
    const dpRow = document.getElementById('dpRow');

    let steps = [];
    let currentStep = 0;
    let autoInterval = null;

    startBtn.addEventListener('click', startAlgorithm);
    prevBtn.addEventListener('click', prevStep);
    nextBtn.addEventListener('click', nextStep);
    autoBtn.addEventListener('click', toggleAuto);
    resetBtn.addEventListener('click', reset);

    function startAlgorithm() {
        const text = document.getElementById('inputText').value;
        const M = parseInt(document.getElementById('inputM').value);

        if (!text || isNaN(M)) {
            alert("請輸入有效的文字和行寬");
            return;
        }

        fetch('/printing_neatly/solve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text, M: M }),
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
            
            // Render initial empty DP table
            renderDPTableInit(text.split(/\s+/).length);
            
            // Show first step
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
        stepExplanation.textContent = "請輸入文字並設定行寬，點擊「開始計算」。";
        visualizationContainer.innerHTML = "";
        dpHeader.innerHTML = "";
        dpRow.innerHTML = "";
    }

    function renderDPTableInit(n) {
        dpHeader.innerHTML = '<th>j</th>';
        dpRow.innerHTML = '<th>c[j]</th>';
        
        for (let i = 0; i <= n; i++) {
            const th = document.createElement('th');
            th.textContent = i;
            dpHeader.appendChild(th);
            
            const td = document.createElement('td');
            td.id = `dp-cell-${i}`;
            td.textContent = (i === 0) ? "0" : "∞";
            dpRow.appendChild(td);
        }
    }

    function showStep(step) {
        stepExplanation.innerHTML = step.msg;
        if (window.MathJax) {
            MathJax.typesetPromise([stepExplanation]).catch((err) => console.log(err));
        }

        if (step.type === 'init') {
            // Show words in container simply
            visualizationContainer.innerHTML = '';
            const wordsDiv = document.createElement('div');
            step.words.forEach((w, idx) => {
                const span = document.createElement('span');
                span.textContent = w + " ";
                span.id = `word-${idx}`;
                wordsDiv.appendChild(span);
            });
            visualizationContainer.appendChild(wordsDiv);
            
            // Add a ruler/boundary line
            const ruler = document.createElement('div');
            ruler.style.borderTop = "2px dashed red";
            ruler.style.width = `${step.M * 10}px`; // Approximate width visualization
            ruler.style.marginTop = "10px";
            ruler.textContent = `Width: ${step.M} chars`;
            visualizationContainer.appendChild(ruler);
        }
        else if (step.type === 'dp_step') {
            // Update DP table
            step.c.forEach((val, idx) => {
                const cell = document.getElementById(`dp-cell-${idx}`);
                if (cell) {
                    cell.textContent = val;
                    cell.classList.remove('table-primary', 'table-success');
                }
            });

            // Highlight current cell being computed
            const currentCell = document.getElementById(`dp-cell-${step.j}`);
            if (currentCell) currentCell.classList.add('table-primary');

            // Visualize candidates
            let candidatesHtml = '<ul class="list-group mt-2">';
            step.candidates.forEach(cand => {
                const isBest = cand.i === step.best_i;
                const activeClass = isBest ? 'list-group-item-success' : '';
                candidatesHtml += `<li class="list-group-item ${activeClass}">
                    最後一行: Words[${cand.i}..${step.j}] ("${getWordsText(cand.words_indices)}") <br>
                    Cost = c[${cand.i-1}] + lc[${cand.i}, ${step.j}] = ${cand.prev_cost} + ${cand.line_cost} = <strong>${cand.total}</strong>
                </li>`;
            });
            candidatesHtml += '</ul>';
            
            // Append candidates info to visualization container temporarily
            // Or maybe just keep the words and highlight them?
            // Let's clear and redraw words with highlights
            
            // We need access to the original words list. 
            // It's not in the step object, but we can grab it from the DOM or store it globally.
            // Let's assume we can just use the text from the input for now or store it in 'init'.
            // Actually, let's just use the candidatesHtml in the visualization container for detailed info
            
            const infoDiv = document.createElement('div');
            infoDiv.innerHTML = `<h6>計算 c[${step.j}] 的候選切分點:</h6>` + candidatesHtml;
            
            // Clear previous candidates info but keep words? 
            // For simplicity, let's just replace the bottom part of visualization container
            // But we need to keep the words visible.
            
            // Let's just update the explanation box with more details or a specific area
            // The user wants visualization.
            
            // Let's highlight the words in the main container corresponding to the BEST choice so far
            if (step.best_i !== -1) {
                // Reset all word highlights
                document.querySelectorAll('#visualization-container span').forEach(s => s.style.backgroundColor = 'transparent');
                
                // Highlight the last line of the best choice
                // best_i is 1-based start index.
                // words indices are best_i-1 to j-1
                for (let k = step.best_i - 1; k < step.j; k++) {
                    const w = document.getElementById(`word-${k}`);
                    if (w) w.style.backgroundColor = '#d1e7dd'; // light green
                }
            }
            
            // Append the detailed calculation to the container (clearing old details)
            const oldDetails = document.getElementById('calc-details');
            if (oldDetails) oldDetails.remove();
            
            infoDiv.id = 'calc-details';
            infoDiv.style.marginTop = '20px';
            infoDiv.style.borderTop = '1px solid #ccc';
            infoDiv.style.paddingTop = '10px';
            visualizationContainer.appendChild(infoDiv);
        }
        else if (step.type === 'result') {
            // Show final formatted text
            visualizationContainer.innerHTML = '<h5>最終排版結果:</h5>';
            const resultDiv = document.createElement('div');
            resultDiv.style.border = "1px solid #333";
            resultDiv.style.padding = "10px";
            resultDiv.style.width = "fit-content";
            resultDiv.style.backgroundColor = "#fff";
            
            step.lines.forEach(line => {
                const p = document.createElement('div');
                p.textContent = line;
                p.style.whiteSpace = "pre"; // Preserve spaces
                p.style.fontFamily = "monospace";
                resultDiv.appendChild(p);
            });
            visualizationContainer.appendChild(resultDiv);
            
            const costInfo = document.createElement('p');
            costInfo.className = "mt-3 text-success fw-bold";
            costInfo.textContent = step.msg;
            visualizationContainer.appendChild(costInfo);
        }
    }
    
    function getWordsText(indices) {
        // Helper to get text from indices. 
        // Since we don't have the words array easily accessible in this scope without global,
        // we can grab from DOM.
        let text = "";
        for (let k = indices[0]; k <= indices[1]; k++) {
            const w = document.getElementById(`word-${k}`);
            if (w) text += w.textContent;
        }
        return text.trim();
    }
});
