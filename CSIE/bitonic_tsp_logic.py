import math

def solve_bitonic_tsp():
    # Define 7 points sorted by x-coordinate
    points = [
        {'id': 1, 'x': 50, 'y': 200, 'label': 'p1'},
        {'id': 2, 'x': 150, 'y': 100, 'label': 'p2'},
        {'id': 3, 'x': 200, 'y': 300, 'label': 'p3'},
        {'id': 4, 'x': 350, 'y': 150, 'label': 'p4'},
        {'id': 5, 'x': 450, 'y': 250, 'label': 'p5'},
        {'id': 6, 'x': 600, 'y': 100, 'label': 'p6'},
        {'id': 7, 'x': 700, 'y': 200, 'label': 'p7'}
    ]
    n = len(points)
    
    def dist(idx1, idx2):
        p1 = points[idx1-1]
        p2 = points[idx2-1]
        return math.sqrt((p1['x'] - p2['x'])**2 + (p1['y'] - p2['y'])**2)

    # B table: (n+1) x (n+1)
    # Initialize with infinity
    B = [[float('inf')] * (n + 1) for _ in range(n + 1)]
    # To reconstruct the path: choice[i][j] stores 'k' when i = j-1
    choice = [[0] * (n + 1) for _ in range(n + 1)]

    steps = []
    
    # Base case: B[1, 2] = d(1, 2)
    B[1][2] = dist(1, 2)
    
    steps.append({
        "msg": "初始化: B[1, 2] = d(p1, p2)",
        "points": points,
        "current_i": 1,
        "current_j": 2,
        "val": B[1][2],
        "highlight_edges": [{"from": 1, "to": 2}],
        "type": "init"
    })

    # DP Loop
    for j in range(3, n + 1):
        # Case 1: i < j-1
        for i in range(1, j - 1):
            val = B[i][j-1] + dist(j-1, j)
            B[i][j] = val
            
            steps.append({
                "msg": f"計算 B[{i}, {j}]。因為 i ({i}) < j-1 ({j-1})，這是「簡單延伸」情況。路徑直接從 p{j-1} 延伸到 p{j}。B[{i}, {j}] = B[{i}, {j-1}] + dist({j-1}, {j}) = {B[i][j-1]:.2f} + {dist(j-1, j):.2f} = {val:.2f}",
                "points": points,
                "current_i": i,
                "current_j": j,
                "val": val,
                "highlight_edges": [{"from": j-1, "to": j}],
                "type": "simple",
                "prev_state": {"i": i, "j": j-1}
            })

        # Case 2: i = j-1
        # B[j-1, j] = min_{1<=k<j-1} { B[k, j-1] + d(k, j) }
        min_val = float('inf')
        best_k = -1
        candidates = []
        
        for k in range(1, j - 1):
            d_kj = dist(k, j)
            curr_val = B[k][j-1] + d_kj
            candidates.append({"k": k, "val": curr_val})
            
            if curr_val < min_val:
                min_val = curr_val
                best_k = k
        
        B[j-1][j] = min_val
        choice[j-1][j] = best_k
        
        steps.append({
            "msg": f"計算 B[{j-1}, {j}]。因為 i ({j-1}) = j-1 ({j-1})，這是「分岔點選擇」情況。我們必須嘗試所有可能的 k (1 <= k < {j-1}) 作為 p{j} 的前驅點，找出使總長度最小的 k。最佳選擇是 k=p{best_k}，成本為 {min_val:.2f}。",
            "points": points,
            "current_i": j-1,
            "current_j": j,
            "val": min_val,
            "highlight_edges": [{"from": best_k, "to": j}],
            "candidates": candidates,
            "type": "complex"
        })

    # Final Step: Optimal Tour
    # Cost = B[n-1, n] + d(n-1, n)
    final_cost = B[n-1][n] + dist(n-1, n)
    
    # Reconstruct Path
    edges = []
    # Add the closing edge (n-1, n)
    edges.append({"from": n-1, "to": n})
    
    curr_i = n - 1
    curr_j = n
    
    path_msg = "回溯路徑: 加入邊 (p{0}, p{1})".format(n-1, n)
    
    while curr_j > 2:
        if curr_i < curr_j - 1:
            # Case 1: Came from (i, j-1)
            # Edge added was (j-1, j)
            edges.append({"from": curr_j-1, "to": curr_j})
            curr_j -= 1
        else:
            # Case 2: Came from (k, j-1) where i = j-1
            # Edge added was (k, j)
            k = choice[curr_i][curr_j]
            edges.append({"from": k, "to": curr_j})
            # New state (k, j-1) -> but we keep i < j convention
            # so new i = k, new j = curr_i (which was j-1)
            curr_j = curr_i
            curr_i = k
            
    # Base case edge
    edges.append({"from": 1, "to": 2})
    
    steps.append({
        "msg": f"計算完成。最佳 Bitonic Tour 總長度: {final_cost:.2f}",
        "points": points,
        "current_i": -1,
        "current_j": -1,
        "val": final_cost,
        "highlight_edges": edges,
        "type": "final"
    })
    
    return steps
