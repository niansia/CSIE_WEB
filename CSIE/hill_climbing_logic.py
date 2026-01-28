import copy

def get_misplaced_tiles_details(board, goal):
    count = 0
    size = 3
    details = []
    
    for r in range(size):
        for c in range(size):
            val = board[r][c]
            goal_val = goal[r][c]
            if val != 0: # 不計算空白格
                if val != goal_val:
                    count += 1
                    details.append(f"數字{val}位置不對")
    
    return count, "，".join(details) if details else "全部位置正確"

def get_neighbors(board):
    neighbors = []
    size = 3
    empty_r, empty_c = -1, -1
    for r in range(size):
        for c in range(size):
            if board[r][c] == 0:
                empty_r, empty_c = r, c
                break
    
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)] # Up, Down, Left, Right
    for dr, dc in directions:
        nr, nc = empty_r + dr, empty_c + dc
        if 0 <= nr < size and 0 <= nc < size:
            new_board = [row[:] for row in board]
            new_board[empty_r][empty_c], new_board[nr][nc] = new_board[nr][nc], new_board[empty_r][empty_c]
            neighbors.append(new_board)
            
    return neighbors

def board_to_tuple(board):
    return tuple(tuple(row) for row in board)

def solve_8puzzle(start_board, goal_board):
    steps = []
    
    # Algorithm: Hill Climbing (DFS with Heuristic Ordering)
    # 1. Stack
    stack = []
    # State: (board, path, depth)
    # We need to track the tree structure for visualization
    # Node ID: unique string
    
    node_counter = 0
    def get_id():
        nonlocal node_counter
        node_counter += 1
        return str(node_counter)
    
    root_id = get_id()
    root_h, root_detail = get_misplaced_tiles_details(start_board, goal_board)
    
    root_node = {
        "id": root_id,
        "board": start_board,
        "parent_id": None,
        "h": root_h,
        "h_detail": root_detail,
        "depth": 0,
        "status": "stack" # stack, visited, current
    }
    
    stack.append(root_node)
    visited_boards = set()
    visited_boards.add(board_to_tuple(start_board))
    
    # For visualization, we keep a list of all nodes generated so far
    all_nodes = [root_node]
    
    steps.append({
        "msg": f"初始狀態：將起始節點 {root_id} 加入堆疊。\n起始節點 h={root_h}。\n計算細節：{root_detail}",
        "stack": [n["id"] for n in stack],
        "current_node": None,
        "tree_nodes": copy.deepcopy(all_nodes),
        "phase": "init"
    })
    
    max_steps = 100 # Safety break
    step_count = 0
    
    while stack:
        step_count += 1
        if step_count > max_steps:
            steps.append({
                "msg": "超過最大步數限制，停止搜尋。",
                "stack": [],
                "current_node": None,
                "tree_nodes": copy.deepcopy(all_nodes),
                "phase": "limit"
            })
            break
            
        # 2. Check stack top
        current = stack[-1] # Peek? Algorithm says "Visit and check... then remove".
        # Usually "Visit" implies popping in DFS loop, or peeking.
        # Step 3 says "Remove stack top". So Step 2 is Peek.
        
        # Let's Pop immediately to follow "Remove stack top" in Step 3, 
        # but Step 2 says "Check if goal".
        
        current = stack.pop()
        current["status"] = "current"
        
        # Update visualization for "Processing node"
        h_detail_str = current.get('h_detail', '無')
        steps.append({
            "msg": f"從堆疊頂端取出節點 {current['id']} (h={current['h']})。\n計算細節：{h_detail_str}\n這是目前堆疊中 h 值最小（最優）的節點。",
            "stack": [n["id"] for n in stack],
            "current_node": current["id"],
            "tree_nodes": copy.deepcopy(all_nodes),
            "phase": "pop"
        })
        
        if current["h"] == 0: # Goal reached (h=0)
            current["status"] = "goal"
            steps.append({
                "msg": f"找到目標節點！解答完成。",
                "stack": [n["id"] for n in stack],
                "current_node": current["id"],
                "tree_nodes": copy.deepcopy(all_nodes),
                "phase": "goal"
            })
            return steps
        
        current["status"] = "visited"
        
        # 3. Expand
        neighbors = get_neighbors(current["board"])
        children = []
        
        for nb in neighbors:
            if board_to_tuple(nb) not in visited_boards:
                visited_boards.add(board_to_tuple(nb))
                child_h, child_detail = get_misplaced_tiles_details(nb, goal_board)
                child_id = get_id()
                child_node = {
                    "id": child_id,
                    "board": nb,
                    "parent_id": current["id"],
                    "h": child_h,
                    "h_detail": child_detail,
                    "depth": current["depth"] + 1,
                    "status": "generated"
                }
                children.append(child_node)
                all_nodes.append(child_node)
        
        if not children:
            steps.append({
                "msg": "無可擴展的新子節點 (Dead End)。",
                "stack": [n["id"] for n in stack],
                "current_node": current["id"],
                "tree_nodes": copy.deepcopy(all_nodes),
                "phase": "dead_end"
            })
            continue
            
        # Sort children by priority (Evaluation Function)
        # "Priority low first" pushed to stack.
        # We want HIGH priority (LOW h value) to be at the TOP of the stack.
        # So we push High h -> Low h.
        # Sort by h descending.
        children.sort(key=lambda x: x["h"], reverse=True)
        
        msg_detail = f"擴展節點 {current['id']} 的子節點：\n"
        msg_detail += "計算啟發式評估值 h(n) (錯位方塊數)：\n"
        
        # List all children and their h in Best to Worst order
        children_best_first = sorted(children, key=lambda x: x["h"])
        for child in children_best_first:
             msg_detail += f"- 節點 {child['id']}: h={child['h']} ({child['h_detail']})\n"
             
        msg_detail += "根據 Hill Climbing，優先拜訪 h 值最小者。\n"
        msg_detail += "加入堆疊順序 (h 大先入，h 小後入)：\n"
        
        for child in children:
            child["status"] = "stack"
            stack.append(child)
            msg_detail += f"Push 節點 {child['id']} (h={child['h']})\n"
            
        if children:
            best_child = children[-1]
            msg_detail += f"堆疊頂端現在是節點 {best_child['id']} (h={best_child['h']})，將是下一步拜訪對象。"
            
        steps.append({
            "msg": msg_detail,
            "stack": [n["id"] for n in stack],
            "current_node": current["id"],
            "tree_nodes": copy.deepcopy(all_nodes),
            "phase": "expand"
        })
        
    if not stack:
        steps.append({
            "msg": "堆疊為空，無解答。",
            "stack": [],
            "current_node": None,
            "tree_nodes": copy.deepcopy(all_nodes),
            "phase": "fail"
        })
        
    return steps

