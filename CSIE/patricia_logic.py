import json

# ------------- Patricia 結構（Weiss） -------------

class Node:
    __slots__ = ("key", "bit", "left", "right")
    def __init__(self, key: str, bit: int):
        self.key = key
        self.bit = bit
        self.left = self
        self.right = self

def bit_at(s: str, i: int) -> int:
    if i == 0: return 0 
    idx = i - 1
    return 0 if idx < 0 or idx >= len(s) else (1 if s[idx] == "1" else 0)

def first_diff_bit(a: str, b: str) -> int:
    m = max(len(a), len(b))
    for i in range(m):
        if bit_at(a, i+1) != bit_at(b, i+1):
            return i + 1
    return m + 1

# ------------- 產生步驟（快照） -------------

def push_step(steps, head, msg, highlight_node=None, highlight_bit=None, key=None, check_idx=None, canvas_msg=None):
    # We will process the snapshot immediately to include layout info
    snap = export_tree(head, highlight_node)
    layout_data = get_draw_data(snap)
    
    steps.append({
        "layout": layout_data,
        "msg": msg,
        "hl_bit": highlight_bit,
        "key": key,
        "check_idx": check_idx,
        "canvas_msg": canvas_msg
    })

# ------------- 匯出 + 版面計算 -------------

MARGIN_X = 120
MARGIN_Y = 180
LEVEL_GAP = 95
BASE_HGAP = 160

def export_tree(head, highlight_node=None):
    """輸出可視樹（只含真子樹）＋每個節點的兩個指標終點，用來畫執行緒弧線。"""
    if head.key is None:
        return {"head_has_root": False}

    root = head 
    
    id_of = {}
    rev = {}
    counter = [0]

    def gid(x):
        if x in id_of: return id_of[x]
        i = counter[0]; counter[0] += 1
        id_of[x] = i; rev[i] = x
        return i

    def touch(x):
        gid(x)
        # Left
        if x.left and x.left.bit > x.bit:
            touch(x.left)
        # Right
        if x.right and x.right.bit > x.bit:
            touch(x.right)
            
    touch(root)

    def pack(x):
        d = {"id": gid(x), "key": x.key, "bit": x.bit,
             "ptrL": gid(x.left) if x.left else None, 
             "ptrR": gid(x.right) if x.right else None,
             "left": None, "right": None}
        
        if x.left and x.left.bit > x.bit:
            d["left"] = pack(x.left)
        if x.right and x.right.bit > x.bit:
            d["right"] = pack(x.right)
        return d

    hl_id = id_of.get(highlight_node) if highlight_node else None

    return {
        "head_has_root": True, 
        "root_id": gid(root), 
        "nodes": rev, 
        "tree": pack(root),
        "highlight_id": hl_id
    }

def layout_tree(snap):
    if not snap["head_has_root"]:
        return {}, None
    pos = {}
    xcur = MARGIN_X

    def inorder(n, depth):
        nonlocal xcur
        if n["left"]:
            inorder(n["left"], depth + 1)
        
        # Visit
        pos[n["id"]] = (xcur, MARGIN_Y + depth * LEVEL_GAP)
        xcur += BASE_HGAP
        
        if n["right"]:
            inorder(n["right"], depth + 1)

    inorder(snap["tree"], 0)
    return pos, snap["root_id"]

