import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Environment, Icosahedron, MeshDistortMaterial, Octahedron, TorusKnot } from '@react-three/drei';

const FeatureModel = ({ type, color }) => {
    return (
        <Float speed={3} rotationIntensity={2} floatIntensity={1.5}>
            {type === 'match' && (
                <Icosahedron args={[1, 0]} scale={2.2}>
                    <MeshDistortMaterial color={color} speed={2} distort={0.3} metalness={0.5} roughness={0.2} />
                </Icosahedron>
            )}
            {type === 'sync' && (
                <TorusKnot args={[1, 0.3, 100, 16]} scale={1.8}>
                    <meshStandardMaterial color={color} metalness={0.8} roughness={0.1} />
                </TorusKnot>
            )}
            {type === 'profile' && (
                <Octahedron args={[1, 0]} scale={2.2}>
                    <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.1} clearcoat={1} />
                </Octahedron>
            )}
        </Float>
    );
};

export const FeatureCanvas = ({ type, color }) => {
    return (
        <div style={{ width: '150px', height: '150px', margin: '0 auto 1.5rem' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color={color} />
                <Suspense fallback={null}>
                    <FeatureModel type={type} color={color} />
                    <Environment preset="city" />
                </Suspense>
            </Canvas>
        </div>
    );
};
