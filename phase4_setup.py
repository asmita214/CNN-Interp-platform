import torch
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
from models.resnet import ResNetCIFAR
from models.sae import TopKSAE

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# --- Load CNN ---
cnn = ResNetCIFAR(num_classes=10).to(device)
cnn.load_state_dict(torch.load("models/best_resnet_cifar.pth", map_location=device))
cnn.eval()

# --- Load SAE ---
sae = TopKSAE(input_dim=512, hidden_dim=4096, top_k=256).to(device)
sae.load_state_dict(torch.load("models/sae_topk_256.pth", map_location=device))
sae.eval()

# --- Load normalization stats ---
norm_stats = torch.load("models/sae_activation_normalization.pth", map_location=device)
activation_mean = norm_stats["mean"].to(device)
activation_std = norm_stats["std"].to(device)

# --- Load feature frequencies (from training) ---
feature_frequencies = torch.load("models/sae_feature_frequencies.pt", map_location=device)

print("CNN loaded:", sum(p.numel() for p in cnn.parameters()), "params")
print("SAE loaded:", sum(p.numel() for p in sae.parameters()), "params")
print("Activation mean shape:", activation_mean.shape)
print("Activation std shape:", activation_std.shape)
print("Feature frequencies shape:", feature_frequencies.shape)
print("Alive features (freq > 0.001):", (feature_frequencies > 0.001).sum().item())

# --- Load CIFAR-10 test set for analysis ---
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616))
])
testset = torchvision.datasets.CIFAR10(root='./data', train=False, download=True, transform=transform)
classes = ('plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck')

print("Test set size:", len(testset))