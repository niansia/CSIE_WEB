import math

def solve_inventory_planning():
    # Default parameters for demonstration
    n = 3
    m = 2 # Regular production capacity
    c = 3 # Extra cost per unit over m
    demands = [2, 3, 2] # d_1, d_2, d_3
    
    # Holding cost function h(j) = j * 1
    def h(j):
        return j * 1

    D = sum(demands)
    
    steps = []
    
    # DP table f[i][j]
    # i: 0 to n (months)
    # j: 0 to D (inventory)
    f = [[float('inf')] * (D + 1) for _ in range(n + 1)]
    parent = [[-1] * (D + 1) for _ in range(n + 1)] # Stores 's' (previous inventory)
    production = [[-1] * (D + 1) for _ in range(n + 1)] # Stores 'x' (production amount)
    
    # Initialization
    f[0][0] = 0
    
    steps.append({
        "type": "init",
        "n": n,
        "m": m,
        "c": c,
        "demands": demands,
        "D": D,
        "f": [[(val if val != float('inf') else None) for val in row] for row in f],
        "msg": f"初始化: $n={n}$ 個月, 總需求 $D={D}$。<br>正常產能 $m={m}$, 加班費 $c={c}$。<br>設定 $f[0][0]=0$，其餘為 $\\infty$。"
    })
    
    for i in range(1, n + 1):
        d_i = demands[i-1]
        
        steps.append({
            "type": "start_month",
            "i": i,
            "d_i": d_i,
            "f": [[(val if val != float('inf') else None) for val in row] for row in f],
            "msg": f"<strong>開始計算第 {i} 個月</strong> (需求 $d_{i} = {d_i}$)<br>計算所有可能的月底庫存 $j$ (0 到 {D})。"
        })
        
        for j in range(D + 1):
            # Calculate f[i][j]
            # Try all possible previous inventory s
            
            candidates = []
            
            for s in range(D + 1):
                # Check if valid previous state
                if f[i-1][s] == float('inf'):
                    continue
                
                # Production amount x
                # j = s + x - d_i  => x = d_i + j - s
                x = d_i + j - s
                
                if x < 0:
                    continue
                
                # Cost calculation
                # Production cost
                prod_cost = 0
                if x > m:
                    prod_cost = (x - m) * c
                
                # Holding cost
                hold_cost = h(j)
                
                total_cost = f[i-1][s] + prod_cost + hold_cost
                
                candidates.append({
                    "s": s,
                    "x": x,
                    "prev_cost": f[i-1][s],
                    "prod_cost": prod_cost,
                    "hold_cost": hold_cost,
                    "total_cost": total_cost
                })
            
            if candidates:
                # Find min
                best_cand = min(candidates, key=lambda item: item['total_cost'])
                f[i][j] = best_cand['total_cost']
                parent[i][j] = best_cand['s']
                production[i][j] = best_cand['x']
                
                # Detailed message for this cell
                # Only show top 3 candidates or so to avoid clutter if D is large?
                # For small D, show all.
                cand_msgs = []
                for cand in candidates:
                    cand_msgs.append(f"s={cand['s']} (x={cand['x']}): {cand['prev_cost']} + {cand['prod_cost']} + {cand['hold_cost']} = {cand['total_cost']}")
                
                msg = f"計算 $f[{i}][{j}]$:<br>" + "<br>".join(cand_msgs) + f"<br>→ 最小值: {best_cand['total_cost']} (來自 s={best_cand['s']})"
                
                steps.append({
                    "type": "calc_cell",
                    "i": i,
                    "j": j,
                    "val": f[i][j],
                    "candidates": candidates,
                    "best_s": best_cand['s'],
                    "f": [[(val if val != float('inf') else None) for val in row] for row in f],
                    "msg": msg
                })
            else:
                # No valid s leads to j
                pass

    # Result
    min_cost = f[n][0]
    path = []
    
    if min_cost != float('inf'):
        curr_j = 0
        for i in range(n, 0, -1):
            prev_s = parent[i][curr_j]
            prod_x = production[i][curr_j]
            path.append({
                "month": i,
                "inventory_start": prev_s,
                "production": prod_x,
                "demand": demands[i-1],
                "inventory_end": curr_j
            })
            curr_j = prev_s
        path.reverse()
        
        path_str = " -> ".join([f"M{p['month']}:造{p['production']}" for p in path])
        
        steps.append({
            "type": "result",
            "min_cost": min_cost,
            "path": path,
            "f": [[(val if val != float('inf') else None) for val in row] for row in f],
            "msg": f"計算完成。第 {n} 個月月底庫存為 0 的最小成本為 {min_cost}。<br>生產計畫: {path_str}"
        })
    else:
        steps.append({
            "type": "result",
            "min_cost": -1,
            "path": [],
            "f": [[(val if val != float('inf') else None) for val in row] for row in f],
            "msg": "無法達成目標 (無解)。"
        })
        
    return steps
