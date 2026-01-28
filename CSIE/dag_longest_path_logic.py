import copy

def generate_proof_steps():
    # Define a sample DAG
    # Nodes: 0:s, 1:a, 2:b, 3:c, 4:d, 5:t
    nodes = ["s", "a", "b", "c", "d", "t"]
    # Adjacency list: u -> [(v, weight)]
    adj = {
        0: [(1, 2), (2, 4)], # s -> a(2), s -> b(4)
        1: [(3, 3), (2, 1)], # a -> c(3), a -> b(1)
        2: [(3, 2), (4, 3)], # b -> c(2), b -> d(3)
        3: [(5, 4)],         # c -> t(4)
        4: [(5, 2)],         # d -> t(2)
        5: []                # t
    }
    
    # Coordinates for visualization (x, y)
    node_coords = {
        0: {"x": 100, "y": 200},   # s
        1: {"x": 250, "y": 100},   # a
        2: {"x": 250, "y": 300},   # b
        3: {"x": 450, "y": 100},   # c
        4: {"x": 450, "y": 300},   # d
        5: {"x": 600, "y": 200}    # t
    }

    # Topological Sort (Manual for this fixed graph)
    # s -> a -> b -> c -> t is NOT valid because a->b is not there, but s->a, s->b.
    # Let's check dependencies:
    # s: none
    # a: from s
    # b: from s, a
    # c: from a, b
    # d: from b
    # t: from c, d
    # Valid topo order: s, a, b, d, c, t (or s, a, b, c, d, t)
    # Let's use: s, a, b, c, d, t
    # Reverse topo order: t, d, c, b, a, s
    topo_order = [5, 4, 3, 2, 1, 0] 
    
    # Initialize L table
    # L[v] = -infinity
    L = {i: float('-inf') for i in range(6)}
    # Path reconstruction pointer
    parent = {i: None for i in range(6)}
    
    steps = []
    
    # Helper to create step
    def create_step(msg, highlight_nodes=[], highlight_edges=[], current_node=None):
        display_L = {}
        for k, v in L.items():
            display_L[nodes[k]] = "-∞" if v == float('-inf') else str(v)
            
        return {
            "nodes": nodes,
            "adj": adj,
            "node_coords": node_coords,
            "L": display_L,
            "topo_order": [nodes[i] for i in topo_order],
            "msg": msg,
            "highlight_nodes": highlight_nodes,
            "highlight_edges": highlight_edges,
            "current_node": nodes[current_node] if current_node is not None else None
        }

    # Step 1: Initialization
    steps.append(create_step("初始化: 設定所有節點的 L 值為 -∞ (表示尚未計算或無法到達)。", [], []))
    
    L[5] = 0
    steps.append(create_step("初始化: 設定終點 t 的 L(t) = 0 (從 t 到 t 的距離為 0)。", [5], [], 5))
    
    # Step 2: Topological Sort explanation
    steps.append(create_step("拓樸排序 (Topological Sort): s, a, b, c, d, t。\n我們將依照反向拓樸順序 (t -> d -> c -> b -> a -> s) 計算 L 值。", [], []))

    # Step 3: DP Loop
    for u in topo_order:
        u_name = nodes[u]
        
        if u == 5: # t
            steps.append(create_step(f"處理節點 {u_name} (終點): L({u_name}) 已知為 0。", [u], [], u))
            continue
            
        steps.append(create_step(f"處理節點 {u_name}...", [u], [], u))
        
        # Check neighbors
        if not adj[u]:
             steps.append(create_step(f"節點 {u_name} 沒有出邊，L({u_name}) 保持 -∞。", [u], [], u))
             continue
        
        max_val = float('-inf')
        best_v = None
        
        for v, weight in adj[u]:
            v_name = nodes[v]
            l_v_display = L[v] if L[v] != float('-inf') else "-∞"
            
            steps.append(create_step(f"檢查邊 ({u_name} -> {v_name})，權重 w = {weight}。\n計算 w({u_name}, {v_name}) + L({v_name}) = {weight} + {l_v_display}", 
                                     [u, v], [{"from": u, "to": v}], u))
            
            if L[v] != float('-inf'):
                current_val = weight + L[v]
                if current_val > max_val:
                    max_val = current_val
                    best_v = v
                    steps.append(create_step(f"找到新的最大值: {max_val} (經由 {v_name})", [u, v], [{"from": u, "to": v}], u))
        
        if max_val != float('-inf'):
            L[u] = max_val
            parent[u] = best_v
            steps.append(create_step(f"更新 L({u_name}) = {max_val}。", [u], [], u))
        else:
             steps.append(create_step(f"無法從 {u_name} 到達 t，L({u_name}) 保持 -∞。", [u], [], u))

    # Final Step: Reconstruct path
    path = []
    curr = 0 # s
    
    # Simple check if path exists
    if L[0] == float('-inf'):
        steps.append(create_step("無法從 s 到達 t。", [], []))
    else:
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
            
        path_edges = []
        for i in range(len(path) - 1):
            path_edges.append({"from": path[i], "to": path[i+1]})
            
        path_names = [nodes[i] for i in path]
        steps.append(create_step(f"計算完成。\n從 s 到 t 的最長路徑長度為 {L[0]}。\n路徑: {' -> '.join(path_names)}", path, path_edges))
    
    return steps
