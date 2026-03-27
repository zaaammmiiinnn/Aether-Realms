/**
 * NexusWorld — Chunk
 * Represents a 16x128x16 chunk of blocks with optimized mesh generation.
 */

import * as THREE from 'three';
import { BlockID, getBlock, getBlockColor, getBlockTopColor, getBlockSideColor, isTransparent, isSolid } from './BlockTypes.js';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

export class Chunk {
  constructor(cx, cz, terrainGenerator) {
    this.cx = cx;
    this.cz = cz;
    this.worldX = cx * CHUNK_SIZE;
    this.worldZ = cz * CHUNK_SIZE;
    this.terrainGenerator = terrainGenerator;

    // Block data: flat array [x][y][z]
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);

    // Three.js mesh
    this.mesh = null;
    this.waterMesh = null;
    this.dirty = true;
    this.generated = false;
    this.disposed = false;
  }

  /**
   * Get block index in flat array
   */
  index(x, y, z) {
    return (x * CHUNK_HEIGHT * CHUNK_SIZE) + (y * CHUNK_SIZE) + z;
  }

  /**
   * Get block at local coordinates
   */
  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return BlockID.AIR;
    }
    return this.blocks[this.index(x, y, z)];
  }

  /**
   * Set block at local coordinates
   */
  setBlock(x, y, z, blockId) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return;
    this.blocks[this.index(x, y, z)] = blockId;
    this.dirty = true;
  }

  /**
   * Generate terrain data for this chunk
   */
  generate() {
    const gen = this.terrainGenerator;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = this.worldX + x;
        const wz = this.worldZ + z;
        const surfaceHeight = gen.getHeight(wx, wz);
        const biome = gen.getBiome(wx, wz);

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const blockId = gen.getBlock(wx, y, wz);
          this.blocks[this.index(x, y, z)] = blockId;
        }

        // Add decorations on surface
        if (surfaceHeight > 35 && surfaceHeight < CHUNK_HEIGHT - 10) {
          const surfaceBlock = this.getBlock(x, surfaceHeight, z);
          if (surfaceBlock === BlockID.GRASS || surfaceBlock === BlockID.SAND || surfaceBlock === BlockID.SNOW) {
            // Trees
            if (gen.shouldSpawnTree(wx, wz)) {
              this.placeTree(x, surfaceHeight + 1, z, biome);
            } else {
              // Small decorations
              const deco = gen.getDecoration(wx, wz, biome);
              if (deco !== BlockID.AIR) {
                this.setBlock(x, surfaceHeight + 1, z, deco);
                if (deco === BlockID.CACTUS) {
                  // Stack cactus 2-3 high
                  const cactusHeight = 2 + Math.floor(Math.random() * 2);
                  for (let h = 1; h < cactusHeight; h++) {
                    this.setBlock(x, surfaceHeight + 1 + h, z, BlockID.CACTUS);
                  }
                }
              }
            }
          }
        }
      }
    }

    this.generated = true;
    this.dirty = true;
  }

  /**
   * Place a tree at local coordinates
   */
  placeTree(x, y, z, biome) {
    const isSnowy = biome === 'Snow Peaks';
    const trunkHeight = 4 + Math.floor(Math.random() * 3);
    const leafBlock = isSnowy ? BlockID.SNOW : BlockID.LEAVES;

    // Trunk
    for (let h = 0; h < trunkHeight; h++) {
      this.setBlock(x, y + h, z, BlockID.WOOD);
    }

    // Leaves canopy
    const leafStart = trunkHeight - 2;
    for (let h = leafStart; h < trunkHeight + 2; h++) {
      const radius = h < trunkHeight ? 2 : 1;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx === 0 && dz === 0 && h < trunkHeight) continue; // trunk position
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && Math.random() < 0.3) continue; // round corners
          const lx = x + dx;
          const lz = z + dz;
          if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
            if (this.getBlock(lx, y + h, lz) === BlockID.AIR) {
              this.setBlock(lx, y + h, lz, leafBlock);
            }
          }
        }
      }
    }
  }

  /**
   * Build optimized mesh from block data
   */
  buildMesh(getNeighborBlock) {
    if (!this.dirty || !this.generated) return;

    // Dispose old meshes
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.waterMesh.material.dispose();
    }

    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];

    const waterPositions = [];
    const waterNormals = [];
    const waterColors = [];
    const waterIndices = [];

    let vertexCount = 0;
    let waterVertexCount = 0;

    // Face definitions: [normal, vertices]
    const faces = [
      { dir: [0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], name: 'top' },    // Top
      { dir: [0, -1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], name: 'bottom' }, // Bottom
      { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], name: 'front' },   // Front
      { dir: [0, 0, -1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], name: 'back' },   // Back
      { dir: [1, 0, 0], corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], name: 'right' },   // Right
      { dir: [-1, 0, 0], corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]], name: 'left' },   // Left
    ];

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const blockId = this.getBlock(x, y, z);
          if (blockId === BlockID.AIR) continue;

          const block = getBlock(blockId);
          const isWater = blockId === BlockID.WATER;

          for (const face of faces) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            // Get neighbor block (handle cross-chunk boundaries)
            let neighborId;
            if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE) {
              const wnx = this.worldX + nx;
              const wnz = this.worldZ + nz;
              neighborId = getNeighborBlock ? getNeighborBlock(wnx, ny, wnz) : BlockID.AIR;
            } else if (ny < 0 || ny >= CHUNK_HEIGHT) {
              neighborId = BlockID.AIR;
            } else {
              neighborId = this.getBlock(nx, ny, nz);
            }

            // Only render face if neighbor is transparent and not the same liquid
            const neighborTransparent = isTransparent(neighborId);
            if (isWater && neighborId === BlockID.WATER) continue;
            if (!neighborTransparent && !isWater) continue;
            if (!isWater && !neighborTransparent) continue;

            // Determine color
            let color;
            if (face.name === 'top') {
              color = getBlockTopColor(blockId);
            } else if (face.name === 'bottom') {
              color = getBlockColor(blockId);
            } else {
              color = getBlockSideColor(blockId);
            }

            const r = ((color >> 16) & 0xff) / 255;
            const g = ((color >> 8) & 0xff) / 255;
            const b = (color & 0xff) / 255;

            // Simple ambient occlusion based on face direction
            let ao = 1.0;
            if (face.name === 'bottom') ao = 0.5;
            else if (face.name !== 'top') ao = 0.7 + Math.random() * 0.1;

            if (isWater) {
              // Water mesh
              for (const corner of face.corners) {
                waterPositions.push(x + corner[0], y + corner[1] - 0.1, z + corner[2]);
                waterNormals.push(face.dir[0], face.dir[1], face.dir[2]);
                waterColors.push(r * ao, g * ao, b * ao);
              }
              waterIndices.push(
                waterVertexCount, waterVertexCount + 1, waterVertexCount + 2,
                waterVertexCount, waterVertexCount + 2, waterVertexCount + 3
              );
              waterVertexCount += 4;
            } else {
              // Solid mesh
              for (const corner of face.corners) {
                positions.push(x + corner[0], y + corner[1], z + corner[2]);
                normals.push(face.dir[0], face.dir[1], face.dir[2]);
                colors.push(r * ao, g * ao, b * ao);
              }
              indices.push(
                vertexCount, vertexCount + 1, vertexCount + 2,
                vertexCount, vertexCount + 2, vertexCount + 3
              );
              vertexCount += 4;
            }
          }
        }
      }
    }

    // Build solid mesh
    if (positions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(this.worldX, 0, this.worldZ);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
    }

    // Build water mesh
    if (waterPositions.length > 0) {
      const waterGeometry = new THREE.BufferGeometry();
      waterGeometry.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
      waterGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
      waterGeometry.setAttribute('color', new THREE.Float32BufferAttribute(waterColors, 3));
      waterGeometry.setIndex(waterIndices);

      const waterMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.3,
        flatShading: true,
        side: THREE.DoubleSide,
      });

      this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
      this.waterMesh.position.set(this.worldX, 0, this.worldZ);
    }

    this.dirty = false;
  }

  /**
   * Dispose this chunk's resources
   */
  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.waterMesh.material.dispose();
    }
    this.disposed = true;
  }
}

export default Chunk;
