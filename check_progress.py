import json
with open("data/feature_labels_full.json") as f:
    results = json.load(f)

success = [r for r in results if not str(r.get("label", "")).startswith("ERROR")]
errors = [r for r in results if str(r.get("label", "")).startswith("ERROR")]
print("Successfully labeled:", len(success))
print("Errors (need retry):", len(errors))