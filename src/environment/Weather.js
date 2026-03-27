/**
 * NexusWorld — Weather System
 * Rain, fog, storm effects with smooth transitions.
 */

import * as THREE from 'three';

export const WeatherType = {
  CLEAR: 'Clear',
  CLOUDY: 'Cloudy',
  RAIN: 'Rain',
  STORM: 'Storm',
  FOG: 'Fog',
};

export class Weather {
  constructor(scene) {
    this.scene = scene;
    this.currentWeather = WeatherType.CLEAR;
    this.targetWeather = WeatherType.CLEAR;
    this.intensity = 0; // 0-1
    this.targetIntensity = 0;
    this.transitionSpeed = 0.002;

    // Weather change timer
    this.weatherTimer = 0;
    this.weatherDuration = 600 + Math.random() * 600; // 10-20 minutes

    // Rain particles
    this.rainGroup = new THREE.Group();
    this.rainCount = 3000;
    this.rainGeometry = null;
    this.rainMaterial = null;
    this.rainMesh = null;
    this.rainVelocities = [];
    scene.add(this.rainGroup);

    this.initRain();

    // Fog density
    this.baseFogDensity = 0.008;
    this.fogDensity = this.baseFogDensity;

    // Lightning
    this.lightningFlash = new THREE.PointLight(0xffffff, 0, 500);
    this.lightningFlash.position.set(0, 100, 0);
    scene.add(this.lightningFlash);
    this.lightningTimer = 0;
    this.lightningDuration = 0;
  }

  initRain() {
    const positions = new Float32Array(this.rainCount * 3);
    this.rainVelocities = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      this.rainVelocities[i] = 0.3 + Math.random() * 0.5;
    }

    this.rainGeometry = new THREE.BufferGeometry();
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.rainMaterial = new THREE.PointsMaterial({
      color: 0xaabbcc,
      size: 0.15,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });

    this.rainMesh = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.rainGroup.add(this.rainMesh);
  }

  /**
   * Update weather system
   */
  update(deltaTime, playerPos) {
    // Weather change timer
    this.weatherTimer += deltaTime;
    if (this.weatherTimer > this.weatherDuration) {
      this.weatherTimer = 0;
      this.weatherDuration = 600 + Math.random() * 600;
      this.changeWeather();
    }

    // Transition intensity
    if (this.intensity < this.targetIntensity) {
      this.intensity = Math.min(this.intensity + this.transitionSpeed * deltaTime, this.targetIntensity);
    } else if (this.intensity > this.targetIntensity) {
      this.intensity = Math.max(this.intensity - this.transitionSpeed * deltaTime, this.targetIntensity);
    }

    // Update effects based on current weather
    this.updateRain(deltaTime, playerPos);
    this.updateFog(deltaTime);
    this.updateLightning(deltaTime, playerPos);
  }

  changeWeather() {
    const weathers = [
      WeatherType.CLEAR, WeatherType.CLEAR, WeatherType.CLEAR,
      WeatherType.CLOUDY,
      WeatherType.RAIN,
      WeatherType.STORM,
      WeatherType.FOG,
    ];

    this.targetWeather = weathers[Math.floor(Math.random() * weathers.length)];

    switch (this.targetWeather) {
      case WeatherType.CLEAR:
        this.targetIntensity = 0;
        break;
      case WeatherType.CLOUDY:
        this.targetIntensity = 0.2;
        break;
      case WeatherType.RAIN:
        this.targetIntensity = 0.6;
        break;
      case WeatherType.STORM:
        this.targetIntensity = 1.0;
        break;
      case WeatherType.FOG:
        this.targetIntensity = 0.5;
        break;
    }

    this.currentWeather = this.targetWeather;
  }

  updateRain(deltaTime, playerPos) {
    const isRaining = this.currentWeather === WeatherType.RAIN || this.currentWeather === WeatherType.STORM;
    const rainOpacity = isRaining ? this.intensity * 0.6 : 0;

    this.rainMaterial.opacity = rainOpacity;

    if (rainOpacity > 0.01) {
      const positions = this.rainGeometry.attributes.position.array;
      const px = playerPos.x;
      const py = playerPos.y;
      const pz = playerPos.z;

      for (let i = 0; i < this.rainCount; i++) {
        positions[i * 3 + 1] -= this.rainVelocities[i] * deltaTime * 0.5;

        // Reset rain drops that fall below player
        if (positions[i * 3 + 1] < py - 20) {
          positions[i * 3] = px + (Math.random() - 0.5) * 100;
          positions[i * 3 + 1] = py + 40 + Math.random() * 40;
          positions[i * 3 + 2] = pz + (Math.random() - 0.5) * 100;
        }
      }

      // Center rain around player
      this.rainGroup.position.set(0, 0, 0);
      this.rainGeometry.attributes.position.needsUpdate = true;
    }
  }

  updateFog(deltaTime) {
    let targetDensity = this.baseFogDensity;

    switch (this.currentWeather) {
      case WeatherType.FOG:
        targetDensity = 0.035 * this.intensity;
        break;
      case WeatherType.RAIN:
        targetDensity = 0.012 + 0.008 * this.intensity;
        break;
      case WeatherType.STORM:
        targetDensity = 0.02 + 0.01 * this.intensity;
        break;
      default:
        targetDensity = this.baseFogDensity;
    }

    this.fogDensity += (targetDensity - this.fogDensity) * 0.01;

    if (this.scene.fog) {
      this.scene.fog.density = this.fogDensity;
    }
  }

  updateLightning(deltaTime, playerPos) {
    if (this.currentWeather !== WeatherType.STORM) {
      this.lightningFlash.intensity = 0;
      return;
    }

    this.lightningTimer += deltaTime;

    if (this.lightningDuration > 0) {
      this.lightningDuration -= deltaTime;
      this.lightningFlash.intensity = Math.random() * 5 * this.intensity;
    } else {
      this.lightningFlash.intensity = 0;
    }

    // Random lightning strikes
    if (this.lightningTimer > 200 + Math.random() * 400) {
      this.lightningTimer = 0;
      this.lightningDuration = 5 + Math.random() * 10;
      this.lightningFlash.position.set(
        playerPos.x + (Math.random() - 0.5) * 200,
        100,
        playerPos.z + (Math.random() - 0.5) * 200
      );
    }
  }

  /**
   * Set weather manually
   */
  setWeather(type) {
    this.currentWeather = type;
    this.targetWeather = type;
    switch (type) {
      case WeatherType.CLEAR: this.targetIntensity = 0; break;
      case WeatherType.CLOUDY: this.targetIntensity = 0.3; break;
      case WeatherType.RAIN: this.targetIntensity = 0.6; break;
      case WeatherType.STORM: this.targetIntensity = 1.0; break;
      case WeatherType.FOG: this.targetIntensity = 0.5; break;
    }
  }

  /**
   * Get current weather string
   */
  getWeatherString() {
    return this.currentWeather;
  }
}

export default Weather;
