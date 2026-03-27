/**
 * NexusWorld — World Manager
 * Manages chunk loading/unloading around the player, block access, and world state.
 */

import * as THREE from 'three';
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk.js';
import { TerrainGenerator } from './TerrainGenerator.js';
import { BlockID, isSolid } from './BlockTypes.js';

export class World {
  constructor(scene, seed) {
    this.scene = scene;
    this.seed = seed || Math.floor(Math.random() * 999999);
    this.terrainGenerator = new TerrainGenerator(this.seed);
    this.chunks = new Map(); // key: "cx,cz" -> Chunk
    this.renderDistance = 6;
    this.chunksToGenerate = [];
    this.generating = false;
    this.totalChunksGenerated = 0;
  }

  /**
   * Get chunk key
   */
  key(cx, cz) {
    return `${cx},${cz}`;
  }

  /**
   * Get chunk at chunk coords
   */
  getChunk(cx, cz) {
    return this.chunks.get(this.key(cx, cz));
  }

  /**
   * World coord to chunk coord
   */
  worldToChunk(x) {
    return Math.floor(x / CHUNK_SIZE);
  }

  /**
   * Get block at world coordinates
   */
  getBlock(x, y, z) {
    const cx = this.worldToChunk(x);
    const cz = this.worldToChunk(z);
    const chunk = this.getChunk(cx, cz);
    if (!chunk || !chunk.generated) return BlockID.AIR;
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.getBlock(lx, y, lz);
  }

  /**
   * Set block at world coordinates
   */
  setBlock(x, y, z, blockId) {
    const cx = this.worldToChunk(x);
    const cz = this.worldToChunk(z);
    const chunk = this.getChunk(cx, cz);
    if (!chunk || !chunk.generated) return;
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.setBlock(lx, y, lz, blockId);

    // Rebuild this chunk
    this.rebuildChunk(cx, cz);

    // If on edge, rebuild neighbor chunk too
    if (lx === 0) this.rebuildChunk(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.rebuildChunk(cx + 1, cz);
    if (lz === 0) this.rebuildChunk(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.rebuildChunk(cx, cz + 1);
  }

  /**
   * Rebuild a chunk's mesh
   */
  rebuildChunk(cx, cz) {
    const chunk = this.getChunk(cx, cz);
    if (!chunk || !chunk.generated) return;

    // Remove old meshes from scene
    if (chunk.mesh) this.scene.remove(chunk.mesh);
    if (chunk.waterMesh) this.scene.remove(chunk.waterMesh);

    // Rebuild
    chunk.dirty = true;
    chunk.buildMesh((wx, wy, wz) => this.getBlock(wx, wy, wz));

    // Add new meshes
    if (chunk.mesh) this.scene.add(chunk.mesh);
    if (chunk.waterMesh) this.scene.add(chunk.waterMesh);
  }

  /**
   * Update chunks around player position
   */
  update(playerX, playerZ, onProgress) {
    const pcx = this.worldToChunk(Math.floor(playerX));
    const pcz = this.worldToChunk(Math.floor(playerZ));

    // Determine which chunks should be loaded
    const needed = new Set();
    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        if (dx * dx + dz * dz > this.renderDistance * this.renderDistance) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        needed.add(this.key(cx, cz));

        if (!this.chunks.has(this.key(cx, cz))) {
          this.chunksToGenerate.push({ cx, cz, dist: dx * dx + dz * dz });
        }
      }
    }

    // Sort by distance (closest first)
    this.chunksToGenerate.sort((a, b) => a.dist - b.dist);

    // Generate a few chunks per frame to avoid jank
    const chunksPerFrame = 2;
    for (let i = 0; i < chunksPerFrame && this.chunksToGenerate.length > 0; i++) {
      const { cx, cz } = this.chunksToGenerate.shift();
      if (this.chunks.has(this.key(cx, cz))) continue;

      const chunk = new Chunk(cx, cz, this.terrainGenerator);
      chunk.generate();
      chunk.buildMesh((wx, wy, wz) => this.getBlock(wx, wy, wz));

      this.chunks.set(this.key(cx, cz), chunk);

      if (chunk.mesh) this.scene.add(chunk.mesh);
      if (chunk.waterMesh) this.scene.add(chunk.waterMesh);

      this.totalChunksGenerated++;
      if (onProgress) onProgress(this.totalChunksGenerated);
    }

    // Unload far chunks
    for (const [key, chunk] of this.chunks) {
      if (!needed.has(key)) {
        if (chunk.mesh) this.scene.remove(chunk.mesh);
        if (chunk.waterMesh) this.scene.remove(chunk.waterMesh);
        chunk.dispose();
        this.chunks.delete(key);
      }
    }
  }

