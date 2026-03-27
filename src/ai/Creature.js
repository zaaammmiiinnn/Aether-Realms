/**
 * NexusWorld — AI Creature System
 * Creatures with state machine AI (idle, wander, flee, follow).
 */

import * as THREE from 'three';

const CreatureType = {
  SHEEP: {
    name: 'Sheep',
    color: 0xf0f0f0,
    speed: 1.5,
    size: { w: 0.8, h: 0.7, d: 1.2 },
    passive: true,
    spawnBiomes: ['Plains', 'Forest'],
  },
  PIG: {
    name: 'Pig',
    color: 0xf5a0a0,
    speed: 1.8,
    size: { w: 0.7, h: 0.6, d: 1.0 },
    passive: true,
    spawnBiomes: ['Plains', 'Forest', 'Swamp'],
  },
  CHICKEN: {
    name: 'Chicken',
    color: 0xffffff,
    speed: 2.0,
    size: { w: 0.4, h: 0.5, d: 0.5 },
    passive: true,
    spawnBiomes: ['Plains'],
  },
  WOLF: {
    name: 'Wolf',
    color: 0x888888,
    speed: 3.0,
    size: { w: 0.6, h: 0.7, d: 1.1 },
    passive: false,
    spawnBiomes: ['Forest', 'Snow Peaks'],
  },
};

const State = {
  IDLE: 'idle',
  WANDER: 'wander',
  FLEE: 'flee',
  FOLLOW: 'follow',
};

