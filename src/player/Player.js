/**
 * NexusWorld — Player Controller
 * First-person movement with WASD, jumping, sprinting, and mouse look.
 */

import * as THREE from 'three';

export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;

    // Position and movement
    this.position = new THREE.Vector3(0, 80, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');

    // Movement settings
    this.moveSpeed = 5.0;
    this.sprintMultiplier = 1.6;
    this.jumpForce = 8.0;
    this.gravity = -22.0;
    this.mouseSensitivity = 0.002;
    this.height = 1.7;
    this.width = 0.3;

    // State
    this.grounded = false;
    this.sprinting = false;
    this.flying = false; // Creative mode
    this.noclip = false;

    // Input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
    };

    // Pointer lock
    this.locked = false;

    // Block interaction
    this.selectedSlot = 0;
    this.breakProgress = 0;
    this.breaking = false;
    this.breakTarget = null;
    this.lastWheelTime = 0;

    this.setupControls();
  }

  setupControls() {
    // Keyboard
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Mouse
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.locked = !!document.pointerLockElement;
    });

    // Scroll wheel for hotbar
    document.addEventListener('wheel', (e) => this.onWheel(e));
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = true; break;
      case 'KeyS': this.keys.backward = true; break;
      case 'KeyA': this.keys.left = true; break;
      case 'KeyD': this.keys.right = true; break;
      case 'Space': this.keys.jump = true; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = true;
        this.sprinting = true;
        break;
      case 'Digit1': case 'Digit2': case 'Digit3':
      case 'Digit4': case 'Digit5': case 'Digit6':
      case 'Digit7': case 'Digit8': case 'Digit9':
        this.selectedSlot = parseInt(e.code.replace('Digit', '')) - 1;
        break;
      case 'KeyF':
        this.flying = !this.flying;
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = false; break;
      case 'KeyS': this.keys.backward = false; break;
      case 'KeyA': this.keys.left = false; break;
      case 'KeyD': this.keys.right = false; break;
      case 'Space': this.keys.jump = false; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = false;
        this.sprinting = false;
        break;
    }
  }

  onMouseMove(e) {
    if (!this.locked) return;

    this.rotation.y -= e.movementX * this.mouseSensitivity;
    this.rotation.x -= e.movementY * this.mouseSensitivity;
    this.rotation.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.rotation.x));
  }

  onMouseDown(e) {
    if (!this.locked) return;
    if (e.button === 0) this.breaking = true;
    // Right click is handled in main game loop
  }

  onMouseUp(e) {
    if (e.button === 0) {
      this.breaking = false;
      this.breakProgress = 0;
      this.breakTarget = null;
    }
  }

  onWheel(e) {
    if (!this.locked) return;
    const now = Date.now();
    if (now - this.lastWheelTime < 100) return; // 100ms cooldown for trackpads
    this.lastWheelTime = now;

    if (e.deltaY > 0) {
      this.selectedSlot = (this.selectedSlot + 1) % 9;
    } else {
      this.selectedSlot = (this.selectedSlot + 8) % 9; // equivalent to -1 wrapping around
    }
  }

  /**
   * Get forward direction vector
   */
  getForward() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
    return dir;
  }

  /**
   * Get right direction vector
   */
  getRight() {
    const dir = new THREE.Vector3(1, 0, 0);
    dir.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
    return dir;
  }

  /**
   * Get camera look direction
   */
  getLookDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(this.rotation);
    return dir;
  }

  /**
   * Update player physics and movement
   */
  update(deltaTime) {
    if (!this.locked) return;

    const dt = Math.min(deltaTime / 1000, 0.05); // Cap delta time at 50ms
    const speed = this.moveSpeed * (this.sprinting ? this.sprintMultiplier : 1);

    // Calculate movement direction
    const moveDir = new THREE.Vector3(0, 0, 0);
    const forward = this.getForward();
    const right = this.getRight();

    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);

    if (moveDir.length() > 0) moveDir.normalize();

    if (this.flying) {
      // Flying mode
      this.velocity.x = moveDir.x * speed * 2;
      this.velocity.z = moveDir.z * speed * 2;
      if (this.keys.jump) this.velocity.y = speed * 2;
      else if (this.keys.sprint) this.velocity.y = -speed * 2;
      else this.velocity.y *= 0.9;
    } else {
      // Walking mode
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      // Gravity
      this.velocity.y += this.gravity * dt;

      // Jumping
      if (this.keys.jump && this.grounded) {
        this.velocity.y = this.jumpForce;
        this.grounded = false;
      }
    }

    // Apply movement with collision
    if (!this.noclip) {
      this.moveWithCollision(dt);
    } else {
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;
    }

    // Update camera
    this.camera.position.copy(this.position);
    this.camera.position.y += this.height * 0.9; // Eye height
    this.camera.rotation.copy(this.rotation);
  }

  /**
   * Move with continuous heightmap tracking and basic raycast collision for prefabs
   */
  moveWithCollision(dt) {
    // Horizontal movement
    const nextX = this.position.x + this.velocity.x * dt;
    const nextZ = this.position.z + this.velocity.z * dt;

    // Simple horizontal raycast vs Prefabs
    const moveDir = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
    let canMove = true;

    if (moveDir.lengthSq() > 0.001 && this.world.collidableMeshes) {
      moveDir.normalize();
      const origin = new THREE.Vector3(this.position.x, this.position.y + 1, this.position.z);
      const ray = new THREE.Raycaster(origin, moveDir, 0, this.width * 2.0);
      
      const hits = ray.intersectObjects(this.world.collidableMeshes);
      if (hits.length > 0 && hits[0].object !== this.world.terrainMesh) {
         canMove = false;
      }
    }

    if (canMove) {
      this.position.x = nextX;
      this.position.z = nextZ;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // Vertical movement (Gravity & Terrain Tracking)
    this.position.y += this.velocity.y * dt;
    const surfaceY = this.world.getSurfaceHeight(this.position.x, this.position.z);

    if (this.position.y <= surfaceY) {
      this.position.y = surfaceY;
      this.velocity.y = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
  }

  spawn() {
    const surfaceY = this.world.getSurfaceHeight(0, 0);
    this.position.set(0, surfaceY + 2, 0);
    this.velocity.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
  }

  /**
   * Lock pointer for FPS controls
   */
  requestPointerLock() {
    document.body.requestPointerLock();
  }

  /**
   * Get position string for HUD
   */
  getPositionString() {
    return `${Math.floor(this.position.x)}, ${Math.floor(this.position.y)}, ${Math.floor(this.position.z)}`;
  }
}

export default Player;
