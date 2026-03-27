/**
 * NexusWorld — Main Entry Point
 * Initializes the game engine, game loop, and UI interactions.
 */

import * as THREE from 'three';
import { Renderer } from './engine/Renderer.js';
import { World } from './engine/World.js';
import { BlockID, getBlock } from './engine/BlockTypes.js';
import { Sky } from './environment/Sky.js';
import { Weather } from './environment/Weather.js';
import { Lighting } from './environment/Lighting.js';
import { Player } from './player/Player.js';
import { Inventory } from './player/Inventory.js';
import { Crafting } from './player/Crafting.js';
import { Survival } from './player/Survival.js';
import { CreatureManager } from './ai/Creature.js';

// ============================================
// Game State
// ============================================
const GameState = {
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  INVENTORY: 'inventory',
  CRAFTING: 'crafting',
  SETTINGS: 'settings',
};

let state = GameState.LOADING;
let prevState = null;

// ============================================
// Core Systems
// ============================================
let renderer, world, sky, weather, lighting;
let player, inventory, crafting, survival;
let creatureManager;
let clock = new THREE.Clock();
let fpsFrames = 0;
let fpsTime = 0;
let currentFps = 60;
let lastSelectedSlot = -1;
let lastInventoryHash = '';

function getInventoryHash() {
  if (!inventory) return '';
  return inventory.slots.map(s => s ? s.id+':'+s.count : '0').join(',');
}

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
  // Setup loading particles
  createLoadingParticles();

  // Initialize renderer
  const canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);

  // Initialize world
  updateLoadingText('Creating world seed...');
  updateLoadingBar(5);
  const seed = Date.now() % 100000;
  world = new World(renderer.scene, seed);

  // Initialize environment
  updateLoadingText('Building sky...');
  updateLoadingBar(10);
  sky = new Sky(renderer.scene);
  weather = new Weather(renderer.scene);
  lighting = new Lighting(sky, weather);

  // Initialize player
  updateLoadingText('Preparing player...');
  updateLoadingBar(15);
  player = new Player(renderer.camera, world);
  inventory = new Inventory();
  crafting = new Crafting(inventory);
  survival = new Survival();

  // Initialize creatures
  creatureManager = new CreatureManager(renderer.scene, world);

  // Generate initial world chunks
  updateLoadingText('Generating terrain...');
  await world.generateInitial(0, 0, (progress) => {
    const pct = 15 + progress * 75;
    updateLoadingBar(pct);
    const messages = [
      'Generating terrain...',
      'Carving caves...',
      'Planting trees...',
      'Placing ores...',
      'Building biomes...',
      'Populating world...',
      'Finishing touches...',
    ];
    const msgIdx = Math.min(Math.floor(progress * messages.length), messages.length - 1);
    updateLoadingText(messages[msgIdx]);
  });

  // Spawn player on surface
  player.spawn();
  showToast('Tip: Hold Left Click to mine blocks. Right Click to place.', 'info');

  updateLoadingText('Ready!');
  updateLoadingBar(100);

  // Transition to menu
  await sleep(500);
  setState(GameState.MENU);

  // Start game loop
  gameLoop();
}

// ============================================
// Game Loop
// ============================================
function gameLoop() {
  requestAnimationFrame(gameLoop);

  const deltaTime = clock.getDelta() * 1000; // ms

  // FPS counter
  fpsFrames++;
  fpsTime += deltaTime;
  if (fpsTime >= 1000) {
    currentFps = fpsFrames;
    fpsFrames = 0;
    fpsTime = 0;
  }

  if (state === GameState.PLAYING) {
    // Update player
    player.update(deltaTime);

    // Update world (chunk loading)
    world.update(player.position.x, player.position.z);

    // Update environment
    sky.update(player.position, deltaTime);
    weather.update(deltaTime, player.position);
    lighting.update(deltaTime);

    // Update creatures
    creatureManager.update(deltaTime, player.position);

    // Update survival
    survival.update(deltaTime, player.sprinting, false);

    // Block interaction (raycasting)
    handleBlockInteraction();

    // Update HUD
    updateHUD();

    // Render hotbar only if changed
    const currentHash = getInventoryHash();
    if (player.selectedSlot !== lastSelectedSlot || currentHash !== lastInventoryHash) {
      inventory.renderHotbar(player.selectedSlot);
      lastSelectedSlot = player.selectedSlot;
      lastInventoryHash = currentHash;
    }
  }

  // Render
  renderer.render();
}

// ============================================
// Block Interaction
// ============================================
function handleBlockInteraction() {
  if (!player.locked) return;

  const origin = renderer.camera.position.clone();
  const direction = player.getLookDirection();
  const hit = world.raycast(origin, direction, 7);

  if (hit.hit) {
    renderer.showSelection(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);

    // Breaking
    if (player.breaking) {
      if (!player.breakTarget ||
          !player.breakTarget.equals(hit.blockPos)) {
        player.breakTarget = hit.blockPos.clone();
        player.breakProgress = 0;
      }

      const block = getBlock(hit.blockId);
      const hardness = block.hardness || 1;
      player.breakProgress += (1 / hardness) * 0.05;

      if (player.breakProgress >= 1) {
        // Break block
        const drops = block.drops || hit.blockId;
        world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, BlockID.AIR);
        inventory.addItem(drops, 1);
        player.breakProgress = 0;
        player.breakTarget = null;
        showToast(`+1 ${getBlock(drops).name}`);
      }
    }
  } else {
    renderer.hideSelection();
    player.breakProgress = 0;
    player.breakTarget = null;
  }
}

