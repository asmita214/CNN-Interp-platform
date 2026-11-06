import numpy as np
import torch
from models.sae import TopKSAE
import json
import hdbscan
import umap

device = torch.device("cpu")

sae = TopKSAE(input_dim=512, hidden_dim=4096, top_k=256).to(device)
sae.load_state_dict(torch.load("models/sae_topk_256.pth", map_location=device))
sae.eval()

feature_directions = sae.decoder.weight.detach().numpy().T

with open("data/feature_labels_full.json") as f:
    label_data = json.load(f)

label_by_id = {r["feature_id"]: r for r in label_data}
alive_ids = [fid for fid in range(4096) if label_by_id[fid]["label"] != "DEAD"]

alive_directions = feature_directions[alive_ids]
norms = np.linalg.norm(alive_directions, axis=1, keepdims=True)
normalized_directions = alive_directions / (norms + 1e-8)

cluster_reducer = umap.UMAP(n_neighbors=15, min_dist=0.0, n_components=10,
                             metric='cosine', random_state=42)
embedding_10d = cluster_reducer.fit_transform(normalized_directions)

clusterer = hdbscan.HDBSCAN(min_cluster_size=6, min_samples=3, metric='euclidean',
                             cluster_selection_method='eom')
cluster_labels = clusterer.fit_predict(embedding_10d)

n_clusters = len(set(cluster_labels)) - (1 if -1 in cluster_labels else 0)
n_noise = list(cluster_labels).count(-1)
print(f"Found {n_clusters} clusters, {n_noise} noise points")

viz_reducer = umap.UMAP(n_neighbors=15, min_dist=0.1, n_components=2,
                         metric='cosine', random_state=42)
embedding_2d = viz_reducer.fit_transform(normalized_directions)

atlas_data = []
for i, fid in enumerate(alive_ids):
    atlas_data.append({
        "feature_id": int(fid),
        "label": label_by_id[fid]["label"],
        "confidence": label_by_id[fid].get("confidence", "n/a"),
        "cluster": int(cluster_labels[i]),
        "x": float(embedding_2d[i][0]),
        "y": float(embedding_2d[i][1])
    })

with open("data/feature_atlas.json", "w") as f:
    json.dump(atlas_data, f, indent=2)

print("Saved atlas data to data/feature_atlas.json")