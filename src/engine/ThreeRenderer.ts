import * as THREE from 'three';
import {
  AccessoryId,
  BlockTile,
  Costume,
  EnemyEntity,
  GraphicSettings,
  HitSparkEntity,
  ItemEntity,
  PlayerState,
  ProjectileEntity,
  WorldTheme,
} from '../types/game';
import {
  getDestructibleCrateTexture,
  getEmptyGreyBlockTexture,
  getEnemyTexture,
  getJapaneseKobanCoinTexture,
  getJapaneseSakuraGroundTexture,
  getJapaneseVendingMachineTexture,
  getJapaneseWoodBlockTexture,
  getNintendoMiiFaceTexture,
  getOmikujiLuckyBlockTexture,
  getOtakuHoodieTexture,
  getRimuruSlimeTexture,
  getSkyGradientTexture,
  getTempestDemonLordCoatTexture,
} from '../utils/animeTextures';

export class ThreeRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private graphicSettings: GraphicSettings;

  // Player Nintendo Mii Humanoid Components
  private playerGroup: THREE.Group;
  private playerMeshComponents: {
    headGroup: THREE.Group;
    faceMesh: THREE.Mesh;
    hairMeshes: THREE.Mesh[];
    neckMesh: THREE.Mesh;
    torso: THREE.Mesh;
    coatTails: THREE.Mesh;
    slimePetGroup: THREE.Group;
    katanaGroup: THREE.Group;
    slashArcGroup: THREE.Group;
    slashArcMesh: THREE.Mesh;
    punchWaveGroup: THREE.Group;
    wingsGroup: THREE.Group;
    crossMesh: THREE.Mesh;
    visorMesh: THREE.Mesh;
    kitsuneMesh: THREE.Mesh;
    auraMesh: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    leftHand: THREE.Mesh;
    rightHand: THREE.Mesh;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
  };

  private blockMeshMap: Map<string, THREE.Object3D> = new Map();
  private enemyMeshMap: Map<string, THREE.Object3D> = new Map();
  private itemMeshMap: Map<string, THREE.Object3D> = new Map();
  private projectileMeshMap: Map<string, THREE.Object3D> = new Map();
  private hitSparkMeshMap: Map<string, THREE.Object3D> = new Map();
  private backgroundGroup: THREE.Group;
  private skyBackdropMesh: THREE.Mesh;
  private sakuraParticlesGroup: THREE.Points;

  // Dynamic Lighting
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private playerPointLight: THREE.PointLight;
  private raytraceLightPool: THREE.PointLight[] = [];

  private isDisposed: boolean = false;
  private animTimer: number = 0;
  private cameraTargetX: number = 0;

  constructor(container: HTMLElement, settings: GraphicSettings) {
    this.container = container;
    this.graphicSettings = settings;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. 2.5D Calibrated Camera
    const aspect = Math.max(1, container.clientWidth / container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(40, aspect, 1, 4000);
    this.camera.position.set(0, 0, 520);

    // 3. Renderer with ACES Tone Mapping & Textures
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = settings.shadowQuality !== 'off';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = settings.rayTracingEnabled ? 1.25 : 1.05;
    container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.ambientLight = new THREE.AmbientLight(0xfffaed, 0.7);
    this.scene.add(this.ambientLight);

    // Path Tracing Hemisphere Bounce Light (Sky radiance + Ground bounce radiance)
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, settings.pathTracingSim ? 0.9 : 0.4);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    this.sunLight.position.set(150, 350, 260);
    this.sunLight.castShadow = settings.shadowQuality !== 'off';
    if (this.sunLight.castShadow) {
      this.sunLight.shadow.mapSize.width = settings.shadowQuality === 'ultra' ? 2048 : 1024;
      this.sunLight.shadow.mapSize.height = settings.shadowQuality === 'ultra' ? 2048 : 1024;
      this.sunLight.shadow.camera.near = 10;
      this.sunLight.shadow.camera.far = 1200;
      this.sunLight.shadow.bias = -0.0005;
    }
    this.scene.add(this.sunLight);

    this.playerPointLight = new THREE.PointLight(0x38bdf8, 1.2, 220);
    this.scene.add(this.playerPointLight);

    for (let i = 0; i < 4; i++) {
      const pl = new THREE.PointLight(0x0284c7, 0, 160);
      this.scene.add(pl);
      this.raytraceLightPool.push(pl);
    }

    // 5. Sky Gradient Backdrop Mesh
    const skyGeo = new THREE.PlaneGeometry(3200, 1600);
    const skyMat = new THREE.MeshBasicMaterial({
      map: getSkyGradientTexture('grassland'),
      depthWrite: false,
    });
    this.skyBackdropMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyBackdropMesh.position.set(0, 0, -800);
    this.scene.add(this.skyBackdropMesh);

    // 6. Build Nintendo Mii Style Anime Boy Avatar Model
    this.playerGroup = new THREE.Group();
    this.playerMeshComponents = this.createNintendoMiiAvatarModel();
    this.scene.add(this.playerGroup);

    // 7. Background Parallax & Sakura Petals
    this.backgroundGroup = new THREE.Group();
    this.scene.add(this.backgroundGroup);

    this.sakuraParticlesGroup = this.createSakuraPetalsSystem();
    this.scene.add(this.sakuraParticlesGroup);

    this.createLayeredJapanBackdrop('grassland');
  }

  // Nintendo Mii Style Anime Boy Model (Iconic Round Head, Mii Face Decal, Otaku Hair, Sphere Hands)
  private createNintendoMiiAvatarModel() {
    const headGroup = new THREE.Group();

    // 1. Mii Rounded Head
    const headGeo = new THREE.SphereGeometry(9.2, 28, 28);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffdfcb,
      roughness: 0.45,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.scale.set(1.05, 1.05, 1.0);
    head.castShadow = true;
    headGroup.add(head);

    // Nintendo Mii Face Decal (Charming Mii eyes, blush, nose dot & smile)
    const faceGeo = new THREE.PlaneGeometry(16, 16);
    const faceMat = new THREE.MeshBasicMaterial({
      map: getNintendoMiiFaceTexture('happy'),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const faceMesh = new THREE.Mesh(faceGeo, faceMat);
    faceMesh.position.set(0, -0.4, 9.4);
    headGroup.add(faceMesh);

    // 2. Layered Anime Otaku Boy Hair (Bangs, Side Locks & Crown Spikes)
    const hairMeshes: THREE.Mesh[] = [];
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.35,
    });

    const hairSpikesData = [
      // Sweeping front bangs
      { x: 0, y: 7.6, z: 5.5, rx: 0.4, ry: 0, rz: 0, s: 1.1 },
      { x: -4.5, y: 7.0, z: 5.2, rx: 0.35, ry: 0.1, rz: 0.45, s: 1.05 },
      { x: 4.5, y: 7.0, z: 5.2, rx: 0.35, ry: -0.1, rz: -0.45, s: 1.05 },
      // Sideburn tufts
      { x: -7.8, y: 2.2, z: 3.0, rx: 0, ry: 0.2, rz: 0.5, s: 0.95 },
      { x: 7.8, y: 2.2, z: 3.0, rx: 0, ry: -0.2, rz: -0.5, s: 0.95 },
      // Crown & Back volume
      { x: 0, y: 9.4, z: -1.5, rx: -0.25, ry: 0, rz: 0, s: 1.2 },
      { x: -5.5, y: 8.8, z: -3.5, rx: -0.35, ry: 0, rz: 0.45, s: 1.1 },
      { x: 5.5, y: 8.8, z: -3.5, rx: -0.35, ry: 0, rz: -0.45, s: 1.1 },
      { x: 0, y: 3.5, z: -8.0, rx: -0.5, ry: 0, rz: 0, s: 1.05 },
    ];

    hairSpikesData.forEach(hd => {
      const coneGeo = new THREE.ConeGeometry(3.2 * hd.s, 9.0 * hd.s, 8);
      const cone = new THREE.Mesh(coneGeo, hairMat);
      cone.position.set(hd.x, hd.y, hd.z);
      cone.rotation.set(hd.rx, hd.ry, hd.rz);
      cone.castShadow = true;
      headGroup.add(cone);
      hairMeshes.push(cone);
    });

    headGroup.position.set(0, 26, 0);

    // 3. Neck
    const neckGeo = new THREE.CylinderGeometry(3.0, 3.2, 5, 12);
    const neckMat = new THREE.MeshStandardMaterial({ color: 0xffdfcb, roughness: 0.5 });
    const neckMesh = new THREE.Mesh(neckGeo, neckMat);
    neckMesh.position.set(0, 19, 0);

    // 4. Humanoid Torso (Tempest Demon Lord Coat / Otaku Uniform)
    const torsoGeo = new THREE.BoxGeometry(13, 15, 9);
    const coatMat = new THREE.MeshStandardMaterial({
      map: getTempestDemonLordCoatTexture(),
      roughness: 0.35,
    });
    const torso = new THREE.Mesh(torsoGeo, coatMat);
    torso.position.set(0, 11, 0);
    torso.castShadow = true;

    // Flowing Coat Tails
    const coatTailsGeo = new THREE.BoxGeometry(12, 10, 2);
    const coatTailsMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
    const coatTails = new THREE.Mesh(coatTailsGeo, coatTailsMat);
    coatTails.position.set(0, 2, -4.5);
    coatTails.rotation.x = 0.2;

    // 5. Tensura Rimuru Blue Slime Companion (Sitting on shoulder)
    const slimePetGroup = new THREE.Group();
    const slimeGeo = new THREE.SphereGeometry(4.5, 16, 16);
    const slimeMat = new THREE.MeshStandardMaterial({
      map: getRimuruSlimeTexture(),
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.1,
    });
    const slimeMesh = new THREE.Mesh(slimeGeo, slimeMat);
    slimePetGroup.add(slimeMesh);
    slimePetGroup.position.set(-8.5, 18, 1.5);

    // 6. Equipped Dragon Katana Sword in Right Hand
    const katanaGroup = new THREE.Group();
    const hiltGeo = new THREE.CylinderGeometry(1.0, 1.0, 7, 8);
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const hilt = new THREE.Mesh(hiltGeo, hiltMat);
    hilt.position.y = -3.5;

    const tsubaGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.8, 12);
    const tsubaMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 });
    const tsuba = new THREE.Mesh(tsubaGeo, tsubaMat);
    tsuba.position.y = 0;

    const bladeGeo = new THREE.BoxGeometry(1.2, 22, 0.4);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.15,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 11;
    katanaGroup.add(hilt, tsuba, blade);
    katanaGroup.position.set(8.5, 9, 3);
    katanaGroup.rotation.z = -0.4;

    // 7. Dynamic Slash Arc Mesh
    const slashArcGroup = new THREE.Group();
    const arcGeo = new THREE.RingGeometry(14, 24, 24, 1, 0, Math.PI * 0.85);
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const slashArcMesh = new THREE.Mesh(arcGeo, arcMat);
    slashArcMesh.rotation.y = Math.PI * 0.5;
    slashArcGroup.add(slashArcMesh);
    slashArcGroup.position.set(10, 12, 0);

    // Heavy Punch Burst Wave
    const punchWaveGroup = new THREE.Group();
    const punchWaveGeo = new THREE.RingGeometry(8, 18, 16);
    const punchWaveMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const punchWaveMesh = new THREE.Mesh(punchWaveGeo, punchWaveMat);
    punchWaveMesh.rotation.y = Math.PI * 0.5;
    punchWaveGroup.add(punchWaveMesh);
    punchWaveGroup.position.set(12, 10, 0);

    // 8. Seraphim Angel Wings Accessory
    const wingsGroup = new THREE.Group();
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(15, 20, 26, 12);
    wingShape.quadraticCurveTo(16, 2, 0, -4);
    const wingGeo = new THREE.ShapeGeometry(wingShape);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
    });
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-6, 12, -5);
    leftWing.rotation.y = -0.35;
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(6, 12, -5);
    rightWing.rotation.y = 0.35;
    rightWing.scale.set(-1, 1, 1);
    wingsGroup.add(leftWing, rightWing);
    wingsGroup.visible = false;

    // Holy Cross Accessory
    const crossGeo = new THREE.BoxGeometry(4, 10, 1.5);
    const crossMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8 });
    const crossMesh = new THREE.Mesh(crossGeo, crossMat);
    crossMesh.position.set(0, 12, 5.2);
    crossMesh.visible = false;

    // Visor Accessory
    const visorGeo = new THREE.BoxGeometry(14, 3.5, 3);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.8,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 26, 9.4);
    visorMesh.visible = false;

    // Kitsune Fox Mask
    const kitsuneGeo = new THREE.ConeGeometry(5, 7, 4);
    const kitsuneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const kitsuneMesh = new THREE.Mesh(kitsuneGeo, kitsuneMat);
    kitsuneMesh.position.set(7.5, 28, 4);
    kitsuneMesh.rotation.set(-0.4, 0.4, 0.4);
    kitsuneMesh.visible = false;

    // Super Rainbow Invincibility Aura
    const auraGeo = new THREE.SphereGeometry(22, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.position.set(0, 15, 0);

    // 9. Arms with Nintendo Mii Spherical Hands
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.5 });
    const handMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }); // Mii White Glove / Hands

    // Left Arm & Hand
    const leftArmGeo = new THREE.CylinderGeometry(2.2, 2.2, 11, 10);
    const leftArm = new THREE.Mesh(leftArmGeo, limbMat);
    leftArm.position.set(-8.2, 11, 0);
    const leftHandGeo = new THREE.SphereGeometry(2.6, 12, 12);
    const leftHand = new THREE.Mesh(leftHandGeo, handMat);
    leftHand.position.set(0, -6, 0);
    leftArm.add(leftHand);

    // Right Arm & Hand
    const rightArmGeo = new THREE.CylinderGeometry(2.2, 2.2, 11, 10);
    const rightArm = new THREE.Mesh(rightArmGeo, limbMat);
    rightArm.position.set(8.2, 11, 0);
    const rightHandGeo = new THREE.SphereGeometry(2.6, 12, 12);
    const rightHand = new THREE.Mesh(rightHandGeo, handMat);
    rightHand.position.set(0, -6, 0);
    rightArm.add(rightHand);

    // 10. Legs with Rounded Shoes
    const legGeo = new THREE.CylinderGeometry(2.4, 2.4, 11, 10);
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-3.5, 0, 0);
    const leftShoeGeo = new THREE.SphereGeometry(3.0, 12, 12);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
    const leftShoe = new THREE.Mesh(leftShoeGeo, shoeMat);
    leftShoe.position.set(0, -5.5, 1);
    leftLeg.add(leftShoe);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(3.5, 0, 0);
    const rightShoe = new THREE.Mesh(leftShoeGeo, shoeMat);
    rightShoe.position.set(0, -5.5, 1);
    rightLeg.add(rightShoe);

    const group = this.playerGroup;
    group.add(
      headGroup,
      neckMesh,
      torso,
      coatTails,
      slimePetGroup,
      katanaGroup,
      slashArcGroup,
      punchWaveGroup,
      wingsGroup,
      crossMesh,
      visorMesh,
      kitsuneMesh,
      auraMesh,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg
    );

    return {
      headGroup,
      faceMesh,
      hairMeshes,
      neckMesh,
      torso,
      coatTails,
      slimePetGroup,
      katanaGroup,
      slashArcGroup,
      slashArcMesh,
      punchWaveGroup,
      wingsGroup,
      crossMesh,
      visorMesh,
      kitsuneMesh,
      auraMesh,
      leftArm,
      rightArm,
      leftHand,
      rightHand,
      leftLeg,
      rightLeg,
    };
  }

  // Floating Pink Sakura Petals Particle System
  private createSakuraPetalsSystem(): THREE.Points {
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;

      colors[i * 3] = 0.96;
      colors[i * 3 + 1] = 0.65 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 5.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    return new THREE.Points(geometry, material);
  }

  public createLayeredJapanBackdrop(theme: WorldTheme) {
    while (this.backgroundGroup.children.length > 0) {
      this.backgroundGroup.remove(this.backgroundGroup.children[0]);
    }

    // Sky gradient material update
    (this.skyBackdropMesh.material as THREE.MeshBasicMaterial).map = getSkyGradientTexture(theme);
    (this.skyBackdropMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;

    // Mount Fuji
    const fujiBaseGeo = new THREE.ConeGeometry(280, 240, 8);
    const fujiMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const fuji = new THREE.Mesh(fujiBaseGeo, fujiMat);
    fuji.position.set(400, 40, -600);
    fuji.scale.set(1.6, 1.0, 1.0);
    this.backgroundGroup.add(fuji);

    const snowCapGeo = new THREE.ConeGeometry(120, 90, 8);
    const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const snowCap = new THREE.Mesh(snowCapGeo, snowMat);
    snowCap.position.set(400, 120, -590);
    snowCap.scale.set(1.6, 1.0, 1.0);
    this.backgroundGroup.add(snowCap);

    // Pagodas and Tokyo Tower silhouettes
    for (let i = -6; i < 30; i++) {
      const pagodaGroup = new THREE.Group();
      const pMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
      for (let tier = 0; tier < 3; tier++) {
        const roof = new THREE.Mesh(new THREE.ConeGeometry(40 - tier * 8, 14, 4), pMat);
        roof.position.y = tier * 24;
        pagodaGroup.add(roof);
      }
      pagodaGroup.position.set(i * 320, 60 + (i % 3) * 20, -380);
      this.backgroundGroup.add(pagodaGroup);
    }
  }

  // Synchronize Blocks with dynamic EMPTY GREY texture when hit/used
  public syncBlocks(blocks: BlockTile[], theme: WorldTheme) {
    const activeIds = new Set<string>();

    blocks.forEach(b => {
      if (b.isDestroyed) return;
      activeIds.add(b.id);
      let mesh = this.blockMeshMap.get(b.id);

      if (!mesh) {
        mesh = this.createJapaneseBlockMesh(b, theme);
        this.blockMeshMap.set(b.id, mesh);
        this.scene.add(mesh);
      } else {
        // If question block is used, ensure it turns GREY
        if (b.isUsed && b.type.startsWith('question')) {
          const innerMesh = mesh.children[0] as THREE.Mesh;
          if (innerMesh && innerMesh.material) {
            (innerMesh.material as THREE.MeshStandardMaterial).map = getEmptyGreyBlockTexture();
            (innerMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            (innerMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
          }
        }
      }

      const hitBounce = b.hitAnimation ? Math.sin(b.hitAnimation * Math.PI) * 10 : 0;
      const movOffset = b.movementOffset || 0;
      const worldX = b.x + b.width / 2;
      const worldY = 380 - (b.y + b.height / 2) + hitBounce;

      mesh.position.set(worldX, worldY, movOffset);
    });

    for (const [id, mesh] of this.blockMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.blockMeshMap.delete(id);
      }
    }
  }

  private createJapaneseBlockMesh(b: BlockTile, theme: WorldTheme): THREE.Object3D {
    const group = new THREE.Group();

    if (b.type === 'ground') {
      const geo = new THREE.BoxGeometry(b.width, b.height, 32);
      const groundTex = getJapaneseSakuraGroundTexture(theme);
      const mat = new THREE.MeshStandardMaterial({
        map: groundTex,
        roughness: 0.4,
      });
      const m = new THREE.Mesh(geo, mat);
      m.receiveShadow = true;
      group.add(m);
    } else if (b.type === 'destructible_crate') {
      const geo = new THREE.BoxGeometry(b.width, b.height, 28);
      const crateTex = getDestructibleCrateTexture();
      const mat = new THREE.MeshStandardMaterial({
        map: crateTex,
        roughness: 0.5,
      });
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    } else if (b.type === 'brick') {
      const geo = new THREE.BoxGeometry(b.width, b.height, 28);
      const woodTex = getJapaneseWoodBlockTexture();
      const mat = new THREE.MeshStandardMaterial({
        map: woodTex,
        roughness: 0.5,
      });
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    } else if (b.type.startsWith('question')) {
      const geo = new THREE.BoxGeometry(b.width, b.height, 30);
      const blockTex = b.isUsed ? getEmptyGreyBlockTexture() : getOmikujiLuckyBlockTexture();
      const mat = new THREE.MeshStandardMaterial({
        map: blockTex,
        emissive: b.isUsed ? 0x000000 : 0xd97706,
        emissiveIntensity: b.isUsed ? 0 : 0.25,
        roughness: 0.2,
      });
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      group.add(m);
    } else if (b.type === 'pipe') {
      const geo = new THREE.BoxGeometry(b.width, b.height, 28);
      const vendingTex = getJapaneseVendingMachineTexture();
      const mat = new THREE.MeshStandardMaterial({
        map: vendingTex,
        roughness: 0.3,
      });
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    } else if (b.type === 'moving_platform') {
      const geo = new THREE.BoxGeometry(b.width, b.height, 26);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0x991b1b,
        emissiveIntensity: 0.3,
        roughness: 0.3,
      });
      const m = new THREE.Mesh(geo, mat);
      group.add(m);
    } else if (b.type === 'spring') {
      const geo = new THREE.CylinderGeometry(10, 12, b.height, 12);
      const mat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6 });
      const m = new THREE.Mesh(geo, mat);
      group.add(m);
    } else if (b.type === 'flagpole') {
      const poleGeo = new THREE.CylinderGeometry(3.5, 3.5, b.height, 16);
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.3,
      });
      const leftPillar = new THREE.Mesh(poleGeo, poleMat);
      leftPillar.position.x = -14;
      const rightPillar = new THREE.Mesh(poleGeo, poleMat);
      rightPillar.position.x = 14;

      const beamGeo = new THREE.BoxGeometry(48, 10, 8);
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = b.height / 2;

      const subBeamGeo = new THREE.BoxGeometry(40, 6, 6);
      const subBeam = new THREE.Mesh(subBeamGeo, poleMat);
      subBeam.position.y = b.height / 2 - 14;

      const ropeGeo = new THREE.TorusGeometry(12, 2.5, 8, 16);
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a });
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      rope.position.y = b.height / 2 - 20;

      const bellGeo = new THREE.SphereGeometry(6, 12, 12);
      const bellMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9 });
      const bell = new THREE.Mesh(bellGeo, bellMat);
      bell.position.y = b.height / 2 - 32;

      group.add(leftPillar, rightPillar, beam, subBeam, rope, bell);
    } else if (b.type === 'castle') {
      const baseGeo = new THREE.BoxGeometry(b.width, b.height, 50);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
      const shrineBase = new THREE.Mesh(baseGeo, baseMat);
      group.add(shrineBase);

      const roofGeo = new THREE.ConeGeometry(b.width * 0.75, 42, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = b.height / 2 + 20;
      roof.rotation.y = Math.PI * 0.25;
      group.add(roof);

      const doorGeo = new THREE.BoxGeometry(26, 42, 10);
      const doorMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, -b.height / 2 + 21, 26);
      group.add(door);
    }

    return group;
  }

  // Synchronize Enemies - Rich 3D Textured Shapes & Floating Health Bars
  public syncEnemies(enemies: EnemyEntity[]) {
    const activeIds = new Set<string>();

    enemies.forEach(e => {
      if (e.isDead) return;

      activeIds.add(e.id);
      let mesh = this.enemyMeshMap.get(e.id);

      if (!mesh) {
        mesh = this.createEnemy3DMesh(e);
        this.enemyMeshMap.set(e.id, mesh);
        this.scene.add(mesh);
      }

      const worldX = e.x + e.width / 2;
      const worldY = 380 - (e.y + e.height / 2);
      mesh.position.set(worldX, worldY, 0);
      mesh.rotation.y = e.facing === 'right' ? Math.PI * 0.5 : -Math.PI * 0.5;

      // Bobbing / Flying Animation
      if (e.type === 'ufo' || e.type === 'whale') {
        mesh.position.y += Math.sin(this.animTimer * 4 + e.x) * 4;
      } else {
        mesh.position.y += Math.abs(Math.sin(this.animTimer * 8)) * 2.5;
      }

      // Update Health Bar Billboard
      const hpBar = mesh.getObjectByName('hp_bar') as THREE.Mesh;
      if (hpBar) {
        const hpRatio = Math.max(0, e.health / e.maxHealth);
        hpBar.scale.x = hpRatio;
        (hpBar.material as THREE.MeshBasicMaterial).color.setHex(
          hpRatio > 0.6 ? 0x22c55e : hpRatio > 0.3 ? 0xeab308 : 0xef4444
        );
      }
    });

    for (const [id, mesh] of this.enemyMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.enemyMeshMap.delete(id);
      }
    }
  }

  // Build Rich 3D Enemy Models with Health Bars
  private createEnemy3DMesh(e: EnemyEntity): THREE.Object3D {
    const group = new THREE.Group();
    const tex = getEnemyTexture(e.type);

    // 1. Dragon Model
    if (e.type === 'dragon') {
      const bodyGeo = new THREE.ConeGeometry(e.width * 0.45, e.height * 0.9, 10);
      const bodyMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.3,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.3,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI * 0.5;

      // Horns
      const hornGeo = new THREE.ConeGeometry(3, 12, 6);
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
      const h1 = new THREE.Mesh(hornGeo, hornMat);
      h1.position.set(-6, 12, 6);
      h1.rotation.z = -0.4;
      const h2 = new THREE.Mesh(hornGeo, hornMat);
      h2.position.set(6, 12, 6);
      h2.rotation.z = 0.4;

      // Dragon Wings
      const wingGeo = new THREE.PlaneGeometry(18, 14);
      const wingMat = new THREE.MeshBasicMaterial({ color: 0x991b1b, side: THREE.DoubleSide });
      const w1 = new THREE.Mesh(wingGeo, wingMat);
      w1.position.set(-14, 6, 0);
      w1.rotation.y = 0.6;
      const w2 = new THREE.Mesh(wingGeo, wingMat);
      w2.position.set(14, 6, 0);
      w2.rotation.y = -0.6;

      group.add(body, h1, h2, w1, w2);
    }
    // 2. Zombie Model
    else if (e.type === 'zombie') {
      const bodyGeo = new THREE.BoxGeometry(e.width * 0.7, e.height * 0.8, 10);
      const bodyMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);

      const armGeo = new THREE.BoxGeometry(4, 4, 16);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x166534 });
      const arm1 = new THREE.Mesh(armGeo, armMat);
      arm1.position.set(-6, 4, 8);
      const arm2 = new THREE.Mesh(armGeo, armMat);
      arm2.position.set(6, 4, 8);

      group.add(body, arm1, arm2);
    }
    // 3. Spider Model (Multi-Legged Arachnid)
    else if (e.type === 'spider') {
      const bodyGeo = new THREE.SphereGeometry(e.width * 0.4, 12, 12);
      const bodyMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);

      // 6 Articulated Legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
      for (let i = 0; i < 6; i++) {
        const legGeo = new THREE.CylinderGeometry(1.2, 1.2, 14, 6);
        const leg = new THREE.Mesh(legGeo, legMat);
        const side = i % 2 === 0 ? 1 : -1;
        const row = Math.floor(i / 2);
        leg.position.set(side * 10, -2, (row - 1) * 7);
        leg.rotation.z = side * 0.8;
        group.add(leg);
      }
      group.add(body);
    }
    // 4. Lizard / Alligator Model
    else if (e.type === 'lizard' || e.type === 'alligator') {
      const bodyGeo = new THREE.BoxGeometry(e.width * 0.6, e.height * 0.4, e.width * 1.2);
      const bodyMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);

      // Long Snout
      const snoutGeo = new THREE.ConeGeometry(6, 16, 6);
      const snout = new THREE.Mesh(snoutGeo, bodyMat);
      snout.position.set(0, 0, e.width * 0.8);
      snout.rotation.x = Math.PI * 0.5;

      // Spiny dorsal ridge
      const spineGeo = new THREE.ConeGeometry(2, 6, 4);
      const spineMat = new THREE.MeshStandardMaterial({ color: 0x065f46 });
      for (let s = -2; s <= 2; s++) {
        const sp = new THREE.Mesh(spineGeo, spineMat);
        sp.position.set(0, e.height * 0.25, s * 6);
        group.add(sp);
      }

      group.add(body, snout);
    }
    // 5. Alien Model (Bulbous Cranium & Slanted Eyes)
    else if (e.type === 'alien') {
      const headGeo = new THREE.SphereGeometry(e.width * 0.45, 16, 16);
      headGeo.scale(1, 1.3, 1.1);
      const headMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0x065f46, emissiveIntensity: 0.3 });
      const head = new THREE.Mesh(headGeo, headMat);

      const torsoGeo = new THREE.CylinderGeometry(3, 4, 14, 8);
      const torsoMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = -10;

      group.add(head, torso);
    }
    // 6. UFO Model (Flying Saucer Disk with Glass Dome)
    else if (e.type === 'ufo') {
      const diskGeo = new THREE.CylinderGeometry(e.width * 0.6, e.width * 0.7, 4, 16);
      const diskMat = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.85, roughness: 0.2 });
      const disk = new THREE.Mesh(diskGeo, diskMat);

      const domeGeo = new THREE.SphereGeometry(e.width * 0.3, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.y = 2;

      // Pulsating thruster ring below
      const ringGeo = new THREE.TorusGeometry(e.width * 0.4, 1.5, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = -2;
      ring.rotation.x = Math.PI * 0.5;

      group.add(disk, dome, ring);
    }
    // 7. Octopus Model (Cephalopod Mantle with Tentacles)
    else if (e.type === 'octopus') {
      const mantleGeo = new THREE.SphereGeometry(e.width * 0.45, 14, 14);
      const mantleMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 });
      const mantle = new THREE.Mesh(mantleGeo, mantleMat);

      // Curled Tentacles
      for (let t = 0; t < 6; t++) {
        const tentacleGeo = new THREE.TorusGeometry(6, 2, 8, 12, Math.PI * 0.8);
        const tentacle = new THREE.Mesh(tentacleGeo, mantleMat);
        const angle = (t * Math.PI * 2) / 6;
        tentacle.position.set(Math.cos(angle) * 8, -6, Math.sin(angle) * 8);
        tentacle.rotation.z = Math.PI * 0.5;
        group.add(tentacle);
      }
      group.add(mantle);
    }
    // 8. Whale Model (Streamlined Astral Sky Whale)
    else if (e.type === 'whale') {
      const bodyGeo = new THREE.ConeGeometry(e.width * 0.45, e.height * 1.4, 12);
      const bodyMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = -Math.PI * 0.5;

      // Side flippers
      const finGeo = new THREE.PlaneGeometry(14, 8);
      const finMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide });
      const f1 = new THREE.Mesh(finGeo, finMat);
      f1.position.set(-10, 0, 4);
      f1.rotation.y = 0.5;
      const f2 = new THREE.Mesh(finGeo, finMat);
      f2.position.set(10, 0, 4);
      f2.rotation.y = -0.5;

      // Tail flukes
      const tailGeo = new THREE.PlaneGeometry(16, 10);
      const tail = new THREE.Mesh(tailGeo, finMat);
      tail.position.set(0, 0, -e.height * 0.7);

      group.add(body, f1, f2, tail);
    }
    // 9. Demon / Devil Model
    else if (e.type === 'demon' || e.type === 'devil') {
      const bodyGeo = new THREE.DodecahedronGeometry(e.width * 0.45, 1);
      const bodyMat = new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0xef4444,
        emissiveIntensity: 0.4,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);

      // Horns
      const hornGeo = new THREE.ConeGeometry(4, 14, 6);
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8 });
      const h1 = new THREE.Mesh(hornGeo, hornMat);
      h1.position.set(-7, e.height * 0.4, 0);
      h1.rotation.z = -0.3;
      const h2 = new THREE.Mesh(hornGeo, hornMat);
      h2.position.set(7, e.height * 0.4, 0);
      h2.rotation.z = 0.3;

      // Bat wings
      const wingGeo = new THREE.PlaneGeometry(16, 12);
      const wingMat = new THREE.MeshBasicMaterial({ color: 0x450a0a, side: THREE.DoubleSide });
      const w1 = new THREE.Mesh(wingGeo, wingMat);
      w1.position.set(-12, 4, -4);
      w1.rotation.y = 0.5;
      const w2 = new THREE.Mesh(wingGeo, wingMat);
      w2.position.set(12, 4, -4);
      w2.rotation.y = -0.5;

      group.add(body, h1, h2, w1, w2);
    }
    // 10. Tensura Slime Monster
    else if (e.type === 'slime_monster') {
      const slimeGeo = new THREE.SphereGeometry(e.width * 0.45, 14, 14);
      const slimeMat = new THREE.MeshStandardMaterial({
        map: getRimuruSlimeTexture(),
        emissive: 0x16a34a,
        emissiveIntensity: 0.35,
      });
      const slime = new THREE.Mesh(slimeGeo, slimeMat);
      group.add(slime);
    }
    // Default / Boss
    else {
      const oniGeo = new THREE.DodecahedronGeometry(e.width * 0.5, 1);
      const oniMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        emissive: 0xef4444,
        emissiveIntensity: 0.5,
      });
      const oni = new THREE.Mesh(oniGeo, oniMat);

      const hornGeo = new THREE.ConeGeometry(5, 16, 6);
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8 });
      const h1 = new THREE.Mesh(hornGeo, hornMat);
      h1.position.set(-9, e.height * 0.45, 0);
      h1.rotation.z = -0.3;
      const h2 = new THREE.Mesh(hornGeo, hornMat);
      h2.position.set(9, e.height * 0.45, 0);
      h2.rotation.z = 0.3;

      group.add(oni, h1, h2);
    }

    // 11. 3D FLOATING HEALTH BAR & BUFF BADGE OVER ENEMY
    const hpGroup = new THREE.Group();
    hpGroup.position.set(0, e.height * 0.6 + 6, 0);

    // HP Bar Background
    const bgGeo = new THREE.PlaneGeometry(24, 3.5);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
    const hpBg = new THREE.Mesh(bgGeo, bgMat);

    // HP Bar Fill
    const fillGeo = new THREE.PlaneGeometry(22, 2.5);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    const hpFill = new THREE.Mesh(fillGeo, fillMat);
    hpFill.name = 'hp_bar';
    hpFill.position.z = 0.2;

    hpGroup.add(hpBg, hpFill);

    // Buff Aura Ring
    if (e.buff && e.buff !== 'none') {
      const buffRingGeo = new THREE.RingGeometry(e.width * 0.48, e.width * 0.54, 16);
      const buffColor = e.buff === 'shield' ? 0x38bdf8 : e.buff === 'frenzy_speed' ? 0xfacc15 : 0xef4444;
      const buffRingMat = new THREE.MeshBasicMaterial({ color: buffColor, side: THREE.DoubleSide });
      const buffRing = new THREE.Mesh(buffRingGeo, buffRingMat);
      buffRing.rotation.x = Math.PI * 0.5;
      group.add(buffRing);
    }

    group.add(hpGroup);
    return group;
  }

  // Cached Hit Spark Texture Generator & Shared Geometry for Zero-Garbage Performance
  private hitSparkTextureCache: Map<string, THREE.Texture> = new Map();
  private sharedSparkGeo = new THREE.PlaneGeometry(36, 36);

  private getCachedHitSparkTexture(type: string, text?: string): THREE.Texture {
    const key = `${type}_${text || ''}`;
    let cached = this.hitSparkTextureCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const w = 256;
    const h = 256;
    const cx = w / 2;
    const cy = h / 2;

    const points = type === 'ko' ? 12 : 8;
    const outerR = 100;
    const innerR = 35;

    ctx.fillStyle = type === 'player_hurt' ? '#ef4444' : type === 'sword_slash' ? '#38bdf8' : type === 'slime_splash' ? '#06b6d4' : '#facc15';
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = type === 'sword_slash' ? '#ffffff' : '#38bdf8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let b = 0; b < 6; b++) {
      const a = (b * Math.PI) / 3;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60);
      ctx.lineTo(cx + Math.cos(a) * 115, cy + Math.sin(a) * 115);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

    if (text) {
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeText(text, cx, cy);
      ctx.fillText(text, cx, cy);
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.hitSparkTextureCache.set(key, tex);
    return tex;
  }

  // Synchronize Hit Sparks & Visual Combat Decals
  public syncHitSparks(hitSparks: HitSparkEntity[]) {
    const activeIds = new Set<string>();

    hitSparks.forEach(spark => {
      activeIds.add(spark.id);
      let mesh = this.hitSparkMeshMap.get(spark.id);

      if (!mesh) {
        mesh = this.createTekkenHitSparkMesh(spark);
        this.hitSparkMeshMap.set(spark.id, mesh);
        this.scene.add(mesh);
      }

      const progress = 1 - spark.life / spark.maxLife;
      const worldX = spark.x;
      const worldY = 380 - spark.y + progress * 24;

      mesh.position.set(worldX, worldY, 15);
      const scaleMultiplier = spark.scale * (1 + progress * 0.8);
      mesh.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
      mesh.rotation.z = spark.rotation + progress * 2.5;
    });

    for (const [id, mesh] of this.hitSparkMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.hitSparkMeshMap.delete(id);
      }
    }
  }

  private createTekkenHitSparkMesh(spark: HitSparkEntity): THREE.Object3D {
    const group = new THREE.Group();
    const tex = this.getCachedHitSparkTexture(spark.type, spark.text);
    const planeMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const sparkMesh = new THREE.Mesh(this.sharedSparkGeo, planeMat);
    group.add(sparkMesh);
    return group;
  }

  public syncItems(items: ItemEntity[]) {
    const activeIds = new Set<string>();

    items.forEach(it => {
      if (it.collected) return;
      activeIds.add(it.id);
      let mesh = this.itemMeshMap.get(it.id);

      if (!mesh) {
        mesh = this.createJapaneseItemMesh(it);
        this.itemMeshMap.set(it.id, mesh);
        this.scene.add(mesh);
      }

      const worldX = it.x + it.width / 2;
      const worldY = 380 - (it.y + it.height / 2);
      mesh.position.set(worldX, worldY, 0);
      mesh.rotation.y += 0.05;
    });

    for (const [id, mesh] of this.itemMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.itemMeshMap.delete(id);
      }
    }
  }

  private createJapaneseItemMesh(it: ItemEntity): THREE.Object3D {
    const group = new THREE.Group();

    if (it.type === 'coin') {
      const geo = new THREE.CylinderGeometry(8, 8, 2.5, 16);
      const kobanTex = getJapaneseKobanCoinTexture();
      const mat = new THREE.MeshStandardMaterial({
        map: kobanTex,
        metalness: 0.85,
        roughness: 0.2,
      });
      const coin = new THREE.Mesh(geo, mat);
      coin.rotation.x = Math.PI * 0.5;
      group.add(coin);
    } else if (it.type === 'power_katana') {
      const bladeGeo = new THREE.BoxGeometry(1, 14, 0.5);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.2,
      });
      const katana = new THREE.Mesh(bladeGeo, mat);
      group.add(katana);
    } else if (it.type === 'power_slime') {
      const slimeGeo = new THREE.SphereGeometry(8, 16, 16);
      const slimeMat = new THREE.MeshStandardMaterial({
        map: getRimuruSlimeTexture(),
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
      });
      const slime = new THREE.Mesh(slimeGeo, slimeMat);
      group.add(slime);
    } else if (it.type === 'star_coin') {
      const geo = new THREE.CylinderGeometry(14, 14, 4, 16);
      const kobanTex = getJapaneseKobanCoinTexture();
      const mat = new THREE.MeshStandardMaterial({
        map: kobanTex,
        emissive: 0xfef08a,
        emissiveIntensity: 0.6,
        metalness: 0.9,
      });
      const starCoin = new THREE.Mesh(geo, mat);
      starCoin.rotation.x = Math.PI * 0.5;
      group.add(starCoin);
    } else if (it.type === 'mushroom' || it.type === 'power_bento') {
      const capGeo = new THREE.SphereGeometry(9, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
      const cap = new THREE.Mesh(capGeo, capMat);

      const stemGeo = new THREE.CylinderGeometry(5.5, 5.5, 7, 12);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = -3.5;

      group.add(cap, stem);
    } else if (it.type === 'star') {
      const geo = new THREE.DodecahedronGeometry(10, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xfde047,
        emissiveIntensity: 0.9,
      });
      const star = new THREE.Mesh(geo, mat);
      group.add(star);
    }

    return group;
  }

  public syncProjectiles(projs: ProjectileEntity[]) {
    const activeIds = new Set<string>();

    projs.forEach((p, idx) => {
      activeIds.add(p.id);
      let mesh = this.projectileMeshMap.get(p.id);

      if (!mesh) {
        const geo = new THREE.SphereGeometry(p.radius, 12, 12);
        const mat = new THREE.MeshStandardMaterial({
          color: p.type === 'slime_blade' ? 0x06b6d4 : p.type === 'spirit_wave' ? 0x38bdf8 : 0xf97316,
          emissive: p.type === 'slime_blade' ? 0x22d3ee : p.type === 'spirit_wave' ? 0x06b6d4 : 0xef4444,
          emissiveIntensity: 1.4,
        });
        mesh = new THREE.Mesh(geo, mat);
        this.projectileMeshMap.set(p.id, mesh);
        this.scene.add(mesh);
      }

      mesh.position.set(p.x, 380 - p.y, 0);

      if (idx < this.raytraceLightPool.length && this.graphicSettings.rayTracingEnabled) {
        const pl = this.raytraceLightPool[idx];
        pl.position.copy(mesh.position);
        pl.color.setHex(p.type === 'slime_blade' ? 0x06b6d4 : 0xff5500);
        pl.intensity = 2.0;
      }
    });

    for (const [id, mesh] of this.projectileMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.projectileMeshMap.delete(id);
      }
    }
  }

  // Update Player 3D Animation, Attack Slashes, Mii Hands, Bouncing Slime Pet & Camera
  public updatePlayer(player: PlayerState, costume: Costume, accessory: AccessoryId, screenShake: number = 0) {
    this.animTimer += 0.03;

    const worldX = player.x + player.width / 2;
    const worldY = 380 - (player.y + player.height);

    this.playerGroup.position.set(worldX, worldY, 0);
    this.playerGroup.rotation.y = player.facing === 'right' ? Math.PI * 0.5 : -Math.PI * 0.5;

    // Costume & Texture Sync
    if (costume.id === 'tokyo_otaku' || costume.theme === 'otaku') {
      (this.playerMeshComponents.torso.material as THREE.MeshStandardMaterial).map = getOtakuHoodieTexture();
    } else {
      (this.playerMeshComponents.torso.material as THREE.MeshStandardMaterial).map = getTempestDemonLordCoatTexture();
    }

    (this.playerMeshComponents.leftArm.material as THREE.MeshStandardMaterial).color.set(costume.shirtColor || '#09090b');
    (this.playerMeshComponents.rightArm.material as THREE.MeshStandardMaterial).color.set(costume.shirtColor || '#09090b');
    (this.playerMeshComponents.leftLeg.material as THREE.MeshStandardMaterial).color.set(costume.pantsColor || '#18181b');
    (this.playerMeshComponents.rightLeg.material as THREE.MeshStandardMaterial).color.set(costume.pantsColor || '#18181b');

    // Rimuru Slime Pet bounce animation
    const slimeBounce = Math.sin(this.animTimer * 12) * 1.5;
    this.playerMeshComponents.slimePetGroup.position.y = 18 + slimeBounce;
    this.playerMeshComponents.slimePetGroup.visible = accessory === 'slime_pet' || player.equippedPowerUp === 'slime_orb';

    // Katana & Weapon Attacks
    if (player.isAttacking) {
      if (player.attackType === 'slash') {
        this.playerMeshComponents.katanaGroup.rotation.z = Math.sin(player.attackTimer * 20) * 1.6;
        this.playerMeshComponents.rightArm.rotation.x = 1.4;
        (this.playerMeshComponents.slashArcMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
        this.playerMeshComponents.slashArcGroup.scale.set(1.4, 1.4, 1.4);
      } else if (player.attackType === 'punch') {
        this.playerMeshComponents.rightArm.rotation.x = 1.8;
        this.playerMeshComponents.rightArm.position.z = 4;
        (this.playerMeshComponents.punchWaveGroup.children[0] as any).material.opacity = 0.9;
      }
    } else {
      this.playerMeshComponents.katanaGroup.rotation.z = -0.4;
      this.playerMeshComponents.rightArm.position.z = 0;
      (this.playerMeshComponents.slashArcMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      (this.playerMeshComponents.punchWaveGroup.children[0] as any).material.opacity = 0;
    }

    // Accessories
    this.playerMeshComponents.kitsuneMesh.visible = accessory === 'kitsune';
    this.playerMeshComponents.crossMesh.visible = accessory === 'cross';
    this.playerMeshComponents.visorMesh.visible = accessory === 'visor';
    this.playerMeshComponents.wingsGroup.visible = accessory === 'dragon_wings';

    // Invulnerability Flashing
    if (player.invincibleTimer > 0) {
      this.playerGroup.visible = Math.floor(this.animTimer * 40) % 2 === 0;
    } else {
      this.playerGroup.visible = true;
    }

    // Running / Jumping Anim Rig
    const isMoving = Math.abs(player.vx) > 0.4;
    if (!player.isGrounded) {
      this.playerMeshComponents.leftLeg.rotation.x = -0.6;
      this.playerMeshComponents.rightLeg.rotation.x = 0.4;
      this.playerMeshComponents.leftArm.rotation.x = 1.2;
      this.playerMeshComponents.coatTails.rotation.x = 0.6;
    } else if (isMoving) {
      const runCycle = Math.sin(this.animTimer * 18 * (Math.abs(player.vx) / 3));
      this.playerMeshComponents.leftLeg.rotation.x = runCycle * 0.75;
      this.playerMeshComponents.rightLeg.rotation.x = -runCycle * 0.75;
      this.playerMeshComponents.leftArm.rotation.x = -runCycle * 0.75;
      if (!player.isAttacking) {
        this.playerMeshComponents.rightArm.rotation.x = runCycle * 0.75;
      }
      this.playerMeshComponents.headGroup.position.y = 26 + Math.abs(runCycle) * 1.2;
      this.playerMeshComponents.coatTails.rotation.x = 0.3 + Math.abs(runCycle) * 0.3;
    } else {
      this.playerMeshComponents.leftLeg.rotation.x = 0;
      this.playerMeshComponents.rightLeg.rotation.x = 0;
      this.playerMeshComponents.leftArm.rotation.x = 0;
      if (!player.isAttacking) {
        this.playerMeshComponents.rightArm.rotation.x = 0;
      }
      this.playerMeshComponents.headGroup.position.y = 26 + Math.sin(this.animTimer * 4) * 0.4;
      this.playerMeshComponents.coatTails.rotation.x = 0.2;
    }

    if (player.starTimer > 0) {
      (this.playerMeshComponents.auraMesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
      const hue = (this.animTimer * 2) % 1;
      (this.playerMeshComponents.auraMesh.material as THREE.MeshBasicMaterial).color.setHSL(hue, 1, 0.5);
    } else {
      (this.playerMeshComponents.auraMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    this.playerPointLight.position.set(worldX, worldY + 16, 20);

    const shakeOffsetX = screenShake > 0 ? (Math.random() - 0.5) * 12 : 0;
    const shakeOffsetY = screenShake > 0 ? (Math.random() - 0.5) * 12 : 0;

    this.cameraTargetX += (worldX - this.cameraTargetX) * 0.12;
    this.camera.position.x = this.cameraTargetX + shakeOffsetX;
    this.camera.position.y = 380 - 320 + shakeOffsetY;
    this.camera.lookAt(this.camera.position.x, this.camera.position.y, 0);

    // Keep sky gradient backdrop centered with camera
    this.skyBackdropMesh.position.x = this.camera.position.x;
    this.skyBackdropMesh.position.y = this.camera.position.y;

    if (this.sakuraParticlesGroup) {
      const positions = this.sakuraParticlesGroup.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= 0.8;
        positions[i * 3] += Math.sin(this.animTimer + i) * 0.4;

        if (positions[i * 3 + 1] < -200) {
          positions[i * 3 + 1] = 400;
          positions[i * 3] = this.camera.position.x + (Math.random() - 0.5) * 800;
        }
      }
      this.sakuraParticlesGroup.geometry.attributes.position.needsUpdate = true;
    }
  }

  public render() {
    if (this.isDisposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number) {
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(width, height);
  }

  public updateGraphicSettings(settings: GraphicSettings) {
    this.graphicSettings = settings;
    this.renderer.shadowMap.enabled = settings.shadowQuality !== 'off';
    this.renderer.toneMappingExposure = settings.pathTracingSim
      ? 1.35
      : settings.rayTracingEnabled
      ? 1.25
      : 1.05;

    if (this.hemiLight) {
      this.hemiLight.intensity = settings.pathTracingSim ? 0.9 : settings.rayTracingEnabled ? 0.6 : 0.3;
    }

    if (this.playerPointLight) {
      this.playerPointLight.intensity = settings.rayTracingEnabled ? 1.4 : 0.8;
    }

    if (this.sunLight) {
      this.sunLight.castShadow = settings.shadowQuality !== 'off';
      if (this.sunLight.shadow && this.sunLight.shadow.map) {
        this.sunLight.shadow.mapSize.width = settings.shadowQuality === 'ultra' ? 2048 : 1024;
        this.sunLight.shadow.mapSize.height = settings.shadowQuality === 'ultra' ? 2048 : 1024;
      }
    }
  }

  public dispose() {
    this.isDisposed = true;
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
