/**
 * NexusWorld — Procedural Terrain Generator
 * Uses multi-octave simplex noise to create biomes and terrain features.
 */

import { createNoise2D, createNoise3D } from 'simplex-noise';
import { BlockID } from './BlockTypes.js';

// Biome types
export const Biome = {
  OCEAN: 'Ocean',
  BEACH: 'Beach',
  PLAINS: 'Plains',
  FOREST: 'Forest',
  DESERT: 'Desert',
  MOUNTAINS: 'Mountains',
  SNOW: 'Snow Peaks',
  SWAMP: 'Swamp',
};

export class TerrainGenerator {
  constructor(seed = Math.random() * 65536) {
    this.seed = seed;
    // Create multiple noise functions for layered terrain
    const seedFn = () => {
      let s = seed;
      return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    };
    const rng = seedFn();
    this.noise2D = createNoise2D(rng);
    this.noise2D_b = createNoise2D(rng);  // biome noise
    this.noise2D_c = createNoise2D(rng);  // cave noise
    this.noise3D = createNoise3D(rng);
    this.noise2D_d = createNoise2D(rng);  // detail
    this.noise2D_m = createNoise2D(rng);  // moisture
  }

  /**
   * Multi-octave noise for smooth terrain
   */
  octaveNoise(x, z, octaves = 4, persistence = 0.5, lacunarity = 2.0, scale = 0.005) {
    let total = 0;
    let frequency = scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Determine biome at a world position
   */
  getBiome(x, z) {
    // Temperature and moisture determine biome
    const temp = this.noise2D_b(x * 0.001, z * 0.001);
    const moisture = this.noise2D_m(x * 0.0015 + 500, z * 0.0015 + 500);

    if (temp < -0.4) return Biome.SNOW;
    if (temp < -0.1 && moisture > 0.1) return Biome.SNOW;
    if (temp > 0.4) {
      if (moisture < -0.2) return Biome.DESERT;
      return Biome.PLAINS;
    }
    if (moisture > 0.3) return Biome.SWAMP;
    if (moisture > 0) return Biome.FOREST;
    if (temp > 0.1 && moisture < -0.3) return Biome.DESERT;

    // Elevation-based biomes
    const elevation = this.octaveNoise(x, z, 4, 0.5, 2.0, 0.003);
    if (elevation > 0.5) return Biome.MOUNTAINS;
    if (elevation < -0.3) return Biome.OCEAN;
    if (elevation < -0.15) return Biome.BEACH;

    return Biome.PLAINS;
  }

  /**
   * Generate terrain height at world position
   */
  getHeight(x, z) {
    const biome = this.getBiome(x, z);

    // Base terrain
    let height = this.octaveNoise(x, z, 6, 0.5, 2.0, 0.004);

    // Biome-specific height modifiers
    switch (biome) {
      case Biome.MOUNTAINS:
        height = 60 + height * 60 + Math.abs(this.octaveNoise(x, z, 4, 0.6, 2.5, 0.008)) * 40;
        break;
      case Biome.SNOW:
        height = 55 + height * 30 + Math.abs(this.octaveNoise(x, z, 3, 0.5, 2.0, 0.006)) * 25;
        break;
      case Biome.PLAINS:
        height = 40 + height * 8 + this.noise2D_d(x * 0.02, z * 0.02) * 2;
        break;
      case Biome.FOREST:
        height = 42 + height * 12 + this.noise2D_d(x * 0.015, z * 0.015) * 3;
        break;
      case Biome.DESERT:
        height = 38 + height * 6 + Math.abs(this.noise2D_d(x * 0.03, z * 0.03)) * 4;
        break;
      case Biome.SWAMP:
        height = 36 + height * 4;
        break;
      case Biome.OCEAN:
        height = 25 + height * 8;
        break;
      case Biome.BEACH:
        height = 34 + height * 3;
        break;
      default:
        height = 40 + height * 10;
    }

    return Math.floor(height);
  }

  /**
   * Get block type at a specific world position
   */
  getBlock(x, y, z) {
    const surfaceHeight = this.getHeight(x, z);
    const biome = this.getBiome(x, z);

    // Bedrock layer
    if (y === 0) return BlockID.BEDROCK;
    if (y <= 2 && Math.random() < 0.5) return BlockID.BEDROCK;

    // Below terrain
    if (y > surfaceHeight) {
      // Water
      const waterLevel = 35;
      if (y <= waterLevel && biome !== Biome.DESERT) {
        return BlockID.WATER;
      }
      return BlockID.AIR;
    }

    // Cave generation using 3D noise
    if (y > 3 && y < surfaceHeight - 3) {
      const caveNoise = this.noise3D(x * 0.04, y * 0.04, z * 0.04);
      const caveNoise2 = this.noise3D(x * 0.08, y * 0.08, z * 0.08);
      if (caveNoise > 0.55 && caveNoise2 > 0.1) {
        return BlockID.AIR; // Cave
      }
    }

    // Ore generation
    if (y < 15) {
      const oreNoise = this.noise3D(x * 0.1, y * 0.1, z * 0.1);
      if (oreNoise > 0.75) return BlockID.DIAMOND_ORE;
      if (oreNoise > 0.65) return BlockID.GOLD_ORE;
    }
    if (y < 40) {
      const oreNoise = this.noise3D(x * 0.08 + 100, y * 0.08, z * 0.08 + 100);
      if (oreNoise > 0.7) return BlockID.IRON_ORE;
      if (oreNoise > 0.6) return BlockID.COAL_ORE;
    }

    // Surface and sub-surface blocks by biome
    const depth = surfaceHeight - y;

    switch (biome) {
      case Biome.DESERT:
        if (depth === 0) return BlockID.SAND;
        if (depth < 4) return BlockID.SAND;
        if (depth < 8) return BlockID.SANDSTONE;
        return BlockID.STONE;

      case Biome.BEACH:
        if (depth < 3) return BlockID.SAND;
        if (depth < 6) return BlockID.SANDSTONE;
        return BlockID.STONE;

      case Biome.SNOW:
        if (depth === 0) return BlockID.SNOW;
        if (depth < 3) return BlockID.DIRT;
        return BlockID.STONE;

      case Biome.SWAMP:
        if (depth === 0) return BlockID.GRASS;
        if (depth < 2) return BlockID.DIRT;
        if (depth < 5) return BlockID.CLAY;
        return BlockID.STONE;

      case Biome.MOUNTAINS:
        if (surfaceHeight > 80 && depth === 0) return BlockID.SNOW;
        if (depth < 2) return BlockID.STONE;
        if (depth < 5) return BlockID.GRAVEL;
        return BlockID.STONE;

      case Biome.OCEAN:
        if (depth < 3) return BlockID.SAND;
        if (depth < 5) return BlockID.GRAVEL;
        return BlockID.STONE;

      default: // Plains, Forest
        if (depth === 0) return BlockID.GRASS;
        if (depth < 4) return BlockID.DIRT;
        return BlockID.STONE;
    }
  }

  /**
   * Should a tree spawn at this position?
   */
  shouldSpawnTree(x, z) {
    const biome = this.getBiome(x, z);
    const treeNoise = this.noise2D_d(x * 0.5, z * 0.5);

    switch (biome) {
      case Biome.FOREST:
        return treeNoise > 0.3 && (x % 3 === 0) && (z % 3 === 0);
      case Biome.PLAINS:
        return treeNoise > 0.7 && (x % 7 === 0) && (z % 7 === 0);
      case Biome.SWAMP:
        return treeNoise > 0.4 && (x % 5 === 0) && (z % 5 === 0);
      case Biome.SNOW:
        return treeNoise > 0.55 && (x % 6 === 0) && (z % 6 === 0);
      default:
        return false;
    }
  }

  /**
   * Should decoration spawn at this position?
   */
  getDecoration(x, z, biome) {
    const decoNoise = this.noise2D_d(x * 0.8 + 200, z * 0.8 + 200);

    switch (biome) {
      case Biome.PLAINS:
        if (decoNoise > 0.6) return BlockID.TALL_GRASS;
        if (decoNoise > 0.78) return BlockID.FLOWER_RED;
        if (decoNoise > 0.85) return BlockID.FLOWER_YELLOW;
        break;
      case Biome.FOREST:
        if (decoNoise > 0.7) return BlockID.TALL_GRASS;
        if (decoNoise > 0.88) return BlockID.MUSHROOM;
        break;
      case Biome.DESERT:
        if (decoNoise > 0.85) return BlockID.CACTUS;
        break;
      case Biome.SWAMP:
        if (decoNoise > 0.5) return BlockID.TALL_GRASS;
        if (decoNoise > 0.9) return BlockID.MUSHROOM;
        break;
      default:
        break;
    }
    return BlockID.AIR;
  }
}

export default TerrainGenerator;
