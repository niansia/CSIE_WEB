import enum

class Color(enum.Enum):
    RED = "RED"
    BLACK = "BLACK"

class Node:
    def __init__(self, key, color=Color.BLACK, left=None, right=None, p=None):
        self.key = key
        self.color = color
        self.left = left
        self.right = right
        self.p = p
        # Unique ID for frontend tracking
        self.uid = id(self)

# ------------- Visualization Helpers -------------

def push_step(steps, tree, msg, highlight_node=None, canvas_msg=None, rotation=None):
    steps.append({
        "snap": export_tree(tree, highlight_node),
        "msg": msg,
        "canvas_msg": canvas_msg,
        "rotation": rotation
    })

def export_tree(tree, highlight_node=None):
    if tree.root == tree.nil:
        return {"root_id": None, "nodes": [], "edges": []}
    
    nodes = []
    edges = []
    
    # BFS or DFS to traverse
    # We need to calculate positions. Simple layout:
    # Inorder traversal for X, Depth for Y.
    
    pos = {}
    x_counter = [0]
    
    def inorder(u, depth):
        if u == tree.nil:
            return
        inorder(u.left, depth + 1)
        
        # Assign pos
        # Shift Y down by 100px to make room for canvas_msg at the top
        pos[u.uid] = {"x": x_counter[0] * 50 + 50, "y": depth * 60 + 150}
        x_counter[0] += 1
        
        inorder(u.right, depth + 1)
        
    inorder(tree.root, 0)
    
    # Generate nodes and edges list
    stack = [tree.root]
    visited = {tree.root.uid}
    
    while stack:
        u = stack.pop()
        p = pos[u.uid]
        
        nodes.append({
            "id": str(u.uid),
            "key": str(u.key),
            "color": u.color.value,
            "x": p["x"],
            "y": p["y"],
            "is_highlight": (u == highlight_node)
        })
        
        if u.left != tree.nil:
            edges.append({"u": str(u.uid), "v": str(u.left.uid)})
            stack.append(u.left)
            
        if u.right != tree.nil:
            edges.append({"u": str(u.uid), "v": str(u.right.uid)})
            stack.append(u.right)
            
    return {"root_id": str(tree.root.uid) if tree.root != tree.nil else None, "nodes": nodes, "edges": edges}

