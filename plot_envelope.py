import matplotlib.pyplot as plt
import json
import sys

def plot_envelope(envelope_path):
    with open(envelope_path, "r") as f:
        env = json.load(f)
    regions = env.get("dominant_regions", [])
    kink_partitions = env.get("kink_partitions", [])
    plt.figure(figsize=(8, 6))
    # Plot dominant regions
    for region in regions:
        boundaries = region.get("boundaries", [])
        if len(boundaries) >= 2:
            plt.plot(boundaries, [region["region_id"]]*len(boundaries), label=f"Region {region['region_id']}")
    # Plot kink partitions
    for kink in kink_partitions:
        if len(kink) >= 2:
            plt.plot(kink, [0.5]*len(kink), '--', color='red', label="Kink partition")
    plt.xlabel("Boundary / Kink coordinate")
    plt.ylabel("Region ID")
    plt.title("Envelope Dominant Regions and Kink Partitions")
    plt.legend()
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python plot_envelope.py <envelope.json>")
        sys.exit(1)
    plot_envelope(sys.argv[1])
