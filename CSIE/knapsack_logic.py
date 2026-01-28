
def solve_knapsack(capacity, items):
    # items: list of {'w': int, 'v': int}
    # dp table size: (len(items) + 1) x (capacity + 1)
    n = len(items)
    # Initialize DP table with 0
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    steps = []

    # Initial empty state (all zeros)
    steps.append({
        "table": [row[:] for row in dp],
        "items": items,
        "capacity": capacity,
        "current": None,
        "highlights": [],
        "msg": "初始化 DP 表格，大小為 (物品數+1) x (容量+1)，所有值設為 0。"
    })

    for i in range(1, n + 1):
        item = items[i-1]
        w_item = int(item['w'])
        v_item = int(item['v'])
        
        for w in range(capacity + 1): # Include 0 capacity column
            if w == 0:
                dp[i][w] = 0
                continue

            # Logic
            val_exclude = dp[i-1][w]
            val_include = -1
            
            msg = ""
            highlight_cells = [] # list of {r, c, color, label}
            
            # Current cell being calculated
            current_cell = {"r": i, "c": w}
            
            if w_item > w:
                dp[i][w] = val_exclude
                msg = f"物品 {i} (重:{w_item}, 價:{v_item}) > 背包容量 {w}。\n無法放入，繼承上方數值。\ndp[{i}][{w}] = dp[{i-1}][{w}] = {val_exclude}"
                highlight_cells.append({"r": i-1, "c": w, "color": "#aaddff", "label": "不放"}) # Blue-ish
            else:
                val_include = v_item + dp[i-1][w - w_item]
                
                highlight_cells.append({"r": i-1, "c": w, "color": "#aaddff", "label": f"不放: {val_exclude}"})
                highlight_cells.append({"r": i-1, "c": w - w_item, "color": "#aaffaa", "label": f"放入: {val_include}"})
                
                if val_include > val_exclude:
                    dp[i][w] = val_include
                    msg = f"物品 {i} (重:{w_item}, 價:{v_item}) 可以放入。\n比較：\n不放 = {val_exclude}\n放入 = {v_item} + dp[{i-1}][{w-w_item}] = {val_include}\n因為 {val_include} > {val_exclude}，選擇放入。"
                else:
                    dp[i][w] = val_exclude
                    msg = f"物品 {i} (重:{w_item}, 價:{v_item}) 可以放入。\n比較：\n不放 = {val_exclude}\n放入 = {v_item} + dp[{i-1}][{w-w_item}] = {val_include}\n因為 {val_exclude} >= {val_include}，選擇不放。"

            steps.append({
                "table": [row[:] for row in dp], # Copy
                "items": items,
                "capacity": capacity,
                "current": current_cell,
                "highlights": highlight_cells,
                "msg": msg
            })
            
    steps.append({
        "table": [row[:] for row in dp],
        "items": items,
        "capacity": capacity,
        "current": None,
        "highlights": [],
        "msg": f"計算完成。最大價值為 {dp[n][capacity]}。"
    })
    
    return steps
