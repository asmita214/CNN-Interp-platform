import torchvision
import torchvision.transforms as transforms
from PIL import Image
import os

transform = transforms.Compose([transforms.ToTensor()])
testset = torchvision.datasets.CIFAR10(root='./data', train=False, download=True, transform=transform)

os.makedirs("backend/static_images", exist_ok=True)

for idx in range(len(testset)):
    img_tensor, _ = testset[idx]
    img_pil = Image.fromarray((img_tensor.permute(1, 2, 0).numpy() * 255).astype('uint8'))
    img_pil.save(f"backend/static_images/{idx}.png")

print("Done. Extracted", len(testset), "images.")