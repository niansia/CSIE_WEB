import copy

def solve_obst(p, q=None):
    """
    Solves the Optimal Binary Search Tree problem.
    Returns a list of steps for visualization.
    """
    n = len(p)
    
    if q is None:
        q = [0.0] * (n + 1)
    
    # Ensure q has correct length
    if len(q) < n + 1:
        q.extend([0.0] * (n + 1 - len(q)))
    else:
        q = q[:n+1]

    # Tables: size (n+2) x (n+2) to handle 1-based indexing and boundary conditions easily
    # e[i][j]: expected cost of searching an optimal binary search tree containing keys ki...kj
    # w[i][j]: sum of probabilities of keys ki...kj and dummies di-1...dj
    # root[i][j]: index of the root of an optimal binary search tree containing keys ki...kj
    
    e = [[0.0] * (n + 2) for _ in range(n + 2)]
    w = [[0.0] * (n + 2) for _ in range(n + 2)]
    root = [[0] * (n + 2) for _ in range(n + 2)]
    
    steps = []
    
    # Helper to create a step object
    def create_step(msg, highlight=[], tree_nodes=[], tree_edges=[]):
        # Convert inf to -1 for JSON serialization safety
        safe_e = []
        for row in e:
            safe_row = []
            for val in row:
                if val == float('inf'):
                    safe_row.append(-1)
                else:
                    safe_row.append(val)
            safe_e.append(safe_row)
            
        return {
            "e": safe_e,
            "w": [row[:] for row in w],
            "root": [row[:] for row in root],
            "msg": msg,
            "highlight": highlight,
            "tree_nodes": copy.deepcopy(tree_nodes),
            "tree_edges": copy.deepcopy(tree_edges)
        }

    # Initialization
    # For i = 1 to n + 1, e[i, i-1] = q[i-1], w[i, i-1] = q[i-1]
    for i in range(1, n + 2):
        val = q[i-1]
        e[i][i-1] = val
        w[i][i-1] = val
    
    steps.append(create_step("初始化表格。設定邊界條件 e[i, i-1] = q[i-1] 與 w[i, i-1] = q[i-1]。", []))

    # Main DP Loop
    for l in range(1, n + 1): # length l
        for i in range(1, n - l + 2):
            j = i + l - 1
            e[i][j] = float('inf')
            
            # w[i, j] = w[i, j-1] + p_j + q_j
            # p is 0-indexed => p[j-1]
            # q is 0-indexed => q[j]
            w[i][j] = w[i][j-1] + p[j-1] + q[j]
            
            base_msg = f"計算長度 l={l} 的區間 [{i}, {j}]。\nw[{i}][{j}] = {w[i][j]:.2f}。"
            
            for r in range(i, j + 1):
                # t = e[i, r-1] + e[r+1, j] + w[i, j]
                t = e[i][r-1] + e[r+1][j] + w[i][j]
                
                msg = base_msg + f"\n嘗試根節點 r={r} (k{r})。\n"
                msg += f"t = e[{i}][{r-1}] + e[{r+1}][{j}] + w[{i}][{j}] = {e[i][r-1]:.2f} + {e[r+1][j]:.2f} + {w[i][j]:.2f} = {t:.2f}"
                
                highlight = [
                    {"r": i, "c": j, "type": "target"},
                    {"r": i, "c": r-1, "type": "left"},
                    {"r": r+1, "c": j, "type": "right"}
                ]
                
                if t < e[i][j]:
                    e[i][j] = t
                    root[i][j] = r
                    msg += f"\n發現更小值！更新 e[{i}][{j}] = {t:.2f}, root[{i}][{j}] = {r}。"
                else:
                    msg += f"\n未小於當前最小值 {e[i][j]:.2f}，不更新。"
                
                steps.append(create_step(msg, highlight))

    # Reconstruction Phase
    current_tree_nodes = []
    current_tree_edges = []
    
    steps.append(create_step("DP 表格計算完成。開始依照 root 表格建構最佳二元搜尋樹。", [], current_tree_nodes, current_tree_edges))
    
    # Recursive function to build tree and generate steps
    # We need to pass the current state of nodes/edges to the step
    
    def build_tree(i, j, parent_id, x_range_start, x_range_end, y, level):
        # x_range is used to position nodes roughly
        # This is a simple positioning logic. For better visualization, we might need a proper layout algorithm.
        # But for now, let's use simple binary subdivision logic for X.
        
        mid_x = (x_range_start + x_range_end) / 2
        
        if i > j:
            # Dummy node d_{j} (since j = i-1)
            dummy_idx = j
            node_id = f"d{dummy_idx}"
            label = f"d{dummy_idx}"
            
            node = {
                "id": node_id,
                "label": label,
                "type": "dummy",
                "val": q[dummy_idx],
                "x": mid_x,
                "y": y
            }
            current_tree_nodes.append(node)
            
            if parent_id:
                current_tree_edges.append({"from": parent_id, "to": node_id})
            
            msg = f"區間 [{i}, {j}] 為空 (i > j)。\n建立虛擬節點 d{dummy_idx} (機率 {q[dummy_idx]})。"
            # Highlight the boundary condition cell e[i][j] (which is e[j+1][j] effectively? No, it's e[i][i-1])
            # In our table, we access e[i][j].
            steps.append(create_step(msg, [{"r": i, "c": j, "type": "leaf"}], current_tree_nodes, current_tree_edges))
            return

        r = root[i][j]
        node_id = f"k{r}"
        label = f"k{r}"
        
        node = {
            "id": node_id,
            "label": label,
            "type": "key",
            "val": p[r-1],
            "x": mid_x,
            "y": y
        }
        current_tree_nodes.append(node)
        
        if parent_id:
            current_tree_edges.append({"from": parent_id, "to": node_id})
            
        msg = f"查詢 root[{i}][{j}] = {r}。\n區間 [{i}, {j}] 的根節點為 k{r}。"
        steps.append(create_step(msg, [{"r": i, "c": j, "type": "root"}], current_tree_nodes, current_tree_edges))
        
        # Recurse Left
        # Left child range: [i, r-1]
        build_tree(i, r - 1, node_id, x_range_start, mid_x, y + 60, level + 1)
        
        # Recurse Right
        # Right child range: [r+1, j]
        build_tree(r + 1, j, node_id, mid_x, x_range_end, y + 60, level + 1)

    # Start building tree
    # Assume canvas width is roughly 800-1000 units for calculation
    build_tree(1, n, None, 0, 1000, 50, 0)
    
    steps.append(create_step("最佳二元搜尋樹建構完成。", [], current_tree_nodes, current_tree_edges))
    
    return {
        "n": n,
        "p": p,
        "q": q,
        "steps": steps
    }
