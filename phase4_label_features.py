import os
import numpy as np
import torchvision
import torchvision.transforms as transforms
from PIL import Image
from google import genai
import json
import time
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

data = np.load("data/test_sae_features.npz")

features = data["features"]
image_idx = data["image_idx"]

transform = transforms.Compose([transforms.ToTensor()])

testset = torchvision.datasets.CIFAR10(
    root="./data",
    train=False,
    download=True,
    transform=transform
)


def get_top_images(feature_id, top_k=8):

    activations_for_feature = features[:, feature_id]

    if (activations_for_feature > 0).sum() == 0:
        return None

    top_indices = np.argsort(activations_for_feature)[-top_k:][::-1]

    imgs = []

    for idx in top_indices:

        img_id = image_idx[idx]

        img_tensor, _ = testset[img_id]

        img_pil = Image.fromarray(
            (img_tensor.permute(1, 2, 0).numpy() * 255).astype(np.uint8)
        )

        img_pil = img_pil.resize((128, 128))

        imgs.append(img_pil)

    return imgs


def label_feature(feature_id):

    imgs = get_top_images(feature_id)

    if imgs is None:
        return {
            "feature_id": int(feature_id),
            "label": "DEAD",
            "confidence": "n/a"
        }

    prompt = """These 8 images are the strongest activating examples for one neuron in an image classifier's internal layer.

Look at what visual pattern they share - it could be an object class, a specific body part, a color, a texture, a shape, or something more abstract.

Respond in this exact JSON format only, no other text:

{"label": "a short 3-6 word description", "confidence": "high/medium/low"}"""

    contents = [prompt] + imgs

    try:

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=contents
        )

        text = (
            response.text
            .strip()
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        result = json.loads(text)

        result["feature_id"] = int(feature_id)

        return result

    except Exception as e:

        return {
            "feature_id": int(feature_id),
            "label": f"ERROR: {str(e)}",
            "confidence": "n/a"
        }


# Resumable: load existing progress if any

output_path = "data/feature_labels_full.json"

if os.path.exists(output_path):

    with open(output_path, "r") as f:
        results = json.load(f)

    results = [
        r for r in results
        if not str(r.get("label", "")).startswith("ERROR")
    ]

    done_ids = {r["feature_id"] for r in results}

    print(f"Resuming - {len(done_ids)} features already labeled")

else:

    results = []
    done_ids = set()


all_feature_ids = list(range(4096))

for i, fid in enumerate(all_feature_ids):

    if fid in done_ids:
        continue

    result = label_feature(fid)

    results.append(result)

    if i % 20 == 0:
        print(
            f"[{i}/4096] Feature {fid}: "
            f"{result.get('label', 'ERROR')}"
        )

    # Save progress every 25 features,
    # so an interruption doesn't lose everything

    if len(results) % 25 == 0:

        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)

    time.sleep(1)


with open(output_path, "w") as f:
    json.dump(results, f, indent=2)


print(
    f"\nDone. Labeled {len(results)} features total. "
    f"Saved to {output_path}"
)