
def solve_lcs(text1, text2):
    m = len(text1)
    n = len(text2)
    
    # c table for lengths, b table for arrows
    # Dimensions: (m+1) x (n+1)
    c = [[0] * (n + 1) for _ in range(m + 1)]
    b = [[""] * (n + 1) for _ in range(m + 1)]
    
    steps = []
    
    # Initial state
    steps.append({
        "c_table": [row[:] for row in c],
        "b_table": [row[:] for row in b],
        "text1": text1,
        "text2": text2,
        "current": None,
        "highlights": [],
        "msg": "初始化 LCS 表格，大小為 (len(X)+1) x (len(Y)+1)，第一列與第一行設為 0。"
    })
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            # Current characters (0-indexed in strings)
            x_char = text1[i-1]
            y_char = text2[j-1]
            
            current_cell = {"r": i, "c": j}
            highlight_cells = []
            msg = ""
            
            if x_char == y_char:
                val = c[i-1][j-1] + 1
                c[i][j] = val
                b[i][j] = "↖"
                
                highlight_cells.append({"r": i-1, "c": j-1, "color": "#aaffaa", "label": f"c[{i-1}][{j-1}]"})
                msg = f"X[{i}] ('{x_char}') == Y[{j}] ('{y_char}')\n匹配成功！\nc[{i}][{j}] = c[{i-1}][{j-1}] + 1 = {val}\n箭頭指向左上方 (↖)。"
                
            elif c[i-1][j] >= c[i][j-1]:
                val = c[i-1][j]
                c[i][j] = val
                b[i][j] = "↑"
                
                highlight_cells.append({"r": i-1, "c": j, "color": "#aaddff", "label": f"c[{i-1}][{j}]"})
                highlight_cells.append({"r": i, "c": j-1, "color": "#eeeeee", "label": f"c[{i}][{j-1}]"})
                msg = f"X[{i}] ('{x_char}') != Y[{j}] ('{y_char}')\n比較上方與左方：\n上方 c[{i-1}][{j}] = {c[i-1][j]}\n左方 c[{i}][{j-1}] = {c[i][j-1]}\n取較大者 (或上方優先)。\nc[{i}][{j}] = {val}，箭頭指向上方 (↑)。"
                
            else:
                val = c[i][j-1]
                c[i][j] = val
                b[i][j] = "←"
                
                highlight_cells.append({"r": i-1, "c": j, "color": "#eeeeee", "label": f"c[{i-1}][{j}]"})
                highlight_cells.append({"r": i, "c": j-1, "color": "#aaddff", "label": f"c[{i}][{j-1}]"})
                msg = f"X[{i}] ('{x_char}') != Y[{j}] ('{y_char}')\n比較上方與左方：\n上方 c[{i-1}][{j}] = {c[i-1][j]}\n左方 c[{i}][{j-1}] = {c[i][j-1]}\n取較大者 (左方)。\nc[{i}][{j}] = {val}，箭頭指向左方 (←)。"

            steps.append({
                "c_table": [row[:] for row in c],
                "b_table": [row[:] for row in b],
                "text1": text1,
                "text2": text2,
                "current": current_cell,
                "highlights": highlight_cells,
                "msg": msg
            })

    # Backtracking to find LCS path for final highlight
    path_highlights = []
    i, j = m, n
    lcs_str = []
    while i > 0 and j > 0:
        path_highlights.append({"r": i, "c": j, "color": "#ffcc00", "type": "path"})
        if b[i][j] == "↖":
            lcs_str.append(text1[i-1])
            i -= 1
            j -= 1
        elif b[i][j] == "↑":
            i -= 1
        else:
            j -= 1
    
    lcs_result = "".join(reversed(lcs_str))
    
    steps.append({
        "c_table": [row[:] for row in c],
        "b_table": [row[:] for row in b],
        "text1": text1,
        "text2": text2,
        "current": None,
        "highlights": path_highlights,
        "msg": f"計算完成。\nLCS 長度為 {c[m][n]}。\n最長共同子序列為: {lcs_result}"
    })
    
    return steps
