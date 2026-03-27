/**
 * NexusWorld — World Manager
 * Manages the smooth heightmap terrain and prefab raycasting.
 */

import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator.js';

export class World {
  constructor(scene, seed) {
    this.scene = scene;
    this.seed = seed || Math.floor(Math.random() * 999999);
    this.terrainGenerator = new TerrainGenerator(this.seed);
    
    // Arrays for THREE.Raycaster
    this.collidableMeshes = [];
    
    this.initTerrain();
  }

  /**
   * Generates a massive continuous smooth plane for the MVP
   */
  initTerrain() {
    this.size = 1000;
    this.segments = 250; // high detail for smooth hills

    const geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const vx = positions.getX(i);
      const vz = positions.getZ(i);
      const vy = this.terrainGenerator.getHeight(vx, vz);
      positions.setY(i, vy);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x4d7c38, // natural grassy green
      roughness: 0.9,
      metalness: 0.05,
      flatShading: false, // smooth shading!
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.scene.add(this.terrainMesh);
    
    this.collidableMeshes.push(this.terrainMesh);

    this.populateEnvironment();
  }

  populateEnvironment() {
    const treeTrunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2.5, 5);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 1.0 });

    const treeTopGeo = new THREE.ConeGeometry(2, 4, 5);
    const treeTopMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 0.8, flatShading: true });

    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, flatShading: true });

    for (let i = 0; i < 300; i++) {
       const x = (Math.random() - 0.5) * 800;
       const z = (Math.random() - 0.5) * 800;
       
       // Keep clear of spawn and ruin area
       if (x > -30 && x < 30 && z > -30 && z < 70) continue;

       const y = this.getSurfaceHeight(x, z);

       if (Math.random() > 0.4) {
          // Tree
          const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
          trunk.position.set(x, y + 1.0, z);
          
          const top = new THREE.Mesh(treeTopGeo, treeTopMat);
          top.position.set(x, y + 3.0, z);
          top.rotation.y = Math.random() * Math.PI;
          
          trunk.castShadow = true; trunk.receiveShadow = true;
          top.castShadow = true; top.receiveShadow = true;
          this.scene.add(trunk); this.scene.add(top);
          this.collidableMeshes.push(trunk);
       } else {
          // Rock
          const rock = new THREE.Mesh(rockGeo, rockMat);
          const s = 0.5 + Math.random() * 2.0;
          rock.scale.set(s, s*0.5, s);
          rock.position.set(x, y + s*0.2, z);
          rock.rotation.y = Math.random() * Math.PI;
          rock.rotation.x = Math.random() * 0.5;
          rock.castShadow = true; rock.receiveShadow = true;
          this.scene.add(rock);
          this.collidableMeshes.push(rock);
       }
    }
  }

  /**
   * Dummy update function (no chunk loading needed for Phase 1 MVP)
   */
  update(playerX, playerZ, onProgress) {
    // Notify loaded immediately since it's a static plane
    if (onProgress) onProgress(100); 
  }

  /**
   * Get surface height at world position
   */
  getSurfaceHeight(x, z) {
    return this.terrainGenerator.getHeight(x, z);
  }

  /**
   * Registers a prefab mesh so the player can collide/raycast with it
   */
  registerPrefab(mesh) {
    if (mesh) {
      this.collidableMeshes.push(mesh);
    }
  }

  /**
   * Raycast against the smooth terrain and placed prefabs
   */
  raycast(origin, direction, maxDist = 15) {
    const raycaster = new THREE.Raycaster(origin, direction, 0, maxDist);
    const intersects = raycaster.intersectObjects(this.collidableMeshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      return {
        hit: true,
        point: hit.point,
        normal: hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0),
        object: hit.object
      };
    }

    return { hit: false };
  }
}
