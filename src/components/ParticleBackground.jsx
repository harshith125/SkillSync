import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

const CustomParticles = ({ count = 300, color }) => {
    const points = useRef();

    // Generate random positions
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 15;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return pos;
    }, [count]);

    // Create a circular texture for the dots
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        context.beginPath();
        context.arc(16, 16, 14, 0, 2 * Math.PI);
        context.fillStyle = 'white';
        context.fill();
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }, []);

    useFrame((state, delta) => {
        if (points.current) {
            points.current.rotation.y += delta * 0.05;
            points.current.rotation.x += delta * 0.02;
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
                size={0.05} // Smaller size for subtle effect
                color={color}
                map={texture} // Apply circular texture
                sizeAttenuation
                transparent
                alphaTest={0.5} // Cut off transparent corners
                opacity={0.8}
                depthWrite={false}
            />
        </points>
    );
};

const AnimatedScene = ({ color }) => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
            <pointLight position={[-10, -10, -10]} intensity={1} color={color} />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <CustomParticles count={800} color={color} />
        </>
    );
};

const ParticleBackground = ({ color = "#6366f1" }) => {
    return (
        <div className="particle-background" style={{ width: '100%', height: '100%' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 2]}>
                <AnimatedScene color={color} />
            </Canvas>
        </div>
    );
};

export default ParticleBackground;
