import json
import sys
from jsonschema import validate, ValidationError

SCHEMA_FILE = "envelope.schema.json"
SUPPORTED_SCHEMA_VERSIONS = ["1.0.0"]

def main(envelope_path):
    with open(SCHEMA_FILE, "r") as f:
        schema = json.load(f)
    with open(envelope_path, "r") as f:
        envelope = json.load(f)
    version = envelope.get("version") or envelope.get("schema_version")
    if not version:
        print("Validation failed: No version or schema_version field in envelope.")
        sys.exit(1)
    if version not in SUPPORTED_SCHEMA_VERSIONS:
        print(f"Validation failed: Unsupported schema version {version}. Supported: {SUPPORTED_SCHEMA_VERSIONS}")
        sys.exit(2)
    try:
        validate(instance=envelope, schema=schema)
        print(f"Validation successful: envelope.json conforms to schema version {version}.")
    except ValidationError as e:
        print("Validation failed:")
        print(e)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate_envelope.py <envelope.json>")
        sys.exit(1)
    main(sys.argv[1])