def get_draw_data(snap):
    if not snap["head_has_root"]:
        return {"nodes": [], "edges": [], "root_id": None}
        
    pos, root_id = layout_tree(snap)
    nodes_map = snap["nodes"] # id -> Node object
    
    # Build Nodes List
    nodes_list = []
    hl_id = snap["highlight_id"]
    
    for nid, (x, y) in pos.items():
        node_obj = nodes_map[nid]
        nodes_list.append({
            "id": nid,
            "x": x,
            "y": y,
            "key": node_obj.key,
            "bit": node_obj.bit,
            "is_highlight": (nid == hl_id)
        })
        
    # Build Edges
    edges_list = []
    
    def traverse_edges(n_struct):
        nid = n_struct["id"]
        
        # Left
        lid = n_struct["ptrL"]
        if lid is not None:
            is_thread = True
            if n_struct["left"]: is_thread = False # It's a real child
            edges_list.append({
                "u": nid, "v": lid, "type": "L", "is_thread": is_thread
            })
            if not is_thread: traverse_edges(n_struct["left"])
            
        # Right
        rid = n_struct["ptrR"]
        if rid is not None:
            is_thread = True
            if n_struct["right"]: is_thread = False
            edges_list.append({
                "u": nid, "v": rid, "type": "R", "is_thread": is_thread
            })
            if not is_thread: traverse_edges(n_struct["right"])

    traverse_edges(snap["tree"])
    
    return {
        "nodes": nodes_list,
        "edges": edges_list,
        "root_id": root_id,
        "highlight_id": hl_id
    }

def push_step(steps, head, msg, highlight_node=None, highlight_bit=None, key=None, check_idx=None, canvas_msg=None):
    # We will process the snapshot immediately to include layout info
    snap = export_tree(head, highlight_node)
    layout_data = get_draw_data(snap)
    
    steps.append({
        "layout": layout_data,
        "msg": msg,
        "hl_bit": highlight_bit,
        "key": key,
        "check_idx": check_idx,
        "canvas_msg": canvas_msg
    })


# ------------- 搜尋 / 插入 / 刪除 -------------

def pat_search(head: Node, key: str, steps=None, explain=False):
    p = head
    b = bit_at(key, head.bit)
    # Modified Logic: 0 -> Right, 1 -> Left (Based on User Feedback)
    x = head.left if b else head.right
    
    if steps is not None and explain:
        direction = "左 (1)" if b == 1 else "右 (0)"
        push_step(steps, head, f"【搜尋開始】\n目標：{key}\n起點：Head ({head.key}, bit={head.bit})\n"
                               f"檢查 Key 第 {head.bit} 位元：'{b}' → 往{direction}走。",
                  highlight_node=head, highlight_bit=head.bit, key=key, check_idx=head.bit,
                  canvas_msg=f"檢查 Bit {head.bit}：{b} → 往{direction[0]}")
    
    while p.bit < x.bit:
        p = x
        idx = x.bit
        bit_val = bit_at(key, idx)
        
        # Modified Logic: 0 -> Right, 1 -> Left
        direction = "左 (1)" if bit_val == 1 else "右 (0)"
        
        if steps is not None and explain:
            push_step(steps, head, 
                      f"【搜尋中】\n"
                      f"當前節點：{p.key} (bit={p.bit})\n"
                      f"動作：檢查 Key 的第 {idx} 位元\n"
                      f"數值：{key} 的第 {idx} 位是 '{bit_val}'\n"
                      f"決定：因為是 {bit_val}，所以往{direction}走。",
                      highlight_node=p, highlight_bit=p.bit, key=key, check_idx=idx,
                      canvas_msg=f"檢查 Bit {idx}：{bit_val} → 往{direction[0]}")
        
        x = x.left if bit_val else x.right
    
    if steps is not None and explain:
        push_step(steps, head, 
                  f"【搜尋結束】\n"
                  f"原因：下一個節點的 bit ({x.bit}) 沒有大於當前節點 ({p.bit})，\n"
                  f"      代表這是一條「執行緒 (Thread)」連結。\n"
                  f"停在：{x.key}",
                  highlight_node=x, key=key,
                  canvas_msg=f"搜尋結束，停在 {x.key}")
    return x

def find_parent_for_bit(head: Node, key: str, newbit: int):
    p = head
    b = bit_at(key, head.bit)
    # Modified: 0->Right, 1->Left
    x = head.left if b else head.right
    while p.bit < x.bit and x.bit < newbit:
        p = x
        b = bit_at(key, x.bit)
        # Modified: 0->Right, 1->Left
        x = x.left if b else x.right
    return p, x

