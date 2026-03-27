/**
 * NexusWorld — Prefab Building System
 * Replaces the voxel block system with modular architectural prefabs.
 */

import * as THREE from 'three';

export const Prefabs = {
  FLOOR: 'floor',
  WALL: 'wall',
  ROOF: 'roof'
};

export class PrefabSystem {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.prefabs = [];

    // Materials
    this.mats = {
      [Prefabs.FLOOR]: new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9 }), // Stone
      [Prefabs.WALL]: new THREE.MeshStandardMaterial({ color: 0x737373, roughness: 0.8 }),  // Brick/Stone
      [Prefabs.ROOF]: new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 1.0 })   // Wood/Clay
    };

    // Geometries
    this.geos = {
      [Prefabs.FLOOR]: new THREE.BoxGeometry(4, 0.4, 4),
      [Prefabs.WALL]: new THREE.BoxGeometry(4, 4, 0.4),
      [Prefabs.ROOF]: new THREE.ConeGeometry(2.8, 2, 4) // simple 4-sided pyramid
    };
    
    // Fix roof orientation so edges are flush with walls
    this.geos[Prefabs.ROOF].rotateY(Math.PI / 4);
    
    // Active selection for UI/HUD
    this.selectedPrefab = Prefabs.WALL;
    this.available = [Prefabs.FLOOR, Prefabs.WALL, Prefabs.ROOF];
  }

  cycleSelection(forward = true) {
    const idx = this.available.indexOf(this.selectedPrefab);
    let nextIdx = forward ? idx + 1 : idx - 1;
    if (nextIdx >= this.available.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = this.available.length - 1;
    this.selectedPrefab = this.available[nextIdx];
    return this.selectedPrefab;
  }

  /**
   * Snaps a world coordinate to the nearest grid increment (4x4)
   */
  snapToGrid(val, increment = 4) {
    return Math.round(val / increment) * increment;
  }

  /**
   * Place prefab based on a raycast hit
   */
  placePrefab(hitPoint, normal) {
    // Basic snap: 
    // If placing on terrain (Y-normal is strictly up), snap based on hit point.
    // We add normal*0.1 to avoid intersecting exactly flush.
    let px = this.snapToGrid(hitPoint.x + normal.x * 2, 4);
    let py = hitPoint.y + normal.y * 2; // Approximate height snapping
    let pz = this.snapToGrid(hitPoint.z + normal.z * 2, 4);

    let ry = 0;
    let offset = new THREE.Vector3(0,0,0);

    if (this.selectedPrefab === Prefabs.FLOOR) {
      // Snap to ground level
      py = this.world.getSurfaceHeight(px, pz) + 0.2;
    } else if (this.selectedPrefab === Prefabs.WALL) {
      // Walls sit ON the ground or floors
      py = this.world.getSurfaceHeight(px, pz) + 2.0; 
      // Basic rotation guessing based on normal if snapped to another prefab
      if (Math.abs(normal.x) > 0.5) ry = Math.PI / 2;
    } else if (this.selectedPrefab === Prefabs.ROOF) {
      py = this.world.getSurfaceHeight(px, pz) + 4.0; // Assume 1 story for MVP
    }

    const mesh = new THREE.Mesh(this.geos[this.selectedPrefab], this.mats[this.selectedPrefab]);
    mesh.position.set(px, py, pz);
    mesh.rotation.y = ry;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.scene.add(mesh);
    this.prefabs.push(mesh);
    this.world.registerPrefab(mesh);
    
    return mesh;
  }
}
