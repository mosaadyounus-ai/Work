import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { LatticeNodes } from "./LatticeNodes";
import { Monolith } from "./Monolith";

interface LatticeSceneProps {
  hue?: number;
  speed?: number;
  complexity?: number;
  frequency?: number;
}

export function LatticeScene({ hue, speed, complexity, frequency }: LatticeSceneProps) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas gl={{ preserveDrawingBuffer: true }}>
        <PerspectiveCamera makeDefault position={[0, 5, 25]} fov={75} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.2}
        />
        
        <color attach="background" args={["#050a10"]} />
        <fog attach="fog" args={["#050a10", 20, 60]} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color={`hsl(${hue ?? 170}, 100%, 50%)`} />
        <pointLight position={[-10, 5, -5]} intensity={1} color="#0088ff" />
        
        <LatticeNodes hue={hue} speed={speed} complexity={complexity} frequency={frequency} />
        <Monolith />
        
        <EffectComposer>
          <Bloom 
            intensity={1.5} 
            luminanceThreshold={0.1} 
            luminanceSmoothing={0.9} 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
