# Runs the real RandomGen (weighted-draw-engine) over the cases written by weighted-draw-parity.mjs.
import sys, json, random
sys.path.insert(0, sys.argv[1])
from random_number_generator import RandomGen
cases = json.load(open(sys.argv[2]))
draws = [0.005, 0.01, 0.0100001, 0.125, 0.3, 0.31, 0.315, 0.5, 0.875, 0.88, 0.885, 0.89, 0.995, 0.999]
out = []
for nums, probs in cases:
    probs = [float(p) for p in probs]
    try:
        g = RandomGen(nums, probs)
        res = []
        for d in draws:
            random.random = lambda d=d: d
            try: res.append(g.next_num())
            except IndexError: res.append("IndexError")
        out.append({"ok": res, "cum": g._cumulative_probabilities})
    except ValueError as e:
        out.append({"err": str(e)})
print(json.dumps(out))
