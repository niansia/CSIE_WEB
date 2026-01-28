# 111.py
# Patricia (Weiss threaded 版本) 視覺化：插入 / 刪除 / 自動播放 / 上一步 / 清除
# 小數字＝目的節點 bit；只對 child.bit > parent.bit 的連結畫直線，其餘為執行緒（自迴圈或長弧）

import tkinter as tk
from tkinter import ttk, messagebox

# ------------- Patricia 結構（Weiss） -------------

class Node:
    __slots__ = ("key", "bit", "left", "right")
    def __init__(self, key: str, bit: int):
        self.key = key
        self.bit = bit
        self.left = self
        self.right = self

class Head(Node):
    def __init__(self):
        # Horowitz: Head is a node. Initially empty or special?
        # We will handle the "Empty" state separately in App or use a flag.
        # But to match the structure, we can start with a dummy or None.
        # Let's use a flag in App to know if it's empty.
        pass

def bit_at(s: str, i: int) -> int:
    # Horowitz 1-based indexing
    # i=0 is reserved for Head (always Left)
    if i == 0: return 0 
    # i=1 corresponds to s[0]
    idx = i - 1
    return 0 if idx < 0 or idx >= len(s) else (1 if s[idx] == "1" else 0)

def first_diff_bit(a: str, b: str) -> int:
    # Returns 1-based index of first difference
    m = max(len(a), len(b))
    for i in range(m):
        if (a[i] if i < len(a) else '0') != (b[i] if i < len(b) else '0'): # Assuming padding with 0 or just compare
             # Actually Patricia keys are usually unique prefix-free or handled.
             # Simple comparison:
             pass
        if bit_at(a, i+1) != bit_at(b, i+1):
            return i + 1
    return m + 1 # Should not happen if keys unique

# ...existing code...


# ------------- 產生步驟（快照） -------------

def push_step(steps, head, msg, highlight_node=None, highlight_bit=None, key=None, check_idx=None, canvas_msg=None):
    steps.append({
        "snap": export_tree(head, highlight_node),
        "msg": msg,
        "hl_bit": highlight_bit,
        "key": key,
        "check_idx": check_idx,
        "canvas_msg": canvas_msg
    })

# ------------- 匯出 + 版面計算 + 繪圖 -------------

MARGIN_X = 120
MARGIN_Y = 160
LEVEL_GAP = 95
BASE_HGAP = 160

def export_tree(head, highlight_node=None):
    """輸出可視樹（只含真子樹）＋每個節點的兩個指標終點，用來畫執行緒弧線。"""
    # Horowitz: Head is the first node.
    # If head.key is None, empty.
    if head.key is None:
        return {"head_has_root": False}

    root = head # Start from Head
    
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

