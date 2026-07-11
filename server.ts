import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Bypass strict TLS verification to support custom IPTV provider URLs with self-signed or expired SSL certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data", "database.json");

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
}

// Interfaces
interface Profile {
  id: string;
  name: string;
  avatar: string;
  pin?: string;
  isKids: boolean;
}

interface User {
  username: string;
  passwordHash: string;
  salt: string;
  role: "admin" | "user";
  profiles: Profile[];
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  url: string;
  format: "M3U" | "M3U8" | "XML" | "Xtream";
  autoUpdate: boolean;
  lastUpdated: string;
  status: "Online" | "Offline";
  channelCount: number;
  movieCount: number;
  seriesCount: number;
  channels: PlaylistItem[];
}

interface PlaylistItem {
  id: string;
  name: string;
  logo: string;
  group: string;
  category: "tv" | "movie" | "series" | "sports" | "kids" | "news" | "music" | "documentary" | "adult";
  url: string;
  epgId?: string;
  duration?: string;
  year?: string;
  description?: string;
  season?: number;
  episode?: number;
}

interface HistoryEntry {
  id: string;
  profileId: string;
  itemId: string;
  name: string;
  category: string;
  logo: string;
  watchedAt: string;
  progress: number; // percentage or seconds
  duration: number; // total seconds
  season?: number;
  episode?: number;
}

interface FavoriteEntry {
  profileId: string;
  itemId: string;
}

interface SystemLog {
  timestamp: string;
  type: "info" | "warning" | "error" | "security";
  message: string;
  user?: string;
}

interface DatabaseSchema {
  users: User[];
  playlists: Playlist[];
  history: HistoryEntry[];
  favorites: FavoriteEntry[];
  logs: SystemLog[];
  settings: {
    language: string;
    theme: "dark" | "light" | "auto";
    defaultQuality: "auto" | "1080p" | "720p" | "480p";
    autoPlay: boolean;
    autoUpdatePlaylists: boolean;
    adultHidden: boolean;
    cacheLimitMB: number;
  };
}

// Default initial premium open-source playground content
const DEFAULT_CHANNELS: PlaylistItem[] = [
  {
    id: "live-nasa",
    name: "NASA TV HD",
    logo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop",
    group: "Documentaries",
    category: "documentary",
    url: "https://ntvlive.nasa.gov/hls/live/ntvlive.m3u8",
    epgId: "NASA.TV",
    description: "Official NASA TV live stream featuring live space missions, astronomy lectures, and stunning Earth views."
  },
  {
    id: "live-france24",
    name: "France 24 English",
    logo: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=100&h=100&fit=crop",
    group: "News",
    category: "news",
    url: "https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8",
    epgId: "F24.EN",
    description: "International news channel broadcasting in English, providing global news coverage from a French perspective."
  },
  {
    id: "live-dw",
    name: "Deutsche Welle (DW) English",
    logo: "https://images.unsplash.com/photo-1495020689067-958852a6565d?w=100&h=100&fit=crop",
    group: "News",
    category: "news",
    url: "https://dwstream4-lh.akamaihd.net/i/dwstream4_live@131329/master.m3u8",
    epgId: "DW.EN",
    description: "Germany's international broadcaster, delivering news, features, and analysis from around the globe."
  },
  {
    id: "live-redbull",
    name: "Red Bull TV",
    logo: "https://images.unsplash.com/photo-1551698618-1ffdfe0700ff?w=100&h=100&fit=crop",
    group: "Sports",
    category: "sports",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/sports/master.m3u8",
    epgId: "REDBULL.TV",
    description: "Live sporting events, high-adrenaline stunts, and inspirational adventure stories from Red Bull athletes."
  },
  {
    id: "movie-bunny",
    name: "Big Buck Bunny",
    logo: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=450&fit=crop",
    group: "Kids & Animation",
    category: "kids",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: "9:56",
    year: "2008",
    description: "A large, friendly rabbit's daily routine is rudely disrupted by three mischievous rodents. He decides to take a comedic and clever revenge."
  },
  {
    id: "movie-sintel",
    name: "Sintel (Sci-Fi)",
    logo: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=300&h=450&fit=crop",
    group: "Sci-Fi Movies",
    category: "movie",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    duration: "14:48",
    year: "2010",
    description: "A lonely young woman searches for her pet dragon, a bond forged in childhood, leading her on a dangerous quest across fantasy landscapes."
  },
  {
    id: "movie-tears",
    name: "Tears of Steel",
    logo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=450&fit=crop",
    group: "Action & Sci-Fi",
    category: "movie",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    duration: "12:14",
    year: "2012",
    description: "Set in a dystopian future Amsterdam, a group of scientists attempts to save the world from rogue giant robots using high-tech weaponry."
  },
  {
    id: "series-steel-1",
    name: "Tears of Steel: Ep 1",
    logo: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&h=200&fit=crop",
    group: "Dystopian Chronicles",
    category: "series",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    season: 1,
    episode: 1,
    duration: "12:14",
    year: "2012",
    description: "The crew gathers at the observatory to start the experimental time-loop sequence to fix the robot apocalypse."
  },
  {
    id: "series-steel-2",
    name: "Tears of Steel: Ep 2 (Behind Scenes)",
    logo: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=200&fit=crop",
    group: "Dystopian Chronicles",
    category: "series",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback.mp4",
    season: 1,
    episode: 2,
    duration: "1:00",
    year: "2012",
    description: "An exclusive look into the rendering and compositing pipeline used to bring the giant mechs of Amsterdam to life."
  }
];

