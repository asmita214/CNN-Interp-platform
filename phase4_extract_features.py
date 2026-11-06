import torch
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
from models.resnet import ResNetCIFAR
from models.sae import TopKSAE
import numpy as np
from tqdm import tqdm

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

cnn = ResNetCIFAR(num_classes=10).to(device)
cnn.load_state_dict(torch.load("models/best_resnet_cifar.pth", map_location=device))
cnn.eval()

sae = TopKSAE(input_dim=512, hidden_dim=4096, top_k=256).to(device)
sae.load_state_dict(torch.load("models/sae_topk_256.pth", map_location=device))
sae.eval()

norm_stats = torch.load("models/sae_activation_normalization.pth", map_location=device)
activation_mean = norm_stats["mean"].to(device)
activation_std = norm_stats["std"].to(device)

# Hook to grab layer4 activations
captured = {}
def hook_fn(module, input, output):
    captured["activations"] = output.detach()

hook_handle = cnn.layer4.register_forward_hook(hook_fn)

transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616))
])
testset = torchvision.datasets.CIFAR10(root='./data', train=False, download=True, transform=transform)
loader = DataLoader(testset, batch_size=128, shuffle=False)

all_features = []      # SAE feature activations: [N*16, 4096]
all_image_idx = []     # which image each row came from
all_position_idx = []  # which spatial position (0-15)
all_labels = []

img_counter = 0

with torch.no_grad():
    for images, labels in tqdm(loader, desc="Extracting SAE features"):
        images = images.to(device)
        _ = cnn(images)

        acts = captured["activations"]  # [batch, 512, 4, 4]
        batch_size = acts.shape[0]

        # Reshape to [batch*16, 512], same as training extraction
        acts = acts.permute(0, 2, 3, 1).reshape(-1, 512)

        # CRITICAL: normalize using the SAME mean/std from training
        acts_normalized = (acts - activation_mean) / activation_std

        _, features = sae(acts_normalized)  # [batch*16, 4096]

        all_features.append(features.cpu().numpy())

        for i in range(batch_size):
            for pos in range(16):
                all_image_idx.append(img_counter + i)
                all_position_idx.append(pos)
                all_labels.append(labels[i].item())

        img_counter += batch_size

hook_handle.remove()

all_features = np.concatenate(all_features, axis=0)
all_image_idx = np.array(all_image_idx)
all_position_idx = np.array(all_position_idx)
all_labels = np.array(all_labels)

print("Feature matrix shape:", all_features.shape)
print("Image idx shape:", all_image_idx.shape)

np.savez("data/test_sae_features.npz",
         features=all_features,
         image_idx=all_image_idx,
         position_idx=all_position_idx,
         labels=all_labels)

print("Saved to data/test_sae_features.npz") 