import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateTexture(
  key: string,
  drawFn: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  width = 256,
  height = 256
): THREE.CanvasTexture {
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  drawFn(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

// 1. Nintendo Mii Style Face Texture (Iconic Nintendo Mii Eyes, Eyebrows & Smile)
export function getNintendoMiiFaceTexture(expression: 'happy' | 'determined' | 'surprised' = 'happy'): THREE.CanvasTexture {
  return getOrCreateTexture(`mii_face_${expression}`, (ctx, w, h) => {
    // Skin Tone
    ctx.fillStyle = '#ffdfcb';
    ctx.fillRect(0, 0, w, h);

    // Cute Mii Blush
    ctx.fillStyle = 'rgba(255, 130, 150, 0.45)';
    ctx.beginPath();
    ctx.ellipse(w * 0.22, h * 0.62, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.78, h * 0.62, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mii Eyes (Iconic Oval / Stylized Anime Dot Eyes)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(w * 0.32, h * 0.46, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.68, h * 0.46, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w * 0.29, h * 0.41, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.65, h * 0.41, 5, 0, Math.PI * 2);
    ctx.fill();

    // Mii Eyebrows
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.31);
    ctx.quadraticCurveTo(w * 0.32, h * 0.27, w * 0.42, h * 0.32);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.58, h * 0.32);
    ctx.quadraticCurveTo(w * 0.68, h * 0.27, w * 0.78, h * 0.31);
    ctx.stroke();

    // Mii Nose (Cute Minimalist Dot / Triangle)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.55, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Mii Smile
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.68, 14, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.stroke();

    // Smile interior
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.68, 12, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.fill();
  }, 256, 256);
}

// 2. Tensura Rimuru Blue Slime Texture
export function getRimuruSlimeTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('rimuru_slime', (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w * 0.4, h * 0.35, 10, w / 2, h / 2, w * 0.48);
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(0.3, '#38bdf8');
    grad.addColorStop(0.8, '#0284c7');
    grad.addColorStop(1, '#0369a1');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Slime Cute Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(w * 0.35, h * 0.45, 9, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.65, h * 0.45, 9, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w * 0.32, h * 0.40, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.40, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cute Cheeks
    ctx.fillStyle = 'rgba(244, 114, 182, 0.65)';
    ctx.beginPath();
    ctx.ellipse(w * 0.25, h * 0.58, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.75, h * 0.58, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }, 256, 256);
}

// 3. Tensura Rimuru Demon Lord Coat Texture
export function getTempestDemonLordCoatTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('tempest_demon_lord_coat', (ctx, w, h) => {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    // Gold filigree border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    // Tempest Blue Sash
    const sashGrad = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.75);
    sashGrad.addColorStop(0, '#0284c7');
    sashGrad.addColorStop(0.5, '#38bdf8');
    sashGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = sashGrad;
    ctx.fillRect(0, h * 0.55, w, h * 0.16);

    // Fur / Collar White Trim
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(w * 0.2, 0);
    ctx.lineTo(w * 0.5, h * 0.38);
    ctx.lineTo(w * 0.8, 0);
    ctx.closePath();
    ctx.fill();
  }, 256, 256);
}

// 4. Modern Tokyo Otaku Techwear Hoodie Texture
export function getOtakuHoodieTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('otaku_hoodie', (ctx, w, h) => {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOKYO', w / 2, h * 0.35);
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('⚡ MII OTAKU ⚡', w / 2, h * 0.48);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(w * 0.15, h * 0.15, 12, h * 0.7);
    ctx.fillRect(w * 0.80, h * 0.15, 12, h * 0.7);
  }, 256, 256);
}

// 5. Empty Spent Grey Metallic Block Texture (Turns Grey when used)
export function getEmptyGreyBlockTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('empty_grey_block', (ctx, w, h) => {
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, w, h);

    // Inset metallic bevel
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);

    ctx.fillStyle = '#64748b';
    ctx.fillRect(10, 10, w - 20, h - 20);

    // Rivets in 4 corners
    const rivets = [
      { x: 22, y: 22 },
      { x: w - 22, y: 22 },
      { x: 22, y: h - 22 },
      { x: w - 22, y: h - 22 },
    ];
    ctx.fillStyle = '#1e293b';
    rivets.forEach(r => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dim spent center icon
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('· 済 ·', w / 2, h / 2);
  }, 256, 256);
}

