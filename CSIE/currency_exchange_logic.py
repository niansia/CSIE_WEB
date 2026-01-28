
def generate_proof_steps():
    steps = []
    
    # Phase 1: Optimal Substructure (ck = 0)
    # We use a conceptual graph here, not specific numbers
    steps.append({
        "phase": "1",
        "step": 1,
        "title": "情況一：無手續費 (ck = 0)",
        "msg": "假設我們有一條從貨幣 1 到 n 的最佳兌換路徑 P*，中間經過貨幣 i。",
        "graph": {
            "nodes": [
                {"id": 1, "x": 100, "y": 200, "label": "1"},
                {"id": "i", "x": 400, "y": 200, "label": "i"},
                {"id": "n", "x": 700, "y": 200, "label": "n"}
            ],
            "edges": [
                {"from": 1, "to": "i", "label": "P1", "style": "solid"},
                {"from": "i", "to": "n", "label": "P2", "style": "solid"}
            ]
        },
        "math": r"P^* : 1 \xrightarrow{P_1} i \xrightarrow{P_2} n"
    })

    steps.append({
        "phase": "1",
        "step": 2,
        "title": "最佳子結構證明",
        "msg": "若 P1 不是從 1 到 i 的最佳路徑，則存在另一條更佳路徑 P1'。",
        "graph": {
            "nodes": [
                {"id": 1, "x": 100, "y": 200, "label": "1"},
                {"id": "i", "x": 400, "y": 200, "label": "i"},
                {"id": "n", "x": 700, "y": 200, "label": "n"}
            ],
            "edges": [
                {"from": 1, "to": "i", "label": "P1", "style": "solid", "color": "#999"},
                {"from": 1, "to": "i", "label": "P1'", "style": "dashed", "color": "red", "curve": -50},
                {"from": "i", "to": "n", "label": "P2", "style": "solid"}
            ]
        },
        "math": r"\prod_{(u \to v) \in P'_1} r_{uv} > \prod_{(u \to v) \in P_1} r_{uv}"
    })

    steps.append({
        "phase": "1",
        "step": 3,
        "title": "矛盾產生",
        "msg": "用 P1' 取代 P1，我們會得到一條比 P* 更好的路徑，這與 P* 是最佳解矛盾。因此 P1 必須是最佳路徑。",
        "graph": {
            "nodes": [
                {"id": 1, "x": 100, "y": 200, "label": "1"},
                {"id": "i", "x": 400, "y": 200, "label": "i"},
                {"id": "n", "x": 700, "y": 200, "label": "n"}
            ],
            "edges": [
                {"from": 1, "to": "i", "label": "P1'", "style": "solid", "color": "red", "curve": -50},
                {"from": "i", "to": "n", "label": "P2", "style": "solid"}
            ]
        },
        "math": r"\text{Total}(P'_1 + P_2) > \text{Total}(P^*) \implies \text{Contradiction!}"
    })

    # Phase 2: Counterexample (ck arbitrary)
    # Graph: 1 -> 2 (2), 1 -> 3 (10), 3 -> 2 (10), 2 -> 4 (2)
    # c1=0, c2=0, c3=200
    
    nodes = [
        {"id": 1, "x": 100, "y": 200, "label": "1"},
        {"id": 2, "x": 400, "y": 200, "label": "2"},
        {"id": 3, "x": 250, "y": 100, "label": "3"},
        {"id": 4, "x": 700, "y": 200, "label": "4"}
    ]
    
    edges = [
        {"from": 1, "to": 2, "weight": 2, "label": "x2"},
        {"from": 1, "to": 3, "weight": 10, "label": "x10"},
        {"from": 3, "to": 2, "weight": 10, "label": "x10"},
        {"from": 2, "to": 4, "weight": 2, "label": "x2"}
    ]

    commissions = "c1=0, c2=0, c3=200"

    steps.append({
        "phase": "2",
        "step": 1,
        "title": "情況二：有手續費 (ck 任意)",
        "msg": f"考慮反例：手續費 {commissions}。目標是從 1 換到 4。",
        "graph": {"nodes": nodes, "edges": edges},
        "math": r"\text{Value} = d \cdot (\prod r_{ij}) - c_k"
    })

    # Path P: 1->2->4
    steps.append({
        "phase": "2",
        "step": 2,
        "title": "計算路徑 P: 1 -> 2 -> 4",
        "msg": "路徑 P 經過 2 次交易 (k=2)。",
        "graph": {"nodes": nodes, "edges": edges},
        "highlight_path": [1, 2, 4],
        "math": r"1 \cdot 2 \cdot 2 - c_2 = 4 - 0 = 4"
    })

    # Path Q: 1->3->2->4
    steps.append({
        "phase": "2",
        "step": 3,
        "title": "計算路徑 Q: 1 -> 3 -> 2 -> 4",
        "msg": "路徑 Q 經過 3 次交易 (k=3)。",
        "graph": {"nodes": nodes, "edges": edges},
        "highlight_path": [1, 3, 2, 4],
        "math": r"1 \cdot 10 \cdot 10 \cdot 2 - c_3 = 200 - 200 = 0"
    })

    steps.append({
        "phase": "2",
        "step": 4,
        "title": "整體最佳解",
        "msg": "比較 P 和 Q，路徑 P (收益 4) 是從 1 到 4 的最佳解。",
        "graph": {"nodes": nodes, "edges": edges},
        "highlight_path": [1, 2, 4],
        "math": r"P^* = 1 \to 2 \to 4"
    })

    # Subproblem 1->2
    steps.append({
        "phase": "2",
        "step": 5,
        "title": "檢查子問題: 1 到 2",
        "msg": "現在看 P* 的前半段：從 1 到 2 的最佳解是什麼？",
        "graph": {"nodes": nodes, "edges": edges},
        "highlight_path": [1, 2],
        "math": r"\text{Sub-path}: 1 \to 2"
    })

    steps.append({
        "phase": "2",
        "step": 6,
        "title": "子問題比較",
        "msg": "直接 1->2 (1次交易): 收益 2。經由 3 (1->3->2, 2次交易): 收益 100。",
        "graph": {"nodes": nodes, "edges": edges},
        "highlight_path": [1, 3, 2],
        "math": r"1 \to 2: 1 \cdot 2 - c_1 = 2 \\ 1 \to 3 \to 2: 1 \cdot 10 \cdot 10 - c_2 = 100"
    })

    steps.append({
        "phase": "2",
        "step": 7,
        "title": "結論",
        "msg": "子問題的最佳解 (1->3->2) 並不是整體最佳解 (1->2->4) 的一部分。因此不具備最佳子結構。",
        "graph": {"nodes": nodes, "edges": edges},
        "highlight_path": [1, 3, 2],
        "math": r"\text{Optimal}(1 \to 2) \not\subset \text{Optimal}(1 \to 4)"
    })

    return steps
