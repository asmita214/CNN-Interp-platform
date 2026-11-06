import numpy as np
import json

data = np.load("data/test_sae_features.npz")
features = data["features"]      # [160000, 4096]
image_idx = data["image_idx"]
position_idx = data["position_idx"]

lookup = {}
for feature_id in range(4096):
    activations_for_feature = features[:, feature_id]
    if (activations_for_feature > 0).sum() == 0:
        continue
    top_indices = np.argsort(activations_for_feature)[-12:][::-1]
    lookup[str(feature_id)] = [
        {"image_idx": int(image_idx[idx]), "position": int(position_idx[idx]),
         "activation": float(activations_for_feature[idx])}
        for idx in top_indices
    ]

with open("data/feature_image_lookup.json", "w") as f:
    json.dump(lookup, f)

print("Saved lookup for", len(lookup), "features")