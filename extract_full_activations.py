import torch
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
from models.resnet import ResNetCIFAR
import h5py
import numpy as np
from tqdm import tqdm

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

model = ResNetCIFAR(num_classes=10).to(device)
model.load_state_dict(torch.load("models/best_resnet_cifar.pth", map_location=device))
model.eval()

# Hook setup
captured = {}
def hook_fn(module, input, output):
    captured["activations"] = output.detach().cpu()

hook_handle = model.layer4.register_forward_hook(hook_fn)

transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616))
])

trainset = torchvision.datasets.CIFAR10(root='./data', train=True, download=True, transform=transform)
# No shuffle - we want to keep track of which image/position each activation came from
loader = DataLoader(trainset, batch_size=128, shuffle=False)

# Pre-calculate total size: 50000 images * 16 positions (4x4) = 800,000 vectors of dim 512
total_vectors = len(trainset) * 4 * 4
feature_dim = 512

print(f"Will extract {total_vectors} activation vectors of dimension {feature_dim}")
print(f"Estimated storage size: {(total_vectors * feature_dim * 4) / (1024**3):.2f} GB")

# Create HDF5 file for efficient storage
with h5py.File("data/activations.h5", "w") as f:
    dset = f.create_dataset("activations", shape=(total_vectors, feature_dim), dtype="float32")
    # Also store metadata: which image index and which spatial position each row came from
    img_idx_dset = f.create_dataset("image_idx", shape=(total_vectors,), dtype="int32")
    pos_idx_dset = f.create_dataset("position_idx", shape=(total_vectors,), dtype="int32")
    label_dset = f.create_dataset("labels", shape=(total_vectors,), dtype="int32")

    write_ptr = 0
    img_counter = 0

    with torch.no_grad():
        for images, labels in tqdm(loader, desc="Extracting activations"):
            images = images.to(device)
            _ = model(images)

            batch_acts = captured["activations"]   # [batch, 512, 4, 4]
            batch_size = batch_acts.shape[0]

            # Reshape: [batch, 512, 4, 4] -> [batch, 4, 4, 512] -> [batch*16, 512]
            batch_acts = batch_acts.permute(0, 2, 3, 1).reshape(-1, feature_dim)
            n_vectors = batch_acts.shape[0]

            dset[write_ptr:write_ptr + n_vectors] = batch_acts.numpy()

            # Fill metadata
            for i in range(batch_size):
                for pos in range(16):
                    img_idx_dset[write_ptr] = img_counter + i
                    pos_idx_dset[write_ptr] = pos
                    label_dset[write_ptr] = labels[i].item()
                    write_ptr += 1

            img_counter += batch_size

hook_handle.remove()
print("Done. Total vectors written:", write_ptr)