// Right-click to place block
document.addEventListener('mousedown', (e) => {
  if (e.button !== 2 || state !== GameState.PLAYING || !player.locked) return;

  const origin = renderer.camera.position.clone();
  const direction = player.getLookDirection();
  const hit = world.raycast(origin, direction, 7);

  if (hit.hit) {
    const selectedBlock = inventory.getSelectedBlockId(player.selectedSlot);
    if (selectedBlock !== BlockID.AIR) {
      // Don't place inside player
      const px = Math.floor(player.position.x);
      const py = Math.floor(player.position.y);
      const pz = Math.floor(player.position.z);
      const pp = hit.placePos;

      if (!(pp.x === px && pp.z === pz && (pp.y === py || pp.y === py + 1))) {
        if (inventory.useItem(player.selectedSlot)) {
          world.setBlock(pp.x, pp.y, pp.z, selectedBlock);
        }
      }
    }
  }
});

// Prevent context menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ============================================
// State Management
// ============================================
function setState(newState) {
  prevState = state;
  state = newState;

  // Hide all screens
  const screens = ['loading-screen', 'main-menu', 'settings-menu', 'hud',
    'inventory-panel', 'crafting-panel', 'pause-menu'];
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

    case GameState.INVENTORY:
      show('hud');
      show('inventory-panel');
      inventory.renderInventory();
      document.exitPointerLock();
      break;

    case GameState.CRAFTING:
      show('hud');
      show('crafting-panel');
      crafting.renderCraftingMenu();
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

// Main Menu
document.getElementById('btn-singleplayer')?.addEventListener('click', () => {
  setState(GameState.PLAYING);
});

document.getElementById('btn-settings')?.addEventListener('click', () => {
  setState(GameState.SETTINGS);
});

// Settings
document.getElementById('btn-settings-close')?.addEventListener('click', () => {
  if (prevState === GameState.PAUSED) {
    setState(GameState.PAUSED);
  } else {
    setState(GameState.MENU);
  }
});

// Settings sliders
document.getElementById('render-distance')?.addEventListener('input', (e) => {
  settings.renderDistance = parseInt(e.target.value);
  document.getElementById('render-distance-val').textContent = settings.renderDistance;
  if (world) world.setRenderDistance(settings.renderDistance);
});

document.getElementById('fov')?.addEventListener('input', (e) => {
  settings.fov = parseInt(e.target.value);
  document.getElementById('fov-val').textContent = settings.fov + '°';
  if (renderer) renderer.setFOV(settings.fov);
});

document.getElementById('shadows-toggle')?.addEventListener('change', (e) => {
  settings.shadows = e.target.checked;
  if (renderer) renderer.setShadows(settings.shadows);
});

document.getElementById('fog-toggle')?.addEventListener('change', (e) => {
  settings.fog = e.target.checked;
  if (renderer) renderer.setFog(settings.fog);
});

document.getElementById('master-volume')?.addEventListener('input', (e) => {
  settings.masterVolume = parseInt(e.target.value);
  document.getElementById('master-volume-val').textContent = settings.masterVolume + '%';
});

document.getElementById('music-volume')?.addEventListener('input', (e) => {
  settings.musicVolume = parseInt(e.target.value);
  document.getElementById('music-volume-val').textContent = settings.musicVolume + '%';
});

// Pause Menu
document.getElementById('btn-resume')?.addEventListener('click', () => {
  setState(GameState.PLAYING);
});

document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
  setState(GameState.SETTINGS);
});

document.getElementById('btn-quit')?.addEventListener('click', () => {
  setState(GameState.MENU);
});

// Inventory/Crafting close
document.getElementById('btn-close-inventory')?.addEventListener('click', () => {
  setState(GameState.PLAYING);
});

document.getElementById('btn-close-crafting')?.addEventListener('click', () => {
  setState(GameState.PLAYING);
});

// ============================================
// Keyboard Controls (UI)
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    e.preventDefault();
    if (state === GameState.PLAYING) {
      setState(GameState.PAUSED);
    } else if (state === GameState.PAUSED) {
      setState(GameState.PLAYING);
    } else if (state === GameState.INVENTORY || state === GameState.CRAFTING) {
      setState(GameState.PLAYING);
    } else if (state === GameState.SETTINGS) {
      if (prevState === GameState.PAUSED) {
        setState(GameState.PAUSED);
      } else {
        setState(GameState.MENU);
      }
    }
  }

  if (state === GameState.PLAYING) {
    if (e.code === 'KeyE') {
      e.preventDefault();
      setState(GameState.INVENTORY);
    }
    if (e.code === 'KeyC') {
      e.preventDefault();
      setState(GameState.CRAFTING);
    }
  }
});

// Re-lock pointer on click when playing
document.addEventListener('click', () => {
  if (state === GameState.PLAYING && !player?.locked) {
    player.requestPointerLock();
  }
});

// ============================================
// HUD Update
// ============================================
function updateHUD() {
  const fpsEl = document.getElementById('fps-counter');
  if (fpsEl) fpsEl.textContent = currentFps;

  const posEl = document.getElementById('player-pos');
  if (posEl) posEl.textContent = player.getPositionString();

  const biomeEl = document.getElementById('current-biome');
  if (biomeEl) {
    biomeEl.textContent = world.getBiome(player.position.x, player.position.z);
  }

  const timeEl = document.getElementById('world-time');
  if (timeEl) timeEl.textContent = sky.getTimeString();
}

// ============================================
// Loading Screen Helpers
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

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============================================
// Utility
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Start the game!
// ============================================
init().catch(err => {
  console.error('Failed to initialize NexusWorld:', err);
  updateLoadingText('Error: ' + err.message);
});