def insert_with_steps(head: Node, key: str):
    steps = []
    if not key or any(c not in "01" for c in key):
        return steps, head

    if head.key is None:
        head.key = key
        head.bit = 0
        head.left = head
        head.right = head
        push_step(steps, head, f"空樹：建立 Head 節點「{key}」，bit=0。\nLeft->Self, Right->Self。",
                  canvas_msg="空樹：建立 Head 節點")
        return steps, head

    push_step(steps, head, f"準備插入「{key}」。\n第一步：先執行搜尋，看看這個 Key 是否已存在，或應該在哪裡停止。",
              canvas_msg=f"準備插入 {key}")

    t = pat_search(head, key, steps, explain=True)
    
    if t.key == key:
        push_step(steps, head, f"結果：鍵「{key}」已存在於樹中，不需插入。",
                  canvas_msg=f"鍵 {key} 已存在")
        return steps, head

    d = first_diff_bit(t.key, key)
    newbit = d
    t_bit_val = bit_at(t.key, d)
    k_bit_val = bit_at(key, d)
    
    push_step(steps, head, 
              f"【計算差異】\n"
              f"搜尋停在：{t.key}\n"
              f"輸入鍵值：{key}\n"
              f"比較兩者：\n"
              f"  {t.key}\n"
              f"  {key}\n"
              f"  {' '*(d-1 if d>0 else 0)}^\n"
              f"發現第一個不同的位元在第 {d} 位 (1-based)。\n"
              f"  {t.key}[{d}] = {t_bit_val}\n"
              f"  {key}[{d}] = {k_bit_val}\n"
              f"結論：新節點的 bit 設為 {newbit}。",
              key=key, check_idx=d,
              canvas_msg=f"比較 {t.key} 與 {key}，差異在 Bit {d}")

    push_step(steps, head, f"【定位插入點】\n"
                           f"目標：找到一個父節點 p，滿足 p.bit < {newbit} 且 p 的子節點 bit >= {newbit}。\n"
                           f"方法：再次從 Head 開始搜尋，但只使用 Key 的前 {newbit-1} 位。",
                           key=key,
                           canvas_msg=f"重新搜尋，定位插入點 (Bit < {newbit})")
                           
    p, x = find_parent_for_bit(head, key, newbit)
    
    # Modified: 0->Right, 1->Left
    direction_str = "左 (1)" if bit_at(key, p.bit) else "右 (0)"
    is_thread = (x.bit <= p.bit)
    x_desc = f"{x.key} (bit={x.bit})" + (" [回溯連結]" if is_thread else "")
    
    reason_str = ""
    if is_thread:
        reason_str = (f"檢查發現：p 指向的 x 是一個回溯連結 (Thread)。\n"
                      f"這意味著 p 是此路徑上 bit 順序的最後一個節點。\n"
                      f"新節點 z (bit={newbit}) 比 p (bit={p.bit}) 還要大，\n"
                      f"因此，z 將會直接接在 p 的後面。")
    else:
        reason_str = (f"檢查發現：新節點 z 的 bit ({newbit}) 介於 p 和 x 之間。\n"
                      f"p.bit ({p.bit}) < z.bit ({newbit}) <= x.bit ({x.bit})。\n"
                      f"因此，我們將 z 插入到 p 與 x 中間，\n"
                      f"讓 p 指向 z，再讓 z 指向 x。")

    push_step(steps, head, f"【找到插入位置】\n"
                           f"父節點 p：{p.key} (bit={p.bit})\n"
                           f"原路徑子節點 x：{x_desc}\n"
                           f"新節點 z 的 bit：{newbit}\n\n"
                           f"插入邏輯解析：\n"
                           f"1. 找到 p 是最後一個 bit 小於 {newbit} 的節點。\n"
                           f"2. p 原本往{direction_str}指向 x。\n"
                           f"3. {reason_str}\n"
                           f"動作：將 p 的{direction_str}指標改指向新節點 z，再讓 z 連接 x。",
                           highlight_node=p, key=key,
                           canvas_msg=f"將插入在 {p.key} 與 {x.key} 之間")
    
    z = Node(key, newbit)
    z_bit_val = bit_at(key, newbit)
    
    # Modified: 0->Right, 1->Left
    if z_bit_val == 0:
        z.right = z
        z.left = x
        z_dir_str = "右 (0)"
        x_dir_str = "左 (1)"
    else:
        z.left = z
        z.right = x
        z_dir_str = "左 (1)"
        x_dir_str = "右 (0)"
        
    p_bit_val = bit_at(key, p.bit)
    if p_bit_val == 0:
        p.right = z
        p_side = "右 (0)"
    else:
        p.left = z
        p_side = "左 (1)"
        
    push_step(steps, head, f"【插入完成】\n"
                           f"1. 建立新節點 z ({key}, bit={newbit})。\n"
                           f"   - 決定 z 的左右指標：\n"
                           f"     檢查 z 的第 {newbit} 位元，值為 {z_bit_val}。\n"
                           f"     (1) 因為值是 {z_bit_val}，所以 z 的{z_dir_str}指標指向自己 (Self-Loop)，表示這是新鍵值的落腳處。\n"
                           f"     (2) 相對地，原本的子樹 x 在這一位的值與 z 相反，所以 z 的{x_dir_str}指標指向 x。\n"
                           f"2. 更新父節點 p ({p.key})：\n"
                           f"   - p 的第 {p.bit} 位是 {p_bit_val}，所以將 p 的{p_side}指標截斷，改指向 z。\n"
                           f"   - 這樣就形成了 p → z → x 的結構 (或 z 指向自己)。",
                           highlight_node=z, key=key,
                           canvas_msg=f"插入完成：p→z，z 分岔出 x 與自己")
    
    return steps, head

