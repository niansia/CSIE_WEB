let steps = [];
let currentStepIndex = 0;
let isPlaying = false;
let animationInterval = null;
let canvas, ctx;
let priceList = []; 

document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('rodCanvas');
    ctx = canvas.getContext('2d');
    
    // Initial setup
    resetDefault();
    
    // Speed control
    const speedRange = document.getElementById('speedRange');
    const speedDisplay = document.getElementById('speedDisplay');
    speedRange.addEventListener('input', function() {
        speedDisplay.textContent = this.value + ' ms';
        if (isPlaying) {
            togglePlay(); 
            togglePlay(); 
        }
    });
});

function resetDefault() {
    document.getElementById('lengthInput').value = 5;
    priceList = []; 
    steps = [];
    currentStepIndex = 0;
    stopAutoPlay();
    renderPriceTable();
    drawPreview(); 
    document.getElementById('msgContent').textContent = "請設定參數並點擊執行。";
    document.getElementById('dynamicFormula').innerHTML = "準備就緒...";
    document.getElementById('statusText').textContent = "準備就緒";
}

function addPriceItem() {
    const lenInput = document.getElementById('itemLengthInput');
    const priceInput = document.getElementById('itemPriceInput');
    
    const len = parseInt(lenInput.value);
    const price = parseInt(priceInput.value);
    
    if (isNaN(len) || len <= 0) {
        alert("請輸入有效的長度 (正整數)");
        return;
    }
    if (isNaN(price) || price < 0) {
        alert("請輸入有效的價格 (非負整數)");
        return;
    }
    
    const existingIndex = priceList.findIndex(item => item.length === len);
    if (existingIndex !== -1) {
        priceList[existingIndex].price = price;
    } else {
        priceList.push({length: len, price: price});
        priceList.sort((a, b) => a.length - b.length);
    }
    
    lenInput.value = '';
    priceInput.value = '';
    renderPriceTable();
    drawPreview();
}

function removePriceItem(index) {
    priceList.splice(index, 1);
    renderPriceTable();
    drawPreview();
}

function renderPriceTable() {
    const tbody = document.getElementById('pricesTableBody');
    tbody.innerHTML = '';
    
    priceList.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.length}</td>
            <td>${item.price}</td>
            <td><button class="btn btn-sm btn-danger" onclick="removePriceItem(${index})">刪除</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function drawPreview() {
    const n = parseInt(document.getElementById('lengthInput').value) || 5;
    
    // Construct prices array
    let maxLen = n;
    priceList.forEach(p => {
        if (p.length > maxLen) maxLen = p.length;
    });
    
    let prices = new Array(maxLen).fill(0);
    priceList.forEach(item => {
        if (item.length > 0) {
            prices[item.length - 1] = item.price;
        }
    });
    
    const r = new Array(maxLen + 1).fill(0);
    const s = new Array(maxLen + 1).fill(0);
    
    const dummyStep = {
        prices: prices,
        r: r,
        s: s,
        j: -1,
        i: -1,
        q: -1,
        msg: "請設定參數並點擊執行。",
        highlight: []
    };
    
    draw(dummyStep);
}

function runRodCutting() {
    const n = parseInt(document.getElementById('lengthInput').value);
    
    if (isNaN(n) || n <= 0) {
        alert("請輸入有效的鋼條總長度");
        return;
    }
    
    let maxLen = n;
    priceList.forEach(p => {
        if (p.length > maxLen) maxLen = p.length;
    });
    
    let prices = new Array(maxLen).fill(0);
    priceList.forEach(item => {
        if (item.length > 0) {
            prices[item.length - 1] = item.price;
        }
    });

    fetch('/api/rod_cutting/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n: n, prices: prices }),
    })
    .then(response => response.json())
    .then(data => {
        steps = data;
        currentStepIndex = 0;
        stopAutoPlay();
        updateUI();
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('發生錯誤，請查看控制台。');
    });
}

function updateUI() {
    if (steps.length === 0) return;
    
    const step = steps[currentStepIndex];
    document.getElementById('msgContent').textContent = step.msg;
    document.getElementById('statusText').textContent = `步驟 ${currentStepIndex + 1} / ${steps.length}`;
    
    // Update Dynamic Formula
    const formulaDiv = document.getElementById('dynamicFormula');
    if (step.i !== -1 && step.j !== -1) {
        const p_i = step.p_i;
        const r_rem = step.r_remainder;
        const val = step.current_val;
        const q = step.q === -1 ? '-∞' : step.q;
        
        formulaDiv.innerHTML = `
            <div>計算 r[${step.j}]</div>
            <div>嘗試切 i=${step.i}: p[${step.i}] + r[${step.j-step.i}]</div>
            <div>= ${p_i} + ${r_rem} = ${val}</div>
            <div class="mt-1 text-primary">比較: max(${q}, ${val}) -> ${Math.max(step.q, val)}</div>
        `;
    } else if (step.j !== -1) {
        formulaDiv.innerHTML = `<div>準備計算 r[${step.j}]...</div>`;
    } else {
        formulaDiv.innerHTML = `<div>完成</div>`;
    }
    
    draw(step);
}

