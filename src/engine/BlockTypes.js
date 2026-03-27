/**
 * NexusWorld — Block Type Registry
 * Defines all block types, their properties, colors, and behaviors.
 */

// Block IDs
export const BlockID = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  WOOD: 6,
  LEAVES: 7,
  SNOW: 8,
  SANDSTONE: 9,
  COAL_ORE: 10,
  IRON_ORE: 11,
  GOLD_ORE: 12,
  DIAMOND_ORE: 13,
  COBBLESTONE: 14,
  PLANKS: 15,
  GLASS: 16,
  BRICK: 17,
  BEDROCK: 18,
  GRAVEL: 19,
  CLAY: 20,
  CACTUS: 21,
  TALL_GRASS: 22,
  FLOWER_RED: 23,
  FLOWER_YELLOW: 24,
  MUSHROOM: 25,
  ICE: 26,
};

// Block definitions
const blockDefs = {
  [BlockID.AIR]: {
    name: 'Air',
    solid: false,
    transparent: true,
    breakable: false,
    color: [0, 0, 0],
    icon: '',
  },
  [BlockID.GRASS]: {
    name: 'Grass',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 1,
    drops: BlockID.DIRT,
    color: [0x4a, 0x8c, 0x3f],
    topColor: [0x5d, 0xa8, 0x4a],
    sideColor: [0x6b, 0x4e, 0x30],
    icon: '🟩',
  },
  [BlockID.DIRT]: {
    name: 'Dirt',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 1,
    color: [0x6b, 0x4e, 0x30],
    icon: '🟫',
  },
  [BlockID.STONE]: {
    name: 'Stone',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 3,
    drops: BlockID.COBBLESTONE,
    color: [0x80, 0x80, 0x80],
    icon: '⬜',
  },
  [BlockID.SAND]: {
    name: 'Sand',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 1,
    color: [0xd4, 0xc0, 0x8a],
    icon: '🟨',
  },
  [BlockID.WATER]: {
    name: 'Water',
    solid: false,
    transparent: true,
    liquid: true,
    breakable: false,
    color: [0x2e, 0x86, 0xc1],
    opacity: 0.6,
    icon: '🟦',
  },
  [BlockID.WOOD]: {
    name: 'Wood',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 2,
    color: [0x6d, 0x4c, 0x2a],
    icon: '🪵',
  },
  [BlockID.LEAVES]: {
    name: 'Leaves',
    solid: true,
    transparent: true,
    breakable: true,
    hardness: 0.5,
    color: [0x3e, 0x7a, 0x30],
    opacity: 0.85,
    icon: '🌿',
  },
  [BlockID.SNOW]: {
    name: 'Snow',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 0.5,
    color: [0xe8, 0xea, 0xed],
    icon: '⬜',
  },
  [BlockID.SANDSTONE]: {
    name: 'Sandstone',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 2,
    color: [0xc4, 0xaa, 0x70],
    icon: '🟧',
  },
  [BlockID.COAL_ORE]: {
    name: 'Coal Ore',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 3,
    color: [0x3a, 0x3a, 0x3a],
    icon: '⚫',
  },
  [BlockID.IRON_ORE]: {
    name: 'Iron Ore',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 4,
    color: [0x8e, 0x7c, 0x6a],
    icon: '🔶',
  },
  [BlockID.GOLD_ORE]: {
    name: 'Gold Ore',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 4,
    color: [0xc4, 0xa0, 0x30],
    icon: '🟡',
  },
  [BlockID.DIAMOND_ORE]: {
    name: 'Diamond Ore',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 5,
    color: [0x4a, 0xc4, 0xd0],
    icon: '💎',
  },
  [BlockID.COBBLESTONE]: {
    name: 'Cobblestone',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 3,
    color: [0x6e, 0x6e, 0x6e],
    icon: '🪨',
  },
  [BlockID.PLANKS]: {
    name: 'Planks',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 2,
    color: [0xa0, 0x7a, 0x48],
    icon: '🟫',
  },
  [BlockID.GLASS]: {
    name: 'Glass',
    solid: true,
    transparent: true,
    breakable: true,
    hardness: 0.5,
    color: [0xc8, 0xe8, 0xf0],
    opacity: 0.3,
    icon: '🔲',
  },
  [BlockID.BRICK]: {
    name: 'Brick',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 3,
    color: [0x9c, 0x4a, 0x36],
    icon: '🧱',
  },
  [BlockID.BEDROCK]: {
    name: 'Bedrock',
    solid: true,
    transparent: false,
    breakable: false,
    color: [0x30, 0x30, 0x30],
    icon: '⬛',
  },
  [BlockID.GRAVEL]: {
    name: 'Gravel',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 1,
    color: [0x7a, 0x72, 0x68],
    icon: '⚪',
  },
  [BlockID.CLAY]: {
    name: 'Clay',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 1,
    color: [0x90, 0x96, 0xa0],
    icon: '🔵',
  },
  [BlockID.CACTUS]: {
    name: 'Cactus',
    solid: true,
    transparent: false,
    breakable: true,
    hardness: 0.5,
    color: [0x2e, 0x7d, 0x32],
    icon: '🌵',
  },
  [BlockID.TALL_GRASS]: {
    name: 'Tall Grass',
    solid: false,
    transparent: true,
    breakable: true,
    hardness: 0,
    color: [0x5a, 0x9e, 0x4a],
    icon: '🌾',
  },
  [BlockID.FLOWER_RED]: {
    name: 'Red Flower',
    solid: false,
    transparent: true,
    breakable: true,
    hardness: 0,
    color: [0xc0, 0x2a, 0x2a],
    icon: '🌹',
  },
  [BlockID.FLOWER_YELLOW]: {
    name: 'Yellow Flower',
    solid: false,
    transparent: true,
    breakable: true,
    hardness: 0,
    color: [0xc0, 0xb0, 0x2a],
    icon: '🌼',
  },
  [BlockID.MUSHROOM]: {
    name: 'Mushroom',
    solid: false,
    transparent: true,
    breakable: true,
    hardness: 0,
    color: [0x8b, 0x45, 0x13],
    icon: '🍄',
  },
  [BlockID.ICE]: {
    name: 'Ice',
    solid: true,
    transparent: true,
    breakable: true,
    hardness: 1,
    color: [0xa0, 0xd0, 0xf0],
    opacity: 0.7,
    icon: '🧊',
  },
};

