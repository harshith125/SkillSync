/* Profile Identity 3D Visual */
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Sphere, Torus, MeshDistortMaterial, useTexture, Circle } from "@react-three/drei";

// Sub-component to safely load texture using hooks
// This must remain a separate component so that useTexture is only called when this component is mounted
const AvatarImage = ({ url }) => {
    // Ensure url is valid
    const texture = useTexture(url);
    return (
        <Circle args={[1.5, 64]} position={[0, 0, 1.6]}>
            <meshBasicMaterial map={texture} transparent />
        </Circle>
    );
};

export default function ProfileIdentity({ picture }) {
    const sphereRef = useRef();
    const ringRef1 = useRef();
    const ringRef2 = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        if (ringRef1.current) {
            ringRef1.current.rotation.x = t * 0.2;
            ringRef1.current.rotation.y = t * 0.3;
        }
        if (ringRef2.current) {
            ringRef2.current.rotation.x = t * -0.2;
            ringRef2.current.rotation.y = t * 0.1;
        }

        if (sphereRef.current) {
            // Less breathing if picture is there to keep it stable
            if (!picture) {
                sphereRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
            } else {
                sphereRef.current.scale.setScalar(1);
            }
        }
    });

    // Determine material props based on mode
    const materialProps = picture ? {
        color: "#8b5cf6",
        metalness: 0.9,
        transmission: 0.5,
        opacity: 0.3,
        transparent: true,
        distort: 0.2
    } : {
        color: "#8b5cf6",
        metalness: 0.1,
        opacity: 1,
        transparent: false,
        distort: 0.3
    };

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            {/* If picture exists, mount the AvatarImage component */}
            {picture && <AvatarImage url={picture} />}

            {/* Always render the Sphere, just change its size/material props */}
            <Sphere ref={sphereRef} args={[picture ? 1.55 : 1.5, 64, 64]}>
                <MeshDistortMaterial
                    envMapIntensity={1}
                    clearcoat={1}
                    clearcoatRoughness={0}
                    speed={1.5}
                    {...materialProps}
                />
            </Sphere>

            {/* Orbiting Rings */}
            <Torus ref={ringRef1} args={[2.2, 0.05, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} toneMapped={false} />
            </Torus>

            <Torus ref={ringRef2} args={[2.8, 0.02, 16, 100]} rotation={[0, Math.PI / 4, 0]}>
                <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={1.5} toneMapped={false} />
            </Torus>
        </Float>
    );
}
