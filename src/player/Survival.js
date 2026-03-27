/**
 * NexusWorld — Survival Mechanics
 * Health, hunger, and stamina systems with environment effects.
 */

export class Survival {
  constructor() {
    this.health = 100;
    this.maxHealth = 100;
    this.hunger = 100;
    this.maxHunger = 100;
    this.stamina = 100;
    this.maxStamina = 100;

    // Rates
    this.hungerDecayRate = 0.015; // per second
    this.staminaRegenRate = 0.8;  // per second
    this.staminaDrainRate = 1.5;  // per second while sprinting
    this.healthRegenRate = 0.3;   // per second when hunger > 80
    this.starveDamageRate = 0.5;  // per second when hunger = 0

    // Timers
    this.tickTimer = 0;
    this.tickInterval = 1000; // 1 second
  }

  /**
   * Update survival stats
   */
  update(deltaTime, isSprinting, isInWater) {
    const dt = deltaTime / 1000; // Convert to seconds

    // Hunger slowly decreases
    this.hunger = Math.max(0, this.hunger - this.hungerDecayRate * deltaTime / 16);

    // Sprinting drains hunger faster
    if (isSprinting) {
      this.hunger = Math.max(0, this.hunger - this.hungerDecayRate * 2 * deltaTime / 16);
    }

    // Stamina
    if (isSprinting && this.stamina > 0) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * deltaTime / 16);
    } else if (!isSprinting) {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * deltaTime / 16);
    }

    // Health regen when well-fed
    if (this.hunger > 80 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.healthRegenRate * deltaTime / 16);
    }

    // Starving damage
    if (this.hunger <= 0) {
      this.health = Math.max(0, this.health - this.starveDamageRate * deltaTime / 16);
    }

    // Update UI
    this.updateUI();
  }

  /**
   * Take damage
   */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.updateUI();

    if (this.health <= 0) {
      return true; // Dead
    }
    return false;
  }

  /**
   * Heal
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.updateUI();
  }

  /**
   * Eat food (restores hunger)
   */
  eat(amount) {
    this.hunger = Math.min(this.maxHunger, this.hunger + amount);
    this.updateUI();
  }

  /**
   * Check if player can sprint
   */
  canSprint() {
    return this.stamina > 5 && this.hunger > 10;
  }

  /**
   * Respawn (reset stats)
   */
  respawn() {
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.stamina = this.maxStamina;
    this.updateUI();
  }

  /**
   * Update HUD bars
   */
  updateUI() {
    // Health bar
    const healthBar = document.getElementById('health-bar');
    const healthValue = document.getElementById('health-value');
    if (healthBar) healthBar.style.width = `${this.health}%`;
    if (healthValue) healthValue.textContent = Math.floor(this.health);

    // Hunger bar
    const hungerBar = document.getElementById('hunger-bar');
    const hungerValue = document.getElementById('hunger-value');
    if (hungerBar) hungerBar.style.width = `${this.hunger}%`;
    if (hungerValue) hungerValue.textContent = Math.floor(this.hunger);

    // Stamina bar
    const staminaBar = document.getElementById('stamina-bar');
    const staminaValue = document.getElementById('stamina-value');
    if (staminaBar) staminaBar.style.width = `${this.stamina}%`;
    if (staminaValue) staminaValue.textContent = Math.floor(this.stamina);
  }
}

export default Survival;
