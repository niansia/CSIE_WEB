
def solve_mst_reduce_weight():
    steps = []
    
    # Graph definition
    # Nodes: 0:a, 1:b, 2:c, 3:d
    nodes = [
        {"id": 0, "label": "a", "x": 200, "y": 200},
        {"id": 1, "label": "b", "x": 400, "y": 100},
        {"id": 2, "label": "c", "x": 600, "y": 200},
        {"id": 3, "label": "d", "x": 400, "y": 300}
    ]
    
    # Edges
    # T edges: (a,b), (b,c), (c,d) -> w=10 each
    # Non-T edges: (a,d) w=20, (b,d) w=15
    edges = [
        {"u": 0, "v": 1, "w": 10, "id": "e1"}, # T, target edge
        {"u": 1, "v": 2, "w": 10, "id": "e2"}, # T
        {"u": 2, "v": 3, "w": 10, "id": "e3"}, # T
        {"u": 0, "v": 3, "w": 20, "id": "e4"}, # Non-T
        {"u": 1, "v": 3, "w": 15, "id": "e5"}  # Non-T
    ]
    
    t_edges = ["e1", "e2", "e3"]
    target_edge_id = "e1"
    k = 5
    
    # Step 1: Intro
    steps.append({
        "type": "intro",
        "nodes": nodes,
        "edges": edges,
        "highlight_edges": t_edges,
        "msg": "<h3>23.1-10 MST Weight Reduction Proof</h3><p>給定圖 G 和最小生成樹 T (藍色邊)。<br>假設我們減少 T 中某條邊 (x,y) 的權重。</p>"
    })
    
    # Step 2: Reduce Weight
    edges_reduced = [e.copy() for e in edges]
    edges_reduced[0]["w"] = 10 - k # e1 weight becomes 5
    
    steps.append({
        "type": "reduce_weight",
        "nodes": nodes,
        "edges": edges_reduced,
        "highlight_edges": t_edges,
        "target_edge": target_edge_id,
        "msg": f"<p>選定邊 (a,b) $\in$ T，將其權重減少 k={k}。<br>新權重 w'(a,b) = 10 - 5 = 5。<br>T 的新總權重 w'(T) = w(T) - k。</p>"
    })
    
    # Step 3: Case 1 (S not containing e)
    # S1 = {(a,d), (b,c), (c,d)}
    s1_edges = ["e4", "e2", "e3"]
    
    steps.append({
        "type": "case_1",
        "nodes": nodes,
        "edges": edges_reduced,
        "highlight_edges": t_edges, # Show T for comparison
        "compare_edges": s1_edges,  # Show S1
        "msg": "<p><b>情況 1：</b>考慮不包含 (a,b) 的生成樹 S (綠色虛線)。<br>w'(S) = w(S) (因為沒用到變輕的邊)。<br>w'(T) = w(T) - k。<br>因為 w(T) $\le$ w(S)，所以 <b>w'(T) < w'(S)</b>。</p>"
    })
    
    # Step 4: Case 2 (S containing e)
    # S2 = {(a,b), (b,d), (c,d)}
    s2_edges = ["e1", "e5", "e3"]
    
    steps.append({
        "type": "case_2",
        "nodes": nodes,
        "edges": edges_reduced,
        "highlight_edges": t_edges,
        "compare_edges": s2_edges,
        "msg": "<p><b>情況 2：</b>考慮包含 (a,b) 的生成樹 S (綠色虛線)。<br>w'(S) = w(S) - k (兩邊都減 k)。<br>w'(T) = w(T) - k。<br>因為 w(T) $\le$ w(S)，所以 <b>w'(T) $\le$ w'(S)</b>。</p>"
    })
    
    # Step 5: Conclusion
    steps.append({
        "type": "conclusion",
        "nodes": nodes,
        "edges": edges_reduced,
        "highlight_edges": t_edges,
        "msg": "<p>結論：<br>無論 S 是否包含該邊，T 在新權重 w' 下的總權重仍然小於等於 S。<br><b>所以 T 仍然是 G 的最小生成樹。</b></p>"
    })
    
    return steps
