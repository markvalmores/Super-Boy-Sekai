import { BlockTile, EnemyBuff, EnemyEntity, EnemyType, ItemEntity, LevelMetadata, WorldTheme } from '../types/game';

export interface GeneratedLevel {
  metadata: LevelMetadata;
  blocks: BlockTile[];
  enemies: EnemyEntity[];
  items: ItemEntity[];
  spawnX: number;
  spawnY: number;
  flagX: number;
  flagY: number;
  castleX: number;
  castleY: number;
}

export const WORLD_DEFINITIONS: { worldNum: number; name: string; theme: WorldTheme; color: string; desc: string }[] = [
  { worldNum: 1, name: 'Emerald Cherry Blossom Valley & Slime Meadows', theme: 'grassland', color: '#38bdf8', desc: 'Lush magical anime valleys with friendly slimes, cherry blossom petals, and wandering dragons' },
  { worldNum: 2, name: 'Crystal Gemstone Underground Citadel', theme: 'cavern', color: '#6366f1', desc: 'Bioluminescent gemstone caverns with ancient spiders, lizards, and alligators' },
  { worldNum: 3, name: 'Neo-Akihabara Cyber Arcade Skyway', theme: 'sky', color: '#06b6d4', desc: 'High-tech sky bridges with flying UFOs and cybernetic extraterrestrials' },
  { worldNum: 4, name: 'Crimson Magma Caldera & Dragon Peak', theme: 'volcano', color: '#ef4444', desc: 'Molten magma rivers and dragon breath fiery strongholds' },
  { worldNum: 5, name: 'Moonlit Bamboo Sanctuary & Spirit Grove', theme: 'astral', color: '#8b5cf6', desc: 'Sacred spirit grove bathed in ethereal lunar anime light with celestial whales' },
  { worldNum: 6, name: 'Gilded Sky Castle & Marionette Spire', theme: 'cyber', color: '#f59e0b', desc: 'High-speed floating marionette platforms, zombies, and puppet devils' },
  { worldNum: 7, name: 'Hokkaido Glacial Frost Peaks & Ice Kami', theme: 'ice', color: '#38bdf8', desc: 'Glacial frost towers, flying octopuses, and sacred ice sculptures' },
  { worldNum: 8, name: 'Edo Samurai Phantom Pagoda', theme: 'ghost', color: '#a855f7', desc: 'Haunted samurai castle halls with fiery devils and ancient dragons' },
  { worldNum: 9, name: 'Holy Archon Golden Citadel', theme: 'celestial', color: '#fbbf24', desc: 'Golden holy cathedral with archon guardians and celestial beings' },
  { worldNum: 10, name: 'The 1001 Super Boy Sekai Dimension Nexus', theme: 'omega', color: '#ec4899', desc: 'The ultimate infinite dimensional convergence of all realities' },
];

export function getLevelWorldInfo(levelNum: number) {
  const worldIndex = Math.min(Math.floor((levelNum - 1) / 100), WORLD_DEFINITIONS.length - 1);
  return WORLD_DEFINITIONS[worldIndex];
}

