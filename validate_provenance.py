import json
import sys
from jsonschema import validate, ValidationError

SCHEMA_FILE = "provenance.schema.json"
SUPPORTED_SCHEMA_VERSIONS = ["1.0.0"]

def main(provenance_path):
    with open(SCHEMA_FILE, "r") as f:
        schema = json.load(f)
    with open(provenance_path, "r") as f:
        provenance = json.load(f)
    version = provenance.get("version")
    if not version:
        print("Validation failed: No version field in provenance chain.")
        sys.exit(1)
    if version not in SUPPORTED_SCHEMA_VERSIONS:
        print(f"Validation failed: Unsupported schema version {version}. Supported: {SUPPORTED_SCHEMA_VERSIONS}")
        sys.exit(2)
    try:
        validate(instance=provenance, schema=schema)
        print(f"Validation successful: provenance.json conforms to schema version {version}.")
    except ValidationError as e:
        print("Validation failed:")
        print(e)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate_provenance.py <provenance.json>")
        sys.exit(1)
    main(sys.argv[1])
