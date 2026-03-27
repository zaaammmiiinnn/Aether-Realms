/**
 * NexusWorld — Renderer
 * Three.js renderer setup with post-processing effects.
 */

import * as THREE from 'three';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Handle resize
    window.addEventListener('resize', () => this.onResize());

    // Selection highlight
    this.selectionBox = this.createSelectionBox();
    this.scene.add(this.selectionBox);
    this.selectionBox.visible = false;
  }

  createSelectionBox() {
    const geometry = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    });
    return new THREE.LineSegments(edges, material);
  }

  showSelection(x, y, z) {
    this.selectionBox.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.selectionBox.visible = true;
  }

  hideSelection() {
    this.selectionBox.visible = false;
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  setFOV(fov) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  setShadows(enabled) {
    this.renderer.shadowMap.enabled = enabled;
  }

  setFog(enabled, density = 0.008) {
    if (enabled) {
      this.scene.fog = new THREE.FogExp2(this.scene.background, density);
    } else {
      this.scene.fog = null;
    }
  }

  setFogColor(color) {
    if (this.scene.fog) {
      this.scene.fog.color.set(color);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  get domElement() {
    return this.renderer.domElement;
  }
}

export default Renderer;
