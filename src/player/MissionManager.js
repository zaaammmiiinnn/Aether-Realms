/**
 * NexusWorld — MVP Mission Manager
 * Handles the "Collect 3 Glowing Artifacts" quest.
 */

import * as THREE from 'three';

export class MissionManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.artifacts = [];
    this.collected = 0;
    this.total = 3;
    this.completed = false;

    this.spawnArtifacts();
  }

  spawnArtifacts() {
    const geo = new THREE.SphereGeometry(0.5, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00aaff,
      emissiveIntensity: 1.0,
      roughness: 0.2,
      metalness: 0.8
    });

    // Spawn 3 artifacts near the ruin (ruin is at 0, 50)
    const positions = [
      { x: 10, z: 60 },
      { x: -15, z: 45 },
      { x: 5, z: 35 }
    ];

    positions.forEach(pos => {
      const mesh = new THREE.Mesh(geo, mat);
      const y = this.world.getSurfaceHeight(pos.x, pos.z) + 1.5;
      mesh.position.set(pos.x, y, pos.z);
      
      const light = new THREE.PointLight(0x00ffff, 2, 5);
      mesh.add(light);

      this.scene.add(mesh);
      this.artifacts.push({ mesh, active: true, basePos: mesh.position.clone() });
    });
    
    this.updateHUD();
  }

  update(deltaTime, playerPos) {
    if (this.completed) return;

    let collectedThisFrame = false;

    this.artifacts.forEach((artifact, i) => {
      if (!artifact.active) return;

      // Bobbing animation
      artifact.mesh.position.y = artifact.basePos.y + Math.sin(Date.now() * 0.003 + i) * 0.3;
      artifact.mesh.rotation.y += deltaTime * 0.001;

      // Check collection distance
      if (playerPos.distanceTo(artifact.mesh.position) < 2.5) {
        artifact.active = false;
        this.scene.remove(artifact.mesh);
        this.collected++;
        collectedThisFrame = true;
      }
    });

    if (collectedThisFrame) {
      if (this.collected >= this.total) {
        this.completed = true;
        this.updateHUD();
        // Global notify function from main.js
        if (window.showToast) window.showToast('MISSION COMPLETE: Ancient Energy Stabilized!', 'success');
      } else {
        this.updateHUD();
        if (window.showToast) window.showToast(`Artifact Collected! (${this.collected}/${this.total})`, 'info');
      }
    }
  }

  updateHUD() {
    let el = document.getElementById('mission-tracker');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mission-tracker';
      el.className = 'glass-panel-sm';
      el.style.position = 'absolute';
      el.style.top = '20px';
      el.style.right = '20px';
      el.style.color = '#fff';
      el.style.zIndex = '100';
      document.body.appendChild(el);
    }

    if (this.completed) {
      el.innerHTML = '<strong style="color: #00ffaa">Mission Complete!</strong>';
      setTimeout(() => el.remove(), 5000);
    } else {
      el.innerHTML = `<strong>Quest:</strong> Collect Artifacts (${this.collected}/${this.total})`;
    }
  }
}
