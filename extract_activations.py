import torch
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
from models.resnet import ResNetCIFAR

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# Load model
model = ResNetCIFAR(num_classes=10).to(device)
model.load_state_dict(torch.load("models/best_resnet_cifar.pth", map_location=device))
model.eval()

# --- Hook setup ---
activations = []

def hook_fn(module, input, output):
    # output shape: [batch, 512, 4, 4] - we'll store it as-is for now
    activations.append(output.detach().cpu())

hook_handle = model.layer4.register_forward_hook(hook_fn)

# --- Load a small batch of test data to try extraction on ---
transform_test = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616))
])

testset = torchvision.datasets.CIFAR10(root='./data', train=False, download=True, transform=transform_test)
testloader = DataLoader(testset, batch_size=16, shuffle=False)

images, labels = next(iter(testloader))
images = images.to(device)

with torch.no_grad():
    _ = model(images)

hook_handle.remove()

print("Number of activation batches captured:", len(activations))
print("Activation shape:", activations[0].shape)   