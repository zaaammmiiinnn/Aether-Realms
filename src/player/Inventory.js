/**
 * NexusWorld — Inventory System
 * Hotbar (9 slots) + grid inventory (36 slots) with block management.
 */

import { BlockID, getBlock, getPlaceableBlocks } from '../engine/BlockTypes.js';

export class Inventory {
  constructor() {
    // 9 hotbar + 27 inventory slots = 36 total
    this.slots = new Array(36).fill(null);
    this.hotbarSize = 9;

    // Initialize with starter items
    this.initStarterKit();
  }

  initStarterKit() {
    const starters = [
      { id: BlockID.GRASS, count: 64 },
      { id: BlockID.DIRT, count: 64 },
      { id: BlockID.STONE, count: 64 },
      { id: BlockID.WOOD, count: 64 },
      { id: BlockID.PLANKS, count: 64 },
      { id: BlockID.COBBLESTONE, count: 64 },
      { id: BlockID.SAND, count: 64 },
      { id: BlockID.GLASS, count: 32 },
      { id: BlockID.BRICK, count: 32 },
    ];

    starters.forEach((item, i) => {
      this.slots[i] = { ...item };
    });

    // Add more items to inventory
    const extras = [
      { id: BlockID.LEAVES, count: 32 },
      { id: BlockID.SNOW, count: 32 },
      { id: BlockID.SANDSTONE, count: 32 },
      { id: BlockID.GRAVEL, count: 32 },
      { id: BlockID.CLAY, count: 32 },
      { id: BlockID.ICE, count: 16 },
      { id: BlockID.COAL_ORE, count: 16 },
      { id: BlockID.IRON_ORE, count: 16 },
      { id: BlockID.GOLD_ORE, count: 8 },
      { id: BlockID.DIAMOND_ORE, count: 4 },
    ];

    extras.forEach((item, i) => {
      this.slots[this.hotbarSize + i] = { ...item };
    });
  }

  /**
   * Get item in a slot
   */
  getSlot(index) {
    return this.slots[index];
  }

  /**
   * Get hotbar slot item
   */
  getHotbarItem(slotIndex) {
    return this.slots[slotIndex];
  }

  /**
   * Get selected block ID for the hotbar slot
   */
  getSelectedBlockId(slotIndex) {
    const item = this.slots[slotIndex];
    return item ? item.id : BlockID.AIR;
  }

  /**
   * Use one item from a slot (when placing a block)
   */
  useItem(slotIndex) {
    const item = this.slots[slotIndex];
    if (!item || item.count <= 0) return false;
    item.count--;
    if (item.count <= 0) {
      this.slots[slotIndex] = null;
    }
    return true;
  }

  /**
   * Add item to inventory (returns false if full)
   */
  addItem(blockId, count = 1) {
    // First try to stack with existing
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot && slot.id === blockId && slot.count < 64) {
        const canAdd = Math.min(count, 64 - slot.count);
        slot.count += canAdd;
        count -= canAdd;
        if (count <= 0) return true;
      }
    }

    // Then try empty slots
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.slots[i]) {
        const canAdd = Math.min(count, 64);
        this.slots[i] = { id: blockId, count: canAdd };
        count -= canAdd;
        if (count <= 0) return true;
      }
    }

    return count <= 0;
  }

  /**
   * Swap two slots
   */
  swapSlots(indexA, indexB) {
    const temp = this.slots[indexA];
    this.slots[indexA] = this.slots[indexB];
    this.slots[indexB] = temp;
  }

  /**
   * Render hotbar UI
   */
  renderHotbar(selectedSlot) {
    const container = document.getElementById('hotbar-slots');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < this.hotbarSize; i++) {
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot' + (i === selectedSlot ? ' active' : '');

      // Slot number
      const num = document.createElement('span');
      num.className = 'slot-number';
      num.textContent = i + 1;
      slot.appendChild(num);

      const item = this.slots[i];
      if (item) {
        const block = getBlock(item.id);
        slot.textContent = '';
        slot.appendChild(num);

        const icon = document.createElement('span');
        icon.textContent = block.icon;
        icon.style.fontSize = '1.4rem';
        slot.appendChild(icon);

        if (item.count > 1) {
          const count = document.createElement('span');
          count.className = 'slot-count';
          count.textContent = item.count;
          slot.appendChild(count);
        }
      }

      container.appendChild(slot);
    }

    // Update selected block name
    const nameEl = document.getElementById('selected-block-name');
    if (nameEl) {
      const item = this.slots[selectedSlot];
      nameEl.textContent = item ? getBlock(item.id).name : 'Empty';
    }
  }

  /**
   * Render full inventory UI
   */
  renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;

    grid.innerHTML = '';

    for (let i = 0; i < this.slots.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';

      const item = this.slots[i];
      if (item) {
        const block = getBlock(item.id);
        slot.textContent = block.icon;

        if (item.count > 1) {
          const count = document.createElement('span');
          count.className = 'slot-count';
          count.textContent = item.count;
          slot.appendChild(count);
        }
      }

      // Click to move to hotbar
      slot.addEventListener('click', () => {
        if (i >= this.hotbarSize) {
          // Find first empty hotbar slot
          for (let h = 0; h < this.hotbarSize; h++) {
            if (!this.slots[h]) {
              this.swapSlots(h, i);
              this.renderInventory();
              return;
            }
          }
          // Or swap with slot 0
          this.swapSlots(0, i);
          this.renderInventory();
        }
      });

      grid.appendChild(slot);
    }
  }
}

export default Inventory;
