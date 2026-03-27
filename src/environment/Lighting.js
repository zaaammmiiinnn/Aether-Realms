/**
 * NexusWorld — Dynamic Lighting System
 * Manages sun angle, ambient, and environmental lighting.
 */

export class Lighting {
  constructor(sky, weather) {
    this.sky = sky;
    this.weather = weather;
  }

  /**
   * Update lighting based on sky and weather
   */
  update(deltaTime) {
    const sf = this.sky.getSunFactor();
    const wi = this.weather.intensity;

    // Reduce sunlight during rain/storms
    const weatherDim = 1 - wi * 0.4;
    this.sky.sunLight.intensity = sf * 1.8 * weatherDim;
    this.sky.ambientLight.intensity = (0.1 + sf * 0.4) * weatherDim;

    // Adjust tone mapping exposure based on weather
    // (handled externally via renderer)
  }

  /**
   * Get overall light level (0-1)
   */
  getLightLevel() {
    const sf = this.sky.getSunFactor();
    const wi = this.weather.intensity;
    return sf * (1 - wi * 0.3);
  }
}

export default Lighting;
