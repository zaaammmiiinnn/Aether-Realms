/**
 * NexusWorld — Crafting System
 * Recipe-based crafting with progression tiers.
 */

import { BlockID, getBlock } from '../engine/BlockTypes.js';

const recipes = [
  {
    name: 'Planks',
    icon: '🪵',
    result: { id: BlockID.PLANKS, count: 4 },
    ingredients: [{ id: BlockID.WOOD, count: 1 }],
    tier: 0,
  },
  {
    name: 'Cobblestone Wall',
    icon: '🧱',
    result: { id: BlockID.COBBLESTONE, count: 4 },
    ingredients: [{ id: BlockID.STONE, count: 2 }],
    tier: 0,
  },
  {
    name: 'Sandstone',
    icon: '🟧',
    result: { id: BlockID.SANDSTONE, count: 1 },
    ingredients: [{ id: BlockID.SAND, count: 4 }],
    tier: 0,
  },
  {
    name: 'Glass',
    icon: '🔲',
    result: { id: BlockID.GLASS, count: 1 },
    ingredients: [{ id: BlockID.SAND, count: 2 }],
    tier: 1,
  },
  {
    name: 'Brick',
    icon: '🧱',
    result: { id: BlockID.BRICK, count: 1 },
    ingredients: [{ id: BlockID.CLAY, count: 4 }],
    tier: 1,
  },
  {
    name: 'Snow Block',
    icon: '⬜',
    result: { id: BlockID.SNOW, count: 1 },
    ingredients: [{ id: BlockID.ICE, count: 2 }],
    tier: 1,
  },
  {
    name: 'Polished Stone',
    icon: '⬜',
    result: { id: BlockID.STONE, count: 4 },
    ingredients: [
      { id: BlockID.COBBLESTONE, count: 4 },
      { id: BlockID.COAL_ORE, count: 1 },
    ],
    tier: 2,
  },
];

export class Crafting {
  constructor(inventory) {
    this.inventory = inventory;
    this.recipes = recipes;
    this.selectedRecipe = null;
  }

  /**
   * Check if player has ingredients for a recipe
   */
  canCraft(recipe) {
    for (const ingredient of recipe.ingredients) {
      let total = 0;
      for (const slot of this.inventory.slots) {
        if (slot && slot.id === ingredient.id) {
          total += slot.count;
        }
      }
      if (total < ingredient.count) return false;
    }
    return true;
  }

  /**
   * Craft a recipe
   */
  craft(recipe) {
    if (!this.canCraft(recipe)) return false;

    // Remove ingredients
    for (const ingredient of recipe.ingredients) {
      let remaining = ingredient.count;
      for (let i = 0; i < this.inventory.slots.length && remaining > 0; i++) {
        const slot = this.inventory.slots[i];
        if (slot && slot.id === ingredient.id) {
          const take = Math.min(remaining, slot.count);
          slot.count -= take;
          remaining -= take;
          if (slot.count <= 0) {
            this.inventory.slots[i] = null;
          }
        }
      }
    }

    // Add result
    this.inventory.addItem(recipe.result.id, recipe.result.count);
    return true;
  }

  /**
   * Render crafting UI
   */
  renderCraftingMenu() {
    const recipeList = document.getElementById('recipe-list');
    const preview = document.getElementById('crafting-preview');
    if (!recipeList || !preview) return;

    recipeList.innerHTML = '';

    for (const recipe of this.recipes) {
      const item = document.createElement('div');
      item.className = 'recipe-item' + (this.selectedRecipe === recipe ? ' selected' : '');

      const icon = document.createElement('span');
      icon.className = 'recipe-icon';
      icon.textContent = recipe.icon;

      const name = document.createElement('span');
      name.className = 'recipe-name';
      name.textContent = recipe.name;

      item.appendChild(icon);
      item.appendChild(name);

      const craftable = this.canCraft(recipe);
      const status = document.createElement('span');
      status.className = craftable ? 'recipe-craftable' : 'recipe-locked';
      status.textContent = craftable ? '✓ Ready' : '✗ Missing';
      item.appendChild(status);

      item.addEventListener('click', () => {
        this.selectedRecipe = recipe;
        this.renderCraftingMenu();
      });

      recipeList.appendChild(item);
    }

    // Preview selected recipe
    if (this.selectedRecipe) {
      const recipe = this.selectedRecipe;
      const resultBlock = getBlock(recipe.result.id);
      const canCraft = this.canCraft(recipe);

      preview.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 8px;">${recipe.icon}</div>
        <h3 style="margin-bottom: 12px; font-size: 1.1rem;">${recipe.name}</h3>
        <div style="margin-bottom: 8px; font-size: 0.85rem; color: rgba(237,242,247,0.6);">
          Produces: ${recipe.result.count}x ${resultBlock.name}
        </div>
        <div style="margin-bottom: 16px;">
          <p style="font-size: 0.8rem; color: rgba(237,242,247,0.4); margin-bottom: 6px;">Ingredients:</p>
          ${recipe.ingredients.map(ing => {
            const block = getBlock(ing.id);
            return `<div style="font-size: 0.85rem; margin-bottom: 2px;">${block.icon} ${ing.count}x ${block.name}</div>`;
          }).join('')}
        </div>
        <button class="craft-btn" id="btn-craft" ${!canCraft ? 'disabled' : ''}>
          ${canCraft ? 'Craft' : 'Missing Materials'}
        </button>
      `;

      const craftBtn = document.getElementById('btn-craft');
      if (craftBtn && canCraft) {
        craftBtn.addEventListener('click', () => {
          if (this.craft(recipe)) {
            this.renderCraftingMenu();
            this.inventory.renderHotbar(0);
            showToast(`Crafted ${recipe.result.count}x ${recipe.name}`, 'success');
          }
        });
      }
    } else {
      preview.innerHTML = '<p>Select a recipe to craft</p>';
    }
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

export default Crafting;
