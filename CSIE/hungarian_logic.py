import copy

def solve_hungarian(matrix, problem_type='min'):
    steps = []
    n = len(matrix)
    
    # Deep copy for processing
    m = [row[:] for row in matrix]
    original_m = [row[:] for row in matrix]
    
    # Helper to record step
    def add_step(phase, msg, current_m, lines=None, highlights=None, assignment=None):
        steps.append({
            "phase": phase,
            "msg": msg,
            "matrix": [row[:] for row in current_m],
            "lines": lines or {"rows": [], "cols": []},
            "highlights": highlights or [],
            "assignment": assignment or []
        })

    add_step("init", "初始矩陣 (Initial Matrix)", m)

    # Step 0: Maximization Conversion (if needed)
    if problem_type == 'max':
        max_val = max(max(row) for row in m)
        highlights = []
        for r in range(n):
            for c in range(n):
                m[r][c] = max_val - m[r][c]
                highlights.append({"r": r, "c": c, "type": "sub", "val": max_val})
        add_step("max_convert", f"步驟 0: 最大化問題轉換 (Maximization Conversion)。\n找出最大值 {max_val}，將所有元素改為 {max_val} - 元素值。", m, highlights=highlights)

    # Helper for Covering (Min Lines)
    def get_min_lines(current_m):
        # Simple Max Matching (DFS)
        match_r_to_c = [-1] * n
        match_c_to_r = [-1] * n
        
        def dfs(u, visited, adj):
            for v in adj[u]:
                if not visited[v]:
                    visited[v] = True
                    if match_c_to_r[v] < 0 or dfs(match_c_to_r[v], visited, adj):
                        match_c_to_r[v] = u
                        match_r_to_c[u] = v
                        return True
            return False

        # Build adjacency for zeros
        adj = [[] for _ in range(n)]
        for r in range(n):
            for c in range(n):
                if current_m[r][c] == 0:
                    adj[r].append(c)
        
        # Find Max Matching
        matching_size = 0
        for r in range(n):
            visited = [False] * n
            if dfs(r, visited, adj):
                matching_size += 1
                
        # Construct Min Vertex Cover (Lines)
        marked_rows = [False] * n
        marked_cols = [False] * n
        
        # 1. Mark rows with no assignment
        for r in range(n):
            if match_r_to_c[r] == -1:
                marked_rows[r] = True
                
        while True:
            new_marked = False
            # 2. Mark cols having zeros in marked rows
            for r in range(n):
                if marked_rows[r]:
                    for c in range(n):
                        if current_m[r][c] == 0 and not marked_cols[c]:
                            marked_cols[c] = True
                            new_marked = True
            # 3. Mark rows having matched zeros in marked cols
            for c in range(n):
                if marked_cols[c]:
                    r = match_c_to_r[c]
                    if r != -1 and not marked_rows[r]:
                        marked_rows[r] = True
                        new_marked = True
            if not new_marked:
                break
                
        covered_rows = [r for r in range(n) if not marked_rows[r]]
        covered_cols = [c for c in range(n) if marked_cols[c]]
        
        return covered_rows, covered_cols, match_r_to_c

    # Step 1: Row Reduction
    highlights = []
    for r in range(n):
        row_min = min(m[r])
        if row_min > 0:
            for c in range(n):
                m[r][c] -= row_min
                highlights.append({"r": r, "c": c, "type": "sub", "val": row_min})
    
    add_step("row_reduce", "步驟 1: 列減法 (Row Reduction) - 每列減去該列最小值。", m, highlights=highlights)

    # Step 2: Check Lines (After Row Reduce)
    cov_rows, cov_cols, match_r_to_c = get_min_lines(m)
    num_lines = len(cov_rows) + len(cov_cols)
    add_step("cover_row", f"步驟 2: 計算覆蓋 0 的最少直線數。\n直線數 = {num_lines} (Rows: {cov_rows}, Cols: {cov_cols})", 
             m, lines={"rows": cov_rows, "cols": cov_cols})

    if num_lines == n:
        # Optimal found early
        final_assignment = []
        total_cost = 0
        for r in range(n):
            c = match_r_to_c[r]
            final_assignment.append({"r": r, "c": c})
            total_cost += original_m[r][c]
        add_step("optimize", f"步驟 6: 直線數 ({num_lines}) 等於矩陣大小 ({n})，找到最佳解！\n{'最大' if problem_type == 'max' else '最小'}成本 = {total_cost}", 
                 m, lines={"rows": cov_rows, "cols": cov_cols}, assignment=final_assignment)
        return steps

    # Step 3: Column Reduction
    highlights = []
    for c in range(n):
        col_vals = [m[r][c] for r in range(n)]
        col_min = min(col_vals)
        if col_min > 0:
            for r in range(n):
                m[r][c] -= col_min
                highlights.append({"r": r, "c": c, "type": "sub", "val": col_min})
    
    add_step("col_reduce", "步驟 3: 行減法 (Column Reduction) - 每行減去該行最小值。", m, highlights=highlights)

    # Loop for covering and augmenting
    max_iterations = 20
    iter_count = 0
    
    while iter_count < max_iterations:
        iter_count += 1
        
        # Step 4: Cover Zeros
        cov_rows, cov_cols, match_r_to_c = get_min_lines(m)
        num_lines = len(cov_rows) + len(cov_cols)
        
        add_step("cover", f"步驟 4: 計算覆蓋 0 的最少直線數。\n直線數 = {num_lines} (Rows: {cov_rows}, Cols: {cov_cols})", 
                 m, lines={"rows": cov_rows, "cols": cov_cols})
        
        if num_lines == n:
            final_assignment = []
            total_cost = 0
            for r in range(n):
                c = match_r_to_c[r]
                final_assignment.append({"r": r, "c": c})
                total_cost += original_m[r][c]
            add_step("optimize", f"步驟 6: 直線數 ({num_lines}) 等於矩陣大小 ({n})，找到最佳解！\n{'最大' if problem_type == 'max' else '最小'}成本 = {total_cost}", 
                     m, lines={"rows": cov_rows, "cols": cov_cols}, assignment=final_assignment)
            return steps
        
        # Step 5: Augment
        min_val = float('inf')
        for r in range(n):
            if r not in cov_rows:
                for c in range(n):
                    if c not in cov_cols:
                        if m[r][c] < min_val:
                            min_val = m[r][c]
                            
        highlights = []
        msg_augment = f"步驟 5: 擴充 (Augment)。\n未被覆蓋元素中最小值 = {min_val}。\n"
        msg_augment += "1. 未覆蓋元素減去此值。\n2. 雙重覆蓋(交叉點)元素加上此值。"
        
        for r in range(n):
            for c in range(n):
                is_row_covered = r in cov_rows
                is_col_covered = c in cov_cols
                
                if not is_row_covered and not is_col_covered:
                    m[r][c] -= min_val
                    highlights.append({"r": r, "c": c, "type": "sub_augment", "val": min_val})
                elif is_row_covered and is_col_covered:
                    m[r][c] += min_val
                    highlights.append({"r": r, "c": c, "type": "add_augment", "val": min_val})
                    
        add_step("augment", msg_augment, m, lines={"rows": cov_rows, "cols": cov_cols}, highlights=highlights)

    return steps
