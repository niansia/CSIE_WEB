import networkx as nx

def solve_spanning_tree_proof():
    # Define Graph G
    # Nodes: 0, 1, 2, 3, 4
    # A slightly more complex graph to make it interesting
    nodes = [0, 1, 2, 3, 4]
    edges = [
        (0, 1), (0, 2), (0, 3),
        (1, 2), (1, 4),
        (2, 3), (2, 4),
        (3, 4)
    ]
    
    # Spanning Tree T1
    # Let's pick a path-like tree
    t1_edges = [(0, 1), (1, 2), (2, 3), (3, 4)]
    
    # Spanning Tree T2
    # Let's pick a star-like tree centered at 2
    t2_edges = [(2, 0), (2, 1), (2, 3), (2, 4)]
    # Note: (2,0) is same as (0,2)
    
    # Normalize edges to sorted tuples
    def norm(e): return tuple(sorted(e))
    
    t1_set = set(norm(e) for e in t1_edges)
    t2_set = set(norm(e) for e in t2_edges)
    all_edges = set(norm(e) for e in edges)
    
    # Find edge a in T1 but not in T2
    # T1: (0,1), (1,2), (2,3), (3,4)
    # T2: (0,2), (1,2), (2,3), (2,4)
    # Diff T1-T2: (0,1), (3,4)
    # Let's pick a = (0,1)
    a = (0, 1)
    
    steps = []
    
    # Initial State
    steps.append({
        "type": "init",
        "nodes": nodes,
        "edges": [list(e) for e in all_edges],
        "t1": [list(e) for e in t1_set],
        "t2": [list(e) for e in t2_set],
        "msg": "初始化: 給定圖 G 以及兩棵生成樹 \\(T_1\\) (紅色) 與 \\(T_2\\) (藍色)。"
    })
    
    # Step 0: Select a
    steps.append({
        "type": "select_a",
        "a": list(a),
        "t1": [list(e) for e in t1_set],
        "t2": [list(e) for e in t2_set],
        "msg": f"選擇邊 \\(a = {a}\\)，它在 \\(T_1\\) 中但不在 \\(T_2\\) 中。"
    })
    
    # Step 1: Find cycle in T2 + {a}
    # Build T2 graph
    G_t2 = nx.Graph()
    G_t2.add_nodes_from(nodes)
    G_t2.add_edges_from(t2_set)
    
    # Find path in T2 between endpoints of a
    path = nx.shortest_path(G_t2, source=a[0], target=a[1])
    # Path edges
    path_edges = []
    for i in range(len(path)-1):
        path_edges.append(norm((path[i], path[i+1])))
        
    cycle_edges = path_edges + [a]
    
    steps.append({
        "type": "show_cycle",
        "a": list(a),
        "path": path,
        "cycle_edges": [list(e) for e in cycle_edges],
        "t2": [list(e) for e in t2_set],
        "msg": f"第一步: 在 \\(T_2\\) 中加入 \\(a\\) 會形成唯一的 Cycle \\(C\\)。<br>路徑 \\(P\\) (在 \\(T_2\\) 中): {path}。"
    })
    
    # Step 2: Find b in Cycle - {a} such that b not in T1
    candidates = []
    for e in path_edges:
        if e not in t1_set:
            candidates.append(e)
            
    # We also need to ensure b connects the two components of T1 - {a}
    # Let's check components of T1 - {a}
    G_t1_minus_a = nx.Graph()
    G_t1_minus_a.add_nodes_from(nodes)
    G_t1_minus_a.add_edges_from(t1_set - {a})
    comps = list(nx.connected_components(G_t1_minus_a))
    # comps should be 2 sets
    
    valid_b = None
    for cand in candidates:
        u, v = cand
        # Check if u in comp0 and v in comp1 or vice versa
        in_c0 = (u in comps[0])
        in_c1 = (u in comps[1])
        
        if (u in comps[0] and v in comps[1]) or (u in comps[1] and v in comps[0]):
            valid_b = cand
            break
            
    if valid_b is None:
        # Should not happen by theorem
        valid_b = candidates[0] 
        
    steps.append({
        "type": "select_b",
        "a": list(a),
        "b": list(valid_b),
        "cycle_edges": [list(e) for e in cycle_edges],
        "candidates": [list(e) for e in candidates],
        "msg": f"在 Cycle \\(C \\setminus \\{{a\\}}\\) 中尋找不在 \\(T_1\\) 的邊。<br>候選邊: {[list(e) for e in candidates]}。<br>選擇 \\(b = {valid_b}\\)。"
    })
    
    # Step 3: Verify T2' = T2 - {b} + {a}
    t2_prime = (t2_set - {valid_b}) | {a}
    steps.append({
        "type": "verify_t2_prime",
        "t2_prime": [list(e) for e in t2_prime],
        "removed": list(valid_b),
        "added": list(a),
        "msg": f"第二步: 證明 \\(T_2' = (T_2 - \\{{b\\}}) \\cup \\{{a\\}}\\) 是生成樹。<br>移除 \\(b\\) 打斷了 Cycle，加入 \\(a\\) 重新連接。<br>邊數不變，無環且連通。"
    })
    
    # Step 4: Verify T1' = T1 - {a} + {b}
    t1_prime = (t1_set - {a}) | {valid_b}
    steps.append({
        "type": "verify_t1_prime",
        "t1_prime": [list(e) for e in t1_prime],
        "removed": list(a),
        "added": list(valid_b),
        "msg": f"第三步: 證明 \\(T_1' = (T_1 - \\{{a\\}}) \\cup \\{{b\\}}\\) 是生成樹。<br>移除 \\(a\\) 將 \\(T_1\\) 分為兩個連通分量。<br>邊 \\(b\\) 恰好連接這兩個分量 (因為 \\(b\\) 在 \\(T_2\\) 的路徑上，且該路徑連接 \\(a\\) 的兩端)。"
    })
    
    return steps
