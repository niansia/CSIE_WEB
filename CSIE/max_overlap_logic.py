import random

def generate_proof_steps():
    steps = []
    
    # 1. Generate random intervals
    # We want a nice distribution to show overlaps
    intervals = []
    num_intervals = 5
    min_val = 10
    max_val = 90
    
    for i in range(num_intervals):
        start = random.randint(min_val, max_val - 20)
        length = random.randint(10, 30)
        end = start + length
        intervals.append({"id": i, "start": start, "end": end, "y": i * 20 + 50}) # y for visualization layout
        
    # Sort endpoints
    endpoints = []
    for interval in intervals:
        endpoints.append({"val": interval["start"], "type": "start", "id": interval["id"]})
        endpoints.append({"val": interval["end"], "type": "end", "id": interval["id"]})
    
    endpoints.sort(key=lambda x: x["val"])
    
    # Calculate f(x) - overlap count
    # We can represent f(x) as a list of segments: [start, end, count]
    fx_segments = []
    current_overlap = 0
    
    # Iterate through sorted unique endpoints to build segments
    unique_points = sorted(list(set(e["val"] for e in endpoints)))
    
    for i in range(len(unique_points) - 1):
        p1 = unique_points[i]
        p2 = unique_points[i+1]
        mid = (p1 + p2) / 2
        
        count = 0
        for interval in intervals:
            if interval["start"] <= mid <= interval["end"]:
                count += 1
        
        fx_segments.append({
            "start": p1,
            "end": p2,
            "count": count
        })
        
    # Find max overlap
    max_overlap = 0
    for seg in fx_segments:
        if seg["count"] > max_overlap:
            max_overlap = seg["count"]
            
    max_points = [e["val"] for e in endpoints if any(s["count"] == max_overlap and (s["start"] == e["val"] or s["end"] == e["val"]) for s in fx_segments)]
    # Actually, we just need to check if an endpoint achieves the max overlap.
    # The count at an endpoint is technically defined by whether the interval is closed or open.
    # The problem usually assumes closed intervals [a, b].
    # If closed, count at start is +1, at end is still +1 (until after).
    # Let's assume standard interpretation: at point x, how many intervals [s, e] contain x.
    
    # Step 1: Show Intervals
    steps.append({
        "phase": "1",
        "msg": "1. 把所有區間畫在數線上。想像「同時覆蓋某一點的區間數量」是一個隨 $x$ 變化的函數 $f(x)$。",
        "intervals": intervals,
        "endpoints": [],
        "fx": [],
        "highlight": None
    })
    
    # Step 2: Show Endpoints
    steps.append({
        "phase": "2",
        "msg": "2. 標記出所有區間的端點 (Start/End)。函數 $f(x)$ 只會在這些端點處改變。",
        "intervals": intervals,
        "endpoints": endpoints,
        "fx": [],
        "highlight": None
    })
    
    # Step 3: Show f(x)
    steps.append({
        "phase": "3",
        "msg": "3. 繪製 $f(x)$。在任何兩個相鄰端點之間，覆蓋的區間集合完全一樣，所以 $f(x)$ 是常數。",
        "intervals": intervals,
        "endpoints": endpoints,
        "fx": fx_segments,
        "highlight": None
    })
    
    # Step 4: Highlight Max Regions
    max_segments = [s for s in fx_segments if s["count"] == max_overlap]
    steps.append({
        "phase": "4",
        "msg": f"4. 尋找最大值。圖中 $f(x)$ 的最大值為 {max_overlap}。它出現在某些區間段 $(e_j, e_{{j+1}})$ 上。",
        "intervals": intervals,
        "endpoints": endpoints,
        "fx": fx_segments,
        "highlight": {"type": "max_regions", "segments": max_segments}
    })
    
    # Step 5: Move to Endpoint
    # Pick one max segment
    target_seg = max_segments[0]
    steps.append({
        "phase": "5",
        "msg": f"5. 若最大值出現在開區間 $(e_j, e_{{j+1}})$ 裡，我們可以把點往左移到端點 $e_j$ (或往右移到 $e_{{j+1}}$)。",
        "intervals": intervals,
        "endpoints": endpoints,
        "fx": fx_segments,
        "highlight": {"type": "move_demo", "segment": target_seg}
    })
    
    # Step 6: Conclusion
    steps.append({
        "phase": "6",
        "msg": "6. 移動過程中，覆蓋它的區間集合完全沒變，所以 $f(e_j)$ 也同樣是最大值。因此，一定存在一個最大重疊點，它是某個區間的端點。",
        "intervals": intervals,
        "endpoints": endpoints,
        "fx": fx_segments,
        "highlight": {"type": "conclusion", "points": [target_seg["start"], target_seg["end"]]}
    })
    
    return steps
