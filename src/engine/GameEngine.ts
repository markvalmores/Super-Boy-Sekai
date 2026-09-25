import { soundSynth } from '../utils/audioSynth';
import { Accessory, BlockTile, Costume, EnemyEntity, HitSparkEntity, ItemEntity, PlayerState, PowerUpType, ProjectileEntity, Skill, WeaponType } from '../types/game';
import { GeneratedLevel } from './levelGenerator';

export class GameEngine {
  public level: GeneratedLevel;
  public player: PlayerState;
  public projectiles: ProjectileEntity[] = [];
  public hitSparks: HitSparkEntity[] = [];
  public currentCostume: Costume;
  public currentAccessory: Accessory;
  public currentSkill: Skill;
  
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public isLevelCompleted: boolean = false;
  public isGameOver: boolean = false;
  public timeRemaining: number;
  public elapsedTime: number = 0;
  public screenShakeTimer: number = 0;

  // Key states
  public keys: { [key: string]: boolean } = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    KeyA: false,
    KeyD: false,
    KeyW: false,
    KeyS: false,
    Space: false,
    ShiftLeft: false,
    KeyJ: false, // Sword Slash / Primary Attack
    KeyK: false, // Heavy Punch / Special Skill
    KeyU: false, // Slime Water Blade
  };

  private canDoubleJump: boolean = true;
  private jumpCount: number = 0;
  private onLevelCompleteCallback?: (stats: { score: number; time: number; coins: number; starCoins: number[] }) => void;
  private onGameOverCallback?: () => void;
  private onDialogueCallback?: (msg: string) => void;

  constructor(
    level: GeneratedLevel,
    costume: Costume,
    accessory: Accessory,
    skill: Skill,
    callbacks?: {
      onComplete?: (stats: any) => void;
      onGameOver?: () => void;
      onDialogue?: (msg: string) => void;
    }
  ) {
    this.level = level;
    this.currentCostume = costume;
    this.currentAccessory = accessory;
    this.currentSkill = skill;
    this.timeRemaining = level.metadata.timeLimit;
    
    if (callbacks) {
      this.onLevelCompleteCallback = callbacks.onComplete;
      this.onGameOverCallback = callbacks.onGameOver;
      this.onDialogueCallback = callbacks.onDialogue;
    }

    this.player = {
      x: level.spawnX,
      y: level.spawnY,
      vx: 0,
      vy: 0,
      width: 24,
      height: 38,
      isGrounded: false,
      isJumping: false,
      facing: 'right',
      health: 3,
      maxHealth: 3,
      activeWeapon: 'katana',
      powerUpTimer: 0,
      isAttacking: false,
      attackTimer: 0,
      attackType: 'slash',
      invincibleTimer: 0,
      starTimer: 0,
      energy: 100,
      maxEnergy: 100,
      skillCooldownTimer: 0,
      coins: 0,
      starCoins: [],
      score: 0,
      lives: 3,
      isClimbingFlag: false,
      flagSlideProgress: 0,
      isDead: false,
      deathTimer: 0,
    };
  }

  public update(dt: number) {
    if (this.isPaused || this.isGameOver) return;

    this.elapsedTime += dt;

    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer -= dt;
    }

    // PowerUp Timer
    if (this.player.powerUpTimer > 0) {
      this.player.powerUpTimer -= dt;
      if (this.player.powerUpTimer <= 0) {
        this.player.equippedPowerUp = undefined;
      }
    }

    // Attack Animation Timer
    if (this.player.isAttacking) {
      this.player.attackTimer -= dt;
      if (this.player.attackTimer <= 0) {
        this.player.isAttacking = false;
      }
    }

    // Time Countdown
    if (!this.isLevelCompleted && !this.player.isDead) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.triggerDeath();
        return;
      }
    }

    // Timers
    if (this.player.invincibleTimer > 0) this.player.invincibleTimer -= dt;
    if (this.player.starTimer > 0) this.player.starTimer -= dt;
    if (this.player.skillCooldownTimer > 0) this.player.skillCooldownTimer -= dt;
    if (this.player.energy < this.player.maxEnergy) {
      this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + dt * 15);
    }

    // Flagpole sequence
    if (this.player.isClimbingFlag) {
      this.updateFlagpoleSequence(dt);
      return;
    }

    // Death sequence
    if (this.player.isDead) {
      this.player.deathTimer += dt;
      this.player.vy += 0.45;
      this.player.y += this.player.vy;
      if (this.player.deathTimer > 2.2 && !this.isGameOver) {
        this.isGameOver = true;
        if (this.onGameOverCallback) this.onGameOverCallback();
      }
      return;
    }

    // Normal Gameplay Updates
    this.handleInput(dt);
    this.updatePlayerPhysics(dt);
    this.updateBlocks(dt);
    this.updateEnemies(dt);
    this.updateItems(dt);
    this.updateProjectiles(dt);
    this.updateHitSparks(dt);
  }

  private handleInput(dt: number) {
    const moveLeft = this.keys.ArrowLeft || this.keys.KeyA;
    const moveRight = this.keys.ArrowRight || this.keys.KeyD;
    const jump = this.keys.Space || this.keys.ArrowUp || this.keys.KeyW;
    const sprint = this.keys.ShiftLeft;

    const baseSpeed = 4.0 + (this.currentCostume.speedBonus || 0);
    const speed = sprint ? baseSpeed * 1.5 : baseSpeed;

    if (moveLeft && !moveRight) {
      this.player.vx = -speed;
      this.player.facing = 'left';
    } else if (moveRight && !moveLeft) {
      this.player.vx = speed;
      this.player.facing = 'right';
    } else {
      this.player.vx *= 0.78;
      if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
    }

    // JUMP & DOUBLE JUMP
    if (jump && !this.player.isJumping) {
      if (this.player.isGrounded) {
        this.player.vy = -10.8 - (this.currentCostume.jumpBonus || 0);
        this.player.isGrounded = false;
        this.player.isJumping = true;
        this.jumpCount = 1;
        this.canDoubleJump = true;
        soundSynth.playJump(false);
      } else if (this.canDoubleJump && this.jumpCount === 1) {
        this.player.vy = -9.8;
        this.canDoubleJump = false;
        this.jumpCount = 2;
        soundSynth.playJump(true);
        this.spawnHitSpark(this.player.x + 12, this.player.y + 30, 'electric', 'DOUBLE JUMP!');
      }
    }

    if (!jump) {
      this.player.isJumping = false;
    }

    // ATTACK 1: Key J - Katana Slash
    if (this.keys.KeyJ && !this.player.isAttacking) {
      this.performKatanaSlash();
    }

    // ATTACK 2: Key K - Heavy Punch
    if (this.keys.KeyK && !this.player.isAttacking) {
      this.performHeavyPunch();
    }

    // ATTACK 3: Key U - Slime Water Blade
    if (this.keys.KeyU && this.player.skillCooldownTimer <= 0) {
      this.performSlimeWaterBlade();
    }
  }

  // 1. DRAGON KATANA SWORD SLASH
  public performKatanaSlash() {
    this.player.isAttacking = true;
    this.player.attackTimer = 0.22;
    this.player.attackType = 'slash';

    soundSynth.playSwordSlash();

    const slashReach = this.player.equippedPowerUp === 'katana_blade' ? 64 : 46;
    const slashX = this.player.facing === 'right' ? this.player.x + this.player.width : this.player.x - slashReach;
    const slashY = this.player.y - 10;
    const slashW = slashReach;
    const slashH = this.player.height + 20;

    this.spawnHitSpark(
      this.player.facing === 'right' ? this.player.x + this.player.width + 16 : this.player.x - 16,
      this.player.y + 14,
      'sword_slash',
      'SLASH!'
    );

    // Destroy Enemies in range
    for (const e of this.level.enemies) {
      if (!e.isDead && this.checkRectOverlap(slashX, slashY, slashW, slashH, e.x, e.y, e.width, e.height)) {
        if (e.buff === 'shield') {
          e.buff = 'none';
          soundSynth.playTekkenHitSpark(true);
          this.spawnHitSpark(e.x + e.width / 2, e.y + e.height / 2, 'critical', 'SHIELD BREAK!');
          continue;
        }

        const dmg = this.player.equippedPowerUp === 'katana_blade' ? 4 : 2;
        e.health -= dmg;
        if (e.health <= 0) {
          this.defeatEnemy(e, 300, 'KATANA KO!');
        } else {
          soundSynth.playTekkenHitSpark(true);
          this.spawnHitSpark(e.x + e.width / 2, e.y + e.height / 2, 'critical', `-${dmg} HP!`);
        }
      }
    }

    // Destroy Destructible Objects & Bricks in front
    for (const b of this.level.blocks) {
      if (!b.isDestroyed && this.checkRectOverlap(slashX, slashY, slashW, slashH, b.x, b.y, b.width, b.height)) {
        if (b.type === 'destructible_crate' || b.type === 'brick') {
          b.isDestroyed = true;
          this.addScore(150);
          soundSynth.playBlockShatter();
          this.spawnHitSpark(b.x + b.width / 2, b.y + b.height / 2, 'block_break', 'SHATTER!');
        } else if (b.type.startsWith('question')) {
          this.hitBlockFromBelow(b);
        }
      }
    }
  }

  // 2. HEAVY DESTRUCTIVE PUNCH
  public performHeavyPunch() {
    this.player.isAttacking = true;
    this.player.attackTimer = 0.25;
    this.player.attackType = 'punch';

    soundSynth.playHeavyPunch();

    const punchReach = 42;
    const punchX = this.player.facing === 'right' ? this.player.x + this.player.width : this.player.x - punchReach;
    const punchY = this.player.y;
    const punchW = punchReach;
    const punchH = this.player.height;

    this.spawnHitSpark(
      this.player.facing === 'right' ? this.player.x + this.player.width + 14 : this.player.x - 14,
      this.player.y + 16,
      'punch_burst',
      'PUNCH!'
    );

    for (const e of this.level.enemies) {
      if (!e.isDead && this.checkRectOverlap(punchX, punchY, punchW, punchH, e.x, e.y, e.width, e.height)) {
        if (e.buff === 'shield') {
          e.buff = 'none';
          soundSynth.playTekkenHitSpark(true);
          this.spawnHitSpark(e.x + e.width / 2, e.y + e.height / 2, 'critical', 'SHIELD BREAK!');
          continue;
        }

        e.health -= 3;
        if (e.health <= 0) {
          this.defeatEnemy(e, 350, 'HEAVY KO!');
        } else {
          soundSynth.playTekkenHitSpark(true);
          this.spawnHitSpark(e.x + e.width / 2, e.y + e.height / 2, 'critical', 'SMASH!');
        }
      }
    }

    for (const b of this.level.blocks) {
      if (!b.isDestroyed && this.checkRectOverlap(punchX, punchY, punchW, punchH, b.x, b.y, b.width, b.height)) {
        if (b.type === 'destructible_crate' || b.type === 'brick') {
          b.isDestroyed = true;
          this.addScore(150);
          soundSynth.playBlockShatter();
          this.spawnHitSpark(b.x + b.width / 2, b.y + b.height / 2, 'block_break', 'PUNCH BREAK!');
        }
      }
    }
  }

  // 3. TENSURA RIMURU SLIME WATER BLADE
  public performSlimeWaterBlade() {
    if (this.player.energy < 20) return;

    this.player.energy -= 20;
    this.player.skillCooldownTimer = 0.6;

    soundSynth.playSlimeWaterBlade();

    this.projectiles.push({
      id: 'slime-blade-' + Date.now() + Math.random(),
      type: 'slime_blade',
      x: this.player.facing === 'right' ? this.player.x + this.player.width + 8 : this.player.x - 8,
      y: this.player.y + this.player.height * 0.4,
      vx: this.player.facing === 'right' ? 9.5 : -9.5,
      vy: 0,
      radius: 10,
      lifetime: 2.8,
      isPlayer: true,
      damage: 4,
    });

    this.spawnHitSpark(this.player.x + 12, this.player.y + 14, 'slime_splash', 'WATER CUTTER!');
  }

  private checkRectOverlap(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
    return x1 + w1 > x2 && x1 < x2 + w2 && y1 + h1 > y2 && y1 < y2 + h2;
  }

  public spawnHitSpark(x: number, y: number, type: 'electric' | 'critical' | 'ko' | 'player_hurt' | 'sword_slash' | 'punch_burst' | 'slime_splash' | 'block_break', text?: string) {
    this.screenShakeTimer = 0.16;
    this.hitSparks.push({
      id: 'spark-' + Date.now() + Math.random(),
      x,
      y,
      type,
      text,
      life: 0.35,
      maxLife: 0.35,
      scale: type === 'ko' ? 1.8 : 1.2,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  private updateHitSparks(dt: number) {
    for (let i = this.hitSparks.length - 1; i >= 0; i--) {
      const spark = this.hitSparks[i];
      spark.life -= dt;
      if (spark.life <= 0) {
        this.hitSparks.splice(i, 1);
      }
    }
  }

  private updatePlayerPhysics(dt: number) {
    const gravity = 0.42;
    this.player.vy += gravity;
    if (this.player.vy > 12) this.player.vy = 12;

    this.player.x += this.player.vx;
    this.checkTileCollisionX();

    this.player.y += this.player.vy;
    this.player.isGrounded = false;
    this.checkTileCollisionY();
  }

  private checkTileCollisionX() {
    for (const b of this.level.blocks) {
      if (b.isDestroyed || b.type === 'flagpole') {
        if (
          b.type === 'flagpole' &&
          this.player.x + this.player.width >= b.x &&
          this.player.x <= b.x + b.width &&
          this.player.y + this.player.height >= b.y &&
          this.player.y <= b.y + b.height
        ) {
          this.startFlagpoleVictory(b);
          return;
        }
        continue;
      }

      if (
        this.player.x + this.player.width > b.x &&
        this.player.x < b.x + b.width &&
        this.player.y + this.player.height > b.y &&
        this.player.y < b.y + b.height
      ) {
        if (this.player.vx > 0) {
          this.player.x = b.x - this.player.width;
          this.player.vx = 0;
        } else if (this.player.vx < 0) {
          this.player.x = b.x + b.width;
          this.player.vx = 0;
        }
      }
    }
  }

  private checkTileCollisionY() {
    for (const b of this.level.blocks) {
      if (b.isDestroyed || b.type === 'flagpole') continue;

      if (
        this.player.x + this.player.width > b.x &&
        this.player.x < b.x + b.width &&
        this.player.y + this.player.height > b.y &&
        this.player.y < b.y + b.height
      ) {
        if (this.player.vy > 0 && this.player.y + this.player.height - this.player.vy <= b.y + 10) {
          this.player.y = b.y - this.player.height;
          this.player.vy = 0;
          this.player.isGrounded = true;
          this.jumpCount = 0;

          if (b.type === 'spring') {
            this.player.vy = -14;
            this.player.isGrounded = false;
            soundSynth.playJump(true);
            this.spawnHitSpark(b.x + b.width / 2, b.y, 'electric', 'SPRING!');
          }
        } 
        else if (this.player.vy < 0) {
          this.player.y = b.y + b.height;
          this.player.vy = 0;
          this.hitBlockFromBelow(b);
        }
      }
    }
  }

  // Hit question block from below: Spawns item & TURNS THE BLOCK GREY (USED)
  private hitBlockFromBelow(b: BlockTile) {
    if (b.isUsed || b.isDestroyed) {
      soundSynth.playBlockBump();
      return;
    }

    b.hitAnimation = 1.0;
    b.isUsed = true; // TURNS GREY EMPTY BLOCK
    soundSynth.playBlockBump();
    this.spawnHitSpark(b.x + b.width / 2, b.y + b.height, 'electric', 'LUCKY!');

    if (b.type === 'question_katana') {
      soundSynth.playPowerup();
      this.level.items.push({
        id: 'katana-' + Date.now(),
        type: 'power_katana',
        x: b.x + 4,
        y: b.y - 28,
        vx: 1.2,
        vy: -3,
        width: 24,
        height: 24,
        collected: false,
      });
    } else if (b.type === 'question_slime') {
      soundSynth.playPowerup();
      this.level.items.push({
        id: 'slime-' + Date.now(),
        type: 'power_slime',
        x: b.x + 4,
        y: b.y - 28,
        vx: 1.5,
        vy: -3,
        width: 24,
        height: 24,
        collected: false,
      });
    } else if (b.type === 'question_mushroom') {
      soundSynth.playPowerup();
      this.level.items.push({
        id: 'mushroom-' + Date.now(),
        type: 'mushroom',
        x: b.x + 4,
        y: b.y - 28,
        vx: 1.5,
        vy: -3,
        width: 24,
        height: 24,
        collected: false,
      });
    } else if (b.type === 'question_star') {
      soundSynth.playPowerup();
      this.level.items.push({
        id: 'star-' + Date.now(),
        type: 'star',
        x: b.x + 4,
        y: b.y - 28,
        vx: 2.0,
        vy: -4,
        width: 24,
        height: 24,
        collected: false,
      });
    } else if (b.type === 'brick' && b.hasCoin) {
      b.hasCoin = false;
      this.addScore(200);
      this.player.coins++;
      soundSynth.playCoin();
    }
  }

  private updateBlocks(dt: number) {
    for (const b of this.level.blocks) {
      if (b.hitAnimation && b.hitAnimation > 0) {
        b.hitAnimation -= dt * 5;
        if (b.hitAnimation < 0) b.hitAnimation = 0;
      }

      if (b.type === 'moving_platform' && b.movementRange && b.movementSpeed) {
        b.movementOffset = Math.sin(this.elapsedTime * b.movementSpeed) * b.movementRange;
      }
    }
  }

  // Update Enemies, Ranged Attacks, and Patrolling
  private updateEnemies(dt: number) {
    for (let i = this.level.enemies.length - 1; i >= 0; i--) {
      const e = this.level.enemies[i];
      if (e.isDead) {
        e.deathTimer += dt;
        if (e.deathTimer > 0.15) {
          this.level.enemies.splice(i, 1);
        }
        continue;
      }

      e.vy += 0.35;
      e.y += e.vy;

      if (e.y > 380 - e.height) {
        e.y = 380 - e.height;
        e.vy = 0;
      }

      if (e.type === 'ufo' || e.type === 'whale') {
        e.y = 380 - 90 + Math.sin(this.elapsedTime * 3 + e.x) * 12;
      }

      e.x += e.vx;
      if (e.x < e.patrolLeft) {
        e.x = e.patrolLeft;
        e.vx = Math.abs(e.vx);
        e.facing = 'right';
      } else if (e.x > e.patrolRight) {
        e.x = e.patrolRight;
        e.vx = -Math.abs(e.vx);
        e.facing = 'left';
      }

      // Enemy Ranged Attacks / Powers
      if (e.attackCooldown !== undefined) {
        e.attackCooldown -= dt;
        const distToPlayer = Math.abs(this.player.x - e.x);

        if (e.attackCooldown <= 0 && distToPlayer < 240) {
          e.attackCooldown = 3.2;

          if (e.type === 'dragon' || e.buff === 'fire_aura') {
            this.projectiles.push({
              id: 'enemy-fire-' + Date.now(),
              type: 'enemy_fire',
              x: e.facing === 'right' ? e.x + e.width : e.x,
              y: e.y + 12,
              vx: e.facing === 'right' ? 4.5 : -4.5,
              vy: 0,
              radius: 8,
              lifetime: 2.5,
              isPlayer: false,
              damage: 1,
            });
            this.spawnHitSpark(e.x, e.y, 'electric', 'DRAGON FIRE!');
          } else if (e.type === 'ufo' || e.type === 'alien') {
            this.projectiles.push({
              id: 'alien-laser-' + Date.now(),
              type: 'alien_laser',
              x: e.facing === 'right' ? e.x + e.width : e.x,
              y: e.y + 14,
              vx: e.facing === 'right' ? 5.5 : -5.5,
              vy: 0,
              radius: 6,
              lifetime: 2.2,
              isPlayer: false,
              damage: 1,
            });
            this.spawnHitSpark(e.x, e.y, 'electric', 'LASER!');
          } else if (e.type === 'spider') {
            this.projectiles.push({
              id: 'spider-web-' + Date.now(),
              type: 'spider_web',
              x: e.facing === 'right' ? e.x + e.width : e.x,
              y: e.y + 10,
              vx: e.facing === 'right' ? 3.8 : -3.8,
              vy: 0,
              radius: 7,
              lifetime: 2.4,
              isPlayer: false,
              damage: 1,
            });
            this.spawnHitSpark(e.x, e.y, 'slime_splash', 'WEB!');
          }
        }
      }

      // Player Stomp or Collision
      if (
        this.player.x + this.player.width > e.x &&
        this.player.x < e.x + e.width &&
        this.player.y + this.player.height > e.y &&
        this.player.y < e.y + e.height
      ) {
        if (this.player.starTimer > 0) {
          this.defeatEnemy(e, 500, 'CRITICAL KO!');
          continue;
        }

        // Stomp from above
        if (this.player.vy > 0 && this.player.y + this.player.height - this.player.vy <= e.y + 14) {
          this.player.vy = -7.8;

          if (e.buff === 'shield') {
            e.buff = 'none';
            soundSynth.playTekkenHitSpark(true);
            this.spawnHitSpark(e.x + e.width / 2, e.y, 'critical', 'SHIELD BREAK!');
          } else {
            e.health--;
            if (e.health <= 0) {
              this.defeatEnemy(e, 200, 'STOMP KO!');
            } else {
              soundSynth.playTekkenHitSpark(false);
              this.spawnHitSpark(e.x + e.width / 2, e.y, 'electric', 'HIT!');
            }
          }
        } 
        else if (this.player.invincibleTimer <= 0) {
          this.hurtPlayer(e);
        }
      }
    }
  }

  private defeatEnemy(e: EnemyEntity, scoreReward: number, text: string = 'KO!') {
    e.isDead = true;
    e.deathTimer = 0;
    this.addScore(scoreReward);

    soundSynth.playKOBurst();
    soundSynth.playTekkenHitSpark(true);
    this.spawnHitSpark(e.x + e.width / 2, e.y + e.height / 2, 'ko', text);
  }

  private hurtPlayer(e?: EnemyEntity) {
    this.player.invincibleTimer = 1.8;
    this.player.health--;

    soundSynth.playTekkenHitSpark(true);
    this.spawnHitSpark(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 'player_hurt', 'OUCH!');

    const knockDir = e && e.x < this.player.x ? 5 : -5;
    this.player.vx = knockDir;
    this.player.vy = -4.5;

    if (this.player.health <= 0) {
      this.triggerDeath();
    }
  }

  private triggerDeath() {
    if (this.player.isDead) return;
    this.player.isDead = true;
    this.player.vy = -10;
    this.player.vx = 0;
    soundSynth.playHurt();
    this.spawnHitSpark(this.player.x + 12, this.player.y + 16, 'player_hurt', 'DEFEATED!');
  }

  private updateItems(dt: number) {
    for (const it of this.level.items) {
      if (it.collected) continue;

      if (it.type === 'mushroom' || it.type === 'star' || it.type.startsWith('power_')) {
        it.vy += 0.35;
        it.x += it.vx;
        it.y += it.vy;

        if (it.y > 380 - it.height) {
          it.y = 380 - it.height;
          it.vy = it.type === 'star' ? -6 : 0;
        }
      }

      if (
        this.player.x + this.player.width > it.x &&
        this.player.x < it.x + it.width &&
        this.player.y + this.player.height > it.y &&
        this.player.y < it.y + it.height
      ) {
        it.collected = true;

        if (it.type === 'coin') {
          this.player.coins++;
          this.addScore(100);
          soundSynth.playCoin();
          this.spawnHitSpark(it.x + 10, it.y + 10, 'electric', '+100');
        } else if (it.type === 'power_katana') {
          this.player.equippedPowerUp = 'katana_blade';
          this.player.powerUpTimer = 25;
          this.addScore(1500);
          soundSynth.playPowerup();
          this.spawnHitSpark(it.x + 12, it.y + 12, 'sword_slash', 'DRAGON KATANA!');
          if (this.onDialogueCallback) {
            this.onDialogueCallback('⚔️ Dragon Katana Equipped! Press J to slice enemies & obstacles!');
          }
        } else if (it.type === 'power_slime') {
          this.player.equippedPowerUp = 'slime_orb';
          this.player.powerUpTimer = 30;
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
          this.addScore(2000);
          soundSynth.playPowerup();
          this.spawnHitSpark(it.x + 12, it.y + 12, 'slime_splash', 'RIMURU SLIME!');
          if (this.onDialogueCallback) {
            this.onDialogueCallback('✨ Great Sage: Tempest Slime Aura Activated!');
          }
        } else if (it.type === 'star_coin') {
          if (it.coinIndex && !this.player.starCoins.includes(it.coinIndex)) {
            this.player.starCoins.push(it.coinIndex);
          }
          this.addScore(1000);
          soundSynth.playStarCoin();
          this.spawnHitSpark(it.x + 18, it.y + 18, 'critical', '★ STAR COIN ★');
          if (this.onDialogueCallback) {
            this.onDialogueCallback(`★ Star Coin #${it.coinIndex || 1} Collected!`);
          }
        } else if (it.type === 'mushroom' || it.type === 'power_bento') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
          this.addScore(1000);
          soundSynth.playPowerup();
          this.spawnHitSpark(it.x + 12, it.y + 12, 'electric', 'HEALED!');
        } else if (it.type === 'star') {
          this.player.starTimer = 10;
          this.addScore(2000);
          soundSynth.playPowerup();
          this.spawnHitSpark(it.x + 12, it.y + 12, 'critical', 'INVINCIBLE!');
        }
      }
    }
  }

  // Update Projectiles (Both Player and Enemy)
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= dt;
      p.x += p.vx;
      p.y += p.vy;

      if (p.lifetime <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.isPlayer) {
        for (const e of this.level.enemies) {
          if (!e.isDead && Math.hypot(p.x - (e.x + e.width / 2), p.y - (e.y + e.height / 2)) < p.radius + e.width / 2) {
            if (e.buff === 'shield') {
              e.buff = 'none';
              soundSynth.playTekkenHitSpark(true);
              this.spawnHitSpark(e.x + e.width / 2, e.y + e.height / 2, 'critical', 'SHIELD BREAK!');
            } else {
              e.health -= p.damage;
              if (e.health <= 0) {
                this.defeatEnemy(e, 300, p.type === 'slime_blade' ? 'WATER CUTTER KO!' : 'SPIRIT KO!');
              } else {
                soundSynth.playTekkenHitSpark(true);
                this.spawnHitSpark(e.x + e.width / 2, e.y + e.height / 2, 'critical', 'CRITICAL!');
              }
            }
            this.projectiles.splice(i, 1);
            break;
          }
        }
      } else {
        // Enemy Projectile hits Player
        if (
          this.player.invincibleTimer <= 0 &&
          Math.hypot(p.x - (this.player.x + this.player.width / 2), p.y - (this.player.y + this.player.height / 2)) < p.radius + this.player.width / 2
        ) {
          this.hurtPlayer();
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private startFlagpoleVictory(flagpoleBlock: BlockTile) {
    if (this.player.isClimbingFlag || this.isLevelCompleted) return;

    this.player.isClimbingFlag = true;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.x = flagpoleBlock.x - 6;

    const heightRatio = Math.max(0, Math.min(1, (380 - this.player.y) / flagpoleBlock.height));
    const flagBonus = Math.floor(heightRatio * 5000);
    this.addScore(flagBonus);

    this.spawnHitSpark(flagpoleBlock.x, this.player.y, 'critical', 'TORII BELL!');
    soundSynth.playFlagpole();
  }

  private updateFlagpoleSequence(dt: number) {
    this.player.flagSlideProgress += dt * 0.9;
    this.player.y = Math.min(380 - this.player.height, this.player.y + dt * 140);

    if (this.player.y >= 380 - this.player.height - 2) {
      this.player.x += dt * 60;

      if (this.player.x >= this.level.castleX + 40 && !this.isLevelCompleted) {
        this.isLevelCompleted = true;
        const timeBonus = Math.floor(this.timeRemaining) * 50;
        this.addScore(timeBonus);

        if (this.onLevelCompleteCallback) {
          this.onLevelCompleteCallback({
            score: this.player.score,
            time: Math.floor(this.elapsedTime),
            coins: this.player.coins,
            starCoins: this.player.starCoins,
          });
        }
      }
    }
  }

  public addScore(pts: number) {
    this.player.score += pts;
  }
}
