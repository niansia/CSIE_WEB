def solve_med(s1, s2):
    n = len(s1)
    m = len(s2)
    
    # dp[i][j] stores the edit distance between s1[:i] and s2[:j]
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    # op[i][j] stores the operation used: 'M' (Match), 'S' (Sub), 'I' (Insert), 'D' (Delete)
    op = [[None] * (m + 1) for _ in range(n + 1)]
    
    steps = []
    
    # Initialization
    for i in range(n + 1):
        dp[i][0] = i
        op[i][0] = 'D' # Deleting from s1 to match empty s2
    for j in range(m + 1):
        dp[0][j] = j
        op[0][j] = 'I' # Inserting into s1 to match s2
        
    op[0][0] = 'M' # Base case
        
    steps.append({
        "type": "init",
        "dp": [row[:] for row in dp],
        "s1": s1,
        "s2": s2,
        "msg": f"初始化 DP 表格。<br>列 (Row) 代表字串 1: '{s1}'<br>行 (Col) 代表字串 2: '{s2}'<br>Base cases: dp[i][0] = i (全刪除), dp[0][j] = j (全插入)"
    })
    
    # Fill DP table
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            char1 = s1[i-1]
            char2 = s2[j-1]
            
            cost_sub = 0 if char1 == char2 else 1
            
            # Calculate costs
            del_cost = dp[i-1][j] + 1
            ins_cost = dp[i][j-1] + 1
            sub_cost = dp[i-1][j-1] + cost_sub
            
            min_cost = min(del_cost, ins_cost, sub_cost)
            dp[i][j] = min_cost
            
            # Determine operation priority: Match/Sub > Delete > Insert (arbitrary but consistent)
            # Actually usually we prefer Match if possible.
            
            current_op = ''
            explanation = ""
            
            if min_cost == sub_cost:
                if cost_sub == 0:
                    current_op = 'M' # Match
                    explanation = f"字元相同 ('{char1}' == '{char2}')，直接沿用左上角數值。<br>Cost = dp[{i-1}][{j-1}] = {dp[i-1][j-1]}"
                else:
                    current_op = 'S' # Substitute
                    explanation = f"字元不同 ('{char1}' != '{char2}')，替換操作。<br>Cost = dp[{i-1}][{j-1}] + 1 = {dp[i-1][j-1]} + 1 = {min_cost}"
            elif min_cost == del_cost:
                current_op = 'D' # Delete
                explanation = f"刪除操作 (從上方)。<br>Cost = dp[{i-1}][{j}] + 1 = {dp[i-1][j]} + 1 = {min_cost}"
            else: # min_cost == ins_cost
                current_op = 'I' # Insert
                explanation = f"插入操作 (從左方)。<br>Cost = dp[{i}][{j-1}] + 1 = {dp[i][j-1]} + 1 = {min_cost}"
                
            op[i][j] = current_op
            
            steps.append({
                "type": "step",
                "i": i,
                "j": j,
                "val": min_cost,
                "op": current_op,
                "dp": [row[:] for row in dp], # Snapshot
                "msg": f"<strong>計算 dp[{i}][{j}] (s1[{i-1}]='{char1}', s2[{j-1}]='{char2}')</strong><br>{explanation}"
            })
            
    # Backtrack to find path
    path = []
    curr_i, curr_j = n, m
    while curr_i > 0 or curr_j > 0:
        path.append((curr_i, curr_j))
        
        # Logic must match the forward pass priority
        # But here we just look at which neighbor gave the value
        
        c1 = s1[curr_i-1] if curr_i > 0 else ''
        c2 = s2[curr_j-1] if curr_j > 0 else ''
        cost_sub = 0 if c1 == c2 else 1
        
        current_val = dp[curr_i][curr_j]
        
        # Check where we came from
        # Priority: Match/Sub (i-1, j-1), Delete (i-1, j), Insert (i, j-1)
        
        if curr_i > 0 and curr_j > 0 and dp[curr_i][curr_j] == dp[curr_i-1][curr_j-1] + cost_sub:
            curr_i -= 1
            curr_j -= 1
        elif curr_i > 0 and dp[curr_i][curr_j] == dp[curr_i-1][curr_j] + 1:
            curr_i -= 1
        elif curr_j > 0 and dp[curr_i][curr_j] == dp[curr_i][curr_j-1] + 1:
            curr_j -= 1
        else:
            # Should not happen if logic is consistent
            break
            
    path.append((0, 0))
    path.reverse()
    
    steps.append({
        "type": "finish",
        "dp": dp,
        "path": path,
        "result": dp[n][m],
        "msg": f"計算完成。最小編輯距離為 {dp[n][m]}。<br>紅色路徑顯示最佳操作序列。"
    })
    
    return steps