function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateLevel(levelNum: number, marathonMode: boolean = false): GeneratedLevel {
  const worldInfo = getLevelWorldInfo(levelNum);
  const prng = createSeededRandom(levelNum * 9973 + 42);

  const lengthBlocks = marathonMode ? 320 : Math.min(160 + (levelNum % 50) * 2, 280);
  const timeLimit = marathonMode ? 660 : 300;

  const metadata: LevelMetadata = {
    levelNumber: levelNum,
    worldNumber: worldInfo.worldNum,
    worldName: worldInfo.name,
    theme: worldInfo.theme,
    title: `Chapter ${worldInfo.worldNum}-${((levelNum - 1) % 100) + 1}: ${worldInfo.name}`,
    lore: `Sekai Chronicle: Super Boy Ren leaps into Dimensional Stage ${levelNum}. Slay dragons, zombies, aliens & demons, smash crates, and ring the Torii Shrine bell!`,
    timeLimit,
    parScore: 50000 + levelNum * 250,
    difficulty: levelNum > 800 ? 'Godly' : levelNum > 500 ? 'Extreme' : levelNum > 250 ? 'Hard' : levelNum > 50 ? 'Normal' : 'Easy',
    lengthBlocks,
  };

  const blocks: BlockTile[] = [];
  const enemies: EnemyEntity[] = [];
  const items: ItemEntity[] = [];

  const blockSize = 32;
  const groundY = 380;

  // Safe starting spawn pad
  for (let i = 0; i < 10; i++) {
    blocks.push({
      id: `ground-start-${i}`,
      x: i * blockSize,
      y: groundY,
      width: blockSize,
      height: 120,
      type: 'ground',
    });
  }
  let currentX = 10 * blockSize;

  const starCoinTargets = [
    Math.floor(lengthBlocks * 0.25) * blockSize,
    Math.floor(lengthBlocks * 0.55) * blockSize,
    Math.floor(lengthBlocks * 0.85) * blockSize,
  ];

  // Enemy Pool Selection by World Theme
  const getEnemyTypeForTheme = (theme: WorldTheme, roll: number): { type: EnemyType; name: string; buff: EnemyBuff; hp: number } => {
    const buffRoll = prng();
    const buff: EnemyBuff = buffRoll > 0.8 ? 'shield' : buffRoll > 0.6 ? 'frenzy_speed' : buffRoll > 0.45 ? 'fire_aura' : 'none';

    if (theme === 'grassland') {
      if (roll > 0.8) return { type: 'dragon', name: 'Crimson Drake', buff, hp: 4 };
      if (roll > 0.55) return { type: 'spider', name: 'Forest Tarantula', buff, hp: 3 };
      if (roll > 0.3) return { type: 'lizard', name: 'Wild Salamander', buff, hp: 2 };
      return { type: 'slime_monster', name: 'Tempest Slime', buff: 'none', hp: 2 };
    } else if (theme === 'cavern') {
      if (roll > 0.75) return { type: 'alligator', name: 'Cavern Croc', buff, hp: 4 };
      if (roll > 0.5) return { type: 'spider', name: 'Cave Weaver', buff, hp: 3 };
      if (roll > 0.25) return { type: 'zombie', name: 'Undead Miner', buff, hp: 3 };
      return { type: 'lizard', name: 'Cave Gecko', buff, hp: 2 };
    } else if (theme === 'sky' || theme === 'cyber') {
      if (roll > 0.7) return { type: 'ufo', name: 'Cyber Invader UFO', buff, hp: 4 };
      if (roll > 0.4) return { type: 'alien', name: 'Neon Extraterrestrial', buff, hp: 3 };
      return { type: 'flying_koopa', name: 'Aero Drone', buff, hp: 2 };
    } else if (theme === 'volcano') {
      if (roll > 0.7) return { type: 'dragon', name: 'Volcanic Hell Dragon', buff: 'fire_aura', hp: 5 };
      if (roll > 0.4) return { type: 'devil', name: 'Magma Fiend', buff, hp: 4 };
      return { type: 'demon', name: 'Flame Demon', buff, hp: 3 };
    } else if (theme === 'astral' || theme === 'ice') {
      if (roll > 0.7) return { type: 'whale', name: 'Celestial Astral Whale', buff, hp: 5 };
      if (roll > 0.4) return { type: 'octopus', name: 'Cosmic Kraken', buff, hp: 4 };
      return { type: 'alien', name: 'Star Voyager', buff, hp: 3 };
    } else {
      // Demon & Devil Realms
      if (roll > 0.7) return { type: 'demon', name: 'Arch-Demon', buff: 'shield', hp: 5 };
      if (roll > 0.4) return { type: 'devil', name: 'Infernal Devil', buff: 'frenzy_speed', hp: 4 };
      if (roll > 0.2) return { type: 'zombie', name: 'Cursed Wight', buff, hp: 3 };
      return { type: 'dragon', name: 'Abyssal Wyrm', buff, hp: 4 };
    }
  };

  let segmentIdx = 0;
  while (currentX < lengthBlocks * blockSize - (15 * blockSize)) {
    segmentIdx++;
    const segRoll = prng();

    // Gap / Pit Hazard
    if (segRoll < 0.15 && currentX > 15 * blockSize) {
      const gapWidth = Math.floor(prng() * 2 + 2) * blockSize;
      if (prng() > 0.5) {
        blocks.push({
          id: `moving-plat-${segmentIdx}`,
          x: currentX + gapWidth / 2 - 32,
          y: groundY - 64,
          width: 64,
          height: 20,
          type: 'moving_platform',
          movementOffset: 0,
          movementSpeed: 1.2,
          movementRange: 48,
        });
      }
      currentX += gapWidth;
      continue;
    }

    // Flat Ground chunk
    const chunkLength = Math.floor(prng() * 6 + 4);
    for (let c = 0; c < chunkLength; c++) {
      const bx = currentX + c * blockSize;
      blocks.push({
        id: `ground-${segmentIdx}-${c}`,
        x: bx,
        y: groundY,
        width: blockSize,
        height: 120,
        type: 'ground',
      });

      // Spawn Enemies with unique models, buffs and health bars
      if (c === 2 && prng() > 0.3) {
        const eRoll = prng();
        const enemyConfig = getEnemyTypeForTheme(worldInfo.theme, eRoll);
        enemies.push({
          id: `enemy-${segmentIdx}-${c}`,
          type: enemyConfig.type,
          name: enemyConfig.name,
          x: bx,
          y: enemyConfig.type === 'ufo' || enemyConfig.type === 'whale' ? groundY - 90 : groundY - 36,
          vx: enemyConfig.buff === 'frenzy_speed' ? -2.2 : -1.2,
          vy: 0,
          width: enemyConfig.type === 'dragon' || enemyConfig.type === 'whale' ? 44 : 32,
          height: enemyConfig.type === 'dragon' || enemyConfig.type === 'whale' ? 44 : 32,
          health: enemyConfig.hp,
          maxHealth: enemyConfig.hp,
          buff: enemyConfig.buff,
          attackCooldown: 2.0,
          isDead: false,
          deathTimer: 0,
          facing: 'left',
          patrolLeft: bx - 100,
          patrolRight: bx + 100,
        });
      }
    }

    // Destructible Wooden Crates in front
    if (prng() > 0.45) {
      const crateX = currentX + 32;
      blocks.push({
        id: `crate-${segmentIdx}`,
        x: crateX,
        y: groundY - 32,
        width: 32,
        height: 32,
        type: 'destructible_crate',
      });

      if (prng() > 0.5) {
        blocks.push({
          id: `crate-top-${segmentIdx}`,
          x: crateX,
          y: groundY - 64,
          width: 32,
          height: 32,
          type: 'destructible_crate',
        });
      }
    }

    // Question / Power-Up Blocks (Turn Grey when hit)
    if (prng() > 0.25) {
      const elevatedY = groundY - (prng() > 0.5 ? 96 : 128);
      const elevatedLen = Math.floor(prng() * 4 + 3);
      for (let e = 0; e < elevatedLen; e++) {
        const eX = currentX + (e + 1) * blockSize;
        const isQuestion = e === 1 || e === elevatedLen - 2;

        let itemType: 'brick' | 'question_katana' | 'question_slime' | 'question_star' | 'question_mushroom' = 'brick';
        if (isQuestion) {
          const qRoll = prng();
          if (qRoll > 0.7) itemType = 'question_katana';
          else if (qRoll > 0.4) itemType = 'question_slime';
          else if (qRoll > 0.2) itemType = 'question_star';
          else itemType = 'question_mushroom';
        }

        blocks.push({
          id: `elevated-${segmentIdx}-${e}`,
          x: eX,
          y: elevatedY,
          width: blockSize,
          height: blockSize,
          type: itemType as any,
          isUsed: false,
          hasCoin: !isQuestion && prng() > 0.4,
        });

        // Floating Koban Coins
        if (prng() > 0.4) {
          items.push({
            id: `coin-floating-${segmentIdx}-${e}`,
            type: 'coin',
            x: eX + 6,
            y: elevatedY - 36,
            vx: 0,
            vy: 0,
            width: 20,
            height: 20,
            collected: false,
          });
        }
      }
    }

    // Japanese Vending Machine Obstacle
    if (prng() > 0.55) {
      const pipeX = currentX + Math.floor(chunkLength / 2) * blockSize;
      const pipeH = Math.floor(prng() * 2 + 2) * blockSize;
      blocks.push({
        id: `vending-${segmentIdx}`,
        x: pipeX,
        y: groundY - pipeH,
        width: 48,
        height: pipeH,
        type: 'pipe',
      });
    }

    // Spring Bouncer
    if (prng() > 0.75) {
      blocks.push({
        id: `spring-${segmentIdx}`,
        x: currentX + 32,
        y: groundY - 20,
        width: 28,
        height: 20,
        type: 'spring',
      });
    }

    // Star Coins
    for (let sIdx = 0; sIdx < starCoinTargets.length; sIdx++) {
      const targetX = starCoinTargets[sIdx];
      if (currentX <= targetX && currentX + chunkLength * blockSize > targetX) {
        items.push({
          id: `star-coin-${sIdx + 1}`,
          type: 'star_coin',
          coinIndex: sIdx + 1,
          x: currentX + 32,
          y: groundY - 160,
          vx: 0,
          vy: 0,
          width: 36,
          height: 36,
          collected: false,
        });
      }
    }

    currentX += chunkLength * blockSize;
  }

  // Boss Area (Red Oni Demon / Celestial Dragon Lord)
  if (levelNum % 5 === 0) {
    const bossX = currentX + 80;
    enemies.push({
      id: `level-boss-${levelNum}`,
      type: levelNum % 10 === 0 ? 'boss_celestial' : 'boss_bowser',
      name: levelNum % 10 === 0 ? 'Celestial Astral Archon' : 'Demon Lord Guy Crimson',
      x: bossX,
      y: groundY - 64,
      vx: -1.0,
      vy: 0,
      width: 56,
      height: 56,
      health: 8 + Math.floor(levelNum / 50),
      maxHealth: 8 + Math.floor(levelNum / 50),
      buff: 'fire_aura',
      attackCooldown: 1.5,
      isDead: false,
      deathTimer: 0,
      facing: 'left',
      patrolLeft: bossX - 120,
      patrolRight: bossX + 120,
    });
  }

  // Final Japanese Torii Shrine Finish Line
  for (let f = 0; f < 25; f++) {
    blocks.push({
      id: `ground-end-${f}`,
      x: (lengthBlocks - 25 + f) * blockSize,
      y: groundY,
      width: blockSize,
      height: 120,
      type: 'ground',
    });
  }

  for (let step = 0; step < 6; step++) {
    for (let h = 0; h <= step; h++) {
      blocks.push({
        id: `stair-${step}-${h}`,
        x: (lengthBlocks - 16 + step) * blockSize,
        y: groundY - (h + 1) * blockSize,
        width: blockSize,
        height: blockSize,
        type: 'brick',
      });
    }
  }

  const flagX = (lengthBlocks - 8) * blockSize;
  const flagY = groundY - 240;
  blocks.push({
    id: `flagpole-finish`,
    x: flagX,
    y: flagY,
    width: 32,
    height: 240,
    type: 'flagpole',
  });

  const castleX = (lengthBlocks - 4) * blockSize;
  const castleY = groundY - 120;
  blocks.push({
    id: `castle-finish`,
    x: castleX,
    y: castleY,
    width: 120,
    height: 120,
    type: 'castle',
  });

  return {
    metadata,
    blocks,
    enemies,
    items,
    spawnX: 64,
    spawnY: groundY - 48,
    flagX,
    flagY,
    castleX,
    castleY,
  };
}