// Load or initialize Database
function getDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(data);
      let changed = false;
      if (!db.users) { db.users = []; changed = true; }
      if (!db.playlists) { db.playlists = []; changed = true; }
      if (!db.history) { db.history = []; changed = true; }
      if (!db.favorites) { db.favorites = []; changed = true; }
      if (!db.logs) { db.logs = []; changed = true; }
      if (!db.settings) {
        db.settings = {
          language: "pt-BR",
          theme: "dark",
          defaultQuality: "auto",
          autoPlay: true,
          autoUpdatePlaylists: true,
          adultHidden: true,
          cacheLimitMB: 512
        };
        changed = true;
      }
      // Ensure default premium playlist is registered
      const hasPremium = db.playlists.some(p => p.url === "http://bit.ly/tvmeutedio");
      if (!hasPremium) {
        db.playlists.push({
          id: "premium-playlist-1",
          name: "Canais, Filmes e Séries Premium",
          description: "Lista IPTV Principal (tvmeutedio)",
          url: "http://bit.ly/tvmeutedio",
          format: "M3U",
          autoUpdate: true,
          lastUpdated: new Date().toISOString(),
          status: "Online",
          channelCount: 0,
          movieCount: 0,
          seriesCount: 0,
          channels: []
        });
        changed = true;
      }
      if (changed) {
        saveDB(db);
      }
      return db;
    }
  } catch (err) {
    console.error("Failed to read database file, restoring defaults.", err);
  }

  // Create default structure
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.createHmac("sha256", salt).update("picapau").digest("hex"); // default password: "picapau"

  const db: DatabaseSchema = {
    users: [
      {
        username: "picapau",
        passwordHash,
        salt,
        role: "admin",
        profiles: [
          { id: "p1", name: "Pica-Pau VIP", avatar: "🔴", isKids: false },
          { id: "p2", name: "Pica-Pau Kids", avatar: "🟡", isKids: true }
        ]
      }
    ],
    playlists: [
      {
        id: "default-playlist",
        name: "Lista Demonstrativa PICA-PAU",
        description: "Lista de canais e canais de teste de alta definição",
        url: "https://raw.githubusercontent.com/picapau/demo-iptv/main/playlist.m3u",
        format: "M3U",
        autoUpdate: true,
        lastUpdated: new Date().toISOString(),
        status: "Online",
        channelCount: 4,
        movieCount: 3,
        seriesCount: 2,
        channels: DEFAULT_CHANNELS
      },
      {
        id: "premium-playlist-1",
        name: "Canais, Filmes e Séries Premium",
        description: "Lista IPTV Principal (tvmeutedio)",
        url: "http://bit.ly/tvmeutedio",
        format: "M3U",
        autoUpdate: true,
        lastUpdated: new Date().toISOString(),
        status: "Online",
        channelCount: 0,
        movieCount: 0,
        seriesCount: 0,
        channels: []
      }
    ],
    history: [],
    favorites: [],
    logs: [
      {
        timestamp: new Date().toISOString(),
        type: "info",
        message: "Banco de dados inicializado com sucesso."
      }
    ],
    settings: {
      language: "pt-BR",
      theme: "dark",
      defaultQuality: "auto",
      autoPlay: true,
      autoUpdatePlaylists: true,
      adultHidden: true,
      cacheLimitMB: 512
    }
  };

  saveDB(db);
  return db;
}

function saveDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to database file", err);
  }
}

// Background playlist fetcher to prevent cold-start loss
async function refreshPlaylistInBackground(id: string) {
  try {
    // Get database on fresh read
    const db = getDB();
    const plIdx = db.playlists.findIndex(p => p.id === id);
    if (plIdx === -1) return;
    const playlist = db.playlists[plIdx];
    
    console.log(`[Background Sync] Iniciar sincronização da lista: ${playlist.name} (${playlist.url})`);
    const response = await fetch(playlist.url, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" 
      }
    });
    if (!response.ok) {
      throw new Error(`Servidor respondeu com status HTTP ${response.status}`);
    }
    const text = await response.text();
    const parsed = parseM3UPlaylist(text);
    
    const live = parsed.filter(c => c.category === "tv" || c.category === "sports" || c.category === "news" || c.category === "music" || c.category === "documentary");
    const movies = parsed.filter(c => c.category === "movie" || c.category === "kids");
    const series = parsed.filter(c => c.category === "series");

    playlist.channels = parsed;
    playlist.channelCount = live.length;
    playlist.movieCount = movies.length;
    playlist.seriesCount = series.length;
    playlist.lastUpdated = new Date().toISOString();
    playlist.status = "Online";

    db.playlists[plIdx] = playlist;
    saveDB(db);
    writeLog("info", `Sincronização em segundo plano concluída: ${playlist.name} (${parsed.length} canais)`);
  } catch (err: any) {
    console.error(`[Background Sync] Falha ao atualizar lista no plano de fundo:`, err.message);
    const db = getDB();
    const plIdx = db.playlists.findIndex(p => p.id === id);
    if (plIdx !== -1) {
      db.playlists[plIdx].status = "Offline";
      saveDB(db);
    }
  }
}

// Log assistant function
function writeLog(type: "info" | "warning" | "error" | "security", message: string, user?: string) {
  const db = getDB();
  db.logs.unshift({
    timestamp: new Date().toISOString(),
    type,
    message,
    user
  });
  if (db.logs.length > 200) db.logs.pop(); // keep log history manageable
  saveDB(db);
}

