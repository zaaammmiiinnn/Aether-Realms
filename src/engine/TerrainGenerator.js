/**
 * NexusWorld — Smooth Terrain Generator
 * Uses simplex noise to output continuous heightmap values for plane displacement.
 */

import { createNoise2D } from 'simplex-noise';

export class TerrainGenerator {
  constructor(seed = Math.random() * 65536) {
    this.seed = seed;
    
    const seedFn = () => {
      let s = seed;
      return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    };
    
    const rng = seedFn();
    this.noiseA = createNoise2D(rng);
    this.noiseB = createNoise2D(rng);
    this.noiseC = createNoise2D(rng);
  }

  /**
   * Get continuous ground height at world coordinates (x, z)
   */
  getHeight(x, z) {
    const scale1 = 0.005;
    const scale2 = 0.015;
    const scale3 = 0.05;

    let elevation = this.noiseA(x * scale1, z * scale1) * 30; // Large rolling hills
    elevation += this.noiseB(x * scale2, z * scale2) * 10;    // Medium bumps
    elevation += this.noiseC(x * scale3, z * scale3) * 2;     // Small details

    // Raise baseline
    elevation += 40;
    
    // Ensure no extreme deep pits
    return Math.max(elevation, 10);
  }
}

export default TerrainGenerator;
