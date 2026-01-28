/* Floating Hexagon Animation */
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial } from "@react-three/drei";

export default function JobHexagon(props) {
    const meshRef = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            meshRef.current.rotation.x = Math.cos(t / 4) / 2;
            meshRef.current.rotation.y = Math.sin(t / 4) / 2;
            meshRef.current.rotation.z = Math.sin(t / 1.5) / 5;
        }
    });

    return (
        <Float speed={4} rotationIntensity={1} floatIntensity={1}>
            <Icosahedron args={[1, 0]} ref={meshRef} scale={props.scale || 1.5}>
                <MeshDistortMaterial
                    color={props.color || "#6366f1"}
                    attach="material"
                    distort={0.4} // Strength, 0 disables the effect (default=1)
                    speed={2} // Speed (default=1)
                    roughness={0.2}
                    metalness={0.9}
                />
            </Icosahedron>
        </Float>
    );
}
