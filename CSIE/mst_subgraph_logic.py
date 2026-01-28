
def solve_mst_subgraph():
    steps = []
    
    # Graph definition
    # V' = {0, 1, 2} (a, b, c)
    # V-V' = {3, 4} (d, e)
    nodes = [
        {"id": 0, "label": "a", "x": 300, "y": 100}, # V'
        {"id": 1, "label": "b", "x": 200, "y": 250}, # V'
        {"id": 2, "label": "c", "x": 400, "y": 250}, # V'
        {"id": 3, "label": "d", "x": 200, "y": 400}, # Outside
        {"id": 4, "label": "e", "x": 400, "y": 400}  # Outside
    ]
    
    # Edges in G
    # T edges: (a,b), (a,c), (b,d), (c,e) -> This makes T' connected?
    # T' induced by {a,b,c}: (a,b), (a,c). Connected.
    # G' edges: (a,b), (a,c), (b,c).
    
    edges = [
        {"u": 0, "v": 1, "w": 2, "id": "e1"}, # in T, in T'
        {"u": 0, "v": 2, "w": 3, "id": "e2"}, # in T, in T'
        {"u": 1, "v": 2, "w": 10, "id": "e3"}, # in G', not T
        {"u": 1, "v": 3, "w": 4, "id": "e4"}, # in T
        {"u": 2, "v": 4, "w": 5, "id": "e5"}, # in T
        {"u": 3, "v": 4, "w": 8, "id": "e6"}  # not T
    ]
    
    t_edges = ["e1", "e2", "e4", "e5"]
    t_prime_edges = ["e1", "e2"]
    v_prime_ids = [0, 1, 2]
    
    # Step 1: Show G and MST T
    steps.append({
        "type": "intro",
        "nodes": nodes,
        "edges": edges,
        "highlight_edges": t_edges,
        "msg": "<h3>23.1-9 MST Subgraph Proof</h3><p>給定圖 G 和其最小生成樹 T (藍色邊)。<br>T 是 G 的 MST。</p>"
    })
    
    # Step 2: Define V' and T'
    steps.append({
        "type": "define_subgraph",
        "nodes": nodes,
        "edges": edges,
        "highlight_edges": t_edges,
        "highlight_nodes": v_prime_ids,
        "subgraph_edges": t_prime_edges, # Special highlight for T'
        "msg": "<p>令 V' 為頂點子集 {a, b, c} (黃色)。<br>令 T' 為 T 在 V' 上的導出子圖 (粗藍線)。<br>已知 T' 是連通的。</p>"
    })
    
    # Step 3: Define G'
    steps.append({
        "type": "define_g_prime",
        "nodes": nodes,
        "edges": edges,
        "highlight_nodes": v_prime_ids,
        "g_prime_edges": ["e1", "e2", "e3"], # Edges in G induced by V'
        "msg": "<p>令 G' 為 G 在 V' 上的導出子圖。<br>G' 包含 V' 中所有的邊：{(a,b), (a,c), (b,c)}。</p>"
    })
    
    # Step 4: Assumption (Contradiction)
    # Hypothetical S'
    steps.append({
        "type": "assumption",
        "nodes": nodes,
        "edges": edges,
        "highlight_nodes": v_prime_ids,
        "highlight_edges": ["e4", "e5"], # Rest of T
        "hypothetical_s_prime": ["e1", "e3"], # Assume this is better than T' (e1, e2)
        # Visually we show S' replacing T'
        "msg": "<p><b>反證法：</b>假設 T' 不是 G' 的 MST。<br>則存在 G' 的生成樹 S' (例如綠色虛線)，使得 w(S') < w(T')。</p>"
    })
    
    # Step 5: Construct S
    steps.append({
        "type": "construction",
        "nodes": nodes,
        "edges": edges,
        "highlight_edges": ["e4", "e5"], # T - T'
        "hypothetical_s_prime": ["e1", "e3"], # S'
        "msg": "<p>構造新的樹 S = (T - T') ∪ S'。<br>也就是把 T 裡面的 T' 換成 S'。</p>"
    })
    
    # Step 6: Verify S is a tree
    steps.append({
        "type": "verification",
        "nodes": nodes,
        "edges": edges,
        "highlight_edges": ["e4", "e5"],
        "hypothetical_s_prime": ["e1", "e3"],
        "msg": "<p>因為 T 原本是樹：<br>1. V' 以外的部分保持連通且無環。<br>2. S' 在 V' 內也是樹。<br>3. 兩部分連接方式不變。<br>=> S 仍然是 G 的生成樹。</p>"
    })
    
    # Step 7: Conclusion
    steps.append({
        "type": "conclusion",
        "nodes": nodes,
        "edges": edges,
        "highlight_edges": t_edges, # Show original T again
        "msg": "<p>計算權重：<br>w(S) = w(T) - w(T') + w(S')。<br>因為假設 w(S') < w(T')，所以 w(S) < w(T)。<br>這與 T 是 MST 矛盾！<br><b>故假設錯誤，T' 必為 G' 的 MST。</b></p>"
    })
    
    return steps
