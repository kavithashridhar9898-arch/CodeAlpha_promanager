'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Environment, Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Create a particle network that moves softly
function ParticleNetwork() {
  const ref = useRef<THREE.Points>(null);

  // Generate random positions inside a sphere
  const positions = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 10 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#8b5cf6"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}

// Geometric abstract floating objects representing "Projects" or "Tasks"
function FloatingNodes() {
  return (
    <>
      <Float speed={2} rotationIntensity={1} floatIntensity={2} position={[3, 2, -4]}>
        <mesh>
          <icosahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial 
            color="#2563eb" 
            roughness={0.1} 
            transmission={0.9} 
            thickness={1} 
            envMapIntensity={2}
          />
        </mesh>
      </Float>
      <Float speed={1.5} rotationIntensity={2} floatIntensity={1} position={[-4, -1, -2]}>
        <mesh>
          <octahedronGeometry args={[0.8, 0]} />
          <meshPhysicalMaterial 
            color="#7c3aed" 
            roughness={0.2} 
            transmission={0.8} 
            thickness={0.5} 
            envMapIntensity={1.5}
          />
        </mesh>
      </Float>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={1.5} position={[2, -3, -5]}>
        <mesh>
          <torusGeometry args={[0.6, 0.2, 16, 100]} />
          <meshPhysicalMaterial 
            color="#ec4899" 
            roughness={0.1} 
            transmission={1} 
            thickness={0.2} 
          />
        </mesh>
      </Float>
    </>
  );
}

import { useTheme } from 'next-themes';

export function HeroCanvas() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={[isLight ? '#f8fafc' : '#050505']} />
        
        {/* Cinematic Lighting */}
        <ambientLight intensity={isLight ? 0.8 : 0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#8b5cf6" />
        <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={1} color="#3b82f6" />
        
        <ParticleNetwork />
        <FloatingNodes />
        
        {/* Environment mapping for the glass/transmission materials */}
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
