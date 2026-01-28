def solve_rod_cutting(n, prices):
    # prices: list of integers where prices[i] is the price of a rod of length i+1
    # n: total length of the rod
    
    # Initialize DP arrays
    # r[j] stores the max revenue for rod of length j
    # s[j] stores the optimal first cut size for rod of length j
    r = [0] * (n + 1)
    s = [0] * (n + 1)
    
    steps = []
    
    # Step 0: Initialization
    steps.append({
        "prices": list(prices), # Add prices to step
        "r": list(r),
        "s": list(s),
        "j": -1,
        "i": -1,
        "q": -1,
        "msg": "初始化 r 和 s 陣列。r[0] = 0。",
        "highlight": []
    })
    
    # Outer loop: solve for length j = 1 to n
    for j in range(1, n + 1):
        q = -1
        best_cut = 0
        
        steps.append({
            "prices": list(prices),
            "r": list(r),
            "s": list(s),
            "j": j,
            "i": -1,
            "q": q,
            "msg": f"開始計算長度 j = {j} 的最佳解。",
            "highlight": [{"index": j, "type": "target"}]
        })
        
        # Inner loop: try first cut at position i = 1 to j
        for i in range(1, j + 1):
            # prices is 0-indexed, so price of length i is prices[i-1]
            if i-1 < len(prices):
                p_i = prices[i-1]
            else:
                p_i = 0 # Should not happen if input is correct
                
            remainder_val = r[j-i]
            current_val = p_i + remainder_val
            
            msg = f"考慮第一刀切在 i={i} (價格 p[{i}]={p_i}) + 剩餘 r[{j-i}]={remainder_val} = {current_val}"
            
            highlight = [
                {"index": j, "type": "target"},
                {"index": j-i, "type": "remainder"}
            ]
            
            updated = False
            if current_val > q:
                q = current_val
                best_cut = i
                updated = True
                msg += f"。\n發現更大值！更新 q = {q}，最佳切點 s[{j}] 暫定為 {i}。"
            else:
                msg += f"。\n比當前 q={q} 小或相等，不更新。"
                
            steps.append({
                "prices": list(prices),
                "r": list(r),
                "s": list(s),
                "j": j,
                "i": i,
                "p_i": p_i,
                "r_remainder": remainder_val,
                "current_val": current_val,
                "q": q,
                "best_cut": best_cut,
                "updated": updated,
                "msg": msg,
                "highlight": highlight
            })
            
        r[j] = q
        s[j] = best_cut
        
        steps.append({
            "prices": list(prices),
            "r": list(r),
            "s": list(s),
            "j": j,
            "i": -1,
            "q": q,
            "msg": f"長度 j={j} 計算完成。最大收益 r[{j}] = {q}，最佳第一刀 s[{j}] = {best_cut}。",
            "highlight": [{"index": j, "type": "final"}]
        })
        
    # Final step
    steps.append({
        "prices": list(prices),
        "r": list(r),
        "s": list(s),
        "j": -1,
        "i": -1,
        "q": r[n],
        "msg": f"計算完成。長度 {n} 的最大收益為 {r[n]}。",
        "highlight": [{"index": n, "type": "final"}]
    })
    
    return steps