/**
 * Get block definition by ID
 */
export function getBlock(id) {
  return blockDefs[id] || blockDefs[BlockID.AIR];
}

/**
 * Get block color as THREE.Color-compatible hex
 */
export function getBlockColor(id) {
  const block = getBlock(id);
  const c = block.color;
  return (c[0] << 16) | (c[1] << 8) | c[2];
}

/**
 * Get the top-face color (for grass, etc.)
 */
export function getBlockTopColor(id) {
  const block = getBlock(id);
  const c = block.topColor || block.color;
  return (c[0] << 16) | (c[1] << 8) | c[2];
}

/**
 * Get the side-face color
 */
export function getBlockSideColor(id) {
  const block = getBlock(id);
  const c = block.sideColor || block.color;
  return (c[0] << 16) | (c[1] << 8) | c[2];
}

/**
 * Check if block is solid (for collision)
 */
export function isSolid(id) {
  return getBlock(id).solid;
}

/**
 * Check if block is transparent (for face culling)
 */
export function isTransparent(id) {
  return getBlock(id).transparent;
}

/**
 * Get all placeable block IDs
 */
export function getPlaceableBlocks() {
  return Object.keys(blockDefs)
    .map(Number)
    .filter(id => id !== BlockID.AIR && id !== BlockID.BEDROCK && !blockDefs[id].liquid);
}

export default blockDefs;
