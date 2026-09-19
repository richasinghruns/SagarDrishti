import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { Vessel } from '@/lib/api';

interface GlobeProps {
  vessels: Vessel[];
  primeSuspectName?: string;
  onVesselClick?: (vessel: Vessel) => void;
}

const EARTH_RADIUS = 2;

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function EarthSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  // Procedural earth-like texture using canvas
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Ocean base
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#0a1a2e');
    grad.addColorStop(0.5, '#0d2540');
    grad.addColorStop(1, '#0a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Draw continents as noise patches
    const continents = [
      { x: 200, y: 180, w: 180, h: 120 },
      { x: 500, y: 160, w: 250, h: 140 },
      { x: 100, y: 250, w: 120, h: 100 },
      { x: 700, y: 200, w: 200, h: 100 },
      { x: 400, y: 300, w: 80, h: 60 },
      { x: 850, y: 280, w: 100, h: 80 },
      { x: 300, y: 350, w: 120, h: 50 },
    ];

    continents.forEach((c) => {
      const g = ctx.createRadialGradient(
        c.x + c.w / 2,
        c.y + c.h / 2,
        0,
        c.x + c.w / 2,
        c.y + c.h / 2,
        Math.max(c.w, c.h) / 2
      );
      g.addColorStop(0, 'rgba(20, 50, 70, 0.9)');
      g.addColorStop(0.7, 'rgba(15, 35, 55, 0.6)');
      g.addColorStop(1, 'rgba(10, 25, 40, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(c.x - 20, c.y - 20, c.w + 40, c.h + 40);
    });

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1024; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
    }
    for (let i = 0; i < 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.85}
        metalness={0.1}
        emissive="#0a1a2e"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.06}>
      <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
      <meshBasicMaterial
        color="#00D4FF"
        transparent
        opacity={0.06}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function OceanGlow() {
  return (
    <mesh scale={1.15}>
      <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
      <meshBasicMaterial
        color="#0088cc"
        transparent
        opacity={0.03}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function VesselMarker({
  vessel,
  isAnomaly,
  isPrimeSuspect,
  onClick,
}: {
  vessel: Vessel;
  isAnomaly: boolean;
  isPrimeSuspect: boolean;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pos = latLonToVec3(vessel.lat, vessel.lon, EARTH_RADIUS * 1.02);

  const color = isPrimeSuspect ? '#FFD700' : isAnomaly ? '#FF4444' : '#00D4FF';
  const size = isPrimeSuspect ? 0.045 : isAnomaly ? 0.035 : 0.025;

  useFrame(({ clock }) => {
    if (isPrimeSuspect && ringRef.current) {
      const t = clock.getElapsedTime();
      const s = 1 + Math.sin(t * 2) * 0.3;
      ringRef.current.scale.set(s, s, s);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.5 + Math.sin(t * 2) * 0.3;
    }
    if (isAnomaly && ref.current) {
      const t = clock.getElapsedTime();
      const s = 1 + Math.sin(t * 3) * 0.2;
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <group position={pos}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {isPrimeSuspect && (
        <mesh ref={ringRef}>
          <ringGeometry args={[size * 1.5, size * 2.2, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      {isAnomaly && !isPrimeSuspect && (
        <mesh>
          <ringGeometry args={[size * 1.3, size * 1.8, 24]} />
          <meshBasicMaterial color="#FF4444" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export function Globe({ vessels, primeSuspectName, onVesselClick }: GlobeProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#0066cc" />

      <Stars
        radius={50}
        depth={20}
        count={2000}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />

      <EarthSphere />
      <Atmosphere />
      <OceanGlow />

      {vessels.map((v, i) => (
        <VesselMarker
          key={`${v.mmsi}-${i}`}
          vessel={v}
          isAnomaly={!!v.is_anomaly}
          isPrimeSuspect={!!v.is_prime_suspect || v.name === primeSuspectName}
          onClick={() => onVesselClick?.(v)}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  );
}
