def solve_unique_mst():
    steps = []
    
    # Graph definition
    # 0: a, 1: b, 2: c
    nodes = [
        {"id": 0, "label": "a", "x": 100, "y": 300},
        {"id": 1, "label": "b", "x": 300, "y": 100},
        {"id": 2, "label": "c", "x": 500, "y": 300}
    ]
    
    edges = [
        {"u": 0, "v": 1, "w": 1},
        {"u": 1, "v": 2, "w": 1},
        {"u": 0, "v": 2, "w": 2}
    ]
    
    # Step 0: Init
    steps.append({
        "type": "init",
        "nodes": nodes,
        "edges": edges,
        "msg": "考慮只有三個頂點的三角形圖 G。<br>頂點: a, b, c。<br>邊權重: (a,b)=1, (b,c)=1, (a,c)=2。"
    })
    
    # Step 1: Show all Spanning Trees
    steps.append({
        "type": "show_mst",
        "nodes": nodes,
        "edges": edges,
        "mst_edges": [{"u": 0, "v": 1}, {"u": 1, "v": 2}],
        "msg": "找出最小生成樹 (MST)。<br>選項 1: {(a,b), (b,c)}, 權重 = 1+1 = 2。<br>選項 2: {(a,b), (a,c)}, 權重 = 1+2 = 3。<br>選項 3: {(b,c), (a,c)}, 權重 = 1+2 = 3。<br>因此 MST 唯一: {(a,b), (b,c)}。"
    })
    
    # Step 2: Define Cut
    # Cut ({b}, {a,c})
    steps.append({
        "type": "show_cut",
        "nodes": nodes,
        "edges": edges,
        "cut_nodes": [1], # b
        "other_nodes": [0, 2], # a, c
        "msg": "現在考慮一個割 (Cut) (S, V-S)。<br>令 S = {b}, V-S = {a, c}。"
    })
    
    # Step 3: Show Crossing Edges
    steps.append({
        "type": "show_crossing",
        "nodes": nodes,
        "edges": edges,
        "cut_nodes": [1],
        "crossing_edges": [
            {"u": 0, "v": 1, "w": 1},
            {"u": 1, "v": 2, "w": 1}
        ],
        "msg": "找出跨越此割的邊：<br>1. (a, b) 權重 1。<br>2. (b, c) 權重 1。<br>這兩條邊都是跨越此割的「輕邊」(Light Edge)。"
    })
    
    # Step 4: Conclusion
    steps.append({
        "type": "conclusion",
        "nodes": nodes,
        "edges": edges,
        "cut_nodes": [1],
        "crossing_edges": [
            {"u": 0, "v": 1, "w": 1},
            {"u": 1, "v": 2, "w": 1}
        ],
        "msg": "結論：<br>雖然此圖有唯一的 MST，但在這個割上，輕邊並不唯一 (有兩條權重皆為 1)。<br>因此反向敘述「若 MST 唯一，則每個割都有唯一輕邊」不成立。"
    })
    
    return steps
