import random

def solve_seam_carving():
    # Define a small grid of disruption values d[i][j]
    # m rows, n columns
    m = 6
    n = 5
    
    # Random disruption values between 1 and 9
    # Fixed seed for reproducibility
    random.seed(42)
    d = [[random.randint(1, 9) for _ in range(n)] for _ in range(m)]
    
    steps = []
    
    # Step 1: Initialization
    steps.append({
        "type": "init",
        "m": m,
        "n": n,
        "d": [row[:] for row in d],
        "msg": f"初始化: 建立一個 {m}x{n} 的像素網格。每個格子內的數字代表該像素的破壞度 $d[i,j]$。"
    })
    
    # DP Table C[i][j]
    C = [[0] * n for _ in range(m)]
    parent = [[0] * n for _ in range(m)] # To store which direction it came from (-1: left-up, 0: up, 1: right-up)
    
    # First row initialization
    for j in range(n):
        C[0][j] = d[0][j]
        
    steps.append({
        "type": "row_init",
        "row": 0,
        "C": [row[:] for row in C],
        "msg": "邊界條件: 第一列 (Row 0) 的累積破壞度 $C[0,j]$ 等於該像素本身的破壞度 $d[0,j]$。"
    })
    
    # DP Calculation
    for i in range(1, m):
        steps.append({
            "type": "start_row",
            "row": i,
            "C": [row[:] for row in C],
            "msg": f"<strong>開始計算第 {i} 列</strong><br>根據公式: $C[i,j] = d[i,j] + \\min(C[i-1, j-1], C[i-1, j], C[i-1, j+1])$"
        })
        
        for j in range(n):
            # Find min from previous row neighbors
            candidates = []
            
            # Left-up (j-1)
            if j > 0:
                candidates.append((C[i-1][j-1], j-1, "左上"))
            
            # Up (j)
            candidates.append((C[i-1][j], j, "正上"))
            
            # Right-up (j+1)
            if j < n - 1:
                candidates.append((C[i-1][j+1], j+1, "右上"))
            
            # Find min
            min_val, prev_col, direction = min(candidates, key=lambda x: x[0])
            
            C[i][j] = d[i][j] + min_val
            parent[i][j] = prev_col
            
            # Detailed message for this cell
            calc_msg = f"計算 $C[{i},{j}]$:<br>"
            calc_msg += f"本身破壞度 $d[{i},{j}] = {d[i][j]}$<br>"
            calc_msg += f"前一列候選: "
            cand_strs = [f"{desc} ({val})" for val, _, desc in candidates]
            calc_msg += ", ".join(cand_strs) + "<br>"
            calc_msg += f"最小值為 {min_val} (來自 {direction})<br>"
            calc_msg += f"→ $C[{i},{j}] = {d[i][j]} + {min_val} = {C[i][j]}$"
            
            steps.append({
                "type": "calc_cell",
                "row": i,
                "col": j,
                "val": C[i][j],
                "prev_col": prev_col,
                "candidates": [{"val": c[0], "col": c[1]} for c in candidates],
                "C": [row[:] for row in C],
                "msg": calc_msg
            })

    # Find min in last row
    min_last_val = float('inf')
    min_last_col = -1
    
    last_row_candidates = []
    for j in range(n):
        last_row_candidates.append(f"$C[{m-1},{j}]={C[m-1][j]}$")
        if C[m-1][j] < min_last_val:
            min_last_val = C[m-1][j]
            min_last_col = j
            
    steps.append({
        "type": "find_min",
        "min_val": min_last_val,
        "min_col": min_last_col,
        "C": [row[:] for row in C],
        "msg": f"計算完成。檢查最後一列 ({m-1}):<br>" + ", ".join(last_row_candidates) + f"<br>最小值為 {min_last_val}，位於行 {min_last_col}。"
    })
    
    # Backtrack
    seam_path = []
    curr_col = min_last_col
    for i in range(m - 1, -1, -1):
        seam_path.append((i, curr_col))
        if i > 0:
            curr_col = parent[i][curr_col]
            
    seam_path.reverse() # Top to bottom
    
    steps.append({
        "type": "result",
        "path": seam_path,
        "C": [row[:] for row in C],
        "msg": f"回溯找出最小破壞度 Seam (路徑):<br>" + " → ".join([f"({r},{c})" for r, c in seam_path])
    })
    
    return steps
