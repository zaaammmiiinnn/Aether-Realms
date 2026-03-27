/**
 * NexusWorld — Pure Gameplay Entry
 * Radically stripped down to ONLY Core 3D engine and game logic. 
 * ZERO DOM/UI manipulation apart from pure HUD.
 */

import * as THREE from 'three';
import { Renderer } from './engine/Renderer.js';
import { World } from './engine/World.js';
import { PrefabSystem } from './engine/PrefabSystem.js';
import { RuinGenerator } from './environment/RuinGenerator.js';
import { Sky } from './environment/Sky.js';
import { Weather } from './environment/Weather.js';
import { Lighting } from './environment/Lighting.js';
import { Player } from './player/Player.js';
import { CreatureManager } from './ai/Creature.js';
import { MissionManager } from './player/MissionManager.js';

// ============================================
// Core Globals
// ============================================
let renderer, world, sky, weather, lighting;
let player, prefabSystem, ruinSystem, creatureManager, missionManager;
let clock = new THREE.Clock();
let isPlaying = false;
let isInitialized = false;

// HUD / Toasts system defined globally
window.showToast = (message, type = '') => {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};

// ============================================
// Instant Start Logic
// ============================================
const startScreen = document.getElementById('start-screen');
startScreen.addEventListener('click', async () => {
  startScreen.style.display = 'none';
  
  // Game generates intensely fast, no loading screen needed
  if (!isInitialized) await initCoreGame();
  
  player.requestPointerLock();
  isPlaying = true;
});

// React to pointer lock breaking (Player pressed ESC)
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement) {
    startScreen.style.display = 'flex';
    document.querySelector('#start-screen p').textContent = 'CLICK TO RESUME';
    isPlaying = false;
  }
});

// ============================================
// Core Initialization
// ============================================
async function initCoreGame() {
  const canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);

  const seed = Date.now() % 10000;
  world = new World(renderer.scene, seed);

  sky = new Sky(renderer.scene);
  weather = new Weather(renderer.scene);
  lighting = new Lighting(sky, weather);

  prefabSystem = new PrefabSystem(renderer.scene, world);
  ruinSystem = new RuinGenerator(renderer.scene, world);
  missionManager = new MissionManager(renderer.scene, world, ruinSystem, sky);
  
  // Spawn the dramatic monolith
  ruinSystem.generate(0, 50);

  player = new Player(renderer.camera, world);
  creatureManager = new CreatureManager(renderer.scene, world);

  // Auto-spawn player
  player.spawn();
  
  isInitialized = true;
  gameLoop();
  
  window.showToast('Move: WASD | Build: Right Click | Cycle Tool: Left Click / Scroll');
  window.showToast('Quest: the anomaly awaits.', 'info');
}

// ============================================
// Pure Game Loop
// ============================================
let fpsFrames = 0, fpsTime = 0;
function gameLoop() {
  requestAnimationFrame(gameLoop);
  
  if (!isPlaying) return;

  const dt = clock.getDelta() * 1000;

  // FPS tracking
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 1000) {
    document.getElementById('fps-counter').textContent = `FPS: ${fpsFrames}`;
    fpsFrames = 0;
    fpsTime = 0;
  }

  // Engine Ticks
  player.update(dt);
  world.update(player.position.x, player.position.z);
  sky.update(player.position, dt);
  weather.update(dt, player.position);
  lighting.update(dt);
  ruinSystem.update(dt);
  creatureManager.update(dt, player.position);
  missionManager.update(dt, player.position);

  renderer.render();
}

// ============================================
// Interactions (Player Events)
// ============================================
document.addEventListener('mousedown', (e) => {
  if (!isPlaying || !player.locked) return;

  if (e.button === 2) { 
    // Right Click = Place
    const origin = renderer.camera.position.clone();
    const hit = world.raycast(origin, player.getLookDirection(), 20);
    if (hit.hit) {
      prefabSystem.placePrefab(hit.point, hit.normal);
    }
  } else if (e.button === 0) {
    // Left Click = Cycle Tools
    const tool = prefabSystem.cycleSelection(true);
    window.showToast(`Tool Equipped: ${tool.toUpperCase()}`);
  }
});

document.addEventListener('wheel', (e) => {
  if (!isPlaying || !player.locked) return;
  const now = Date.now();
  if (now - (window.lastWheelTime || 0) < 100) return;
  window.lastWheelTime = now;

  const tool = prefabSystem.cycleSelection(e.deltaY > 0);
  window.showToast(`Tool Equipped: ${tool.toUpperCase()}`);
});

document.addEventListener('contextmenu', e => e.preventDefault());
