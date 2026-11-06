import numpy as np
import torchvision
import torchvision.transforms as transforms
import matplotlib.pyplot as plt

data = np.load("data/test_sae_features.npz")
features = data["features"]       # [160000, 4096]
image_idx = data["image_idx"]     # [160000]
position_idx = data["position_idx"]
labels = data["labels"]

# Load raw (unnormalized) CIFAR-10 images for visualization
transform = transforms.Compose([transforms.ToTensor()])
testset = torchvision.datasets.CIFAR10(root='./data', train=False, download=True, transform=transform)
classes = ('plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck')

def show_top_activating(feature_id, top_k=12):
    activations_for_feature = features[:, feature_id]

    # Only consider rows where this feature actually fired
    nonzero_mask = activations_for_feature > 0
    print(f"Feature {feature_id} fires on {nonzero_mask.sum()} / {len(activations_for_feature)} positions "
          f"({100*nonzero_mask.mean():.2f}%)")

    if nonzero_mask.sum() == 0:
        print("This feature never fires - likely dead, pick another.")
        return

    top_indices = np.argsort(activations_for_feature)[-top_k:][::-1]

    fig, axes = plt.subplots(2, 6, figsize=(15, 5))
    fig.suptitle(f"Feature {feature_id} - Top {top_k} Activating Images")

    for i, idx in enumerate(top_indices):
        img_id = image_idx[idx]
        pos_id = position_idx[idx]
        act_val = activations_for_feature[idx]
        label = labels[idx]

        img, _ = testset[img_id]
        img_np = img.permute(1, 2, 0).numpy()

        row, col = divmod(i, 6)
        axes[row, col].imshow(img_np)
        axes[row, col].set_title(f"{classes[label]}\nact={act_val:.2f} pos={pos_id}", fontsize=9)
        axes[row, col].axis('off')

    plt.tight_layout()
    plt.savefig(f"feature_{feature_id}_inspection.png", dpi=100)
    plt.show()
    print(f"Saved visualization to feature_{feature_id}_inspection.png")

# Let's inspect a few different features to get a first impression
for fid in [0, 50, 100, 500, 1000]:
    show_top_activating(fid)
    print("---")