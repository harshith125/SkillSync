import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';

export default function CubeModel(props) {
    const mesh = useRef();

    useFrame((state, delta) => {
        mesh.current.rotation.x += delta * 0.2;
        mesh.current.rotation.y += delta * 0.2;
    });

    return (
        <mesh ref={mesh} {...props}>
            <boxGeometry args={[1.8, 1.8, 1.8]} />
            <meshPhysicalMaterial
                color="white"
                transmission={0.9} // Glass-like transparency
                opacity={0.5}
                transparent={true}
                roughness={0}
                metalness={0.1}
                thickness={0.5} // Refraction
            />
            {/* Edges for the 'border' effect */}
            <Edges
                scale={1}
                threshold={15} // Display edges only when angle > 15 degrees
                color="#6366f1"
            />
        </mesh>
    );
}
