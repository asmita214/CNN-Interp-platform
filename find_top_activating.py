import h5py
import numpy as np

def get_top_activating_images(feature_vectors, feature_idx, image_idx_array, top_k=16):
    """
    feature_vectors: [N, 4096] array of SAE feature activations
    feature_idx: which of the 4096 features to inspect
    image_idx_array: [N] array mapping each row back to its source image
    """
    activations_for_feature = feature_vectors[:, feature_idx]
    top_indices = np.argsort(activations_for_feature)[-top_k:][::-1]

    results = []
    for idx in top_indices:
        results.append({
            "image_idx": int(image_idx_array[idx]),
            "activation_value": float(activations_for_feature[idx])
        })
    return results

# This will be wired up to real SAE output once training is done
print("Feature analysis function ready")