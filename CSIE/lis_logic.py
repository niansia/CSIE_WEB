
import random

def generate_lis_steps():
    # Generate random sequence
    n = 10
    a = [random.randint(1, 50) for _ in range(n)]
    
    steps = []
    
    # tails[i] stores the index k of the smallest ending element of an increasing subsequence of length i+1.
    tails = [] # stores indices
    pred = [-1] * n
    
    steps.append({
        "a": a,
        "tails_values": [],
        "tails_indices": [],
        "pred": pred,
        "msg": "初始化: 產生隨機數列 a。準備 tails 陣列 (儲存 index) 與 pred 陣列 (儲存前驅 index)。",
        "highlight": {}
    })
    
    for k in range(n):
        val = a[k]
        
        # Binary Search: Find first element in tails that is >= val
        # This corresponds to finding the longest prefix of tails where all elements are < val.
        
        l, r = 0, len(tails)
        while l < r:
            mid = (l + r) // 2
            if a[tails[mid]] < val:
                l = mid + 1
            else:
                r = mid
        
        idx = l # Insertion point (0-based index in tails, corresponds to length idx+1)
        
        # Prepare info for visualization
        current_tails_values = [a[i] for i in tails]
        
        msg_search = f"處理 a[{k}] = {val}。\n在 tails 中二分搜尋...\n"
        if idx < len(tails):
            msg_search += f"找到第一個 >= {val} 的值是 {a[tails[idx]]} (位於 tails[{idx}])。"
        else:
            msg_search += f"所有 tails 元素都 < {val} (或 tails 為空)。"
            
        steps.append({
            "a": a,
            "tails_values": current_tails_values,
            "tails_indices": tails[:],
            "pred": pred[:],
            "msg": msg_search,
            "highlight": {"type": "search", "index": k, "target_idx": idx}
        })
        
        # Update logic
        if idx < len(tails):
            old_index = tails[idx]
            old_val = a[old_index]
            msg_update = f"更新 tails[{idx}]: 將 {old_val} (index {old_index}) 替換為 {val} (index {k})。\n長度 {idx+1} 的子序列現在以更小的 {val} 結尾，更有利於後續延伸。"
        else:
            msg_update = f"擴充 LIS: 將 {val} (index {k}) 加到 tails 末端。\n現在發現了長度為 {idx+1} 的遞增子序列。"
            
        # Apply update
        if idx < len(tails):
            tails[idx] = k
        else:
            tails.append(k)
        
        if idx > 0:
            pred[k] = tails[idx-1]
        else:
            pred[k] = -1
            
        steps.append({
            "a": a,
            "tails_values": [a[i] for i in tails],
            "tails_indices": tails[:],
            "pred": pred[:],
            "msg": msg_update,
            "highlight": {"type": "update", "index": k, "tail_idx": idx}
        })

    # Backtracking
    if tails:
        lis_len = len(tails)
        curr = tails[-1]
        path = []
        while curr != -1:
            path.append(curr)
            curr = pred[curr]
        
        path.reverse()
        lis_vals = [a[i] for i in path]
        
        steps.append({
            "a": a,
            "tails_values": [a[i] for i in tails],
            "tails_indices": tails[:],
            "pred": pred[:],
            "msg": f"掃描結束。LIS 長度為 {lis_len}。\n從 tails 最後一個元素 (index {tails[-1]}) 開始，沿著 pred 回朔找出完整序列。",
            "highlight": {"type": "backtrack", "path": path}
        })
        
        steps.append({
            "a": a,
            "tails_values": [a[i] for i in tails],
            "tails_indices": tails[:],
            "pred": pred[:],
            "msg": f"最終 LIS: {lis_vals}",
            "highlight": {"type": "final", "path": path}
        })
    else:
        steps.append({
            "a": a,
            "tails_values": [],
            "tails_indices": [],
            "pred": pred[:],
            "msg": "序列為空。",
            "highlight": {}
        })
    
    return steps