  /**
   * Get surface height at world position
   */
  getSurfaceHeight(x, z) {
    return this.terrainGenerator.getHeight(Math.floor(x), Math.floor(z));
  }

  /**
   * Get biome at world position
   */
  getBiome(x, z) {
    return this.terrainGenerator.getBiome(Math.floor(x), Math.floor(z));
  }

  /**
   * Check if a position is solid (for collision)
   */
  isSolidAt(x, y, z) {
    return isSolid(this.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)));
  }

  /**
   * Raycast into the world for block selection
   */
  raycast(origin, direction, maxDist = 8) {
    const step = 0.05;
    const pos = origin.clone();
    const dir = direction.clone().normalize().multiplyScalar(step);
    let prevPos = origin.clone();

    for (let d = 0; d < maxDist; d += step) {
      pos.add(dir);
      const bx = Math.floor(pos.x);
      const by = Math.floor(pos.y);
      const bz = Math.floor(pos.z);

      const blockId = this.getBlock(bx, by, bz);
      if (blockId !== BlockID.AIR && blockId !== BlockID.WATER) {
        return {
          hit: true,
          blockPos: new THREE.Vector3(bx, by, bz),
          blockId: blockId,
          // Place position = block before the hit
          placePos: new THREE.Vector3(
            Math.floor(prevPos.x),
            Math.floor(prevPos.y),
            Math.floor(prevPos.z)
          ),
          distance: d,
        };
      }
      prevPos.copy(pos);
    }

    return { hit: false };
  }

  /**
   * Initial world generation (generates chunks around spawn)
   */
  async generateInitial(centerX, centerZ, onProgress) {
    const pcx = this.worldToChunk(centerX);
    const pcz = this.worldToChunk(centerZ);
    const initialRadius = 4;
    const totalChunks = Math.PI * initialRadius * initialRadius;
    let generated = 0;

    for (let dx = -initialRadius; dx <= initialRadius; dx++) {
      for (let dz = -initialRadius; dz <= initialRadius; dz++) {
        if (dx * dx + dz * dz > initialRadius * initialRadius) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;

        const chunk = new Chunk(cx, cz, this.terrainGenerator);
        chunk.generate();
        chunk.buildMesh((wx, wy, wz) => {
          const c = this.getChunk(this.worldToChunk(wx), this.worldToChunk(wz));
          if (!c || !c.generated) return BlockID.AIR;
          const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
          const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
          return c.getBlock(lx, wy, lz);
        });

        this.chunks.set(this.key(cx, cz), chunk);

        if (chunk.mesh) this.scene.add(chunk.mesh);
        if (chunk.waterMesh) this.scene.add(chunk.waterMesh);

        generated++;
        this.totalChunksGenerated++;
        if (onProgress) onProgress(generated / totalChunks);

        // Yield to prevent blocking
        if (generated % 3 === 0) {
          await new Promise(r => setTimeout(r, 1));
        }
      }
    }
  }

  /**
   * Set render distance
   */
  setRenderDistance(dist) {
    this.renderDistance = Math.max(2, Math.min(16, dist));
  }
}

export default World;
