import json

with open("data/feature_labels_full.json") as f:
    results = json.load(f)

dead = [r for r in results if r.get("label") == "DEAD"]
labeled = [r for r in results if r.get("label") not in ("DEAD",) and not str(r.get("label", "")).startswith("ERROR")]
errors = [r for r in results if str(r.get("label", "")).startswith("ERROR")]

print("Total:", len(results))
print("Dead features:", len(dead))
print("Successfully labeled (alive):", len(labeled))
print("Errors remaining:", len(errors))

high_conf = [r for r in labeled if r.get("confidence") == "high"]
print("High confidence labels:", len(high_conf))