import json
import sys
from jsonschema import validate, ValidationError

SCHEMA_FILE = "polyhedron.schema.json"
SUPPORTED_SCHEMA_VERSIONS = ["1.0.0"]

def main(polyhedron_path):
    with open(SCHEMA_FILE, "r") as f:
        schema = json.load(f)
    with open(polyhedron_path, "r") as f:
        polyhedron = json.load(f)
    version = polyhedron.get("version") or polyhedron.get("schema_version")
    if not version:
        print("Validation failed: No version or schema_version field in polyhedron.")
        sys.exit(1)
    if version not in SUPPORTED_SCHEMA_VERSIONS:
        print(f"Validation failed: Unsupported schema version {version}. Supported: {SUPPORTED_SCHEMA_VERSIONS}")
        sys.exit(2)
    try:
        validate(instance=polyhedron, schema=schema)
        print(f"Validation successful: polyhedron.json conforms to schema version {version}.")
    except ValidationError as e:
        print("Validation failed:")
        print(e)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate_polyhedron.py <polyhedron.json>")
        sys.exit(1)
    main(sys.argv[1])
