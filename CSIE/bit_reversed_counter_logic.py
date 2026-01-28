def solve_bit_reversed_counter():
    k = 4
    n = 1 << k
    steps = []
    
    # Initial array
    arr = list(range(n))
    
    steps.append({
        "type": "init",
        "k": k,
        "n": n,
        "arr": arr[:],
        "msg": f"初始化陣列 A，長度 n = 2^{k} = {n}。索引為 0 到 {n-1}。"
    })
    
    # Bit-reversed counter value
    y = 0
    
    for x in range(n):
        # Current state
        steps.append({
            "type": "check",
            "x": x,
            "y": y,
            "arr": arr[:],
            "msg": f"當前索引 x = {x} (二進位 {format(x, '0'+str(k)+'b')})。<br>Bit-reversed 計數器 y = {y} (二進位 {format(y, '0'+str(k)+'b')})。"
        })
        
        if y > x:
            arr[x], arr[y] = arr[y], arr[x]
            steps.append({
                "type": "swap",
                "x": x,
                "y": y,
                "arr": arr[:],
                "msg": f"因為 y ({y}) > x ({x})，交換 A[{x}] 與 A[{y}]。"
            })
        
        # Increment y (Bit-reversed increment)
        if x < n - 1:
            # Simulate BIT-REVERSED-INCREMENT(y)
            # i goes from k-1 down to 0
            
            temp_y = y
            i = k - 1
            
            # Record the bits being flipped
            # We want to show the scanning process
            
            scan_steps = []
            
            curr_scan_y = y
            while i >= 0 and (curr_scan_y & (1 << i)):
                # Bit i is 1, flip to 0
                curr_scan_y &= ~(1 << i)
                scan_steps.append({"bit": i, "action": "flip_to_0", "current_val": curr_scan_y})
                i -= 1
            
            if i >= 0:
                # Bit i is 0, flip to 1
                curr_scan_y |= (1 << i)
                scan_steps.append({"bit": i, "action": "flip_to_1", "current_val": curr_scan_y})
            
            steps.append({
                "type": "increment",
                "prev_y": y,
                "new_y": curr_scan_y,
                "scan_steps": scan_steps,
                "msg": f"更新 y: 執行 BIT-REVERSED-INCREMENT。<br>從最高位 (Bit {k-1}) 往低位掃描，將連續的 1 翻轉為 0，直到遇到 0 將其翻轉為 1。"
            })
            
            y = curr_scan_y

    steps.append({
        "type": "finish",
        "arr": arr[:],
        "msg": "完成 Bit-reversal Permutation。"
    })
            
    return steps