def find_physical_parent(root, target):
    if root is None or target is None: return None
    stack = [root]
    visited = {id(root)}
    while stack:
        curr = stack.pop()
        if curr.left:
            if curr.left == target: return curr
            if curr.left.bit > curr.bit and id(curr.left) not in visited:
                visited.add(id(curr.left))
                stack.append(curr.left)
        if curr.right:
            if curr.right == target: return curr
            if curr.right.bit > curr.bit and id(curr.right) not in visited:
                visited.add(id(curr.right))
                stack.append(curr.right)
    return None

def delete_with_steps(head: Node, key: str):
    steps = []
    if not key: return steps, head
    
    if head.key is None:
        push_step(steps, head, "空樹無法刪除。", canvas_msg="空樹無法刪除")
        return steps, head

    push_step(steps, head, f"準備刪除「{key}」。\n第一步：搜尋該鍵值是否存在。", canvas_msg=f"準備刪除 {key}")

    y = pat_search(head, key, steps, explain=True)
    
    if y.key != key:
        push_step(steps, head, f"搜尋結果停在 {y.key}，與目標 {key} 不符。\n結論：鍵值不存在，無法刪除。",
                  highlight_node=y, canvas_msg="鍵值不存在")
        return steps, head
        
    p = y 
    push_step(steps, head, f"找到目標節點 p：{p.key} (bit={p.bit})。\n準備執行刪除邏輯。",
              highlight_node=p, canvas_msg=f"找到目標 {p.key}")

    has_self = (p.left == p or p.right == p)
    
    if has_self:
        push_step(steps, head, f"【刪除 Case 1】\n節點 p ({p.key}) 擁有指向自己的指標 (Self-Pointer)。\n"
                               f"處理方式：直接移除 p，並將父節點指向 p 的另一側子節點。",
                  highlight_node=p, canvas_msg="Case 1: 有 Self-Pointer")
        
        if p == head and p.left == p and p.right == p:
             head = Node(None, -1)
             push_step(steps, head, "p 是唯一的節點 (Head)。\n刪除後樹變為空。", canvas_msg="刪除完成：樹已空")
             return steps, head
             
        pp = find_physical_parent(head, p)
        if not pp:
             if p == head:
                 head = Node(None, -1)
                 push_step(steps, head, "p 是 Head。\n刪除後樹變為空。", canvas_msg="刪除完成")
                 return steps, head
             push_step(steps, head, "錯誤：找不到 p 的父節點。", canvas_msg="錯誤")
             return steps, head
             
        child = p.right if p.left == p else p.left
        child_desc = f"{child.key}" if child else "None"
        
        if pp.left == p:
            pp.left = child
            side = "左"
        else:
            pp.right = child
            side = "右"
            
        push_step(steps, head, f"【執行刪除】\n"
                               f"1. p 的父節點是 {pp.key}。\n"
                               f"2. p 指向自己的指標被移除。\n"
                               f"3. p 的另一側子節點是 {child_desc}。\n"
                               f"4. 更新 {pp.key} 的{side}指標，改指向 {child_desc}。",
                  highlight_node=pp, canvas_msg=f"父節點 {pp.key} 改指 {child_desc}")
                  
    else:
        push_step(steps, head, f"【刪除 Case 2】\n節點 p ({p.key}) 沒有指向自己的指標。\n"
                               f"這表示 p 是某個回溯連結 (Thread) 的目標。\n"
                               f"步驟：\n"
                               f"1. 找到指向 p 的節點 q (Back-Edge Source)。\n"
                               f"2. 找到指向 q 的節點 r。\n"
                               f"3. 用 q 的資料取代 p，然後刪除 q。",
                  highlight_node=p, canvas_msg="Case 2: 無 Self-Pointer")
                  
        curr = p
        while True:
            b = bit_at(p.key, curr.bit)
            # Modified: 1->Left, 0->Right
            nxt = curr.left if b else curr.right
            if nxt == p:
                q = curr
                break
            curr = nxt
            
        push_step(steps, head, f"【尋找 q】\n"
                               f"從 p 開始搜尋 {p.key}，最後會經由回溯連結回到 p。\n"
                               f"發出該連結的節點即為 q。\n"
                               f"找到 q：{q.key} (bit={q.bit})。",
                  highlight_node=q, canvas_msg=f"找到 q: {q.key}")

        r_curr = head
        b = bit_at(q.key, head.bit)
        # Modified: 1->Left, 0->Right
        r_next = head.left if b else head.right
        
        while r_curr.bit < r_next.bit:
            r_curr = r_next
            b = bit_at(q.key, r_curr.bit)
            # Modified: 1->Left, 0->Right
            r_next = r_curr.left if b else r_curr.right
            
        r = r_curr
        
        push_step(steps, head, f"【尋找 r】\n"
                               f"搜尋 q.key ({q.key})，會停在 q。\n"
                               f"搜尋終止前的最後一個節點即為 r (指向 q 的來源)。\n"
                               f"找到 r：{r.key} (bit={r.bit})。",
                  highlight_node=r, canvas_msg=f"找到 r: {r.key}")
                  
        old_p_key = p.key
        p.key = q.key
        
        push_step(steps, head, f"【取代資料】\n"
                               f"將 q 的鍵值 ({q.key}) 複製到 p ({old_p_key})。\n"
                               f"現在 p 變成了 {p.key}。",
                  highlight_node=p, canvas_msg=f"p 變更為 {p.key}")
                  
        if r.left == q:
            r.left = p
            r_side = "左"
        else:
            r.right = p
            r_side = "右"
            
        push_step(steps, head, f"【更新 r】\n"
                               f"r ({r.key}) 原本指向 q ({q.key})。\n"
                               f"因為 q 即將被刪除 (且 p 已取代 q)，\n"
                               f"將 r 的{r_side}指標改指向 p。",
                  highlight_node=r, canvas_msg=f"r 改指 p")

        qp = find_physical_parent(head, q)
        q_child = q.right if q.left == p else q.left
        q_child_desc = f"{q_child.key}" if q_child else "None"
        
        if qp.left == q:
            qp.left = q_child
            qp_side = "左"
        else:
            qp.right = q_child
            qp_side = "右"
            
        push_step(steps, head, f"【刪除 q】\n"
                               f"1. q 的父節點是 {qp.key}。\n"
                               f"2. q 指向 p 的指標被移除。\n"
                               f"3. q 的另一側子節點是 {q_child_desc}。\n"
                               f"4. 更新 {qp.key} 的{qp_side}指標，改指向 {q_child_desc}。",
                  highlight_node=qp, canvas_msg=f"刪除 q，父節點連至 {q_child_desc}")

    return steps, head
