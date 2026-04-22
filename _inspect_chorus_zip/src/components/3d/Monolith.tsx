import { useMemo } from "react";

export function Monolith() {
  const count = 3;
  const positions = useMemo(() => {
    return [
      [-5, -2, -5],
      [5, -2, -8],
      [0, -2, -12]
    ];
  }, []);

  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[4, 15, 4]} />
          <meshStandardMaterial 
            color="#0a111a" 
            emissive="#00ffd5" 
            emissiveIntensity={0.2}
            roughness={0.1}
            metalness={0.9}
          />
          {/* Windows / Tech Lines */}
          <mesh position={[0, 0, 2.01]}>
             <planeGeometry args={[3.8, 14.8]} />
             <meshBasicMaterial color="#00ffd5" transparent opacity={0.05} wireframe />
          </mesh>
        </mesh>
      ))}
    </group>
  );
}