function draw(step) {
    const r = step.r;
    const s = step.s;
    const prices = step.prices || [];
    const len = r.length; // n + 1
    
    // Dimensions
    const startX = 60;
    const startY = 40;
    const rowHeight = 40;
    const colWidth = 60;
    const headerWidth = 60;
    
    // Resize canvas if needed
    const totalWidth = startX + colWidth * len + 50;
    const totalHeight = startY + rowHeight * 4 + 200; // Extra space for rod viz
    
    if (canvas.width !== totalWidth || canvas.height !== totalHeight) {
        canvas.width = totalWidth;
        canvas.height = totalHeight;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Headers (Row labels)
    const headers = ['i', 'p[i]', 'r[i]', 'c[i]'];
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    headers.forEach((h, idx) => {
        const y = startY + idx * rowHeight;
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, y, headerWidth, rowHeight);
        ctx.strokeRect(0, y, headerWidth, rowHeight);
        ctx.fillStyle = 'black';
        ctx.fillText(h, headerWidth/2, y + rowHeight/2);
    });
    
    // Draw Data Columns
    for (let j = 0; j < len; j++) {
        const x = headerWidth + j * colWidth;
        
        // Determine background color
        let colColor = 'white';
        if (step.j === j) colColor = '#fff3cd'; // Yellow (Current Target)
        
        // Check highlights
        if (step.highlight) {
            step.highlight.forEach(h => {
                if (h.index === j) {
                    if (h.type === 'target') colColor = '#fff3cd'; // Yellow
                    if (h.type === 'remainder') colColor = '#d1e7dd'; // Green
                    if (h.type === 'final') colColor = '#d4edda'; // Light Green
                }
            });
        }
        
        ctx.fillStyle = colColor;
        ctx.fillRect(x, startY, colWidth, rowHeight * 4);
        ctx.strokeStyle = '#dee2e6';
        
        // Row 0: i (Index)
        ctx.strokeRect(x, startY, colWidth, rowHeight);
        ctx.fillStyle = 'black';
        ctx.fillText(j, x + colWidth/2, startY + rowHeight/2);
        
        // Row 1: p[i] (Price)
        let pVal = 0;
        if (j > 0 && j-1 < prices.length) {
            pVal = prices[j-1];
        }
        ctx.strokeRect(x, startY + rowHeight, colWidth, rowHeight);
        ctx.fillText(pVal, x + colWidth/2, startY + rowHeight + rowHeight/2);
        
        // Row 2: r[i] (Revenue)
        ctx.strokeRect(x, startY + rowHeight * 2, colWidth, rowHeight);
        ctx.fillText(r[j], x + colWidth/2, startY + rowHeight * 2 + rowHeight/2);
        
        // Row 3: c[i] (Cut)
        ctx.strokeRect(x, startY + rowHeight * 3, colWidth, rowHeight);
        ctx.fillText(s[j], x + colWidth/2, startY + rowHeight * 3 + rowHeight/2);
    }
    
    // Draw border
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(headerWidth, startY, colWidth * len, rowHeight * 4);
    ctx.strokeRect(0, startY, headerWidth, rowHeight * 4); // Header border
    
    // Draw Rod Visualization
    drawRodViz(step, headerWidth, startY + rowHeight * 4 + 40);
}

function drawRodViz(step, startX, startY) {
    if (step.i === -1 || step.j === -1) return;
    
    const rodX = startX + 20;
    const rodY = startY;
    const scale = 40;
    const barHeight = 30;
    
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.font = '16px Arial';
    ctx.fillText("當前計算狀態:", rodX, rodY);
    
    const barY = rodY + 30;
    
    // Full rod j ghost
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(rodX, barY, step.j * scale, barHeight);
    ctx.fillStyle = '#999';
    ctx.fillText(`Length ${step.j}`, rodX, barY - 5);
    
    // Cut piece i
    ctx.fillStyle = '#0d6efd'; // Blue
    ctx.fillRect(rodX, barY, step.i * scale, barHeight);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(step.i, rodX + (step.i * scale)/2, barY + 20);
    
    // Remainder j-i
    const remLen = step.j - step.i;
    if (remLen > 0) {
        ctx.fillStyle = '#198754'; // Green
        ctx.fillRect(rodX + step.i * scale, barY, remLen * scale, barHeight);
        ctx.fillStyle = 'white';
        ctx.fillText(remLen, rodX + step.i * scale + (remLen * scale)/2, barY + 20);
    }
    
    // Info
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText(`Price p[${step.i}] = ${step.p_i}`, rodX, barY + 50);
    ctx.fillText(`Max Rev r[${remLen}] = ${step.r_remainder}`, rodX, barY + 70);
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Total = ${step.current_val}`, rodX, barY + 95);
}

function nextStep() {
    if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        updateUI();
    } else {
        stopAutoPlay();
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        updateUI();
    }
}

function togglePlay() {
    isPlaying = !isPlaying;
    const btn = document.getElementById('playBtn');
    
    if (isPlaying) {
        btn.textContent = '⏸ 暫停';
        const speed = parseInt(document.getElementById('speedRange').value);
        animationInterval = setInterval(nextStep, speed);
    } else {
        stopAutoPlay();
    }
}

function stopAutoPlay() {
    isPlaying = false;
    document.getElementById('playBtn').textContent = '⏵ 自動播放';
    if (animationInterval) clearInterval(animationInterval);
}
