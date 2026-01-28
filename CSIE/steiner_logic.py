import heapq
import copy

def solve_steiner(nodes, edges, terminals):
    # nodes: list of {id: str, x: int, y: int}
    # edges: list of {u: str, v: str, w: int}
    # terminals: list of str (node ids)
    
    steps = []
    
    # 1. Initial State
    steps.append({
        "msg": "初始狀態：給定圖 G 與終端節點 (Terminals, 紅色)。",
        "graph": {
            "nodes": nodes,
            "edges": edges
        },
        "terminals": terminals,
        "highlight_edges": [],
        "highlight_nodes": terminals,
        "phase": "init"
    })
    
    # Build Adjacency List
    adj = {n['id']: [] for n in nodes}
    for e in edges:
        adj[e['u']].append((e['v'], e['w']))
        adj[e['v']].append((e['u'], e['w']))
        
    # 2. Metric Closure (All-pairs shortest paths between terminals)
    # We use Dijkstra for each terminal
    closure_edges = []
    shortest_paths = {} # (u, v) -> [path nodes]
    
    steps.append({
        "msg": "步驟 1：建構 Metric Closure G_L。\n計算所有終端節點對之間的最短路徑。",
        "graph": {"nodes": nodes, "edges": edges},
        "terminals": terminals,
        "highlight_edges": [],
        "highlight_nodes": terminals,
        "phase": "closure_start"
    })

    for i in range(len(terminals)):
        u = terminals[i]
        # Dijkstra from u
        dist = {n['id']: float('inf') for n in nodes}
        parent = {n['id']: None for n in nodes}
        dist[u] = 0
        pq = [(0, u)]
        
        while pq:
            d, curr = heapq.heappop(pq)
            if d > dist[curr]:
                continue
            
            for neighbor, weight in adj[curr]:
                if dist[curr] + weight < dist[neighbor]:
                    dist[neighbor] = dist[curr] + weight
                    parent[neighbor] = curr
                    heapq.heappush(pq, (dist[neighbor], neighbor))
        
        # Record paths to other terminals
        for j in range(i + 1, len(terminals)):
            v = terminals[j]
            if dist[v] != float('inf'):
                # Reconstruct path
                path = []
                curr = v
                while curr is not None:
                    path.append(curr)
                    curr = parent[curr]
                path.reverse()
                
                shortest_paths[(u, v)] = path
                shortest_paths[(v, u)] = list(reversed(path))
                
                closure_edges.append({
                    "u": u, "v": v, "w": dist[v],
                    "path": path
                })

    # Show Metric Closure Graph (Conceptual)
    # We can visualize this by drawing direct lines between terminals
    steps.append({
        "msg": f"Metric Closure G_L 建構完成。\n包含 {len(terminals)} 個終端節點與 {len(closure_edges)} 條邊 (代表最短路徑)。",
        "graph": {"nodes": nodes, "edges": edges},
        "terminals": terminals,
        "closure_edges": closure_edges, # Special field for visualization
        "phase": "closure_done"
    })

    # 3. MST on Metric Closure
    # Kruskal's Algorithm on closure_edges
    closure_edges.sort(key=lambda x: x['w'])
    parent_set = {t: t for t in terminals}
    
    def find(i):
        if parent_set[i] == i:
            return i
        parent_set[i] = find(parent_set[i])
        return parent_set[i]
        
    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent_set[root_i] = root_j
            return True
        return False
        
    mst_edges = []
    mst_steps_msg = []
    
    for e in closure_edges:
        if union(e['u'], e['v']):
            mst_edges.append(e)
            mst_steps_msg.append(f"加入邊 ({e['u']}, {e['v']}) 權重 {e['w']}")
            
            steps.append({
                "msg": f"步驟 2：在 G_L 上尋找 MST。\n加入邊 ({e['u']}, {e['v']})，權重 {e['w']}。",
                "graph": {"nodes": nodes, "edges": edges},
                "terminals": terminals,
                "closure_edges": closure_edges,
                "mst_edges": copy.deepcopy(mst_edges), # Edges in G_L
                "phase": "mst_step"
            })

    steps.append({
        "msg": "MST on G_L 尋找完成。",
        "graph": {"nodes": nodes, "edges": edges},
        "terminals": terminals,
        "closure_edges": closure_edges,
        "mst_edges": copy.deepcopy(mst_edges),
        "phase": "mst_done"
    })

    # 4. Transform back to Steiner Tree on G
    # T starts empty (or just terminals)
    # We maintain a set of vertices currently in T
    
    # Initially, no vertices are "connected" in T, but conceptually T is being built.
    # The algorithm says "Let T be empty".
    # But practically, we are adding paths.
    
    t_nodes = set()
    t_edges = [] # Edges in G
    
    # To implement the "vertices already in T" check correctly, we need to track connected components in T?
    # The algorithm implies T grows.
    # "Let pi and pj be the first and the last vertices already in T"
    
    # Let's follow the algorithm strictly.
    # T is a subgraph of G.
    
    current_t_nodes = set()
    current_t_edges = []
    
    steps.append({
        "msg": "步驟 3：將 MST 轉換回 Steiner Tree。\n初始化 T 為空。",
        "graph": {"nodes": nodes, "edges": edges},
        "terminals": terminals,
        "final_tree_edges": [],
        "phase": "reconstruct_start"
    })
    
    for mst_e in mst_edges:
        u, v = mst_e['u'], mst_e['v']
        path = shortest_paths[(u, v)] # List of node IDs
        
        # Check intersection with current T
        indices_in_t = [i for i, node in enumerate(path) if node in current_t_nodes]
        
        path_edges_to_add = []
        nodes_to_add = set()
        
        explanation = ""
        
        if len(indices_in_t) < 2:
            # Add whole path
            explanation = f"處理 MST 邊 ({u}, {v})。\n對應路徑: {path}。\n路徑上少於 2 個點已在 T 中，加入整條路徑。"
            for k in range(len(path) - 1):
                n1, n2 = path[k], path[k+1]
                path_edges_to_add.append({"u": n1, "v": n2})
                nodes_to_add.add(n1)
                nodes_to_add.add(n2)
        else:
            # Add subpaths
            first_idx = indices_in_t[0]
            last_idx = indices_in_t[-1]
            p_i = path[first_idx]
            p_j = path[last_idx]
            
            explanation = f"處理 MST 邊 ({u}, {v})。\n對應路徑: {path}。\n已存在 T 中的點: {[path[i] for i in indices_in_t]}。\n加入 {u}->{p_i} 和 {p_j}->{v} 的路徑段。"
            
            # u -> p_i (0 to first_idx)
            for k in range(first_idx):
                n1, n2 = path[k], path[k+1]
                path_edges_to_add.append({"u": n1, "v": n2})
                nodes_to_add.add(n1)
                nodes_to_add.add(n2)
                
            # p_j -> v (last_idx to end)
            for k in range(last_idx, len(path) - 1):
                n1, n2 = path[k], path[k+1]
                path_edges_to_add.append({"u": n1, "v": n2})
                nodes_to_add.add(n1)
                nodes_to_add.add(n2)

        # Update T
        current_t_nodes.update(nodes_to_add)
        # Avoid duplicate edges
        for pe in path_edges_to_add:
            # Check if edge already exists (undirected)
            exists = False
            for existing in current_t_edges:
                if (existing['u'] == pe['u'] and existing['v'] == pe['v']) or \
                   (existing['u'] == pe['v'] and existing['v'] == pe['u']):
                    exists = True
                    break
            if not exists:
                current_t_edges.append(pe)
                
        steps.append({
            "msg": explanation,
            "graph": {"nodes": nodes, "edges": edges},
            "terminals": terminals,
            "final_tree_edges": copy.deepcopy(current_t_edges),
            "current_path": path, # For highlighting the path being considered
            "phase": "reconstruct_step"
        })

    # Final Step
    total_weight = 0
    # Calculate weight of T
    # We need to look up weights from original edges
    for te in current_t_edges:
        # Find weight in original edges
        for oe in edges:
            if (oe['u'] == te['u'] and oe['v'] == te['v']) or \
               (oe['u'] == te['v'] and oe['v'] == te['u']):
                total_weight += oe['w']
                break

    steps.append({
        "msg": f"Steiner Tree 建構完成。\n總權重: {total_weight}。\n(這是 2-Approximation 結果)",
        "graph": {"nodes": nodes, "edges": edges},
        "terminals": terminals,
        "final_tree_edges": copy.deepcopy(current_t_edges),
        "phase": "complete"
    })
    
    return steps