def draw_snapshot(canvas: tk.Canvas, step_data):
    canvas.delete("all")
    snap = step_data["snap"]
    hl_bit = step_data.get("hl_bit")
    key_str = step_data.get("key")
    check_idx = step_data.get("check_idx")
    canvas_msg = step_data.get("canvas_msg")
    
    # 1. 畫出 Canvas 上的簡易說明 (左上/中)
    if canvas_msg:
        canvas.create_text(20, 90, text=canvas_msg, anchor="w", font=("Taipei Sans TC Beta", 12, "bold"), fill="#0000aa")

    # 2. 畫出 Key Grid (左上固定位置)
    grid_centers = {} 
    if key_str:
        start_x, start_y = 20, 40
        box_w = 30
        
        canvas.create_text(start_x, start_y - 20, text="Input Key:", anchor="w", font=("Arial", 10, "bold"), fill="#555")

        for i, char in enumerate(key_str):
            idx = i + 1
            x = start_x + i * box_w
            
            is_checking = (check_idx is not None and idx == check_idx)
            bg = "#ffcccc" if is_checking else "#f0f0f0"
            outline = "red" if is_checking else "#999"
            width = 3 if is_checking else 1
            
            canvas.create_rectangle(x, start_y, x+box_w, start_y+box_w, fill=bg, outline=outline, width=width)
            canvas.create_text(x+box_w/2, start_y+box_w/2, text=char, font=("Consolas", 14, "bold"))
            
            # Index number
            canvas.create_text(x+box_w/2, start_y-8, text=str(idx), font=("Arial", 8), fill="#666")
            
            grid_centers[idx] = (x+box_w/2, start_y+box_w) 

            if is_checking:
                canvas.create_text(x+box_w/2, start_y-22, text="▼", fill="red", font=("Arial", 12))

    if not snap["head_has_root"]:
        return
    pos, root_id = layout_tree(snap)
    nodes = snap["nodes"]
    hl_id = snap.get("highlight_id")

    # 畫真子樹
    def draw_real(n):
        nid = n["id"]; x, y = pos[nid]
        w, h = 46, 24
        
        is_hl = (nid == hl_id)
        fill_color = "#ff9999" if is_hl else "#ffd966"
        outline_color = "red" if is_hl else "#555"
        outline_width = 4 if is_hl else 2
        
        canvas.create_oval(x-w, y-h, x+w, y+h, fill=fill_color, outline=outline_color, width=outline_width)
        canvas.create_text(x, y, text=nodes[nid].key, font=("Consolas", 12))
        
        bit_text_color = "red" if is_hl and hl_bit is not None else "#333"
        bit_font = ("Arial", 14, "bold") if is_hl and hl_bit is not None else ("Arial", 11, "bold")
        
        canvas.create_text(x, y-32, text=str(nodes[nid].bit), font=bit_font, fill=bit_text_color)

        for child, is_left in [(n["left"], True), (n["right"], False)]:
            if not child: continue
            cid = child["id"]; cx, cy = pos[cid]
            canvas.create_line(x, y, cx, cy, width=2, arrow=tk.LAST)
            
            label_txt = str(nodes[cid].bit)
            canvas.create_text((x+cx)/2, (y+cy)/2-12,
                               text=label_txt, font=("Arial",10,"bold"), fill="#222")
            draw_real(child)

    # 畫執行緒
    def draw_threads(n):
        nid = n["id"]; x, y = pos[nid]
        real_children = {n["left"]["id"] if n["left"] else None,
                         n["right"]["id"] if n["right"] else None}
        
        tid_l = n["ptrL"]
        if tid_l is not None and tid_l not in real_children:
            if tid_l == nid: 
                canvas.create_arc(x-50, y-10, x-10, y+30, start=120, extent=280, style=tk.ARC, width=2, outline="#888")
                canvas.create_line(x-18, y+25, x-10, y+15, width=2, arrow=tk.LAST, fill="#888") 
            else: 
                if tid_l in pos: tx, ty = pos[tid_l]
                else: tx, ty = x, y-90
                ctrlx, ctrly = (x+tx)/2 - 40, min(y, ty) - 60
                canvas.create_line(x, y, ctrlx, ctrly, tx, ty, smooth=True, width=2, arrow=tk.LAST, dash=(4,2), fill="#888")

        tid_r = n["ptrR"]
        if tid_r is not None and tid_r not in real_children:
            if tid_r == nid: 
                canvas.create_arc(x+10, y-10, x+50, y+30, start=-60, extent=280, style=tk.ARC, width=2, outline="#888")
                canvas.create_line(x+18, y+25, x+10, y+15, width=2, arrow=tk.LAST, fill="#888") 
            else: 
                if tid_r in pos: tx, ty = pos[tid_r]
                else: tx, ty = x, y-90
                ctrlx, ctrly = (x+tx)/2 + 40, min(y, ty) - 60
                canvas.create_line(x, y, ctrlx, ctrly, tx, ty, smooth=True, width=2, arrow=tk.LAST, dash=(4,2), fill="#888")

        if n["left"]:  draw_threads(n["left"])
        if n["right"]: draw_threads(n["right"])

    draw_real(snap["tree"])
    draw_threads(snap["tree"])

    rx, ry = pos[root_id]
    canvas.create_text(rx, ry-55, text="t", font=("Arial",12,"bold"))
    canvas.create_line(rx-40, ry-70, rx-10, ry-35, width=2, arrow=tk.LAST)

    # 3. 畫出連接箭頭 (Grid -> Node)
    if check_idx in grid_centers and hl_id in pos:
        gx, gy = grid_centers[check_idx]
        nx, ny = pos[hl_id]
        
        # 畫一條紅色虛線箭頭
        canvas.create_line(gx, gy, nx, ny-40, width=3, arrow=tk.LAST, fill="red", dash=(5, 3))
    
    # Update scrollregion
    canvas.config(scrollregion=canvas.bbox("all"))