// Helper to parser M3U playlists
function parseM3UPlaylist(m3uText: string): PlaylistItem[] {
  const items: PlaylistItem[] = [];
  const lines = m3uText.split(/\r?\n/);
  
  let currentMeta: {
    name: string;
    logo: string;
    group: string;
    epgId: string;
    duration?: string;
    year?: string;
    description?: string;
    season?: number;
    episode?: number;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      // Extract metadata
      const durationMatch = line.match(/#EXTINF:(-?\d+)/);
      const duration = durationMatch ? durationMatch[1] : "";

      // Attributes matching tvg-logo, group-title, etc.
      const logoMatch = line.match(/tvg-logo="([^"]+)"/) || line.match(/logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/) || line.match(/group="([^"]+)"/);
      const nameMatch = line.match(/tvg-name="([^"]+)"/) || line.match(/name="([^"]+)"/);
      const epgMatch = line.match(/tvg-id="([^"]+)"/) || line.match(/epg-id="([^"]+)"/);

      // Title at the end of the EXTINF line
      const commaIndex = line.lastIndexOf(",");
      let displayName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : "Sem nome";
      if (!displayName && nameMatch) {
        displayName = nameMatch[1];
      }

      currentMeta = {
        name: displayName,
        logo: logoMatch ? logoMatch[1] : "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=100&h=100&fit=crop",
        group: groupMatch ? groupMatch[1] : "Geral",
        epgId: epgMatch ? epgMatch[1] : "",
        duration: duration !== "-1" && duration ? `${Math.floor(parseInt(duration) / 60)}m` : undefined,
      };

      // Try to guess additional items like Season / Episode
      const seMatch = displayName.match(/[Ss](\d+)[Ee](\d+)/);
      if (seMatch) {
        currentMeta.season = parseInt(seMatch[1]);
        currentMeta.episode = parseInt(seMatch[2]);
      }
    } else if (line.startsWith("#EXTGRP:")) {
      if (currentMeta) {
        currentMeta.group = line.replace("#EXTGRP:", "").trim();
      }
    } else if (line.startsWith("http://") || line.startsWith("https://") || line.includes("://") || line.endsWith(".m3u8") || line.endsWith(".mp4") || line.endsWith(".ts")) {
      if (currentMeta) {
        // Detect category based on name, group, URL path
        let category: "tv" | "movie" | "series" | "sports" | "kids" | "news" | "music" | "documentary" | "adult" = "tv";
        const combinedText = `${currentMeta.name} ${currentMeta.group} ${line}`.toLowerCase();

        if (combinedText.includes("kids") || combinedText.includes("infantil") || combinedText.includes("desenho") || combinedText.includes("disney") || combinedText.includes("cartoon")) {
          category = "kids";
        } else if (combinedText.includes("sports") || combinedText.includes("esporte") || combinedText.includes("premiere") || combinedText.includes("futebol") || combinedText.includes("combate") || combinedText.includes("espn") || combinedText.includes("arena")) {
          category = "sports";
        } else if (combinedText.includes("news") || combinedText.includes("noticia") || combinedText.includes("jornal") || combinedText.includes("cnn") || combinedText.includes("globonews")) {
          category = "news";
        } else if (combinedText.includes("music") || combinedText.includes("musica") || combinedText.includes("mtv") || combinedText.includes("show")) {
          category = "music";
        } else if (combinedText.includes("documentary") || combinedText.includes("documentario") || combinedText.includes("discovery") || combinedText.includes("history") || combinedText.includes("nasa")) {
          category = "documentary";
        } else if (combinedText.includes("adulto") || combinedText.includes("adult") || combinedText.includes("xxx") || combinedText.includes("playboy") || combinedText.includes("sexy")) {
          category = "adult";
        } else if (currentMeta.season !== undefined || combinedText.includes("s0") || combinedText.includes("s1") || combinedText.includes("temporada") || combinedText.includes("serie")) {
          category = "series";
        } else if (line.endsWith(".mp4") || line.endsWith(".mkv") || line.endsWith(".avi") || combinedText.includes("filme") || combinedText.includes("movie") || currentMeta.duration) {
          category = "movie";
        }

        items.push({
          id: `iptv-${crypto.randomBytes(6).toString("hex")}`,
          name: currentMeta.name,
          logo: currentMeta.logo,
          group: currentMeta.group,
          category,
          url: line,
          epgId: currentMeta.epgId,
          duration: currentMeta.duration,
          season: currentMeta.season,
          episode: currentMeta.episode
        });

        currentMeta = null;
      }
    }
  }

  return items;
}

