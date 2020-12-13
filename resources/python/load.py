import numpy as np
import json

# np.savez_compressed('B1.npz', array1=array1, array2=array2)
b = np.load('B1.npz')
print(b['vertices'])

flatten = lambda t: [item for sublist in t for item in sublist]


import json
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(flatten(b['vertices'].tolist()), f, ensure_ascii=False, indent=4)