import random

def solve_viterbi():
    # Define a graph G = (V, E)
    # V = {v0, v1, v2, v3, v4}
    # Edges with labels (sound) and probabilities
    # Sounds: 'a', 'b', 'c'
    
    nodes = ['v0', 'v1', 'v2', 'v3', 'v4']
    edges = [
        {'u': 'v0', 'v': 'v1', 'label': 'a', 'prob': 0.6},
        {'u': 'v0', 'v': 'v2', 'label': 'a', 'prob': 0.4},
        {'u': 'v1', 'v': 'v2', 'label': 'b', 'prob': 0.7},
        {'u': 'v1', 'v': 'v3', 'label': 'b', 'prob': 0.3},
        {'u': 'v2', 'v': 'v3', 'label': 'b', 'prob': 0.5},
        {'u': 'v2', 'v': 'v4', 'label': 'c', 'prob': 0.5},
        {'u': 'v3', 'v': 'v4', 'label': 'c', 'prob': 0.9},
        {'u': 'v3', 'v': 'v1', 'label': 'a', 'prob': 0.1},
        {'u': 'v4', 'v': 'v0', 'label': 'a', 'prob': 1.0}
    ]
    
    # Target sequence of sounds
    target_sequence = ['a', 'b', 'c']
    k = len(target_sequence)
    
    steps = []
    
    # Part (a): Reachability
    # reachable[i][v] = boolean
    # predecessor[i][v] = u
    
    # Initialize with None to indicate "not yet computed"
    reachable = [[None] * len(nodes) for _ in range(k + 1)]
    predecessor_a = [[None] * len(nodes) for _ in range(k + 1)]
    
    # Init t=0
    reachable[0] = [False] * len(nodes)
    v0_idx = 0 # v0
    reachable[0][v0_idx] = True
    
    steps.append({
        "type": "init",
        "part": "a",
        "nodes": nodes,
        "edges": edges,
        "target": target_sequence,
        "reachable": [row[:] if row is not None else None for row in reachable],
        "msg": f"初始化 (Part A): 設定起點 v0 在時間 t=0 為可達 (True)。目標聲音序列: {target_sequence}"
    })
    
    for i in range(1, k + 1):
        target_sound = target_sequence[i-1]
        
        # Initialize current row with False
        reachable[i] = [False] * len(nodes)
        
        steps.append({
            "type": "start_time",
            "part": "a",
            "i": i,
            "sound": target_sound,
            "reachable": [row[:] if row is not None else None for row in reachable],
            "msg": f"<strong>開始時間 t={i}, 目標聲音: '{target_sound}'</strong><br>準備計算此時間步的可達性。"
        })
        
        for edge in edges:
            u_idx = nodes.index(edge['u'])
            v_idx = nodes.index(edge['v'])
            
            # Only check edges from reachable nodes
            if reachable[i-1][u_idx]:
                steps.append({
                    "type": "check_edge",
                    "part": "a",
                    "i": i,
                    "u": edge['u'],
                    "v": edge['v'],
                    "label": edge['label'],
                    "target": target_sound,
                    "reachable": [row[:] if row is not None else None for row in reachable],
                    "msg": f"檢查邊 {edge['u']} → {edge['v']} (標記: {edge['label']})..."
                })
                
                if edge['label'] == target_sound:
                    reachable[i][v_idx] = True
                    predecessor_a[i][v_idx] = u_idx
                    
                    steps.append({
                        "type": "update",
                        "part": "a",
                        "i": i,
                        "u": edge['u'],
                        "v": edge['v'],
                        "reachable": [row[:] if row is not None else None for row in reachable],
                        "msg": f"標記 '{edge['label']}' 符合目標 '{target_sound}'!<br>→ 更新: 節點 {edge['v']} 在 t={i} 變為可達。"
                    })
                else:
                     steps.append({
                        "type": "mismatch",
                        "part": "a",
                        "i": i,
                        "u": edge['u'],
                        "v": edge['v'],
                        "label": edge['label'],
                        "target": target_sound,
                        "reachable": [row[:] if row is not None else None for row in reachable],
                        "msg": f"標記 '{edge['label']}' 不符合目標 '{target_sound}'。忽略。"
                    })

    # Reconstruct path for (a)
    path_a = []
    found_end_node = -1
    for v_idx in range(len(nodes)):
        if reachable[k][v_idx]:
            found_end_node = v_idx
            break
            
    if found_end_node != -1:
        curr = found_end_node
        path_a.append(nodes[curr])
        for i in range(k, 0, -1):
            pred = predecessor_a[i][curr]
            if pred is not None:
                path_a.append(nodes[pred])
                curr = pred
        path_a.reverse()
        msg_a = f"找到路徑: {' -> '.join(path_a)}"
    else:
        msg_a = "NO-SUCH-PATH"

    steps.append({
        "type": "result_a",
        "part": "a",
        "path": path_a,
        "msg": f"Part A 完成。{msg_a}"
    })

    # Part (b): Viterbi (Max Probability)
    # P[i][v] = max prob
    # pred[i][v] = u
    
    P = [[None] * len(nodes) for _ in range(k + 1)]
    pred_b = [[None] * len(nodes) for _ in range(k + 1)]
    
    # Init
    P[0] = [0.0] * len(nodes)
    P[0][v0_idx] = 1.0
    
    steps.append({
        "type": "init_b",
        "part": "b",
        "P": [row[:] if row is not None else None for row in P],
        "msg": "初始化 (Part B): 設定起點 v0 在時間 t=0 機率為 1.0。其他為 0。"
    })
    
    for i in range(1, k + 1):
        target_sound = target_sequence[i-1]
        P[i] = [0.0] * len(nodes)
        
        steps.append({
            "type": "start_time",
            "part": "b",
            "i": i,
            "sound": target_sound,
            "P": [row[:] if row is not None else None for row in P],
            "msg": f"<strong>開始時間 t={i}, 目標聲音: '{target_sound}'</strong><br>準備計算此時間步的最大機率。"
        })
        
        for edge in edges:
            u_idx = nodes.index(edge['u'])
            v_idx = nodes.index(edge['v'])
            
            if P[i-1][u_idx] is not None and P[i-1][u_idx] > 0:
                steps.append({
                    "type": "check_edge",
                    "part": "b",
                    "i": i,
                    "u": edge['u'],
                    "v": edge['v'],
                    "label": edge['label'],
                    "target": target_sound,
                    "P": [row[:] if row is not None else None for row in P],
                    "msg": f"檢查邊 {edge['u']} → {edge['v']} (標記: {edge['label']})..."
                })
                
                if edge['label'] == target_sound:
                    prev_prob = P[i-1][u_idx]
                    edge_prob = edge['prob']
                    prob = prev_prob * edge_prob
                    
                    steps.append({
                        "type": "calc",
                        "part": "b",
                        "i": i,
                        "u": edge['u'],
                        "v": edge['v'],
                        "P": [row[:] if row is not None else None for row in P],
                        "msg": f"計算機率: $P[{i-1}][{edge['u']}] \\times p({edge['u']},{edge['v']})$<br>= {prev_prob:.2f} × {edge_prob}<br>= <strong>{prob:.4f}</strong>"
                    })
                    
                    if prob > P[i][v_idx]:
                        old_prob = P[i][v_idx]
                        P[i][v_idx] = prob
                        pred_b[i][v_idx] = u_idx
                        
                        steps.append({
                            "type": "update",
                            "part": "b",
                            "i": i,
                            "u": edge['u'],
                            "v": edge['v'],
                            "P": [row[:] if row is not None else None for row in P],
                            "msg": f"新機率 {prob:.4f} > 目前 {old_prob:.4f}。<br>→ 更新 $P[{i}][{edge['v']}]$ = {prob:.4f}。"
                        })
                    else:
                        steps.append({
                            "type": "no_update",
                            "part": "b",
                            "i": i,
                            "u": edge['u'],
                            "v": edge['v'],
                            "P": [row[:] if row is not None else None for row in P],
                            "msg": f"新機率 {prob:.4f} <= 目前 {P[i][v_idx]:.4f}。<br>→ 不更新。"
                        })
                else:
                     steps.append({
                        "type": "mismatch",
                        "part": "b",
                        "i": i,
                        "u": edge['u'],
                        "v": edge['v'],
                        "label": edge['label'],
                        "target": target_sound,
                        "P": [row[:] if row is not None else None for row in P],
                        "msg": f"標記 '{edge['label']}' 不符合目標 '{target_sound}'。忽略。"
                    })

    # Reconstruct path for (b)
    path_b = []
    best_end_node = -1
    max_prob = -1.0
    
    # Check last row k
    if P[k] is not None:
        for v_idx in range(len(nodes)):
            if P[k][v_idx] is not None and P[k][v_idx] > max_prob:
                max_prob = P[k][v_idx]
                best_end_node = v_idx
            
    if best_end_node != -1 and max_prob > 0:
        curr = best_end_node
        path_b.append(nodes[curr])
        for i in range(k, 0, -1):
            pred = pred_b[i][curr]
            if pred is not None:
                path_b.append(nodes[pred])
                curr = pred
        path_b.reverse()
        msg_b = f"最可能路徑: {' -> '.join(path_b)} (機率: {max_prob:.4f})"
    else:
        msg_b = "無路徑"
        
    steps.append({
        "type": "result_b",
        "part": "b",
        "path": path_b,
        "prob": max_prob,
        "msg": f"Part B 完成。{msg_b}"
    })
    
    return steps
