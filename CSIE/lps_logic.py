import copy

def solve_lps(text):
    n = len(text)
    
    # L table for lengths
    # Dimensions: n x n
    # L[i][j] stores the length of LPS in text[i...j]
    L = [[0] * n for _ in range(n)]
    
    # To reconstruct the solution, we can store choices or just re-check conditions during backtracking
    # Let's store choices in a separate table for easier visualization if needed, 
    # but for LPS usually we just look at the values.
    # Let's use a 'path' table to store direction for arrows: 
    # "match" (diagonally in), "left" (skip j), "down" (skip i)
    # Note: In the recurrence L[i][j] depends on L[i+1][j] (down) and L[i][j-1] (left)
    
    path = [[""] * n for _ in range(n)]
    
    steps = []
    
    # Initial state: Base cases L[i][i] = 1
    for i in range(n):
        L[i][i] = 1
        path[i][i] = "base"
        
    steps.append({
        "L_table": [row[:] for row in L],
        "path_table": [row[:] for row in path],
        "text": text,
        "current": None,
        "highlights": [{"r": i, "c": i, "color": "#e0e0e0", "label": "1"} for i in range(n)],
        "msg": "初始化: 對於所有 i，L[i, i] = 1 (單個字元本身就是長度為 1 的回文)。"
    })
    
    # Fill the table
    # length is the length of substring
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            
            # Current substring text[i...j]
            char_i = text[i]
            char_j = text[j]
            
            current_cell = {"r": i, "c": j}
            highlight_cells = []
            msg = ""
            
            if char_i == char_j:
                # Case 1: Characters match
                # L[i, j] = L[i+1, j-1] + 2
                prev_val = 0
                if i + 1 <= j - 1:
                    prev_val = L[i+1][j-1]
                
                val = prev_val + 2
                L[i][j] = val
                path[i][j] = "match" # from i+1, j-1
                
                highlight_cells.append({"r": i+1, "c": j-1, "color": "#aaffaa", "label": f"L[{i+1}][{j-1}]"})
                msg = f"text[{i}] ('{char_i}') == text[{j}] ('{char_j}')\n首尾相同，長度 + 2。\nL[{i}, {j}] = L[{i+1}, {j-1}] + 2 = {val}。"
                
            else:
                # Case 2: Characters do not match
                # L[i, j] = max(L[i+1, j], L[i, j-1])
                val_down = L[i+1][j]   # Skip text[i]
                val_left = L[i][j-1]   # Skip text[j]
                
                if val_down > val_left:
                    L[i][j] = val_down
                    path[i][j] = "down" # from i+1, j
                    highlight_cells.append({"r": i+1, "c": j, "color": "#aaddff", "label": f"L[{i+1}][{j}]"})
                    highlight_cells.append({"r": i, "c": j-1, "color": "#eeeeee", "label": f"L[{i}][{j-1}]"})
                    msg = f"text[{i}] ('{char_i}') != text[{j}] ('{char_j}')\n比較 L[{i+1}, {j}] ({val_down}) 與 L[{i}, {j-1}] ({val_left})。\n取較大者 (下方)。\nL[{i}, {j}] = {val_down}。"
                else:
                    L[i][j] = val_left
                    path[i][j] = "left" # from i, j-1
                    highlight_cells.append({"r": i+1, "c": j, "color": "#eeeeee", "label": f"L[{i+1}][{j}]"})
                    highlight_cells.append({"r": i, "c": j-1, "color": "#aaddff", "label": f"L[{i}][{j-1}]"})
                    msg = f"text[{i}] ('{char_i}') != text[{j}] ('{char_j}')\n比較 L[{i+1}, {j}] ({val_down}) 與 L[{i}, {j-1}] ({val_left})。\n取較大者 (左方)。\nL[{i}, {j}] = {val_left}。"

            steps.append({
                "L_table": [row[:] for row in L],
                "path_table": [row[:] for row in path],
                "text": text,
                "current": current_cell,
                "highlights": highlight_cells,
                "msg": msg
            })

    # Backtracking to find the palindrome
    # We start from L[0][n-1]
    path_highlights = []
    i, j = 0, n - 1
    
    # To reconstruct, we can collect characters from both ends
    left_part = []
    right_part = []
    
    while i <= j:
        path_highlights.append({"r": i, "c": j, "color": "#ffcc00", "type": "path"})
        
        if i == j:
            left_part.append(text[i])
            break
            
        if text[i] == text[j]:
            left_part.append(text[i])
            right_part.append(text[j])
            i += 1
            j -= 1
        else:
            if L[i+1][j] > L[i][j-1]:
                i += 1
            else:
                j -= 1
                
    lps_result = "".join(left_part) + "".join(reversed(right_part))
    
    steps.append({
        "L_table": [row[:] for row in L],
        "path_table": [row[:] for row in path],
        "text": text,
        "current": None,
        "highlights": path_highlights,
        "msg": f"計算完成。\nLPS 長度為 {L[0][n-1]}。\n最長回文子序列為: {lps_result}"
    })
    
    return steps
