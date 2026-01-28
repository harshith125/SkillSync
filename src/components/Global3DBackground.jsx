import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

const ParticleLayer = ({ count = 1000, color = "#6366f1", size = 0.08, opacity = 0.4 }) => {
    const points = useRef();

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const radius = 25; // Spread them wider
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * radius;
            pos[i * 3 + 1] = (Math.random() - 0.5) * radius * 0.8;
            pos[i * 3 + 2] = (Math.random() - 0.5) * radius;
        }
        return pos;
    }, [count]);

    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }, []);

    useFrame((state, delta) => {
        if (points.current) {
            points.current.rotation.y += delta * 0.08;
            points.current.rotation.x += delta * 0.03;
        }
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={size}
                color={color}
                map={texture}
                transparent
                alphaTest={0.5}
                opacity={opacity}
                depthWrite={false}
                sizeAttenuation
            />
        </points>
    );
};

const Global3DBackground = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            pointerEvents: 'none',
            background: 'linear-gradient(to bottom, #fcfdfe, #f1f5f9)' // Softest light professional theme
        }}>
            <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <Stars radius={120} depth={60} count={4000} factor={4} saturation={0} fade speed={1.5} />
                    <ParticleLayer count={1500} color="#6366f1" size={0.12} opacity={0.6} />
                    <ParticleLayer count={1000} color="#ec4899" size={0.09} opacity={0.4} />
                    <ParticleLayer count={800} color="#38bdf8" size={0.1} opacity={0.3} />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default Global3DBackground;
