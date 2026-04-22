export function getNodePosition(index: number, quadrant: number) {
  const NODES_PER_QUADRANT = 250;
  const angleStep = (Math.PI * 2) / 50; // Multiple laps
  const angle = index * angleStep;
  const radius = 5 + (index / 5) * 0.8; // Expanding spiral
  
  let x = Math.cos(angle) * radius;
  let y = (Math.sin(index * 0.2)) * 3 + (index / 50) * 2; // Wavy vertical distribution
  let z = Math.sin(angle) * radius;
  
  // Quadrant mapping for spatial separation (larger spread for 1,000 nodes)
  const offset = 60;
  switch (quadrant) {
    case 0: // North - Strategy
      z += offset;
      break;
    case 1: // East - Execution
      x += offset;
      break;
    case 2: // South - Reflection
      z -= offset;
      break;
    case 3: // West - Synthesis
      x -= offset;
      break;
  }
  
  return [x, y, z] as [number, number, number];
}
