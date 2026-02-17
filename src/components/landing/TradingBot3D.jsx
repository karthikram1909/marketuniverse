import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function TradingBot3D() {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true 
        });
        renderer.setSize(300, 300);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x06b6d4, 1, 100);
        pointLight1.position.set(5, 5, 5);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x3b82f6, 0.8, 100);
        pointLight2.position.set(-5, -5, 5);
        scene.add(pointLight2);

        // Robot group
        const robot = new THREE.Group();

        // Head
        const headGeometry = new THREE.BoxGeometry(1, 1, 1);
        const headMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x06b6d4,
            shininess: 100,
            specular: 0x3b82f6
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        robot.add(head);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.25, 1.6, 0.5);
        robot.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.25, 1.6, 0.5);
        robot.add(rightEye);

        // Antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
        const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x3b82f6 });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(0, 2.25, 0);
        robot.add(antenna);

        const antennaTopGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const antennaTopMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x06b6d4,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.5
        });
        const antennaTop = new THREE.Mesh(antennaTopGeometry, antennaTopMaterial);
        antennaTop.position.set(0, 2.5, 0);
        robot.add(antennaTop);

        // Body
        const bodyGeometry = new THREE.BoxGeometry(1.4, 1.6, 1);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x1e40af,
            shininess: 100,
            specular: 0x3b82f6
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0;
        robot.add(body);

        // Screen on body
        const screenGeometry = new THREE.PlaneGeometry(0.8, 0.5);
        const screenMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.7
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 0.2, 0.51);
        robot.add(screen);

        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x06b6d4 });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.85, 0, 0);
        leftArm.rotation.z = Math.PI / 2;
        robot.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.85, 0, 0);
        rightArm.rotation.z = Math.PI / 2;
        robot.add(rightArm);

        // Hands
        const handGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const handMaterial = new THREE.MeshPhongMaterial({ color: 0x06b6d4 });

        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-1.35, 0, 0);
        robot.add(leftHand);

        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(1.35, 0, 0);
        robot.add(rightHand);

        scene.add(robot);

        // Floating symbols
        const symbols = [];
        const symbolTexts = ['₿', 'Ξ', '$'];
        const symbolColors = [0xf7931a, 0x627eea, 0x26a17b];
        
        symbolTexts.forEach((text, i) => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#' + symbolColors[i].toString(16).padStart(6, '0');
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 32, 32);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(0.5, 0.5, 1);
            
            const angle = (i / symbolTexts.length) * Math.PI * 2;
            sprite.position.set(
                Math.cos(angle) * 2.5,
                Math.sin(angle * 2) * 0.5,
                Math.sin(angle) * 2.5
            );
            
            symbols.push({ sprite, angle, offset: i });
            scene.add(sprite);
        });

        // Animation
        let time = 0;
        const animate = () => {
            requestAnimationFrame(animate);
            time += 0.01;

            // Robot float
            robot.position.y = Math.sin(time * 2) * 0.1;
            robot.rotation.y = Math.sin(time * 0.5) * 0.1;

            // Head tilt
            head.rotation.x = Math.sin(time * 3) * 0.05;

            // Arms wave
            leftArm.rotation.y = Math.sin(time * 2) * 0.3;
            rightArm.rotation.y = Math.sin(time * 2 + Math.PI) * 0.3;

            // Antenna light pulse
            if (antennaTop.material.emissive) {
                antennaTop.material.emissive.setHex(0x06b6d4);
                antennaTop.material.emissiveIntensity = Math.sin(time * 3) * 0.5 + 0.5;
            }

            // Screen flicker
            screen.material.opacity = 0.6 + Math.sin(time * 5) * 0.1;

            // Symbols orbit
            symbols.forEach(({ sprite, angle, offset }) => {
                const orbitAngle = angle + time * 0.5;
                sprite.position.x = Math.cos(orbitAngle) * 2.5;
                sprite.position.y = Math.sin(time * 2 + offset) * 0.5 + 1;
                sprite.position.z = Math.sin(orbitAngle) * 2.5;
                sprite.material.opacity = 0.5 + Math.sin(time * 2 + offset) * 0.3;
            });

            renderer.render(scene, camera);
        };

        animate();

        // Cleanup
        return () => {
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <div className="flex items-center justify-center">
            <div ref={containerRef} className="rounded-2xl" />
        </div>
    );
}