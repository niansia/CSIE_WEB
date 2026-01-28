import patricia_logic
import json

def test():
    head = patricia_logic.Node(None, -1)
    print("Init Head:", head.key)
    
    # Insert 1000
    steps, head = patricia_logic.insert_with_steps(head, "1000")
    print(f"After insert 1000: Head key={head.key}, Steps={len(steps)}")
    
    last_step = steps[-1]
    layout = last_step["layout"]
    print("Nodes count:", len(layout["nodes"]))
    print("Edges count:", len(layout["edges"]))
    print("Nodes:", json.dumps(layout["nodes"], indent=2))
    
    # Insert 1010
    steps2, head = patricia_logic.insert_with_steps(head, "1010")
    print(f"After insert 1010: Steps={len(steps2)}")
    
    # Check a step in the middle (e.g. comparison)
    mid_step = steps2[3] # Arbitrary index
    layout_mid = mid_step["layout"]
    print("Mid step nodes count:", len(layout_mid["nodes"]))
    print("Mid step nodes:", json.dumps(layout_mid["nodes"], indent=2))

if __name__ == "__main__":
    test()
