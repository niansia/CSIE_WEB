import math

def solve_printing_neatly(text, M):
    words = text.split()
    n = len(words)
    # lengths of words
    l = [len(w) for w in words]
    
    # extras[i][j]: extra spaces if words i..j are on one line
    # i, j are 0-indexed here for implementation, but problem uses 1-based usually.
    # Let's stick to 0-indexed internally.
    # extras[i][j] = M - sum(l[k] for k in i..j) - (j - i)
    
    extras = [[0] * n for _ in range(n)]
    lc = [[0] * n for _ in range(n)]
    
    steps = []
    
    # Precompute extras and line costs
    for i in range(n):
        current_len = 0
        for j in range(i, n):
            current_len += l[j]
            if j > i:
                current_len += 1 # space
            
            rem = M - current_len
            extras[i][j] = rem
            
            if rem < 0:
                lc[i][j] = float('inf')
            elif j == n - 1 and rem >= 0:
                lc[i][j] = 0 # Last line has 0 cost
            else:
                lc[i][j] = rem ** 3
                
    steps.append({
        "type": "init",
        "msg": f"初始化: 計算所有可能的行成本 (Line Cost)。\nM = {M}, 單字數 = {n}",
        "words": words,
        "M": M
    })

    # DP array
    # c[j] = min cost to arrange words 0..j-1 (first j words)
    # c[0] = 0
    c = [float('inf')] * (n + 1)
    c[0] = 0
    # p[j] = index where the last line started for optimal arrangement of first j words
    p = [0] * (n + 1)
    
    for j in range(1, n + 1):
        # We want to compute c[j]
        # Try all possible start points i for the last line ending at word j-1
        # The last line contains words i..j-1 (indices in 'words' list)
        # i goes from 1 to j (1-based count) -> 0 to j-1 (0-based index)
        
        candidates = []
        best_val = float('inf')
        best_i = -1
        
        for i in range(1, j + 1):
            # words[i-1...j-1] form the last line
            # In 0-indexed: words from index (i-1) to (j-1)
            start_word_idx = i - 1
            end_word_idx = j - 1
            
            cost_line = lc[start_word_idx][end_word_idx]
            
            if c[i-1] != float('inf') and cost_line != float('inf'):
                total_cost = c[i-1] + cost_line
                candidates.append({
                    "i": i, # 1-based index for display logic (start of line)
                    "prev_cost": c[i-1],
                    "line_cost": cost_line,
                    "total": total_cost,
                    "words_indices": [start_word_idx, end_word_idx]
                })
                
                if total_cost < best_val:
                    best_val = total_cost
                    best_i = i
        
        c[j] = best_val
        p[j] = best_i
        
        if best_val == float('inf'):
            msg = f"<strong>計算 c[{j}] (前 {j} 個字)</strong><br>無法找到合法的排版方式。"
        else:
            msg = f"<strong>計算 c[{j}] (前 {j} 個字)</strong><br>"
            msg += f"我們正在尋找排列前 {j} 個字的最小成本 $c[{j}]$。<br>"
            msg += f"這取決於「最後一行」是從哪裡開始的。假設最後一行是從第 $i$ 個字開始 (包含單字 $i \\dots {j}$)，那麼總成本就是：「前 $i-1$ 個字的最小成本」加上「這一行的行成本」。<br>"
            msg += f"公式：$Cost = c[i-1] + lc[i, {j}]$<br>"
            msg += f"我們比較了所有可能的 $i$ (詳見下方綠色區塊)：<br>"
            msg += f"<ul>"
            msg += f"<li>當 $i={best_i}$ 時，算出最小總成本為 <strong>{best_val}</strong>。</li>"
            msg += f"</ul>"
            msg += f"因此，我們選擇 $i={best_i}$ 作為最佳切分點，並記錄 $c[{j}] = {best_val}$。"

        steps.append({
            "type": "dp_step",
            "j": j,
            "c": [val if val != float('inf') else "∞" for val in c],
            "candidates": candidates,
            "best_i": best_i,
            "best_val": best_val if best_val != float('inf') else "∞",
            "msg": msg
        })

    # Reconstruct
    lines = []
    curr = n
    while curr > 0:
        start_node = p[curr] # 1-based index of first word in line
        # words from start_node-1 to curr-1
        line_words = words[start_node-1 : curr]
        lines.insert(0, " ".join(line_words))
        curr = start_node - 1
        
    steps.append({
        "type": "result",
        "lines": lines,
        "final_cost": c[n],
        "msg": f"計算完成。最小總成本為 {c[n]}。"
    })
    
    return steps
