# MFCS-OMEGA Release Notes

## v0.4.1 - Runtime phi-A premises

### Summary

This update brings the GitHub repo runtime layer in line with the phi-A law binding work:

- `nearRecursion` is now computed by the kernel instead of being hardcoded to `false`
- the Oracle workbench shows the current law premises directly
- tests cover attractor membership, premise visibility, and bounded recurrence behavior
- the law note now explains the difference between theorem proof and runtime approximation

### Notes

- This is a bounded runtime approximation, not a TLC-grade proof of recurrence.
- The spec layer still owns the theorem.
- The kernel now reports what it can measure honestly from the current state.

## v0.1.0 - Initial unified release

### Summary

This is the first unified release of the MFCS-OMEGA system, combining:

- MFCS formal specification and TLC harness
- OMEGA Oracle kernel, spatial layer, agents, and console
- Digital Mirror reviewer artifact
- Codex and VS Code extension
- CI/CD, packaging, and checksums
