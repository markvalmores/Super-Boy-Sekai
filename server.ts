import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory leaderboard store with initial high-score champions
interface LeaderboardEntry {
  id: string;
  playerName: string;
  characterTitle: string;
  level: number;
  score: number;
  timeSeconds: number;
  coins: number;
  starCoins: number;
  equippedCostume: string;
  equippedSkill: string;
  deviceTier: string;
  createdAt: string;
}

let leaderboard: LeaderboardEntry[] = [
  {
    id: 'hero-1',
    playerName: 'Hikaru★Speedster',
    characterTitle: 'Celestial Plumber S-Rank',
    level: 1001,
    score: 999990,
    timeSeconds: 312,
    coins: 742,
    starCoins: 3,
    equippedCostume: 'celestial',
    equippedSkill: 'spirit_wave',
    deviceTier: 'Ultra RTX (Ray Tracing)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hero-2',
    playerName: 'Kame-Slayer99',
    characterTitle: 'Neo Shinobi Master',
    level: 750,
    score: 842000,
    timeSeconds: 410,
    coins: 520,
    starCoins: 3,
    equippedCostume: 'ninja',
    equippedSkill: 'lightning_dash',
    deviceTier: 'High Performance',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'hero-3',
    playerName: 'MarioOtaku_2026',
    characterTitle: 'Classic Plumber Legend',
    level: 420,
    score: 630100,
    timeSeconds: 520,
    coins: 410,
    starCoins: 2,
    equippedCostume: 'classic',
    equippedSkill: 'fireball',
    deviceTier: 'Ray Traced 120FPS',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'hero-4',
    playerName: 'CyberGamer_X',
    characterTitle: 'Saiyan Astral Runner',
    level: 250,
    score: 415000,
    timeSeconds: 480,
    coins: 305,
    starCoins: 3,
    equippedCostume: 'saiyan',
    equippedSkill: 'spirit_wave',
    deviceTier: 'Balanced 60FPS',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 'hero-5',
    playerName: 'RetroBoy_GB',
    characterTitle: 'Game Boy Hero 1989',
    level: 120,
    score: 210000,
    timeSeconds: 610,
    coins: 180,
    starCoins: 1,
    equippedCostume: 'retro',
    equippedSkill: 'double_jump',
    deviceTier: 'Game Boy CRT Mode',
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  }
];

// Initialize Gemini AI Client if API Key is provided
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.warn('Gemini client init error:', err);
  }
}

// API Routes
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 50);
  res.json({ success: true, entries: sorted });
});

app.post('/api/leaderboard/submit', (req: Request, res: Response) => {
  try {
    const { playerName, characterTitle, level, score, timeSeconds, coins, starCoins, equippedCostume, equippedSkill, deviceTier } = req.body;
    
    if (!playerName || typeof score !== 'number') {
      return res.status(400).json({ success: false, message: 'Invalid score submission payload' });
    }

    const newEntry: LeaderboardEntry = {
      id: 'entry-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      playerName: (playerName || 'Anime-Hero').slice(0, 24),
      characterTitle: characterTitle || 'Dimensional Adventurer',
      level: Number(level) || 1,
      score: Number(score) || 0,
      timeSeconds: Number(timeSeconds) || 0,
      coins: Number(coins) || 0,
      starCoins: Number(starCoins) || 0,
      equippedCostume: equippedCostume || 'classic',
      equippedSkill: equippedSkill || 'fireball',
      deviceTier: deviceTier || 'Auto GPU',
      createdAt: new Date().toISOString(),
    };

    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 100);

    res.json({ success: true, entry: newEntry });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Level Generator endpoint
app.post('/api/generate-level', async (req: Request, res: Response) => {
  const { levelNumber, worldId, difficulty, theme } = req.body;
  const levelNum = Number(levelNumber) || 1;

  // If Gemini AI is active, enhance level narrative & special challenges
  if (aiClient) {
    try {
      const prompt = `You are the master game designer for 'Super Boy Sekai: 1001 Dimensional Odyssey' (「スーパーボーイ・セカイ」).
Generate unique AI level metadata for Level #${levelNum} in World '${worldId || 'Grassland'}', theme '${theme || 'Anime Forest'}', difficulty rating ${difficulty || 'Moderate'}.
Return a strict JSON object with:
{
  "title": "Anime-style level title (e.g., 'Solar Citadel: Blazing Rush 1001')",
  "lore": "A dramatic 1-2 sentence anime shonen level back-story featuring Super Boy Ren",
  "aiModifier": "Special AI gameplay modifier (e.g., 'Low Gravity Super Jumps', 'Speed Warp Rush', 'Meteor Storm Rain', 'Dragon Katana Slash Surge')",
  "bossName": "Name of the level's Guardian or Boss (if level % 5 === 0 or special)",
  "tip": "A strategic anime hero tip for conquering this stage"
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, aiGenerated: true, data: parsed });
      }
    } catch (aiErr) {
      console.warn('AI Level Gen fallback:', aiErr);
    }
  }

  // Fallback intelligent procedural title and lore generator for all 1001 levels
  const worldThemes = [
    { name: 'Emerald Shroom Valley', bosses: ['Goomba Overlord Kuri', 'Elder Spore Titan'] },
    { name: 'Neo-Tokyo Sunken Caverns', bosses: ['Mecha-Koopa Zero', 'Abyssal Piranha Queen'] },
    { name: 'Cyberpunk Cloud Metropolis', bosses: ['Sky Dragon Shenron-B', 'Thunder Lakitu 3.0'] },
    { name: 'Crimson Magma Volcano', bosses: ['Inferno Bowser Kai', 'Molten Golem'] },
    { name: 'Astral Star Cosmos', bosses: ['Cosmic Star God', 'Singularity Phantom'] },
    { name: 'Mecha Cyber Fortress', bosses: ['Iron Kamek', 'Omega Fortress AI'] },
    { name: 'Crystal Frost Spire', bosses: ['Blizzard King', 'Frost Piranha Empress'] },
    { name: 'Spirit Hollow Galleon', bosses: ['Shinigami King Boo', 'Haunted Dreadnought'] },
    { name: 'Celestial Divine Sanctuary', bosses: ['Seraphim Archon', 'Holy Trial Master'] },
    { name: 'The Omega 1001 Infinite Horizon', bosses: ['Lord of the 1001 Dimensions', 'True Nexus Core'] },
  ];

  const themeIdx = Math.min(Math.floor((levelNum - 1) / 100), worldThemes.length - 1);
  const curWorld = worldThemes[themeIdx];
  const boss = curWorld.bosses[levelNum % curWorld.bosses.length];

  const modifiers = [
    'Super Speed Anime Boost (1.3x Run Speed)',
    'Low-Gravity Astral Moon Jumps',
    'Coin Frenzy Multiplier (x3 Score)',
    'Mega Fireball Burst Enabled',
    'Shadow Ninja Double Jump Mastery',
    'Intense Boss Marathon Challenge'
  ];

  res.json({
    success: true,
    aiGenerated: false,
    data: {
      title: `Act ${levelNum}: ${curWorld.name} - Dimension ${Math.floor(levelNum * 13.7) % 999 + 1}`,
      lore: `Aoto steps into the dimensional distortion of Level ${levelNum}. The dimensional flag shines at the horizon!`,
      aiModifier: modifiers[levelNum % modifiers.length],
      bossName: levelNum % 5 === 0 ? boss : undefined,
      tip: `Master your jump timing, collect all 3 Star Coins, and slide down the top of the Flagpole for maximum score!`
    }
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Super Boy Sekai Engine] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
