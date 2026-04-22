import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Group } from "three";
import { Float, MeshDistortMaterial, MeshWobbleMaterial } from "@react-three/drei";

export const OmegaSeal = () => {
  const outerRingRef = useRef<Mesh>(null);
  const innerSymbolRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.2;
      outerRingRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    }

    if (innerSymbolRef.current) {
      innerSymbolRef.current.rotation.z = -t * 0.4;
    }

    if (coreRef.current) {
      coreRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central Singularity */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#00eaff" 
          emissiveIntensity={10} 
          toneMapped={false}
        />
      </mesh>

      {/* Primary Omega Housing */}
      <group ref={innerSymbolRef}>
        {/* The Open Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.5, 0.12, 16, 100, (Math.PI * 1.6)]} />
          <meshStandardMaterial color="#00eaff" emissive="#00eaff" emissiveIntensity={2} />
        </mesh>

        {/* Left Foot */}
        <mesh position={[-1.6, -1.95, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color="#00eaff" emissive="#00eaff" emissiveIntensity={2} />
        </mesh>

        {/* Right Foot */}
        <mesh position={[1.6, -1.95, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color="#00eaff" emissive="#00eaff" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Decorative Outer Rings */}
      <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.5, 0.05, 8, 100]} />
        <meshStandardMaterial color="#1a3a45" transparent opacity={0.5} />
      </mesh>

      <mesh rotation={[Math.PI / 2, Math.PI / 4, 0]}>
        <torusGeometry args={[5, 0.02, 8, 6]} />
        <meshStandardMaterial color="#00eaff" transparent opacity={0.2} />
      </mesh>

      {/* Volumetric Glow (Simulated) */}
      <Float speed={5} rotationIntensity={0} floatIntensity={0.5}>
        <mesh>
          <sphereGeometry args={[1.5, 32, 32]} />
          <MeshDistortMaterial
            color="#00eaff"
            transparent
            opacity={0.1}
            speed={2}
            distort={0.4}
            radius={1}
          />
        </mesh>
      </Float>
    </group>
  );
};