// 6. Lucky Omikuji Box Texture
export function getOmikujiLuckyBlockTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('omikuji_block', (ctx, w, h) => {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, 0, 24, 24);
    ctx.fillRect(w - 24, 0, 24, 24);
    ctx.fillRect(0, h - 24, 24, 24);
    ctx.fillRect(w - 24, h - 24, 24, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 90px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('福', w / 2, h / 2 - 4);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('★ 神 社 ★', w / 2, h - 30);
  }, 256, 256);
}

// 7. Destructible Japanese Wooden Crate Texture
export function getDestructibleCrateTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('destructible_crate', (ctx, w, h) => {
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(w - 6, h - 6);
    ctx.moveTo(w - 6, 6);
    ctx.lineTo(6, h - 6);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('壊', w / 2, h / 2);
  }, 256, 256);
}

// 8. Japanese Sakura Ground Texture
export function getJapaneseSakuraGroundTexture(theme: string): THREE.CanvasTexture {
  return getOrCreateTexture(`jp_ground_${theme}`, (ctx, w, h) => {
    ctx.fillStyle = theme === 'cavern' ? '#1e1b4b' : theme === 'volcano' ? '#292524' : '#334155';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    const tileW = w / 4;
    const tileH = h / 4;
    for (let y = 0; y < 4; y++) {
      const offsetX = (y % 2) * (tileW / 2);
      for (let x = -1; x < 5; x++) {
        ctx.strokeRect(x * tileW + offsetX, y * tileH, tileW, tileH);
      }
    }

    const topTrimColor = theme === 'volcano' ? '#991b1b' : theme === 'cavern' ? '#6366f1' : '#15803d';
    ctx.fillStyle = topTrimColor;
    ctx.fillRect(0, 0, w, 18);

    ctx.fillStyle = '#f472b6';
    const petals = [
      { x: 30, y: 35, r: 4 }, { x: 90, y: 70, r: 5 }, { x: 180, y: 40, r: 4 },
      { x: 220, y: 95, r: 6 }, { x: 120, y: 150, r: 4.5 }, { x: 50, y: 200, r: 5 },
      { x: 200, y: 210, r: 5 }
    ];
    petals.forEach(p => {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r * 1.6, p.r, Math.PI * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, 256, 256);
}

// 9. Japanese Wood Block Texture
export function getJapaneseWoodBlockTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('jp_wood_block', (ctx, w, h) => {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillRect(w - 16, 0, 16, 16);
    ctx.fillRect(0, h - 16, 16, 16);
    ctx.fillRect(w - 16, h - 16, 16, 16);
  }, 256, 256);
}

// 10. Japanese Vending Machine Texture
export function getJapaneseVendingMachineTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('vending_machine', (ctx, w, h) => {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(w * 0.1, h * 0.12, w * 0.8, h * 0.45);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.1, h * 0.12, w * 0.8, h * 0.45);

    const canColors = ['#06b6d4', '#16a34a', '#d97706', '#9333ea', '#3b82f6'];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 5; col++) {
        ctx.fillStyle = canColors[(row * 5 + col) % canColors.length];
        ctx.fillRect(w * 0.14 + col * (w * 0.145), h * 0.16 + row * (h * 0.18), w * 0.1, h * 0.11);
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('自動販売機', w / 2, h * 0.08);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(w * 0.2, h * 0.72, w * 0.6, h * 0.18);
  }, 256, 256);
}

// 11. Japanese Koban Coin Texture
export function getJapaneseKobanCoinTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('koban_coin', (ctx, w, h) => {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(w * 0.38, h * 0.38, w * 0.24, h * 0.24);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('福', w / 2, h * 0.28);
    ctx.fillText('金', w / 2, h * 0.86);
  }, 256, 256);
}

