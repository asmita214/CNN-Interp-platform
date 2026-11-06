from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import json
import os
import torch
import torch.nn.functional as F
from pydantic import BaseModel
from PIL import Image
import numpy as np
from models.resnet import ResNetCIFAR
from models.sae import TopKSAE

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cpu")

with open("data/feature_atlas.json") as f:
    ATLAS_DATA = json.load(f)
with open("data/feature_image_lookup.json") as f:
    FEATURE_LOOKUP = json.load(f)

classes = ('plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck')

cnn = ResNetCIFAR(num_classes=10)
cnn.load_state_dict(torch.load("models/best_resnet_cifar.pth", map_location=device))
cnn.eval()

sae = TopKSAE(input_dim=512, hidden_dim=4096, top_k=256)
sae.load_state_dict(torch.load("models/sae_topk_256.pth", map_location=device))
sae.eval()

norm_stats = torch.load("models/sae_activation_normalization.pth", map_location=device)
activation_mean = norm_stats["mean"]
activation_std = norm_stats["std"]

CNN_MEAN = np.array([0.4914, 0.4822, 0.4465], dtype=np.float32)
CNN_STD = np.array([0.2470, 0.2435, 0.2616], dtype=np.float32)

def load_image_tensor(image_idx: int):
    path = f"static_images/{image_idx}.png"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image index out of range")
    img = Image.open(path).convert("RGB")
    arr = np.array(img).astype(np.float32) / 255.0
    normalized = (arr - CNN_MEAN) / CNN_STD
    tensor = torch.from_numpy(normalized).permute(2, 0, 1).unsqueeze(0).float()
    return tensor

@app.get("/")
def root():
    return {"status": "ok", "total_features": len(ATLAS_DATA)}

@app.get("/atlas")
def get_atlas():
    return ATLAS_DATA

@app.get("/feature/{feature_id}")
def get_feature_detail(feature_id: int):
    entry = next((f for f in ATLAS_DATA if f["feature_id"] == feature_id), None)
    if entry is None:
        raise HTTPException(status_code=404, detail="Feature not found or dead")
    return {
        "feature_id": feature_id,
        "label": entry["label"],
        "confidence": entry["confidence"],
        "cluster": entry["cluster"],
        "top_images": FEATURE_LOOKUP.get(str(feature_id), [])
    }

@app.get("/image/{image_idx}")
def get_image(image_idx: int):
    path = f"static_images/{image_idx}.png"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image index out of range")
    return FileResponse(path, media_type="image/png")

class SteerRequest(BaseModel):
    image_idx: int
    feature_id: int
    strength: float

def get_predictions(image_tensor, steer_feature_id=None, steer_strength=1.0):
    def hook_fn(module, input, output):
        if steer_feature_id is None:
            return output
        acts = output.permute(0, 2, 3, 1).reshape(-1, 512)
        acts_norm = (acts - activation_mean) / activation_std
        _, features = sae(acts_norm)
        features[:, steer_feature_id] = features[:, steer_feature_id] * steer_strength
        modified_recon = sae.decoder(features)
        modified_acts = modified_recon * activation_std + activation_mean
        return modified_acts.reshape(1, 4, 4, 512).permute(0, 3, 1, 2)

    handle = cnn.layer4.register_forward_hook(hook_fn)
    with torch.no_grad():
        logits = cnn(image_tensor)
        probs = F.softmax(logits, dim=1)[0]
    handle.remove()
    return {classes[i]: float(probs[i]) for i in range(10)}

@app.post("/steer")
def steer_feature(req: SteerRequest):
    img_tensor = load_image_tensor(req.image_idx)
    original_probs = get_predictions(img_tensor, steer_feature_id=None)
    steered_probs = get_predictions(img_tensor, steer_feature_id=req.feature_id, steer_strength=req.strength)
    return {
        "original_predictions": original_probs,
        "steered_predictions": steered_probs
    }