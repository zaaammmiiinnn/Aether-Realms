/**
 * NexusWorld — Main Entry Point (Phase 1 MVP)
 * Initializes the game engine, game loop, and UI interactions without Voxels!
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
// Game State
// ============================================
const GameState = {
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  SETTINGS: 'settings',
};

let state = GameState.LOADING;
let prevState = null;

// ============================================
// Core Systems
// ============================================
let renderer, world, sky, weather, lighting;
let player, prefabSystem, ruinSystem, creatureManager, missionManager;
let clock = new THREE.Clock();
let fpsFrames = 0;
let fpsTime = 0;
let currentFps = 60;

// Settings
const settings = {
  renderDistance: 6,
  fov: 75,
  shadows: true,
  fog: true,
  masterVolume: 80,
  musicVolume: 50,
};

// ============================================
// Initialization
// ============================================
async function init() {
  createLoadingParticles();

  // Remove old voxel UI
  document.getElementById('inventory-panel')?.remove();
  document.getElementById('crafting-panel')?.remove();
  document.getElementById('hotbar')?.remove();

  // Initialize renderer
  const canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);

  // Initialize world (Smooth Terrain plane)
  updateLoadingText('Generating heightmap terrain...');
  updateLoadingBar(30);
  const seed = Date.now() % 100000;
  world = new World(renderer.scene, seed);

  // Initialize environment
  updateLoadingText('Building sky & lighting...');
  updateLoadingBar(50);
  sky = new Sky(renderer.scene);
  weather = new Weather(renderer.scene);
  lighting = new Lighting(sky, weather);

  // Initialize new systems (Prefabs, Ruins, Missions)
  prefabSystem = new PrefabSystem(renderer.scene, world);
  ruinSystem = new RuinGenerator(renderer.scene, world);
  missionManager = new MissionManager(renderer.scene, world);
  window.showToast = showToast;
  
  // Create dramatic spawn ruin
  ruinSystem.generate(0, 50);

  // Initialize player
  updateLoadingText('Preparing player & AI...');
  updateLoadingBar(80);
  player = new Player(renderer.camera, world);
  creatureManager = new CreatureManager(renderer.scene, world);

  // Spawn player near ruin
  player.spawn();
  
  updateLoadingText('Ready!');
  updateLoadingBar(100);

  setTimeout(() => setState(GameState.MENU), 500);

  updateHUDPrefab();
  gameLoop();
}

// ============================================
// Game Loop
// ============================================
function gameLoop() {
  requestAnimationFrame(gameLoop);
  const deltaTime = clock.getDelta() * 1000;

  fpsFrames++;
  fpsTime += deltaTime;
  if (fpsTime >= 1000) {
    currentFps = fpsFrames;
    fpsFrames = 0;
    fpsTime = 0;
  }

  if (state === GameState.PLAYING) {
    player.update(deltaTime);
    world.update(player.position.x, player.position.z);
    sky.update(player.position, deltaTime);
    weather.update(deltaTime, player.position);
    lighting.update(deltaTime);
    ruinSystem.update(deltaTime);
    creatureManager.update(deltaTime, player.position);
    missionManager.update(deltaTime, player.position);

    updateHUD();
  }

  renderer.render();
}

// ============================================
// Block/Prefab Interaction
// ============================================
document.addEventListener('mousedown', (e) => {
  if (state !== GameState.PLAYING || !player.locked) return;

  if (e.button === 2) { 
    // Right Click = Place Prefab
    const origin = renderer.camera.position.clone();
    const direction = player.getLookDirection();
    const hit = world.raycast(origin, direction, 20);

    if (hit.hit) {
      prefabSystem.placePrefab(hit.point, hit.normal);
      showToast(`Placed ${prefabSystem.selectedPrefab}`, 'success');
    }
  } else if (e.button === 0) {
    // Left Click = Attack / Cycle Prefab
    // Since we don't have mining yet, we cycle prefabs with left click
    prefabSystem.cycleSelection(true);
    updateHUDPrefab();
    showToast(`Selected Build Tool: ${prefabSystem.selectedPrefab}`, 'info');
  }
});

document.addEventListener('wheel', (e) => {
  if (state !== GameState.PLAYING || !player.locked) return;
  const now = Date.now();
  if (now - (window.lastWheelTime || 0) < 100) return;
  window.lastWheelTime = now;

  prefabSystem.cycleSelection(e.deltaY > 0);
  updateHUDPrefab();
});

// Prevent context menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ============================================
// State Management
// ============================================
function setState(newState) {
  prevState = state;
  state = newState;

  const screens = ['loading-screen', 'main-menu', 'settings-menu', 'hud', 'pause-menu'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  switch (newState) {
    case GameState.LOADING:
      show('loading-screen');
      break;
    case GameState.MENU:
      show('main-menu');
      break;
    case GameState.PLAYING:
      show('hud');
      player.requestPointerLock();
      break;
    case GameState.PAUSED:
      show('hud');
      show('pause-menu');
      document.exitPointerLock();
      break;
    case GameState.SETTINGS:
      show('settings-menu');
      break;
  }
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

// ============================================
// UI Wiring
// ============================================
document.getElementById('btn-singleplayer')?.addEventListener('click', () => setState(GameState.PLAYING));
document.getElementById('btn-settings')?.addEventListener('click', () => setState(GameState.SETTINGS));
document.getElementById('btn-settings-close')?.addEventListener('click', () => setState(prevState === GameState.PAUSED ? GameState.PAUSED : GameState.MENU));
document.getElementById('btn-resume')?.addEventListener('click', () => setState(GameState.PLAYING));
document.getElementById('btn-pause-settings')?.addEventListener('click', () => setState(GameState.SETTINGS));
document.getElementById('btn-quit')?.addEventListener('click', () => window.location.reload());

document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    e.preventDefault();
    if (state === GameState.PLAYING) setState(GameState.PAUSED);
    else if (state === GameState.PAUSED) setState(GameState.PLAYING);
    else if (state === GameState.SETTINGS) setState(prevState === GameState.PAUSED ? GameState.PAUSED : GameState.MENU);
  }
});

document.addEventListener('click', () => {
  if (state === GameState.PLAYING && !player?.locked) player.requestPointerLock();
});

// ============================================
// HUD Update
// ============================================
function updateHUD() {
  const fpsEl = document.getElementById('fps-counter');
  if (fpsEl) fpsEl.textContent = currentFps;

  const posEl = document.getElementById('player-pos');
  if (posEl) posEl.textContent = player.getPositionString();

  const timeEl = document.getElementById('world-time');
  if (timeEl) timeEl.textContent = sky.getTimeString();
}

function updateHUDPrefab() {
   const nameEl = document.getElementById('selected-block-name');
   if (nameEl) nameEl.textContent = `Tool: ${prefabSystem.selectedPrefab.toUpperCase()}`;
}

// ============================================
// Loading Helpers
// ============================================
function updateLoadingBar(percent) {
  const bar = document.getElementById('loading-bar');
  if (bar) bar.style.width = `${Math.min(100, percent)}%`;
}
function updateLoadingText(text) {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = text;
}
function createLoadingParticles() {
  const container = document.getElementById('loading-particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'loading-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 4 + 's';
    particle.style.animationDuration = (3 + Math.random() * 3) + 's';
    container.appendChild(particle);
  }
}
function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

init().catch(console.error);