# ------------- 搜尋 / 插入 / 刪除（步驟化） -------------

def pat_search(head: Node, key: str, steps=None, explain=False):
    # Horowitz search
    p = head
    # Decide first step based on head
    # Head is a real node (e.g. 1000, bit 0).
    # We check bit_at(key, head.bit).
    b = bit_at(key, head.bit)
    x = head.right if b else head.left
    
    if steps is not None and explain:
        push_step(steps, head, f"【搜尋開始】\n目標：{key}\n起點：Head ({head.key}, bit={head.bit})\n"
                               f"檢查 Key 第 {head.bit} 位元：'{b}' → 往{'右(1)' if b else '左(0)'}走。",
                  highlight_node=head, highlight_bit=head.bit, key=key, check_idx=head.bit,
                  canvas_msg=f"檢查 Bit {head.bit}：{b} → 往{'右' if b else '左'}")
    
    while p.bit < x.bit:
        p = x
        # Explanation of bit extraction
        idx = x.bit
        bit_val = bit_at(key, idx)
        
        direction = "右 (1)" if bit_val == 1 else "左 (0)"
        
        if steps is not None and explain:
            push_step(steps, head, 
                      f"【搜尋中】\n"
                      f"當前節點：{p.key} (bit={p.bit})\n"
                      f"動作：檢查 Key 的第 {idx} 位元\n"
                      f"數值：{key} 的第 {idx} 位是 '{bit_val}'\n"
                      f"決定：因為是 {bit_val}，所以往{direction}走。",
                      highlight_node=p, highlight_bit=p.bit, key=key, check_idx=idx,
                      canvas_msg=f"檢查 Bit {idx}：{bit_val} → 往{direction[0]}")
        
        x = x.right if bit_val else x.left
    
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
    x = head.right if b else head.left
    
    while p.bit < x.bit and x.bit < newbit:
        p = x
        b = bit_at(key, x.bit)
        x = x.right if b else x.left
    return p, x

