import h5py

with h5py.File("data/activations.h5", "r") as f:
    print("Activations shape:", f["activations"].shape)
    print("Sample activation vector (first 10 values):", f["activations"][0][:10])
    print("Image idx sample:", f["image_idx"][:5])
    print("Position idx sample:", f["position_idx"][:5])
    print("Labels sample:", f["labels"][:5])