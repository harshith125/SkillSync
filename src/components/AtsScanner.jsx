/* 3D ATS Scanner/Chart Model */
import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Text, Torus, Sphere, MeshTransmissionMaterial } from "@react-three/drei";

export default function AtsScanner(props) {
    const group = useRef();
    const ringRef = useRef();

    // Score state to animate or display
    const score = props.score || 0;

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Rotate ring
        if (ringRef.current) {
            ringRef.current.rotation.x = Math.sin(t / 2) * 0.5;
            ringRef.current.rotation.y = Math.cos(t / 2) * 0.5;
        }
        // Gentle floating for whole group
        group.current.rotation.y = t * 0.1;
    });

    return (
        <group ref={group} {...props} dispose={null}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>

                {/* Central Glass Sphere */}
                <Sphere args={[1.2, 32, 32]}>
                    <MeshTransmissionMaterial
                        backside
                        backsideThickness={5}
                        thickness={2}
                        roughness={0}
                        transmission={1}
                        ior={1.5}
                        chromaticAberration={0.1} // Give it that spectral look
                        background="#ffffff"
                    />
                </Sphere>

                {/* Outer Ring Scanner */}
                <Torus ref={ringRef} args={[1.6, 0.05, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={2} />
                </Torus>

                {/* Score Text Floating Inside/Front */}
                <Text
                    position={[0, 0, 1.5]}
                    fontSize={0.8}
                    color="#1e293b"
                    anchorX="center"
                    anchorY="middle"
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEWuLy92w.woff2"
                >
                    {score}
                </Text>

                <Text
                    position={[0, -0.6, 1.5]}
                    fontSize={0.2}
                    color="#64748b"
                    anchorX="center"
                    anchorY="middle"
                >
                    RESUME SCORE
                </Text>

            </Float>
        </group>
    );
}