def insert_with_steps(head: Node, key: str):
    steps = []
    if not key or any(c not in "01" for c in key):
        push_step(steps, head, "輸入錯誤：只允許 0/1 的非空字串。")
        return steps, head

    # Case 1: Empty Tree (Head is None or dummy)
    if head.key is None:
        # First insertion: Create Head with this key
        head.key = key
        head.bit = 0
        head.left = head
        head.right = head # Right pointer of Head loops to itself
        push_step(steps, head, f"空樹：建立 Head 節點「{key}」，bit=0。\nLeft->Self, Right->Self。",
                  canvas_msg="空樹：建立 Head 節點")
        return steps, head

    push_step(steps, head, f"準備插入「{key}」。\n第一步：先執行搜尋，看看這個 Key 是否已存在，或應該在哪裡停止。",
              canvas_msg=f"準備插入 {key}")

    # 1. Search
    t = pat_search(head, key, steps, explain=True)
    
    if t.key == key:
        push_step(steps, head, f"結果：鍵「{key}」已存在於樹中，不需插入。",
                  canvas_msg=f"鍵 {key} 已存在")
        return steps, head

    # 2. Find first diff bit
    d = first_diff_bit(t.key, key)
    newbit = d
    
    # Detailed explanation of diff
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

    # 3. Search again to find insertion point
    push_step(steps, head, f"【定位插入點】\n"
                           f"目標：找到一個父節點 p，滿足 p.bit < {newbit} 且 p 的子節點 bit >= {newbit}。\n"
                           f"方法：再次從 Head 開始搜尋，但只使用 Key 的前 {newbit-1} 位。",
                           key=key,
                           canvas_msg=f"重新搜尋，定位插入點 (Bit < {newbit})")
                           
    p, x = find_parent_for_bit(head, key, newbit)
    
    # Determine direction
    direction_str = "右 (1)" if bit_at(key, p.bit) else "左 (0)"
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
    
    # 4. Insert
    z = Node(key, newbit)
    
    # Setup z's children
    z_bit_val = bit_at(key, newbit)
    if z_bit_val == 0:
        z.left = z
        z.right = x
        z_dir_str = "左 (0)"
        x_dir_str = "右 (1)"
    else:
        z.right = z
        z.left = x
        z_dir_str = "右 (1)"
        x_dir_str = "左 (0)"
        
    # Attach z to p
    p_bit_val = bit_at(key, p.bit)
    
    # Special case: if p is head, we need to be careful.
    # But find_parent_for_bit logic handles p=head correctly.
    # If p=head (bit 0), and newbit=1.
    # p.bit < newbit.
    # We check bit_at(key, p.bit).
    
    if p_bit_val == 0:
        p.left = z
        p_side = "左 (0)"
    else:
        p.right = z
        p_side = "右 (1)"
        
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
    """Find the physical parent of target node in the tree structure."""
    if root is None or target is None: return None
    
    # Use a stack for DFS
    stack = [root]
    visited = {id(root)}
    
    while stack:
        curr = stack.pop()
        
        # Check children
        # Left
        if curr.left:
            if curr.left == target: return curr
            # Only push if it's a real child (not thread) and not visited
            if curr.left.bit > curr.bit and id(curr.left) not in visited:
                visited.add(id(curr.left))
                stack.append(curr.left)
        
        # Right
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

    # 1. Search
    y = pat_search(head, key, steps, explain=True)
    
    if y.key != key:
        push_step(steps, head, f"搜尋結果停在 {y.key}，與目標 {key} 不符。\n結論：鍵值不存在，無法刪除。",
                  highlight_node=y, canvas_msg="鍵值不存在")
        return steps, head
        
    p = y # The node to delete (conceptually)
    push_step(steps, head, f"找到目標節點 p：{p.key} (bit={p.bit})。\n準備執行刪除邏輯。",
              highlight_node=p, canvas_msg=f"找到目標 {p.key}")

    # Check for self-pointer (Case 1)
    has_self = (p.left == p or p.right == p)
    
    if has_self:
        # Case 1: p has self pointer
        push_step(steps, head, f"【刪除 Case 1】\n節點 p ({p.key}) 擁有指向自己的指標 (Self-Pointer)。\n"
                               f"處理方式：直接移除 p，並將父節點指向 p 的另一側子節點。",
                  highlight_node=p, canvas_msg="Case 1: 有 Self-Pointer")
        
        if p == head and p.left == p and p.right == p: # Single node case (Head points to self)
             # Actually head.left points to self.
             head = Node(None, -1) # Reset to empty
             push_step(steps, head, "p 是唯一的節點 (Head)。\n刪除後樹變為空。", canvas_msg="刪除完成：樹已空")
             return steps, head
             
        # Find physical parent of p
        pp = find_physical_parent(head, p)
        if not pp:
             # Should not happen unless p is head and we missed it
             if p == head:
                 head = Node(None, -1)
                 push_step(steps, head, "p 是 Head。\n刪除後樹變為空。", canvas_msg="刪除完成")
                 return steps, head
             push_step(steps, head, "錯誤：找不到 p 的父節點。", canvas_msg="錯誤")
             return steps, head
             
        # Determine which child to keep
        # If p.left is self, keep p.right. If p.right is self, keep p.left.
        child = p.right if p.left == p else p.left
        child_desc = f"{child.key}" if child else "None"
        
        # Update parent
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
        # Case 2: p has NO self pointer
        push_step(steps, head, f"【刪除 Case 2】\n節點 p ({p.key}) 沒有指向自己的指標。\n"
                               f"這表示 p 是某個回溯連結 (Thread) 的目標。\n"
                               f"步驟：\n"
                               f"1. 找到指向 p 的節點 q (Back-Edge Source)。\n"
                               f"2. 找到指向 q 的節點 r。\n"
                               f"3. 用 q 的資料取代 p，然後刪除 q。",
                  highlight_node=p, canvas_msg="Case 2: 無 Self-Pointer")
                  
        # Find q: The node that threads to p.
        # Search for p.key starting from p will lead to q.
        # We need to trace the search path.
        curr = p
        while True:
            b = bit_at(p.key, curr.bit)
            nxt = curr.right if b else curr.left
            if nxt == p: # Found the thread back to p
                q = curr
                break
            curr = nxt
            
        push_step(steps, head, f"【尋找 q】\n"
                               f"從 p 開始搜尋 {p.key}，最後會經由回溯連結回到 p。\n"
                               f"發出該連結的節點即為 q。\n"
                               f"找到 q：{q.key} (bit={q.bit})。",
                  highlight_node=q, canvas_msg=f"找到 q: {q.key}")

        # Find r: The node that threads to q.
        # Search for q.key starting from head.
        # The search stops at q. The node 'p' in pat_search logic (parent of stop node) is r?
        # No, pat_search returns x (the stop node). The loop condition p.bit < x.bit fails.
        # The last node visited before x is NOT necessarily the one threading to x.
        # Wait, if we search for q.key, we traverse the tree.
        # The search ends at q.
        # The node that has the link to q is the one we want.
        # Let's trace search for q.key.
        curr = head
        b = bit_at(q.key, head.bit)
        nxt = head.right if b else head.left
        
        # We need to find the node 'r' such that r points to q via a thread (or normal link? No, thread).
        # Actually, q is being deleted. q must be a leaf in the trie structure (or have a self loop? No, q points to p).
        # q has a thread to p. q's other link points to somewhere else.
        # q is reached by a normal link from its parent 'qp'.
        # But we need 'r' who has a BACK EDGE to q.
        # Why? "將r back edge指向p".
        # This implies q is also a target of a back edge?
        # Yes, if q replaces p, then whoever pointed to q (via back edge) must now point to p.
        # So we search for q.key. The search will end at q.
        # The node that leads to q via a back edge is r.
        
        # Let's find r.
        r_curr = head
        b = bit_at(q.key, head.bit)
        r_next = head.right if b else head.left
        
        while r_curr.bit < r_next.bit:
            r_curr = r_next
            b = bit_at(q.key, r_curr.bit)
            r_next = r_curr.right if b else r_curr.left
            
        r = r_curr # This is the node that points to q (and stops the search)
        
        push_step(steps, head, f"【尋找 r】\n"
                               f"搜尋 q.key ({q.key})，會停在 q。\n"
                               f"搜尋終止前的最後一個節點即為 r (指向 q 的來源)。\n"
                               f"找到 r：{r.key} (bit={r.bit})。",
                  highlight_node=r, canvas_msg=f"找到 r: {r.key}")
                  
        # Action (i): Copy q data to p
        old_p_key = p.key
        p.key = q.key
        # Note: p.bit remains same.
        
        push_step(steps, head, f"【取代資料】\n"
                               f"將 q 的鍵值 ({q.key}) 複製到 p ({old_p_key})。\n"
                               f"現在 p 變成了 {p.key}。",
                  highlight_node=p, canvas_msg=f"p 變更為 {p.key}")
                  
        # Action (ii): r back edge points to p
        # r points to q. Now r should point to p.
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

        # Action (iii): Delete q
        # Find physical parent of q
        qp = find_physical_parent(head, q)
        
        # q has a thread to p (which was old p, now p has q's key).
        # q's other child is the one we keep.
        # Wait, q points to p (the node we just updated).
        # So if q.left == p (the old p node), then keep q.right.
        # But we updated p.key. The object p is the same.
        # So we check if q.left is p.
        
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


