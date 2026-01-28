from flask import Flask, render_template, jsonify, request
import patricia_logic
import rbtree_logic
import knapsack_logic
import steiner_logic
import hill_climbing_logic
import hungarian_logic
import max_overlap_logic
import rod_cutting_logic
import matrix_chain_logic
import currency_exchange_logic
import lcs_logic
import lis_logic
import obst_logic
import lps_logic
import dag_longest_path_logic
import bitonic_tsp_logic
import printing_neatly_logic
import med_logic
import viterbi_logic
import seam_carving_logic
import inventory_planning_logic
import spanning_tree_proof_logic
import bit_reversed_counter_logic
import unique_mst_logic
import min_weight_subset_logic
import mst_subgraph_logic
import mst_reduce_weight_logic

app = Flask(__name__)

# Global state for the demo (not thread-safe, good for single user demo)
HEAD = patricia_logic.Node(None, -1)
RB_TREE = rbtree_logic.RBTree()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/structure/patricia')
def patricia_page():
    return render_template('patricia.html')

@app.route('/structure/rbtree')
def rbtree_page():
    return render_template('rbtree.html')

@app.route('/algorithm/knapsack')
def knapsack_page():
    return render_template('knapsack.html')

@app.route('/algorithm/steiner')
def steiner_page():
    return render_template('steiner.html')

@app.route('/algorithm/hill_climbing')
def hill_climbing_page():
    return render_template('hill_climbing.html')

@app.route('/algorithm/hungarian')
def hungarian_page():
    return render_template('hungarian.html')

@app.route('/algorithm/rod_cutting')
def rod_cutting_page():
    return render_template('rod_cutting.html')

@app.route('/algorithm/matrix_chain')
def matrix_chain_page():
    return render_template('matrix_chain.html')

@app.route('/algorithm/lcs')
def lcs_page():
    return render_template('lcs.html')

@app.route('/algorithm/obst')
def obst_page():
    return render_template('obst.html')

@app.route('/algorithm/lis_proof')
def lis_proof_page():
    return render_template('lis_proof.html')

@app.route('/algorithm/max_overlap')
def max_overlap_page():
    return render_template('max_overlap.html')

@app.route('/algorithm/currency_exchange')
def currency_exchange_page():
    return render_template('currency_exchange.html')

@app.route('/api/patricia/init', methods=['POST'])
def init_tree():
    global HEAD
    HEAD = patricia_logic.Node(None, -1)
    # Return initial empty state
    steps = []
    patricia_logic.push_step(steps, HEAD, "已初始化空樹。", canvas_msg="初始化完成")
    return jsonify(steps)

@app.route('/api/rbtree/init', methods=['POST'])
def init_rbtree():
    global RB_TREE
    RB_TREE = rbtree_logic.RBTree()
    steps = []
    rbtree_logic.push_step(steps, RB_TREE, "已初始化空紅黑樹。", highlight_node=None)
    return jsonify(steps)

@app.route('/api/patricia/insert', methods=['POST'])
def insert_node():
    global HEAD
    data = request.json
    key = data.get('key')
    steps, HEAD = patricia_logic.insert_with_steps(HEAD, key)
    return jsonify(steps)

@app.route('/api/rbtree/insert', methods=['POST'])
def insert_rbtree_node():
    global RB_TREE
    data = request.json
    key = data.get('key')
    # Convert key to int for RB Tree usually, but string is fine if comparable.
    # CLRS usually uses numbers. Let's try to parse int, fallback to string.
    try:
        val = int(key)
    except:
        val = key
    steps = RB_TREE.insert(val)
    return jsonify(steps)

@app.route('/api/patricia/delete', methods=['POST'])
def delete_node():
    global HEAD
    data = request.json
    key = data.get('key')
    steps, HEAD = patricia_logic.delete_with_steps(HEAD, key)
    return jsonify(steps)

@app.route('/api/rbtree/delete', methods=['POST'])
def delete_rbtree_node():
    global RB_TREE
    data = request.json
    key = data.get('key')
    try:
        val = int(key)
    except:
        val = key
    steps = RB_TREE.delete(val)
    return jsonify(steps)

@app.route('/api/knapsack/run', methods=['POST'])
def knapsack_run():
    data = request.json
    capacity = data.get('capacity', 10)
    items = data.get('items', [])
    steps = knapsack_logic.solve_knapsack(capacity, items)
    return jsonify(steps)

@app.route('/api/steiner/run', methods=['POST'])
def steiner_run():
    data = request.json
    nodes = data.get('nodes', [])
    edges = data.get('edges', [])
    terminals = data.get('terminals', [])
    steps = steiner_logic.solve_steiner(nodes, edges, terminals)
    return jsonify(steps)

@app.route('/api/hill_climbing/simple', methods=['POST'])
def hill_climbing_simple():
    data = request.json
    nodes = data.get('nodes', [])
    edges = data.get('edges', [])
    start = data.get('start')
    goal = data.get('goal')
    steps = hill_climbing_logic.solve_simple_graph(nodes, edges, start, goal)
    return jsonify(steps)

@app.route('/api/hill_climbing/puzzle', methods=['POST'])
def hill_climbing_puzzle():
    data = request.json
    start = data.get('start')
    goal = data.get('goal')
    steps = hill_climbing_logic.solve_8puzzle(start, goal)
    return jsonify(steps)

@app.route('/api/hungarian', methods=['POST'])
def hungarian_run():
    data = request.json
    matrix = data.get('matrix', [])
    problem_type = data.get('problem_type', 'min')
    steps = hungarian_logic.solve_hungarian(matrix, problem_type)
    return jsonify(steps)

