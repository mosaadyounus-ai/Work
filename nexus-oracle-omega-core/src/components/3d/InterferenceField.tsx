/// <reference types="@react-three/fiber" />
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  buildFieldRepresentativeNodes,
  FrequencyNode,
} from "../../lib/frequency-map";

const MAX_FIELD_NODES = 24;

const vertexShader = `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const fragmentShader = `
#define MAX_FIELD_NODES 24

uniform float uTime;
uniform float uIntensity;
uniform int uNodeCount;
uniform vec3 uPositions[MAX_FIELD_NODES];
uniform vec4 uParams[MAX_FIELD_NODES];

varying vec3 vWorldPosition;

vec3 spectralMap(float x) {
  if (x < 0.2) {
    return mix(vec3(0.02, 0.05, 0.22), vec3(0.12, 0.42, 0.94), x / 0.2);
  }
  if (x < 0.4) {
    return mix(vec3(0.12, 0.42, 0.94), vec3(0.16, 0.82, 0.52), (x - 0.2) / 0.2);
  }
  if (x < 0.6) {
    return mix(vec3(0.16, 0.82, 0.52), vec3(0.94, 0.82, 0.18), (x - 0.4) / 0.2);
  }
  if (x < 0.8) {
    return mix(vec3(0.94, 0.82, 0.18), vec3(1.0, 0.55, 0.12), (x - 0.6) / 0.2);
  }
  return mix(vec3(1.0, 0.55, 0.12), vec3(0.96, 0.14, 0.14), (x - 0.8) / 0.2);
}

float fieldIntensity(vec3 point) {
  float sum = 0.0;
  for (int index = 0; index < MAX_FIELD_NODES; index++) {
    if (index >= uNodeCount) {
      break;
    }
    vec3 delta = point - uPositions[index];
    float r2 = dot(delta, delta);
    vec4 params = uParams[index];
    float wave = sin(6.28318530718 * params.w * uTime + params.y);
    float fall = exp(-params.z * r2);
    sum += params.x * wave * fall;
  }
  return abs(sum);
}

void main() {
  float intensity = fieldIntensity(vWorldPosition) * uIntensity;
  float normalized = clamp(pow(intensity, 0.7), 0.0, 1.0);
  vec3 color = spectralMap(normalized);
  float alpha = smoothstep(0.05, 0.78, normalized) * 0.26;
  gl_FragColor = vec4(color, alpha);
}
`;

interface InterferenceFieldProps {
  nodes: FrequencyNode[];
  speed: number;
  radius: number;
}

export function InterferenceField({
  nodes,
  speed,
  radius,
}: InterferenceFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const fieldNodes = useMemo(
    () => buildFieldRepresentativeNodes(nodes, MAX_FIELD_NODES),
    [nodes],
  );

  const uniforms = useMemo(() => {
    const positions = Array.from({ length: MAX_FIELD_NODES }, () => new THREE.Vector3());
    const params = Array.from({ length: MAX_FIELD_NODES }, () => new THREE.Vector4());

    fieldNodes.forEach((node, index) => {
      positions[index].set(...node.position);
      params[index].set(node.amplitude, node.phase, node.falloff, node.baseHz / 167.89);
    });

    return {
      uTime: { value: 0 },
      uIntensity: { value: 0.9 },
      uNodeCount: { value: fieldNodes.length },
      uPositions: { value: positions },
      uParams: { value: params },
    };
  }, [fieldNodes]);

  useFrame((frameState) => {
    if (!materialRef.current) {
      return;
    }
    materialRef.current.uniforms.uTime.value = frameState.clock.elapsedTime * speed;
  });

  return (
    <mesh scale={[radius, radius, radius]}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
