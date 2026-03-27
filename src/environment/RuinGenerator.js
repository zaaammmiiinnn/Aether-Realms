/**
 * NexusWorld — Fantasy Ruin Generator
 * Spawns the central "Anomaly" that introduces the fantasy layer.
 */

import * as THREE from 'three';

export class RuinGenerator {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.particles = [];
  }

  generate(px, pz) {
    const py = this.world.getSurfaceHeight(px, pz);

    // 1. Core Monolith (Obsidian-like)
    const geo = new THREE.OctahedronGeometry(15, 0); // angular, alien shape
    const mat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.1, // very smooth/shiny
      metalness: 0.8,
      emissive: 0x2a00ff, // Deep blue/purple glow
      emissiveIntensity: 0.5,
      flatShading: true
    });

    const monolith = new THREE.Mesh(geo, mat);
    // Buried halfway
    monolith.position.set(px, py - 5, pz);
    monolith.castShadow = true;
    monolith.receiveShadow = true;
    this.scene.add(monolith);
    
    // Register as collidable
    this.world.registerPrefab(monolith);

    // 2. Light Source
    const light = new THREE.PointLight(0x5a00ff, 1000, 100);
    light.position.set(px, py + 10, pz);
    light.castShadow = true;
    this.scene.add(light);

    // 3. Floating Particles (Magical Embers)
    const particleCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = px + (Math.random() - 0.5) * 40;
        pPos[i * 3 + 1] = py + Math.random() * 30;
        pPos[i * 3 + 2] = pz + (Math.random() - 0.5) * 40;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    
    // Custom additive blending material for particles
    const pMat = new THREE.PointsMaterial({
      color: 0x8844ff,
      size: 0.5,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particleSystem = new THREE.Points(pGeo, pMat);
    this.scene.add(this.particleSystem);
  }

  activateWowMoment() {
    this.isAwake = true;
    
    // Change monolith color to intense pink/magenta core
    this.monolith.material.emissive.setHex(0xff0088);
    this.monolith.material.emissiveIntensity = 4.0;
    
    // Boost light
    this.light.color.setHex(0xff0088);
    this.light.intensity = 5000;
    this.light.distance = 500;
    
    // Boost particles
    this.particleSystem.material.color.setHex(0xff55aa);
    this.particleSystem.material.size = 1.0;
    
    // Add way more particles
    const particleCount = 2000;
    const pPos = new Float32Array(particleCount * 3);
    const px = this.monolith.position.x;
    const py = this.monolith.position.y;
    const pz = this.monolith.position.z;
    
    for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = px + (Math.random() - 0.5) * 60;
        pPos[i * 3 + 1] = py + Math.random() * 80;
        pPos[i * 3 + 2] = pz + (Math.random() - 0.5) * 60;
    }
    this.particleSystem.geometry.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    
    // Make the monolith float up!
    this.targetY = py + 20; 
  }

  update(deltaTime) {
    if (!this.particleSystem) return;
    
    // Monolith float animation
    if (this.isAwake && this.monolith.position.y < this.targetY) {
      this.monolith.position.y += deltaTime * 0.005;
      this.monolith.rotation.y += deltaTime * 0.001;
      this.monolith.rotation.x += deltaTime * 0.0005;
      this.light.position.y = this.monolith.position.y + 10;
    }
    
    // Slowly float particles up
    const positions = this.particleSystem.geometry.attributes.position.array;
    const speedY = this.isAwake ? 0.02 : 0.002;
    const driftMult = this.isAwake ? 0.1 : 0.01;
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += deltaTime * speedY; // Move UP
      positions[i] += Math.sin(Date.now() * 0.001 + i) * driftMult; // Drift X
      positions[i + 2] += Math.cos(Date.now() * 0.001 + i) * driftMult; // Drift Z
      
      // Reset if too high
      if (positions[i + 1] > this.world.getSurfaceHeight(positions[i], positions[i+2]) + (this.isAwake ? 100 : 40)) {
         positions[i + 1] = this.world.getSurfaceHeight(positions[i], positions[i+2]);
      }
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }
}