@app.route('/api/rod_cutting/run', methods=['POST'])
def rod_cutting_run():
    data = request.json
    n = data.get('n', 5)
    prices = data.get('prices', [])
    steps = rod_cutting_logic.solve_rod_cutting(n, prices)
    return jsonify(steps)

@app.route('/api/matrix_chain/run', methods=['POST'])
def matrix_chain_run():
    data = request.json
    dims = data.get('dims', [])
    steps = matrix_chain_logic.solve_matrix_chain(dims)
    return jsonify(steps)

@app.route('/api/lcs/run', methods=['POST'])
def lcs_run():
    data = request.json
    text1 = data.get('text1', "")
    text2 = data.get('text2', "")
    steps = lcs_logic.solve_lcs(text1, text2)
    return jsonify(steps)

@app.route('/api/lis_proof', methods=['GET'])
def lis_proof_run():
    steps = lis_logic.generate_lis_steps()
    return jsonify(steps)

@app.route('/api/max_overlap', methods=['GET'])
def max_overlap_run():
    steps = max_overlap_logic.generate_proof_steps()
    return jsonify(steps)

@app.route('/api/currency_exchange', methods=['GET'])
def currency_exchange_run():
    steps = currency_exchange_logic.generate_proof_steps()
    return jsonify(steps)

@app.route('/api/obst', methods=['POST'])
def obst_run():
    data = request.json
    p = data.get('p', [])
    q = data.get('q', None)
    result = obst_logic.solve_obst(p, q)
    return jsonify(result)

@app.route('/algorithm/lps')
def lps_page():
    return render_template('lps.html')

@app.route('/api/lps', methods=['POST'])
def lps_run():
    data = request.json
    text = data.get('text', "")
    steps = lps_logic.solve_lps(text)
    return jsonify({"steps": steps})

@app.route('/algorithm/dag_longest_path')
def dag_longest_path_page():
    return render_template('dag_longest_path.html')

@app.route('/api/dag_longest_path', methods=['GET'])
def dag_longest_path_run():
    steps = dag_longest_path_logic.generate_proof_steps()
    return jsonify(steps)

@app.route('/algorithm/bitonic_tsp')
def bitonic_tsp_page():
    return render_template('bitonic_tsp.html')

@app.route('/api/bitonic_tsp', methods=['GET'])
def bitonic_tsp_run():
    steps = bitonic_tsp_logic.solve_bitonic_tsp()
    return jsonify(steps)

@app.route('/algorithm/printing_neatly')
def printing_neatly_page():
    return render_template('printing_neatly.html')

@app.route('/printing_neatly/solve', methods=['POST'])
def printing_neatly_solve():
    data = request.get_json()
    text = data.get('text', '')
    M = int(data.get('M', 20))
    steps = printing_neatly_logic.solve_printing_neatly(text, M)
    return jsonify(steps)

@app.route('/algorithm/med')
def med_page():
    return render_template('med.html')

@app.route('/api/med', methods=['POST'])
def med_solve():
    data = request.get_json()
    s1 = data.get('s1', '')
    s2 = data.get('s2', '')
    steps = med_logic.solve_med(s1, s2)
    return jsonify(steps)

@app.route('/algorithm/viterbi')
def viterbi_page():
    return render_template('viterbi.html')

@app.route('/api/viterbi', methods=['POST'])
def viterbi_solve():
    steps = viterbi_logic.solve_viterbi()
    return jsonify(steps)

@app.route('/algorithm/seam_carving')
def seam_carving_page():
    return render_template('seam_carving.html')

@app.route('/api/seam_carving', methods=['POST'])
def seam_carving_solve():
    steps = seam_carving_logic.solve_seam_carving()
    return jsonify(steps)

@app.route('/algorithm/inventory_planning')
def inventory_planning_page():
    return render_template('inventory_planning.html')

@app.route('/api/inventory_planning', methods=['POST'])
def inventory_planning_solve():
    steps = inventory_planning_logic.solve_inventory_planning()
    return jsonify(steps)

@app.route('/proof/spanning_tree')
def spanning_tree_proof_page():
    return render_template('spanning_tree_proof.html')

@app.route('/api/spanning_tree_proof', methods=['POST'])
def spanning_tree_proof_solve():
    steps = spanning_tree_proof_logic.solve_spanning_tree_proof()
    return jsonify(steps)

@app.route('/algorithm/bit_reversed_counter')
def bit_reversed_counter_page():
    return render_template('bit_reversed_counter.html')

@app.route('/api/bit_reversed_counter', methods=['POST'])
def bit_reversed_counter_solve():
    steps = bit_reversed_counter_logic.solve_bit_reversed_counter()
    return jsonify(steps)

@app.route('/proof/unique_mst')
def unique_mst_page():
    return render_template('unique_mst.html')

@app.route('/api/unique_mst', methods=['POST'])
def unique_mst_solve():
    steps = unique_mst_logic.solve_unique_mst()
    return jsonify(steps)

@app.route('/proof/min_weight_subset')
def min_weight_subset_page():
    return render_template('min_weight_subset.html')

@app.route('/api/min_weight_subset', methods=['POST'])
def min_weight_subset_solve():
    steps = min_weight_subset_logic.solve_min_weight_subset()
    return jsonify(steps)

@app.route('/proof/mst_subgraph')
def mst_subgraph_page():
    return render_template('mst_subgraph.html')

@app.route('/api/mst_subgraph', methods=['POST'])
def mst_subgraph_solve():
    steps = mst_subgraph_logic.solve_mst_subgraph()
    return jsonify(steps)

@app.route('/proof/mst_reduce_weight')
def mst_reduce_weight_page():
    return render_template('mst_reduce_weight.html')

@app.route('/api/mst_reduce_weight', methods=['POST'])
def mst_reduce_weight_solve():
    steps = mst_reduce_weight_logic.solve_mst_reduce_weight()
    return jsonify(steps)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
