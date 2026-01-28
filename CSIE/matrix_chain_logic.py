def solve_matrix_chain(dims):
    # dims: list of integers [p0, p1, ..., pn]
    # n is number of matrices
    n = len(dims) - 1
    
    # s[i][j] stores min scalar multiplications (User wants 's' for cost)
    # c[i][j] stores split position k (User wants 'c' for split)
    # We use 1-based indexing for logic, so size is (n+1)x(n+1)
    
    s_table = [[0] * (n + 1) for _ in range(n + 1)]
    c_table = [[0] * (n + 1) for _ in range(n + 1)]
    
    steps = []
    
    # Initial state
    steps.append({
        "s_table": [row[:] for row in s_table],
        "c_table": [row[:] for row in c_table],
        "dims": dims,
        "msg": "初始化表格 s (最小運算量) 與 c (最佳切割點)。對角線 s[i][i] = 0。",
        "highlight": [],
        "parens": get_optimal_parens(c_table, 1, n) if n > 0 else ""
    })
    
    # l is chain length
    for l in range(2, n + 1):
        for i in range(1, n - l + 2):
            j = i + l - 1
            s_table[i][j] = float('inf')
            
            # Try split k
            for k in range(i, j):
                # Cost calculation
                # q = s[i][k] + s[k+1][j] + p[i-1]*p[k]*p[j]
                # Note: dims is 0-indexed. p_i is dims[i].
                # Matrix Ai has dims p_{i-1} x p_i.
                # So Ai...Ak results in p_{i-1} x p_k
                # Ak+1...Aj results in p_k x p_j
                # Multiplication cost: p_{i-1} * p_k * p_j
                
                q = s_table[i][k] + s_table[k+1][j] + dims[i-1] * dims[k] * dims[j]
                
                msg = f"計算 A{i}...A{j} (長度 {l})。\n嘗試切割點 k={k} (A{i}...A{k} 和 A{k+1}...A{j})。\n"
                msg += f"成本 = s[{i}][{k}] + s[{k+1}][{j}] + p[{i-1}]*p[{k}]*p[{j}]\n"
                msg += f"= {s_table[i][k]} + {s_table[k+1][j]} + {dims[i-1]}*{dims[k]}*{dims[j]} = {q}"
                
                highlight = [
                    {"r": i, "c": j, "type": "target"}, # Current cell being computed
                    {"r": i, "c": k, "type": "dependency_left"}, # Left part
                    {"r": k+1, "c": j, "type": "dependency_right"} # Right part
                ]
                
                updated = False
                if q < s_table[i][j]:
                    s_table[i][j] = q
                    c_table[i][j] = k
                    updated = True
                    msg += f"\n發現更小值！更新 s[{i}][{j}] = {q}, c[{i}][{j}] = {k}。"
                else:
                    msg += f"\n沒有比當前最小值 {s_table[i][j]} 小，不更新。"
                
                # For visualization, we replace inf with -1 or something recognizable if needed, 
                # but JSON handles null or we can just send number. 
                # Python float('inf') becomes Infinity in JSON which is valid in JS (mostly) or null.
                # Let's use a large number or handle in JS. 
                # Actually standard JSON spec doesn't support Infinity. Flask jsonify might fail or convert to null.
                # Let's convert inf to -1 for transfer, or just a very large number.
                
                current_val = s_table[i][j]
                if current_val == float('inf'):
                    current_val = -1 # Represent infinity/unset
                
                # Create safe copies for JSON
                safe_s = []
                for row in s_table:
                    safe_row = []
                    for val in row:
                        if val == float('inf'):
                            safe_row.append(-1)
                        else:
                            safe_row.append(val)
                    safe_s.append(safe_row)

                steps.append({
                    "s_table": safe_s,
                    "c_table": [row[:] for row in c_table],
                    "dims": dims,
                    "i": i, "j": j, "k": k,
                    "q": q,
                    "current_min": current_val,
                    "msg": msg,
                    "highlight": highlight,
                    "parens": "計算中..."
                })
                
    # Prepare safe_s for reconstruction
    safe_s = []
    for row in s_table:
        safe_row = []
        for val in row:
            if val == float('inf'):
                safe_row.append(-1)
            else:
                safe_row.append(val)
        safe_s.append(safe_row)

    # Reconstruction Phase Logic
    visited_splits = set()

    def generate_parens(i, j):
        if i == j:
            return f"A{i}"
        if (i, j) in visited_splits:
            k = c_table[i][j]
            return f"({generate_parens(i, k)}{generate_parens(k+1, j)})"
        else:
            # Not split yet in visualization, show flat sequence
            return "".join([f"A{x}" for x in range(i, j+1)])

    # Initial Recon Step
    steps.append({
        "s_table": safe_s,
        "c_table": [row[:] for row in c_table],
        "dims": dims,
        "msg": "DP 表格填寫完成。準備開始回溯最佳切割方式。",
        "highlight": [],
        "parens": generate_parens(1, n)
    })
    
    def add_recon_steps(i, j):
        if i == j:
            steps.append({
                "s_table": safe_s,
                "c_table": [row[:] for row in c_table],
                "dims": dims,
                "msg": f"子問題 A{i}: 長度為 1 (葉節點)。",
                "highlight": [{"r": i, "c": j, "type": "leaf"}],
                "parens": generate_parens(1, n)
            })
            return
        
        k = c_table[i][j]
        
        # Mark this split as visited so generate_parens will render it
        visited_splits.add((i, j))
        current_parens = generate_parens(1, n)
        
        steps.append({
            "s_table": safe_s,
            "c_table": [row[:] for row in c_table],
            "dims": dims,
            "msg": f"查詢 c[{i}][{j}] = {k}。將 A{i}...A{j} 切割為 (A{i}...A{k}) 與 (A{k+1}...A{j})。",
            "highlight": [{"r": i, "c": j, "type": "split"}],
            "parens": current_parens
        })
        
        add_recon_steps(i, k)
        add_recon_steps(k+1, j)

    add_recon_steps(1, n)

    final_parens = generate_parens(1, n)
    steps.append({
        "s_table": safe_s,
        "c_table": [row[:] for row in c_table],
        "dims": dims,
        "msg": f"回溯完成。最佳括號方式為: {final_parens}\n最小運算量為 {s_table[1][n]}。",
        "highlight": [{"r": 1, "c": n, "type": "final"}],
        "parens": final_parens
    })
    
    return steps

def get_optimal_parens(c, i, j):
    if i > j: return ""
    if i == j:
        return f"A{i}"
    else:
        k = c[i][j]
        if k == 0: # Not computed yet, just show range
            return f"(A{i}...A{j})"
        left = get_optimal_parens(c, i, k)
        right = get_optimal_parens(c, k+1, j)
        return f"({left}{right})"
