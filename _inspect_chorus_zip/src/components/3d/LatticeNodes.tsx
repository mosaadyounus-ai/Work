import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface LatticeNodesProps {
  hue?: number; // 0-360
  speed?: number; // 0.1 - 5.0
  complexity?: number; // 0.1 - 2.0
  frequency?: number; // 0-1
}

export function LatticeNodes({ hue = 170, speed = 1.0, complexity = 1.0, frequency = 0.5 }: LatticeNodesProps) {
  const count = Math.floor(1000 * complexity);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);

  const primaryColor = useMemo(() => {
    return new THREE.Color(`hsl(${hue}, 100%, 50%)`);
  }, [hue]);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 2000; i++) { // Over-allocate for complexity changes
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      temp.push({ x, y, z, velocity: new THREE.Vector3().randomDirection().multiplyScalar(0.01) });
    }
    return temp;
  }, []);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(2000 * 6); 
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();
    const time = state.clock.elapsedTime * speed;
    const peakFreq = frequency * 2;

    const positions = lineRef.current?.geometry.attributes.position.array as Float32Array;
    let lineIdx = 0;

    for (let i = 0; i < count; i++) {
        const p = particles[i];
      // Movement driven by speed and frequency
      const noise = Math.sin(time + i * 0.1) * 0.005 * peakFreq;
      p.x += noise;
      p.y += Math.cos(time + i * 0.5) * 0.002 * speed;
      p.z += Math.sin(time * 0.5 + i) * 0.002 * speed;

      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(0.04 + (frequency * 0.04));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Connections based on complexity
      const connectionLimit = Math.floor(50 * complexity);
      if (i < connectionLimit) {
        const next = particles[(i + 1) % count];
        positions[lineIdx++] = p.x;
        positions[lineIdx++] = p.y;
        positions[lineIdx++] = p.z;
        positions[lineIdx++] = next.x;
        positions[lineIdx++] = next.y;
        positions[lineIdx++] = next.z;
      }
    }
    
    // Clear rest of buffer
    while(lineIdx < 2000 * 6) {
        positions[lineIdx++] = 0;
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (lineRef.current) {
        lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, 2000]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={primaryColor} transparent opacity={0.6 * (0.5 + frequency)} />
      </instancedMesh>
      <lineSegments ref={lineRef}>
        <primitive object={lineGeometry} attach="geometry" />
        <lineBasicMaterial color={primaryColor} transparent opacity={0.15 * (0.5 + frequency)} />
      </lineSegments>
    </group>
  );
}