// Global middlewares
app.use(express.json());

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Auth Endpoints
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const db = getDB();
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    writeLog("security", `Tentativa de login falhou. Usuário inexistente: ${username}`);
    return res.status(401).json({ error: "Usuário ou senha inválidos." });
  }

  const calculatedHash = crypto.createHmac("sha256", user.salt).update(password).digest("hex");
  if (calculatedHash !== user.passwordHash) {
    writeLog("security", `Tentativa de login falhou para o usuário: ${username}`);
    return res.status(401).json({ error: "Usuário ou senha inválidos." });
  }

  // Generate session token
  const token = crypto.randomBytes(32).toString("hex");
  writeLog("info", `Usuário conectado: ${username}`);
  
  res.json({
    token,
    user: {
      username: user.username,
      role: user.role,
      profiles: user.profiles
    }
  });
});

// Profiles Manage
app.post("/api/auth/profiles", (req, res) => {
  const { profileName, avatar, isKids } = req.body;
  if (!profileName) {
    return res.status(400).json({ error: "Nome do perfil é obrigatório." });
  }

  const db = getDB();
  const user = db.users[0]; // main user
  
  const newProfile: Profile = {
    id: `p-${crypto.randomBytes(4).toString("hex")}`,
    name: profileName,
    avatar: avatar || "🟢",
    isKids: !!isKids
  };

  user.profiles.push(newProfile);
  saveDB(db);
  writeLog("info", `Novo perfil criado: ${profileName}`);
  res.json(newProfile);
});

app.delete("/api/auth/profiles/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const user = db.users[0];

  if (user.profiles.length <= 1) {
    return res.status(400).json({ error: "Não é possível excluir o único perfil." });
  }

  user.profiles = user.profiles.filter(p => p.id !== id);
  saveDB(db);
  writeLog("info", `Perfil excluído: ${id}`);
  res.json({ success: true });
});

// Admin management
app.get("/api/admin/users", (req, res) => {
  const db = getDB();
  res.json(db.users.map(u => ({ username: u.username, role: u.role, profiles: u.profiles })));
});

app.get("/api/admin/logs", (req, res) => {
  const db = getDB();
  res.json(db.logs);
});

app.post("/api/admin/backup", (req, res) => {
  const db = getDB();
  res.json({ backup: JSON.stringify(db), date: new Date().toISOString() });
});

app.post("/api/admin/restore", (req, res) => {
  try {
    const { backupString } = req.body;
    if (!backupString) {
      return res.status(400).json({ error: "Conteúdo de backup inválido." });
    }
    const restored = JSON.parse(backupString);
    if (!restored.users || !restored.playlists) {
      return res.status(400).json({ error: "Formato de backup não reconhecido." });
    }
    saveDB(restored);
    writeLog("info", "Restauração de backup realizada com sucesso.");
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Falha ao restaurar backup: " + err.message });
  }
});

// Playlist endpoints
app.get("/api/playlists", (req, res) => {
  const db = getDB();
  // Don't return full channel list to optimize payload sizing
  const optimized = db.playlists.map(pl => ({
    id: pl.id,
    name: pl.name,
    description: pl.description,
    url: pl.url,
    format: pl.format,
    autoUpdate: pl.autoUpdate,
    lastUpdated: pl.lastUpdated,
    status: pl.status,
    channelCount: pl.channelCount,
    movieCount: pl.movieCount,
    seriesCount: pl.seriesCount,
  }));
  res.json(optimized);
});

app.get("/api/playlists/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const pl = db.playlists.find(p => p.id === id);
  if (!pl) return res.status(404).json({ error: "Playlist não encontrada" });
  res.json(pl);
});

