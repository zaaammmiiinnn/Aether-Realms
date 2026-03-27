/**
 * NexusWorld — Dynamic Sky System
 * Sun/moon cycle with procedural clouds and color transitions.
 */

import * as THREE from 'three';

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.time = 0.5; // 0-1, where 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 0/1 = midnight
    this.timeSpeed = 0.000001; // How fast a day passes (very slow, ~16 mins per day at 60fps)

    // Sun
    this.sunLight = new THREE.DirectionalLight(0xfff4e0, 1.5);
    this.sunLight.position.set(100, 100, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 300;
    this.sunLight.shadow.camera.left = -80;
    this.sunLight.shadow.camera.right = 80;
    this.sunLight.shadow.camera.top = 80;
    this.sunLight.shadow.camera.bottom = -80;
    this.sunLight.shadow.bias = -0.001;
    scene.add(this.sunLight);

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(this.ambientLight);

    // Hemisphere light for sky/ground color blending
    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3a5f3a, 0.3);
    scene.add(this.hemiLight);

    // Sun sphere (visual)
    const sunGeo = new THREE.SphereGeometry(3, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(this.sunMesh);

    // Moon sphere
    const moonGeo = new THREE.SphereGeometry(2.5, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xddeeff });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(this.moonMesh);

    // Stars
    this.stars = this.createStars();
    scene.add(this.stars);

    // Sky colors at different times
    this.skyColors = {
      dawn: new THREE.Color(0xff7744),
      sunrise: new THREE.Color(0xffaa66),
      day: new THREE.Color(0x87ceeb),
      noon: new THREE.Color(0x6bb3d9),
      sunset: new THREE.Color(0xff6633),
      dusk: new THREE.Color(0x553366),
      night: new THREE.Color(0x0a0a1a),
      midnight: new THREE.Color(0x050510),
    };
  }

  createStars() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const sizes = [];

    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 400;
      vertices.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      sizes.push(0.5 + Math.random() * 1.5);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0,
      sizeAttenuation: false,
    });

    return new THREE.Points(geometry, material);
  }

  /**
   * Get human-readable time string
   */
  getTimeString() {
    const hours = Math.floor(this.time * 24);
    const minutes = Math.floor((this.time * 24 - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Get the sunlight factor (0 = night, 1 = full day)
   */
  getSunFactor() {
    // Sun is up roughly between 0.2 and 0.8
    const t = this.time;
    if (t >= 0.25 && t <= 0.75) {
      // Day
      const dayProgress = (t - 0.25) / 0.5;
      return Math.sin(dayProgress * Math.PI);
    } else {
      return 0;
    }
  }

  /**
   * Update sky system
   */
  update(playerPos, deltaTime) {
    this.time = (this.time + this.timeSpeed * deltaTime) % 1.0;

    const angle = this.time * Math.PI * 2;
    const sunDist = 200;
    const px = playerPos.x;
    const pz = playerPos.z;

    // Sun position
    this.sunMesh.position.set(
      px + Math.cos(angle) * sunDist,
      Math.sin(angle) * sunDist,
      pz + Math.sin(angle) * sunDist * 0.3
    );

    // Moon opposite the sun
    this.moonMesh.position.set(
      px - Math.cos(angle) * sunDist,
      -Math.sin(angle) * sunDist,
      pz - Math.sin(angle) * sunDist * 0.3
    );

    // Update directional light to follow sun
    this.sunLight.position.copy(this.sunMesh.position);
    this.sunLight.target.position.set(px, 0, pz);
    this.sunLight.target.updateMatrixWorld();

    // Update shadow camera to follow player
    this.sunLight.shadow.camera.updateProjectionMatrix();

    // Sun factor
    const sf = this.getSunFactor();

    // Sky color interpolation
    let skyColor;
    const t = this.time;
    if (t < 0.2) {
      skyColor = this.skyColors.night.clone().lerp(this.skyColors.dawn, t / 0.2);
    } else if (t < 0.3) {
      skyColor = this.skyColors.dawn.clone().lerp(this.skyColors.day, (t - 0.2) / 0.1);
    } else if (t < 0.65) {
      skyColor = this.skyColors.day.clone().lerp(this.skyColors.noon, (t - 0.3) / 0.35);
    } else if (t < 0.75) {
      skyColor = this.skyColors.noon.clone().lerp(this.skyColors.sunset, (t - 0.65) / 0.1);
    } else if (t < 0.85) {
      skyColor = this.skyColors.sunset.clone().lerp(this.skyColors.dusk, (t - 0.75) / 0.1);
    } else {
      skyColor = this.skyColors.dusk.clone().lerp(this.skyColors.night, (t - 0.85) / 0.15);
    }

    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color.copy(skyColor);
    }

    // Light intensity based on time
    this.sunLight.intensity = sf * 1.8;
    this.sunLight.color.setHSL(0.1, 0.3, 0.5 + sf * 0.5);

    this.ambientLight.intensity = 0.1 + sf * 0.4;
    this.ambientLight.color.copy(skyColor).multiplyScalar(0.5);

    this.hemiLight.intensity = 0.1 + sf * 0.3;
    this.hemiLight.color.copy(skyColor);

    // Star visibility
    this.stars.material.opacity = Math.max(0, 1 - sf * 3);

    // Sun/moon visibility
    this.sunMesh.visible = sf > 0.01;
    this.moonMesh.visible = sf < 0.5;
    this.sunMesh.material.color.setHSL(0.1, 0.6, 0.7 + sf * 0.3);

    // Moon glow at night
    if (!this.sunMesh.visible) {
      this.moonMesh.material.color.setHSL(0.6, 0.1, 0.7 + (1 - sf) * 0.3);
    }
  }

  /**
   * Check if it's night
   */
  isNight() {
    return this.getSunFactor() < 0.1;
  }
}

export default Sky;