# ------------- GUI -------------

class App:
    def __init__(self, master):
        self.master = master
        master.title("Patricia Trie 教學（自動播放 / 上一步 / 清除）")
        master.geometry("1260x770")

        self.head = Node(None, -1) # Empty tree marker
        self.steps = []; self.step_idx = -1
        self.playing = False; self.delay = 1500

        self._build_ui()
        self._draw_now("目前為空樹。第一次插入會建立 Head 節點。")

    def _build_ui(self):
        top = ttk.Frame(self.master); top.pack(side=tk.TOP, fill=tk.X, padx=10, pady=8)
        ttk.Label(top, text="輸入（0/1）：").pack(side=tk.LEFT)
        self.entry = ttk.Entry(top, width=40); self.entry.pack(side=tk.LEFT, padx=6)
        self.entry.bind("<Return>", lambda e: self.on_insert())
        ttk.Button(top, text="插入", command=self.on_insert).pack(side=tk.LEFT, padx=4)
        ttk.Button(top, text="刪除", command=self.on_delete).pack(side=tk.LEFT, padx=4)
        self.btn_prev = ttk.Button(top, text="⟲ 上一步", command=self.on_prev); self.btn_prev.pack(side=tk.LEFT, padx=(14,4))
        self.btn_next = ttk.Button(top, text="下一步 ▶", command=self.on_next); self.btn_next.pack(side=tk.LEFT, padx=4)
        self.btn_play = ttk.Button(top, text="⏵ 自動播放", command=self.toggle_play); self.btn_play.pack(side=tk.LEFT, padx=(14,4))
        ttk.Button(top, text="清除", command=self.on_clear).pack(side=tk.LEFT, padx=6)
        ttk.Button(top, text="說明", command=self.on_help).pack(side=tk.LEFT, padx=6)

        ttk.Label(top, text="播放速度(ms)：").pack(side=tk.LEFT, padx=(16,4))
        self.speed = tk.Scale(top, from_=300, to=1500, orient=tk.HORIZONTAL,
                              showvalue=True, length=210,
                              command=lambda v: self.set_speed(int(float(v))))
        self.speed.set(self.delay); self.speed.pack(side=tk.LEFT)

        mid = ttk.Frame(self.master); mid.pack(side=tk.TOP, fill=tk.BOTH, expand=True, padx=10, pady=6)
        
        # Canvas Frame with Scrollbars
        canvas_frame = ttk.Frame(mid)
        canvas_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        self.canvas = tk.Canvas(canvas_frame, bg="white")
        vbar = ttk.Scrollbar(canvas_frame, orient=tk.VERTICAL, command=self.canvas.yview)
        hbar = ttk.Scrollbar(canvas_frame, orient=tk.HORIZONTAL, command=self.canvas.xview)
        
        self.canvas.configure(xscrollcommand=hbar.set, yscrollcommand=vbar.set)
        
        # Grid layout for canvas and scrollbars
        self.canvas.grid(row=0, column=0, sticky="nsew")
        vbar.grid(row=0, column=1, sticky="ns")
        hbar.grid(row=1, column=0, sticky="ew")
        
        canvas_frame.grid_rowconfigure(0, weight=1)
        canvas_frame.grid_columnconfigure(0, weight=1)

        right = ttk.Frame(mid, width=420); right.pack(side=tk.LEFT, fill=tk.Y)
        ttk.Label(right, text="步驟解說（節點上方數字＝檢查 bit；虛線＝執行緒）",
                  font=("Taipei Sans TC Beta", 11, "bold")).pack(anchor="w", pady=(0,6))
        self.txt = tk.Text(right, width=56, wrap="word"); self.txt.pack(fill=tk.BOTH, expand=True)
        self.status = ttk.Label(self.master, anchor="w"); self.status.pack(side=tk.BOTTOM, fill=tk.X, padx=10, pady=4)

    def on_help(self):
        help_text = (
            "【Patricia Trie (Horowitz 版本) 操作說明】\n\n"
            "1. 輸入格式：\n"
            "   請輸入由 0 與 1 組成的二進位字串 (例如: 1000, 0010)。\n\n"
            "2. 節點結構：\n"
            "   每個節點包含 Key (鍵值) 與 Bit (檢查位元索引)。\n"
            "   Head 節點 (Bit=0) 為起始點，通常包含第一個插入的鍵值。\n\n"
            "3. 搜尋邏輯：\n"
            "   - 從當前節點的 Bit 屬性得知要檢查 Key 的第幾位。\n"
            "   - 若該位元為 0 → 往左走；若為 1 → 往右走。\n"
            "   - 終止條件：當下一個節點的 Bit Index 小於或等於當前節點時，停止搜尋。\n\n"
            "4. 插入邏輯：\n"
            "   (1) 先搜尋到底，找到最接近的現有 Key (稱為 t)。\n"
            "   (2) 比較 輸入Key 與 t，找出第一個不同的位元位置 d。\n"
            "   (3) 建立新節點，設定其 Bit = d。\n"
            "   (4) 重新搜尋，找到適當的父節點 p，使得 p.bit < d <= x.bit。\n"
            "   (5) 將新節點插入 p 與 x 之間。\n"
        )
        messagebox.showinfo("使用說明", help_text)

    def set_speed(self, v): self.delay = v

    def on_insert(self):
        s = self.entry.get().strip()
        self.entry.delete(0, tk.END)
        self.steps, self.head = insert_with_steps(self.head, s); self.step_idx = -1
        self.playing = True; self.btn_play.config(text="⏸ 暫停"); self._auto()

    def on_delete(self):
        s = self.entry.get().strip()
        self.entry.delete(0, tk.END)
        self.steps, self.head = delete_with_steps(self.head, s); self.step_idx = -1
        self.playing = True; self.btn_play.config(text="⏸ 暫停"); self._auto()

    def on_clear(self):
        if not messagebox.askyesno("清除確認", "確定要清空樹與步驟？"): return
        self.head = Head()
        # Horowitz: Head is a node, but initially empty.
        # We can use a fresh Head() which is a Node.
        # But our Head class is now just pass.
        # So self.head = Head() creates a Node-like object.
        # But Node __init__ requires key, bit.
        # We need to fix Head initialization.
        self.head = Node(None, -1) # Use None key to mark empty
        
        self.steps = []; self.step_idx = -1; self.playing = False
        self.btn_play.config(text="⏵ 自動播放")
        self._draw_now("已清除。")

    def on_prev(self):
        self.playing = False; self.btn_play.config(text="⏵ 自動播放")
        if not self.steps: return
        self.step_idx = max(0, self.step_idx-1); self._apply_step()

    def on_next(self):
        self.playing = False; self.btn_play.config(text="⏵ 自動播放")
        if not self.steps: return
        self.step_idx = min(len(self.steps)-1, self.step_idx+1); self._apply_step()

    def toggle_play(self):
        if not self.steps: return
        self.playing = not self.playing
        self.btn_play.config(text="⏸ 暫停" if self.playing else "⏵ 自動播放")
        if self.playing: self._auto()

    def _auto(self):
        if not self.playing or not self.steps: return
        if self.step_idx < len(self.steps)-1:
            self.step_idx += 1; self._apply_step()
            self.master.after(self.delay, self._auto)
        else:
            self.playing = False; self.btn_play.config(text="⏵ 自動播放")

    def _apply_step(self):
        st = self.steps[self.step_idx]
        draw_snapshot(self.canvas, st)
        self._set_msg(st["msg"])
        self.status.config(text=f"步驟 {self.step_idx+1}/{len(self.steps)}")

    def _set_msg(self, t):
        self.txt.delete("1.0", tk.END); self.txt.insert(tk.END, t)

    def _draw_now(self, msg):
        # draw_snapshot expects a step object with "snap" key
        dummy_step = {
            "snap": export_tree(self.head),
            "msg": msg,
            "hl_bit": None,
            "key": None,
            "check_idx": None,
            "canvas_msg": msg
        }
        draw_snapshot(self.canvas, dummy_step)
        if msg: self._set_msg(msg)

# ------------- 進入點 -------------

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.bind("<Return>", lambda e: app.on_insert())
    root.bind("<Control-Return>", lambda e: app.on_delete())
    root.bind("<Control-z>", lambda e: app.on_prev())
    root.bind("<Control-y>", lambda e: app.on_next())
    root.mainloop()
