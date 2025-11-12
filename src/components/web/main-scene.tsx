"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

import {
  Environment,
  OrbitControls,
  Sphere,
  MeshDistortMaterial,
  Text3D,
  Float,
} from "@react-three/drei";
import type { Group } from "three";

export function MainScene() {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
      <fog attach="fog" args={["#ff7300", 10, 40]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Environment preset="city" />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.2}
        autoRotate
        autoRotateSpeed={0.2}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.5}
      />
      <Float speed={1} rotationIntensity={1} floatIntensity={4}>
        <Logo position={[0, 1, 0]} />
      </Float>

      <GridPoints />
      <FloatingParticles />
      <DataFlowLines />
    </Canvas>
  );
}

function Logo({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y =
        Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Text3D
        font={"/Momo.json"}
        size={1.5}
        height={0.2}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
        position={[-5, 2.2, 0]}
      >
        Desarrollo
        <meshStandardMaterial color="#ff7300" metalness={0.8} roughness={0.2} />
      </Text3D>

      <Text3D
        font={"/Momo.json"}
        size={1.8}
        height={0.2}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
        position={[-6, -0.5, 0]}
      >
        Formación
        <meshStandardMaterial color="#0006ad" metalness={0.8} roughness={0.2} />
      </Text3D>
    </group>
  );
}

function GridPoints() {
  const pointsRef = useRef<Group>(null);
  //   const { viewport } = useThree();
  const [points, setPoints] = useState<Array<[number, number, number]>>([]);

  useEffect(() => {
    const gridSize = 10;
    const spacing = 2;
    const newPoints: Array<[number, number, number]> = [];

    for (let x = -gridSize; x <= gridSize; x += spacing) {
      for (let z = -gridSize; z <= gridSize; z += spacing) {
        // Create a grid but exclude points near the center
        const distance = Math.sqrt(x * x + z * z);
        if (distance > 5) {
          newPoints.push([x, -3, z]);
        }
      }
    }

    setPoints(newPoints);
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={pointsRef}>
      {points.map((position, i) => (
        <mesh key={i} position={position}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color="#090c87"
            emissive="#0c0e45"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<Group>(null);
  const [particles, setParticles] = useState<
    Array<{
      position: [number, number, number];
      speed: number;
      size: number;
      color: string;
    }>
  >([]);

  useEffect(() => {
    const count = 50;
    const newParticles: Array<{
      position: [number, number, number];
      speed: number;
      size: number;
      color: string;
    }> = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 10;

      newParticles.push({
        position: [x, y, z] as [number, number, number],
        speed: 0.2 + Math.random() * 0.3,
        size: 0.05 + Math.random() * 0.1,
        color: Math.random() > 0.7 ? "#6366f1" : "#f0f0f0",
      });
    }

    setParticles(newParticles);
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.children.forEach((particle, i) => {
        const data = particles[i];
        // Move particles up and reset when they reach the top
        particle.position.y += data.speed * 0.02;
        if (particle.position.y > 5) {
          particle.position.y = -5;
        }
      });
    }
  });

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.size, 16, 16]} />
          <meshStandardMaterial
            color={particle.color}
            emissive={particle.color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

function DataFlowLines() {
  const linesRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={linesRef} position={[0, 0, 0]}>
      <Sphere args={[8, 32, 32]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.3}
          speed={2}
          wireframe
          transparent
          opacity={0.2}
        />
      </Sphere>
    </group>
  );
}