class Creature {
  constructor(type, position, world) {
    this.type = type;
    this.world = world;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.state = State.IDLE;
    this.stateTimer = 0;
    this.targetPos = null;
    this.health = 20;
    this.alive = true;

    // Create mesh
    const { w, h, d } = type.size;

    // Body
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: type.color,
      roughness: 0.7,
      metalness: 0.0,
      flatShading: true,
    });
    this.mesh = new THREE.Mesh(bodyGeo, bodyMat);

    // Head
    const headSize = Math.min(w, h) * 0.6;
    const headGeo = new THREE.BoxGeometry(headSize, headSize, headSize);
    const headMat = new THREE.MeshStandardMaterial({
      color: type.color,
      roughness: 0.7,
      flatShading: true,
    });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.set(0, h * 0.3, d * 0.5);
    this.mesh.add(this.head);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-headSize * 0.25, headSize * 0.1, headSize * 0.5);
    this.head.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(headSize * 0.25, headSize * 0.1, headSize * 0.5);
    this.head.add(rightEye);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.15, 0.4, 0.15);
    const legMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(type.color).multiplyScalar(0.7),
      flatShading: true,
    });

    this.legs = [];
    const legPositions = [
      [-w * 0.3, -h * 0.5 - 0.15, -d * 0.3],
      [w * 0.3, -h * 0.5 - 0.15, -d * 0.3],
      [-w * 0.3, -h * 0.5 - 0.15, d * 0.3],
      [w * 0.3, -h * 0.5 - 0.15, d * 0.3],
    ];

    for (const pos of legPositions) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(...pos);
      this.mesh.add(leg);
      this.legs.push(leg);
    }

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.updateMeshPosition();
  }

  updateMeshPosition() {
    this.mesh.position.copy(this.position);
    this.mesh.position.y += this.type.size.h * 0.5 + 0.2;
  }

  /**
   * Update AI state machine
   */
  update(deltaTime, playerPos) {
    if (!this.alive) return;

    const dt = deltaTime / 1000;
    this.stateTimer += deltaTime;

    const distToPlayer = this.position.distanceTo(playerPos);

    // State transitions
    switch (this.state) {
      case State.IDLE:
        if (this.stateTimer > 2000 + Math.random() * 3000) {
          this.state = State.WANDER;
          this.stateTimer = 0;
          this.pickWanderTarget();
        }
        // Flee from close player
        if (this.type.passive && distToPlayer < 5) {
          this.state = State.FLEE;
          this.stateTimer = 0;
        }
        break;

      case State.WANDER:
        if (this.stateTimer > 4000 + Math.random() * 3000) {
          this.state = State.IDLE;
          this.stateTimer = 0;
        }
        if (this.targetPos) {
          this.moveToward(this.targetPos, this.type.speed * 0.5, dt);
          if (this.position.distanceTo(this.targetPos) < 1) {
            this.state = State.IDLE;
            this.stateTimer = 0;
          }
        }
        if (this.type.passive && distToPlayer < 4) {
          this.state = State.FLEE;
          this.stateTimer = 0;
        }
        break;

      case State.FLEE:
        if (distToPlayer > 15 || this.stateTimer > 5000) {
          this.state = State.IDLE;
          this.stateTimer = 0;
        } else {
          // Run away from player
          const fleeDir = this.position.clone().sub(playerPos).normalize();
          const fleeTarget = this.position.clone().add(fleeDir.multiplyScalar(5));
          this.moveToward(fleeTarget, this.type.speed, dt);
        }
        break;

      case State.FOLLOW:
        if (distToPlayer > 20) {
          this.state = State.IDLE;
          this.stateTimer = 0;
        } else if (distToPlayer > 3) {
          this.moveToward(playerPos, this.type.speed, dt);
        }
        break;
    }

    // Animate legs
    this.animateLegs(deltaTime);

    // Apply gravity
    const groundHeight = this.world.getSurfaceHeight(this.position.x, this.position.z);
    if (this.position.y > groundHeight + 1) {
      this.position.y -= 9.8 * dt;
    } else {
      this.position.y = groundHeight + 1;
    }

    this.updateMeshPosition();
  }

  moveToward(target, speed, dt) {
    const dir = new THREE.Vector3(
      target.x - this.position.x,
      0,
      target.z - this.position.z
    ).normalize();

    this.position.x += dir.x * speed * dt;
    this.position.z += dir.z * speed * dt;

    // Face movement direction
    if (dir.length() > 0.01) {
      this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }

  pickWanderTarget() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 10;
    this.targetPos = new THREE.Vector3(
      this.position.x + Math.cos(angle) * dist,
      this.position.y,
      this.position.z + Math.sin(angle) * dist
    );
  }

  animateLegs(deltaTime) {
    if (this.state === State.WANDER || this.state === State.FLEE || this.state === State.FOLLOW) {
      const speed = this.state === State.FLEE ? 8 : 4;
      const swing = Math.sin(Date.now() * 0.01 * speed) * 0.4;
      if (this.legs.length >= 4) {
        this.legs[0].rotation.x = swing;
        this.legs[1].rotation.x = -swing;
        this.legs[2].rotation.x = -swing;
        this.legs[3].rotation.x = swing;
      }
    } else {
      // Reset legs
      for (const leg of this.legs) {
        leg.rotation.x *= 0.9;
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
    }
    // Flash red
    this.mesh.material.color.set(0xff0000);
    setTimeout(() => {
      if (this.mesh) this.mesh.material.color.set(this.type.color);
    }, 200);
    return !this.alive;
  }

  dispose() {
    this.mesh.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}

/**
 * Creature Manager — spawns and manages all creatures in the world
 */
export class CreatureManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.creatures = [];
    this.maxCreatures = 20;
    this.spawnTimer = 0;
    this.spawnInterval = 5000;
    this.types = Object.values(CreatureType);
  }

  /**
   * Spawn creatures around the player
   */
  spawnAround(playerPos) {
    if (this.creatures.length >= this.maxCreatures) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 30;
    const x = playerPos.x + Math.cos(angle) * dist;
    const z = playerPos.z + Math.sin(angle) * dist;
    const y = this.world.getSurfaceHeight(x, z) + 1;

    // Don't spawn in water or underground
    if (y < 36) return;

    const biome = this.world.getBiome(x, z);

    // Pick a creature type valid for this biome
    const validTypes = this.types.filter(t => t.spawnBiomes.includes(biome));
    if (validTypes.length === 0) return;

    const type = validTypes[Math.floor(Math.random() * validTypes.length)];
    const creature = new Creature(type, new THREE.Vector3(x, y, z), this.world);
    this.creatures.push(creature);
    this.scene.add(creature.mesh);
  }

  /**
   * Update all creatures
   */
  update(deltaTime, playerPos) {
    // Spawn timer
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnAround(playerPos);
    }

    // Update creatures
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const creature = this.creatures[i];

      // Remove dead or far creatures
      const dist = creature.position.distanceTo(playerPos);
      if (!creature.alive || dist > 100) {
        this.scene.remove(creature.mesh);
        creature.dispose();
        this.creatures.splice(i, 1);
        continue;
      }

      creature.update(deltaTime, playerPos);
    }
  }

  /**
   * Get creatures near a position
   */
  getCreaturesNear(pos, radius) {
    return this.creatures.filter(c => c.position.distanceTo(pos) < radius);
  }
}

export { Creature, CreatureType, State };
export default CreatureManager;
