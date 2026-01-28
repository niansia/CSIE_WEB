
def solve_min_weight_subset():
    steps = []
    
    # --- Part 1: Positive Weights Proof ---
    # Graph 1: Triangle with positive weights
    nodes_1 = [
        {"id": 0, "label": "a", "x": 200, "y": 300},
        {"id": 1, "label": "b", "x": 400, "y": 100},
        {"id": 2, "label": "c", "x": 600, "y": 300}
    ]
    
    edges_1 = [
        {"u": 0, "v": 1, "w": 2, "id": "e1"},
        {"u": 1, "v": 2, "w": 3, "id": "e2"},
        {"u": 0, "v": 2, "w": 4, "id": "e3"}
    ]
    
    steps.append({
        "type": "intro_positive",
        "nodes": nodes_1,
        "edges": edges_1,
        "msg": "<h3>正權重情況：一定是樹</h3><p>令 H 為一個邊集合，連接所有頂點，且總權重最小。<br>假設所有邊權重都 > 0。</p>"
    })
    
    # Highlight all edges as H (containing a cycle)
    steps.append({
        "type": "show_cycle_positive",
        "nodes": nodes_1,
        "edges": edges_1,
        "highlight_edges": ["e1", "e2", "e3"],
        "msg": "<p>若 H 有一個環 C (例如選了所有邊)。<br>總權重 = 2 + 3 + 4 = 9。</p>"
    })
    
    # Remove an edge
    steps.append({
        "type": "remove_edge_positive",
        "nodes": nodes_1,
        "edges": edges_1,
        "highlight_edges": ["e1", "e2"], # Removed e3
        "removed_edge": {"u": 0, "v": 2, "w": 4},
        "msg": "<p>刪掉環中任一條邊 e (例如權重為 4 的邊)。<br>得到 H' = H - {e}。</p>"
    })
    
    steps.append({
        "type": "conclusion_positive",
        "nodes": nodes_1,
        "edges": edges_1,
        "highlight_edges": ["e1", "e2"],
        "msg": "<p>1. H' 仍然連通 (在環裡刪一條邊不會使圖分裂)。<br>2. 總權重減少了 w(e) = 4 > 0 (新權重 = 5)。<br>這和「H 的總權重最小」矛盾。<br><b>所以 H 不可能含環 => H 必為樹。</b></p>"
    })
    
    # --- Part 2: Non-positive Weights Counterexample ---
    # Graph 2: Triangle with 0 weights
    nodes_2 = [
        {"id": 0, "label": "a", "x": 200, "y": 300},
        {"id": 1, "label": "b", "x": 400, "y": 100},
        {"id": 2, "label": "c", "x": 600, "y": 300}
    ]
    
    edges_2 = [
        {"u": 0, "v": 1, "w": 0, "id": "e1"},
        {"u": 1, "v": 2, "w": 0, "id": "e2"},
        {"u": 0, "v": 2, "w": 0, "id": "e3"}
    ]
    
    steps.append({
        "type": "intro_zero",
        "nodes": nodes_2,
        "edges": edges_2,
        "msg": "<h3>有非正權重時的反例</h3><p>考慮三角形圖，所有邊權重都是 0。</p>"
    })
    
    steps.append({
        "type": "subset_tree",
        "nodes": nodes_2,
        "edges": edges_2,
        "highlight_edges": ["e1", "e2"],
        "msg": "<p>任何兩條邊的總權重 = 0 (例如 {(a,b), (b,c)})。<br>這是樹，且連通。</p>"
    })
    
    steps.append({
        "type": "subset_cycle",
        "nodes": nodes_2,
        "edges": edges_2,
        "highlight_edges": ["e1", "e2", "e3"],
        "msg": "<p>三條邊全選，總權重也 = 0。<br>這個子圖含有環，<b>不是樹</b>，卻仍然是最小總權重的解 (0)。</p>"
    })
    
    steps.append({
        "type": "conclusion_zero",
        "nodes": nodes_2,
        "edges": edges_2,
        "highlight_edges": ["e1", "e2", "e3"],
        "msg": "<p>因此：<br>1. 最小總權重 = 0。<br>2. 「選三條邊」這個解含有環，不是樹。<br><b>所以當允許 w <= 0 時，「最小總權重的連通子圖一定是樹」這句話不再正確。</b></p>"
    })

    # --- Part 3: Negative Weights Counterexample (Optional but good) ---
    edges_3 = [
        {"u": 0, "v": 1, "w": -1, "id": "e1"},
        {"u": 1, "v": 2, "w": -1, "id": "e2"},
        {"u": 0, "v": 2, "w": -1, "id": "e3"}
    ]
    
    steps.append({
        "type": "intro_negative",
        "nodes": nodes_2,
        "edges": edges_3,
        "msg": "<h3>負權重例子</h3><p>如果把權重都改成 -1。</p>"
    })
    
    steps.append({
        "type": "subset_negative_tree",
        "nodes": nodes_2,
        "edges": edges_3,
        "highlight_edges": ["e1", "e2"],
        "msg": "<p>選兩條邊 (樹)，總權重 = -2。</p>"
    })
    
    steps.append({
        "type": "subset_negative_cycle",
        "nodes": nodes_2,
        "edges": edges_3,
        "highlight_edges": ["e1", "e2", "e3"],
        "msg": "<p>選三條邊 (環)，總權重 = -3。<br>最小的是選三條邊，總權重 -3，也不是樹。</p>"
    })
    
    return steps