def solve_simple_graph(nodes, edges, start_id, goal_id):
    # nodes: list of {id, x, y, h}
    # edges: list of {u, v}
    
    steps = []
    
    # Build adj
    adj = {n['id']: [] for n in nodes}
    for e in edges:
        adj[e['u']].append(e['v'])
        adj[e['v']].append(e['u']) # Undirected? Or directed? Usually directed in search trees.
        # Let's assume undirected for graph, but we treat neighbors as children.
        
    # Map for quick access
    node_map = {n['id']: n for n in nodes}
    
    stack = []
    visited = set()
    
    # Root
    stack.append(start_id)
    visited.add(start_id)
    
    # Track path/tree for visualization?
    # For simple graph, we just highlight the graph nodes.
    # We don't build a separate tree, we traverse the graph.
    
    steps.append({
        "msg": f"初始狀態：將起始節點 {start_id} 加入堆疊。",
        "stack": [start_id],
        "current_node": None,
        "visited": list(visited),
        "phase": "init"
    })
    
    while stack:
        current_id = stack.pop()
        
        steps.append({
            "msg": f"從堆疊頂端取出節點 {current_id}。",
            "stack": list(stack),
            "current_node": current_id,
            "visited": list(visited),
            "phase": "pop"
        })
        
        if current_id == goal_id:
            steps.append({
                "msg": f"找到目標節點 {goal_id}！",
                "stack": list(stack),
                "current_node": current_id,
                "visited": list(visited),
                "phase": "goal"
            })
            return steps
            
        # Expand
        neighbors = adj[current_id]
        unvisited_neighbors = [nid for nid in neighbors if nid not in visited]
        
        if not unvisited_neighbors:
             steps.append({
                "msg": "無未拜訪的鄰居。",
                "stack": list(stack),
                "current_node": current_id,
                "visited": list(visited),
                "phase": "dead_end"
            })
             continue
             
        # Sort by heuristic (h value)
        # We want lowest h on top.
        # So push highest h first.
        unvisited_neighbors.sort(key=lambda nid: node_map[nid]['h'], reverse=True)
        
        msg_detail = f"擴展節點 {current_id} 的未拜訪鄰居：\n"
        
        # Show h values
        neighbors_best_first = sorted(unvisited_neighbors, key=lambda nid: node_map[nid]['h'])
        msg_detail += "鄰居評估 (h 值越小越接近目標)：\n"
        for nid in neighbors_best_first:
            msg_detail += f"- 節點 {nid}: h={node_map[nid]['h']}\n"
            
        msg_detail += "加入堆疊 (h 大先入，h 小後入)：\n"
        
        for nid in unvisited_neighbors:
            visited.add(nid)
            stack.append(nid)
            msg_detail += f"Push {nid} (h={node_map[nid]['h']})\n"
            
        if unvisited_neighbors:
            best_nid = unvisited_neighbors[-1]
            msg_detail += f"堆疊頂端：節點 {best_nid} (h={node_map[best_nid]['h']})。"
            
        steps.append({
            "msg": msg_detail,
            "stack": list(stack),
            "current_node": current_id,
            "visited": list(visited),
            "phase": "expand"
        })
        
    steps.append({
        "msg": "堆疊為空，無解答。",
        "stack": [],
        "current_node": None,
        "visited": list(visited),
        "phase": "fail"
    })
    return steps
