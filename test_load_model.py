import torch
from models.resnet import ResNetCIFAR

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

model = ResNetCIFAR(num_classes=10).to(device)
model.load_state_dict(torch.load("models/best_resnet_cifar.pth", map_location=device))
model.eval()

print("Model loaded successfully")
print("Total parameters:", sum(p.numel() for p in model.parameters()))