// Proxy route to bypass IPTV browser CORS and fetch lists safely
app.get("/api/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Parâmetro URL é obrigatório." });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ao acessar playlist.`);
    }

    const contentType = response.headers.get("content-type") || "";
    const buffer = await response.arrayBuffer();

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Content-Type", contentType || "application/octet-stream");
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    writeLog("error", `Falha de proxy para URL ${url}: ${err.message}`);
    res.status(500).json({ error: "Falha de streaming/proxy: " + err.message });
  }
});

// Add playlist (with optional online parsing)
app.post("/api/playlists", async (req, res) => {
  const { name, description, url, format, autoUpdate } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: "Nome e URL são obrigatórios." });
  }

  try {
    const db = getDB();
    
    // Check if playlist already exists
    const exists = db.playlists.some(p => p.url === url);
    if (exists) {
      return res.status(400).json({ error: "Esta lista de reprodução já está cadastrada." });
    }

    let parsedChannels: PlaylistItem[] = [];
    let status: "Online" | "Offline" = "Offline";

    // Attempt to fetch and parse the playlist
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" }
      });
      if (response.ok) {
        const text = await response.text();
        parsedChannels = parseM3UPlaylist(text);
        status = "Online";
      }
    } catch (err) {
      console.warn("Could not parse remote M3U. Initializing list as Offline.", err);
    }

    // Fallback if M3U is not accessible during offline testing
    if (parsedChannels.length === 0) {
      parsedChannels = [];
    }

    const live = parsedChannels.filter(c => c.category === "tv" || c.category === "sports" || c.category === "news" || c.category === "music" || c.category === "documentary");
    const movies = parsedChannels.filter(c => c.category === "movie" || c.category === "kids");
    const series = parsedChannels.filter(c => c.category === "series");

    const newPlaylist: Playlist = {
      id: `pl-${crypto.randomBytes(6).toString("hex")}`,
      name,
      description: description || "Sem descrição",
      url,
      format: format || "M3U",
      autoUpdate: !!autoUpdate,
      lastUpdated: new Date().toISOString(),
      status,
      channelCount: live.length,
      movieCount: movies.length,
      seriesCount: series.length,
      channels: parsedChannels
    };

    db.playlists.push(newPlaylist);
    saveDB(db);
    writeLog("info", `Lista de reprodução adicionada: ${name} (${parsedChannels.length} canais)`);
    res.json(newPlaylist);
  } catch (err: any) {
    res.status(500).json({ error: "Falha ao processar lista: " + err.message });
  }
});

// Update playlist manually
app.post("/api/playlists/:id/refresh", async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const plIdx = db.playlists.findIndex(p => p.id === id);
  if (plIdx === -1) return res.status(404).json({ error: "Playlist não encontrada" });

  const playlist = db.playlists[plIdx];

  try {
    const response = await fetch(playlist.url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" }
    });
    
    if (!response.ok) {
      throw new Error(`Servidor remoto respondeu com status ${response.status}`);
    }

    const text = await response.text();
    const parsed = parseM3UPlaylist(text);

    const live = parsed.filter(c => c.category === "tv" || c.category === "sports" || c.category === "news" || c.category === "music" || c.category === "documentary");
    const movies = parsed.filter(c => c.category === "movie" || c.category === "kids");
    const series = parsed.filter(c => c.category === "series");

    playlist.channels = parsed;
    playlist.channelCount = live.length;
    playlist.movieCount = movies.length;
    playlist.seriesCount = series.length;
    playlist.lastUpdated = new Date().toISOString();
    playlist.status = "Online";

    db.playlists[plIdx] = playlist;
    saveDB(db);
    writeLog("info", `Lista de reprodução atualizada: ${playlist.name} (${parsed.length} canais)`);
    res.json(playlist);
  } catch (err: any) {
    playlist.status = "Offline";
    db.playlists[plIdx] = playlist;
    saveDB(db);
    writeLog("warning", `Falha ao atualizar lista ${playlist.name}: ${err.message}`);
    res.status(500).json({ error: "Erro de atualização remota: " + err.message, playlist });
  }
});

app.delete("/api/playlists/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const pl = db.playlists.find(p => p.id === id);
  if (!pl) return res.status(404).json({ error: "Playlist não encontrada" });

  db.playlists = db.playlists.filter(p => p.id !== id);
  saveDB(db);
  writeLog("info", `Lista de reprodução removida: ${pl.name}`);
  res.json({ success: true });
});

// All Channels / Movies / Series unified list
app.get("/api/content/all", (req, res) => {
  const db = getDB();
  const allChannels: PlaylistItem[] = [];
  
  db.playlists.forEach(p => {
    if (!p.channels || p.channels.length === 0) {
      // Trigger a background load if it's currently uninitialized/empty
      refreshPlaylistInBackground(p.id);
    } else {
      p.channels.forEach(ch => {
        // Add playlist name as source
        allChannels.push({
          ...ch,
          group: ch.group || "Geral"
        });
      });
    }
  });

  res.json({
    channels: allChannels
  });
});

// History Endpoints
app.get("/api/history/:profileId", (req, res) => {
  const { profileId } = req.params;
  const db = getDB();
  const history = db.history.filter(h => h.profileId === profileId);
  res.json(history);
});

app.post("/api/history", (req, res) => {
  const { profileId, itemId, name, category, logo, progress, duration, season, episode } = req.body;
  if (!profileId || !itemId || !name) {
    return res.status(400).json({ error: "Dados de histórico incompletos" });
  }

  const db = getDB();
  // Remove existing same item to place on top
  db.history = db.history.filter(h => !(h.profileId === profileId && h.itemId === itemId));

  const entry: HistoryEntry = {
    id: `hist-${crypto.randomBytes(6).toString("hex")}`,
    profileId,
    itemId,
    name,
    category,
    logo: logo || "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=100&h=100&fit=crop",
    watchedAt: new Date().toISOString(),
    progress: progress || 0,
    duration: duration || 0,
    season,
    episode
  };

  db.history.unshift(entry);
  if (db.history.length > 100) db.history.pop(); // keep history clean
  saveDB(db);
  res.json(entry);
});

app.delete("/api/history/:profileId", (req, res) => {
  const { profileId } = req.params;
  const db = getDB();
  db.history = db.history.filter(h => h.profileId !== profileId);
  saveDB(db);
  res.json({ success: true });
});

// Favorites Endpoints
app.get("/api/favorites/:profileId", (req, res) => {
  const { profileId } = req.params;
  const db = getDB();
  const favs = db.favorites.filter(f => f.profileId === profileId).map(f => f.itemId);
  res.json(favs);
});

app.post("/api/favorites", (req, res) => {
  const { profileId, itemId } = req.body;
  if (!profileId || !itemId) {
    return res.status(400).json({ error: "Dados de favoritos incompletos" });
  }

  const db = getDB();
  const exists = db.favorites.some(f => f.profileId === profileId && f.itemId === itemId);
  
  if (!exists) {
    db.favorites.push({ profileId, itemId });
    saveDB(db);
  }
  res.json({ success: true });
});

app.post("/api/favorites/toggle", (req, res) => {
  const { profileId, itemId } = req.body;
  if (!profileId || !itemId) {
    return res.status(400).json({ error: "Dados de favoritos incompletos" });
  }

  const db = getDB();
  const index = db.favorites.findIndex(f => f.profileId === profileId && f.itemId === itemId);
  
  let favorited = false;
  if (index === -1) {
    db.favorites.push({ profileId, itemId });
    favorited = true;
  } else {
    db.favorites.splice(index, 1);
  }
  
  saveDB(db);
  res.json({ success: true, favorited });
});

// Settings Endpoints
app.get("/api/settings", (req, res) => {
  const db = getDB();
  res.json(db.settings);
});

app.post("/api/settings", (req, res) => {
  const db = getDB();
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  res.json(db.settings);
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled API error:", err);
  res.status(500).json({ error: "Erro interno no servidor: " + err.message });
});

// Serve frontend with Vite middleware in development, and serve static build in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PICA-PAU Streaming backend running on port ${PORT}`);
    
    // Auto-refresh empty playlists in background on start
    try {
      const db = getDB();
      db.playlists.forEach(p => {
        if (!p.channels || p.channels.length === 0) {
          console.log(`[Auto Start] Detectada playlist vazia "${p.name}". Sincronizando no plano de fundo...`);
          refreshPlaylistInBackground(p.id);
        }
      });
    } catch (err) {
      console.error("Failed to run startup background sync:", err);
    }
  });
}

startServer();