// 12. ENEMY TEXTURES: Dragon, Zombie, Spider, Lizard, Alligator, Alien, UFO, Octopus, Whale, Demon
export function getEnemyTexture(type: string): THREE.CanvasTexture {
  return getOrCreateTexture(`enemy_tex_${type}`, (ctx, w, h) => {
    if (type === 'dragon') {
      // Crimson Dragon Scales
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 4;
      for (let y = 0; y < h; y += 32) {
        for (let x = 0; x < w; x += 32) {
          ctx.beginPath();
          ctx.arc(x + 16, y + 16, 14, 0, Math.PI);
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('🔥 竜 🔥', w / 2 - 40, h / 2);
    } else if (type === 'zombie') {
      // Undead Decay Green Skin
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 0, w, h * 0.4);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(w * 0.35, h * 0.4, 8, 0, Math.PI * 2);
      ctx.arc(w * 0.65, h * 0.4, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'spider') {
      // Arachnid Dark Chitin with Red Eyes
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ef4444';
      const eyePositions = [
        { x: w * 0.35, y: h * 0.3 }, { x: w * 0.65, y: h * 0.3 },
        { x: w * 0.42, y: h * 0.42 }, { x: w * 0.58, y: h * 0.42 },
        { x: w * 0.3, y: h * 0.48 }, { x: w * 0.7, y: h * 0.48 },
      ];
      eyePositions.forEach(ep => {
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (type === 'lizard' || type === 'alligator') {
      // Reptilian Camo Scales
      ctx.fillStyle = '#047857';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#065f46';
      for (let y = 0; y < h; y += 24) {
        for (let x = 0; x < w; x += 24) {
          ctx.fillRect(x, y, 12, 12);
        }
      }
    } else if (type === 'alien') {
      // Neon Sci-Fi Alien Face
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(w * 0.3, h * 0.42, 22, 34, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.7, h * 0.42, 22, 34, 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'ufo') {
      // Cyber Metallic UFO Hull with Neon Lights
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      const lightCols = ['#38bdf8', '#a855f7', '#ec4899', '#22c55e', '#eab308'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = lightCols[i];
        ctx.beginPath();
        ctx.arc(35 + i * 46, h / 2, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'octopus') {
      // Cephalopod Purple Suction Texture
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f472b6';
      for (let y = 16; y < h; y += 40) {
        for (let x = 16; x < w; x += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f472b6';
        }
      }
    } else if (type === 'whale') {
      // Celestial Oceanic Sky Whale
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#0284c7');
      oceanGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w * 0.4, h * 0.4, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'demon' || type === 'devil') {
      // Hellfire Demon Skin
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.35);
      ctx.lineTo(w * 0.4, h * 0.48);
      ctx.lineTo(w * 0.25, h * 0.48);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.7, h * 0.35);
      ctx.lineTo(w * 0.75, h * 0.48);
      ctx.lineTo(w * 0.6, h * 0.48);
      ctx.closePath();
      ctx.fill();
    } else {
      // Generic Enemy Texture
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, w, h);
    }
  }, 256, 256);
}

// 13. Dynamic Gradient Sky Texture for Each World Theme
export function getSkyGradientTexture(theme: string): THREE.CanvasTexture {
  return getOrCreateTexture(`sky_gradient_${theme}`, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);

    if (theme === 'grassland') {
      // Kyoto Sakura Dawn (Soft Pink -> Peach -> Amber)
      grad.addColorStop(0, '#fbcfe8');
      grad.addColorStop(0.4, '#fed7aa');
      grad.addColorStop(1, '#fef08a');
    } else if (theme === 'cyber') {
      // Shibuya Cyberpunk Neon (Dark Indigo -> Violet -> Cyan)
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#3b0764');
      grad.addColorStop(1, '#06b6d4');
    } else if (theme === 'volcano') {
      // Magma Volcano Twilight (Crimson -> Dark Orange -> Molten Amber)
      grad.addColorStop(0, '#450a0a');
      grad.addColorStop(0.5, '#7f1d1d');
      grad.addColorStop(1, '#ea580c');
    } else if (theme === 'astral') {
      // Astral Nebula (Deep Space Black -> Purple Nebula -> Star Blue)
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.4, '#2e1065');
      grad.addColorStop(1, '#1e3a8a');
    } else if (theme === 'sky') {
      // High Sky (Azure -> Cerulean -> Soft White)
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.6, '#38bdf8');
      grad.addColorStop(1, '#e0f2fe');
    } else if (theme === 'ice') {
      // Alpine Snow (Deep Teal -> Cyan -> Crisp Ice White)
      grad.addColorStop(0, '#0e7490');
      grad.addColorStop(0.5, '#67e8f9');
      grad.addColorStop(1, '#f0fdfa');
    } else {
      // Default Warm Sunset
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.6, '#4338ca');
      grad.addColorStop(1, '#f43f5e');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, 512, 512);
}