class RBTree:
    def __init__(self):
        self.nil = Node(key=None, color=Color.BLACK)
        self.nil.left = self.nil
        self.nil.right = self.nil
        self.root = self.nil

    def get_root(self):
        return self.root

    def left_rotate(self, x, steps=None):
        y = x.right
        x.right = y.left
        if y.left != self.nil:
            y.left.p = x
        y.p = x.p
        if x.p == self.nil:
            self.root = y
        elif x == x.p.left:
            x.p.left = y
        else:
            x.p.right = y
        y.left = x
        x.p = y
        if steps is not None:
            push_step(steps, self, f"左旋 (Left Rotate) 節點 {x.key}。\n{x.key} 變為 {y.key} 的左子節點。", highlight_node=x, canvas_msg=f"左旋 {x.key}", rotation={"type": "left", "id": str(x.uid)})

    def right_rotate(self, y, steps=None):
        x = y.left
        y.left = x.right
        if x.right != self.nil:
            x.right.p = y
        x.p = y.p
        if y.p == self.nil:
            self.root = x
        elif y == y.p.right:
            y.p.right = x
        else:
            y.p.left = x
        x.right = y
        y.p = x
        if steps is not None:
            push_step(steps, self, f"右旋 (Right Rotate) 節點 {y.key}。\n{y.key} 變為 {x.key} 的右子節點。", highlight_node=y, canvas_msg=f"右旋 {y.key}", rotation={"type": "right", "id": str(y.uid)})

    def insert(self, key):
        steps = []
        if key is None or key == "":
            return steps
            
        z = Node(key, color=Color.RED)
        z.left = self.nil
        z.right = self.nil
        
        y = self.nil
        x = self.root
        
        push_step(steps, self, f"準備插入 {key}。\n從根節點開始尋找插入位置。", highlight_node=x if x != self.nil else None, canvas_msg=f"準備插入 {key}")

        while x != self.nil:
            y = x
            if z.key < x.key:
                x = x.left
                push_step(steps, self, f"{z.key} < {y.key}，往左走。", highlight_node=y, canvas_msg=f"{z.key} < {y.key} → 左")
            elif z.key > x.key:
                x = x.right
                push_step(steps, self, f"{z.key} > {y.key}，往右走。", highlight_node=y, canvas_msg=f"{z.key} > {y.key} → 右")
            else:
                push_step(steps, self, f"鍵值 {key} 已存在，不執行插入。", highlight_node=y, canvas_msg="鍵值已存在")
                return steps # Duplicate

        z.p = y
        if y == self.nil:
            self.root = z
            push_step(steps, self, f"樹為空，{key} 成為根節點 (設為黑色)。", highlight_node=z, canvas_msg="樹空，設為根節點")
        elif z.key < y.key:
            y.left = z
            push_step(steps, self, f"到達葉節點，{key} 插入在 {y.key} 的左邊 (紅色)。", highlight_node=z, canvas_msg=f"插入 {y.key} 左側")
        else:
            y.right = z
            push_step(steps, self, f"到達葉節點，{key} 插入在 {y.key} 的右邊 (紅色)。", highlight_node=z, canvas_msg=f"插入 {y.key} 右側")
            
        z.color = Color.RED
        
        self.insert_fixup(z, steps)
        return steps

    def insert_fixup(self, z, steps):
        push_step(steps, self, "開始修正 (Fixup) 紅黑樹性質。", highlight_node=z, canvas_msg="開始修正")
        
        while z.p.color == Color.RED:
            if z.p == z.p.p.left:
                y = z.p.p.right
                if y.color == Color.RED:
                    # Case 1
                    z.p.color = Color.BLACK
                    y.color = Color.BLACK
                    z.p.p.color = Color.RED
                    push_step(steps, self, 
                              f"【Case 1: 叔叔是紅色】\n"
                              f"父節點 ({z.p.key}) 與叔叔 ({y.key}) 都是紅色。\n"
                              f"動作：將父與叔叔設為黑色，祖父 ({z.p.p.key}) 設為紅色。\n"
                              f"關注點上移至祖父。", 
                              highlight_node=z.p.p, canvas_msg="Case 1: 叔叔紅 -> 變色")
                    z = z.p.p
                else:
                    if z == z.p.right:
                        # Case 2
                        z = z.p
                        push_step(steps, self, 
                                  f"【Case 2: 叔叔黑，三角形 (LR)】\n"
                                  f"叔叔是黑色，且當前節點 ({z.right.key}) 是父節點 ({z.key}) 的右子 (LR 型)。\n"
                                  f"動作：對父節點 ({z.key}) 進行左旋，轉成直線型 (Case 3)。", 
                                  highlight_node=z, canvas_msg="Case 2: LR -> 左旋", rotation={"type": "left", "id": str(z.uid)})
                        self.left_rotate(z, steps)
                    # Case 3
                    z.p.color = Color.BLACK
                    z.p.p.color = Color.RED
                    push_step(steps, self, 
                              f"【Case 3: 叔叔黑，直線 (LL)】\n"
                              f"叔叔是黑色，且當前節點 ({z.key}) 是父節點 ({z.p.key}) 的左子 (LL 型)。\n"
                              f"動作：父節點設黑，祖父設紅，對祖父 ({z.p.p.key}) 進行右旋。", 
                              highlight_node=z.p, canvas_msg="Case 3: LL -> 右旋+變色", rotation={"type": "right", "id": str(z.p.p.uid)})
                    self.right_rotate(z.p.p, steps)
            else:
                # Mirror of above
                y = z.p.p.left
                if y.color == Color.RED:
                    # Case 1
                    z.p.color = Color.BLACK
                    y.color = Color.BLACK
                    z.p.p.color = Color.RED
                    push_step(steps, self, 
                              f"【Case 1: 叔叔是紅色】\n"
                              f"父節點 ({z.p.key}) 與叔叔 ({y.key}) 都是紅色。\n"
                              f"動作：將父與叔叔設為黑色，祖父 ({z.p.p.key}) 設為紅色。\n"
                              f"關注點上移至祖父。", 
                              highlight_node=z.p.p, canvas_msg="Case 1: 叔叔紅 -> 變色")
                    z = z.p.p
                else:
                    if z == z.p.left:
                        # Case 2
                        z = z.p
                        push_step(steps, self, 
                                  f"【Case 2: 叔叔黑，三角形 (RL)】\n"
                                  f"叔叔是黑色，且當前節點 ({z.left.key}) 是父節點 ({z.key}) 的左子 (RL 型)。\n"
                                  f"動作：對父節點 ({z.key}) 進行右旋，轉成直線型 (Case 3)。", 
                                  highlight_node=z, canvas_msg="Case 2: RL -> 右旋", rotation={"type": "right", "id": str(z.uid)})
                        self.right_rotate(z, steps)
                    # Case 3
                    z.p.color = Color.BLACK
                    z.p.p.color = Color.RED
                    push_step(steps, self, 
                              f"【Case 3: 叔叔黑，直線 (RR)】\n"
                              f"叔叔是黑色，且當前節點 ({z.key}) 是父節點 ({z.p.key}) 的右子 (RR 型)。\n"
                              f"動作：父節點設黑，祖父設紅，對祖父 ({z.p.p.key}) 進行左旋。", 
                              highlight_node=z.p, canvas_msg="Case 3: RR -> 左旋+變色", rotation={"type": "left", "id": str(z.p.p.uid)})
                    self.left_rotate(z.p.p, steps)
                    
        self.root.color = Color.BLACK
        push_step(steps, self, "修正結束，確保根節點為黑色。", highlight_node=self.root, canvas_msg="修正結束")

    def transplant(self, u, v):
        if u.p == self.nil:
            self.root = v
        elif u == u.p.left:
            u.p.left = v
        else:
            u.p.right = v
        v.p = u.p

    def tree_minimum(self, x):
        while x.left != self.nil:
            x = x.left
        return x

    def delete(self, key):
        steps = []
        z = self.root
        while z != self.nil:
            if key == z.key:
                break
            elif key < z.key:
                z = z.left
            else:
                z = z.right
        
        if z == self.nil:
            push_step(steps, self, f"找不到鍵值 {key}，無法刪除。", canvas_msg="找不到鍵值")
            return steps
            
        push_step(steps, self, f"找到節點 {key}，準備刪除。", highlight_node=z, canvas_msg=f"找到 {key}")
        
        y = z
        y_original_color = y.color
        x = self.nil
        
        if z.left == self.nil:
            x = z.right
            self.transplant(z, z.right)
            push_step(steps, self, f"{z.key} 沒有左子節點，直接用右子節點取代。", highlight_node=x, canvas_msg="無左子，右子取代")
        elif z.right == self.nil:
            x = z.left
            self.transplant(z, z.left)
            push_step(steps, self, f"{z.key} 沒有右子節點，直接用左子節點取代。", highlight_node=x, canvas_msg="無右子，左子取代")
        else:
            y = self.tree_minimum(z.right)
            y_original_color = y.color
            x = y.right
            if y.p == z:
                x.p = y
            else:
                self.transplant(y, y.right)
                y.right = z.right
                y.right.p = y
            
            self.transplant(z, y)
            y.left = z.left
            y.left.p = y
            y.color = z.color
            push_step(steps, self, f"{z.key} 有兩個子節點，用後繼者 {y.key} 取代。", highlight_node=y, canvas_msg=f"用後繼 {y.key} 取代")

        if y_original_color == Color.BLACK:
            push_step(steps, self, f"被刪除或移動的節點是黑色，需要修正 (Fixup)。", highlight_node=x, canvas_msg="刪除黑色 -> 修正")
            self.delete_fixup(x, steps)
        else:
            push_step(steps, self, f"被刪除或移動的節點是紅色，不破壞性質，無需修正。", canvas_msg="刪除紅色 -> 無需修正")
            
        return steps

    def delete_fixup(self, x, steps):
        while x != self.root and x.color == Color.BLACK:
            if x == x.p.left:
                w = x.p.right
                if w.color == Color.RED:
                    # Case 1
                    w.color = Color.BLACK
                    x.p.color = Color.RED
                    push_step(steps, self, 
                              f"【Case 1: 兄弟是紅色】\n"
                              f"兄弟節點 w ({w.key}) 是紅色。\n"
                              f"動作：兄弟設黑，父設紅，對父節點 ({x.p.key}) 左旋。\n"
                              f"目的：將情況轉為兄弟是黑色的 Case 2, 3, 或 4。", 
                              highlight_node=w, canvas_msg="Case 1: 兄弟紅 -> 左旋", rotation={"type": "left", "id": str(x.p.uid)})
                    self.left_rotate(x.p, steps)
                    w = x.p.right
                
                if w.left.color == Color.BLACK and w.right.color == Color.BLACK:
                    # Case 2
                    w.color = Color.RED
                    x = x.p
                    push_step(steps, self, 
                              f"【Case 2: 兄弟黑，姪子全黑】\n"
                              f"兄弟 w ({w.key}) 是黑色，且兩個姪子都是黑色。\n"
                              f"動作：將兄弟設為紅色，將雙重黑色 (Double Black) 上移給父節點。\n"
                              f"關注點上移至父節點 ({x.key})。", 
                              highlight_node=x, canvas_msg="Case 2: 姪子全黑 -> 兄弟變紅")
                else:
                    if w.right.color == Color.BLACK:
                        # Case 3
                        w.left.color = Color.BLACK
                        w.color = Color.RED
                        push_step(steps, self, 
                                  f"【Case 3: 兄弟黑，近姪子紅】\n"
                                  f"兄弟 w ({w.key}) 是黑色，左姪子 (近) 是紅色，右姪子 (遠) 是黑色。\n"
                                  f"動作：左姪子設黑，兄弟設紅，對兄弟 ({w.key}) 右旋。\n"
                                  f"目的：轉成 Case 4。", 
                                  highlight_node=w, canvas_msg="Case 3: 近姪子紅 -> 右旋", rotation={"type": "right", "id": str(w.uid)})
                        self.right_rotate(w, steps)
                        w = x.p.right
                    
                    # Case 4
                    w.color = x.p.color
                    x.p.color = Color.BLACK
                    w.right.color = Color.BLACK
                    push_step(steps, self, 
                              f"【Case 4: 兄弟黑，遠姪子紅】\n"
                              f"兄弟 w ({w.key}) 是黑色，右姪子 (遠) 是紅色。\n"
                              f"動作：兄弟設為父節點顏色，父節點設黑，右姪子設黑，對父節點 ({x.p.key}) 左旋。\n"
                              f"目的：消除雙重黑色，修正完成。", 
                              highlight_node=x.p, canvas_msg="Case 4: 遠姪子紅 -> 左旋", rotation={"type": "left", "id": str(x.p.uid)})
                    self.left_rotate(x.p, steps)
                    x = self.root
            else:
                # Mirror
                w = x.p.left
                if w.color == Color.RED:
                    # Case 1
                    w.color = Color.BLACK
                    x.p.color = Color.RED
                    push_step(steps, self, 
                              f"【Case 1: 兄弟是紅色】\n"
                              f"兄弟節點 w ({w.key}) 是紅色。\n"
                              f"動作：兄弟設黑，父設紅，對父節點 ({x.p.key}) 右旋。\n"
                              f"目的：將情況轉為兄弟是黑色的 Case 2, 3, 或 4。", 
                              highlight_node=w, canvas_msg="Case 1: 兄弟紅 -> 右旋", rotation={"type": "right", "id": str(x.p.uid)})
                    self.right_rotate(x.p, steps)
                    w = x.p.left
                
                if w.right.color == Color.BLACK and w.left.color == Color.BLACK:
                    # Case 2
                    w.color = Color.RED
                    x = x.p
                    push_step(steps, self, 
                              f"【Case 2: 兄弟黑，姪子全黑】\n"
                              f"兄弟 w ({w.key}) 是黑色，且兩個姪子都是黑色。\n"
                              f"動作：將兄弟設為紅色，將雙重黑色 (Double Black) 上移給父節點。\n"
                              f"關注點上移至父節點 ({x.key})。", 
                              highlight_node=x, canvas_msg="Case 2: 姪子全黑 -> 兄弟變紅")
                else:
                    if w.left.color == Color.BLACK:
                        # Case 3
                        w.right.color = Color.BLACK
                        w.color = Color.RED
                        push_step(steps, self, 
                                  f"【Case 3: 兄弟黑，近姪子紅】\n"
                                  f"兄弟 w ({w.key}) 是黑色，右姪子 (近) 是紅色，左姪子 (遠) 是黑色。\n"
                                  f"動作：右姪子設黑，兄弟設紅，對兄弟 ({w.key}) 左旋。\n"
                                  f"目的：轉成 Case 4。", 
                                  highlight_node=w, canvas_msg="Case 3: 近姪子紅 -> 左旋", rotation={"type": "left", "id": str(w.uid)})
                        self.left_rotate(w, steps)
                        w = x.p.left
                    
                    # Case 4
                    w.color = x.p.color
                    x.p.color = Color.BLACK
                    w.left.color = Color.BLACK
                    push_step(steps, self, 
                              f"【Case 4: 兄弟黑，遠姪子紅】\n"
                              f"兄弟 w ({w.key}) 是黑色，左姪子 (遠) 是紅色。\n"
                              f"動作：兄弟設為父節點顏色，父節點設黑，左姪子設黑，對父節點 ({x.p.key}) 右旋。\n"
                              f"目的：消除雙重黑色，修正完成。", 
                              highlight_node=x.p, canvas_msg="Case 4: 遠姪子紅 -> 右旋", rotation={"type": "right", "id": str(x.p.uid)})
                    self.right_rotate(x.p, steps)
                    x = self.root
                    
        x.color = Color.BLACK
        push_step(steps, self, "修正結束，將 x 設為黑色。", highlight_node=x, canvas_msg="修正結束")
