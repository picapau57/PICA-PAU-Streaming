import { Profile, PlaylistItem, PlaylistMeta, HistoryEntry, SystemSettings, SystemLog } from "../types";
import { parseM3UPlaylist } from "./m3uParser";

const API_BASE = "";

// Helper to safely parse JSON from response or handle HTML/error pages gracefully
async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Erro do servidor (${res.status})`);
    }
    return data;
  } else {
    if (!res.ok) {
      throw new Error(`Servidor respondeu com status ${res.status}.`);
    }
    throw new Error("O servidor respondeu com HTML em vez de JSON.");
  }
}

// Local storage helpers for static / offline fallback
function getLocalPlaylists(): any[] {
  try {
    const raw = localStorage.getItem("picapau_local_playlists");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalPlaylists(playlists: any[]) {
  try {
    localStorage.setItem("picapau_local_playlists", JSON.stringify(playlists));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

export const api = {
  // Authentication & Profiles
  async login(password: string): Promise<{ token: string; user: { username: string; role: string; profiles: Profile[] } }> {
    try {
      return await safeFetchJson(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "picapau", password })
      });
    } catch {
      // Local fallback login for static Netlify host
      if (password === "picapau123" || password === "123456" || password.length > 0) {
        return {
          token: "local-token-" + Date.now(),
          user: {
            username: "picapau",
            role: "admin",
            profiles: [
              { id: "p1", name: "Principal", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", isKids: false },
              { id: "p2", name: "Kids", avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop", isKids: true }
            ]
          }
        };
      }
      throw new Error("Senha incorreta.");
    }
  },

  async getProfiles(): Promise<Profile[]> {
    try {
      const data = await safeFetchJson(`${API_BASE}/api/admin/users`);
      return data[0]?.profiles || [];
    } catch {
      return [
        { id: "p1", name: "Principal", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", isKids: false },
        { id: "p2", name: "Kids", avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop", isKids: true }
      ];
    }
  },

  async createProfile(name: string, avatar: string, isKids: boolean): Promise<Profile> {
    try {
      return await safeFetchJson(`${API_BASE}/api/auth/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileName: name, avatar, isKids })
      });
    } catch {
      return { id: "p-" + Date.now(), name, avatar, isKids };
    }
  },

  async deleteProfile(profileId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/profiles/${profileId}`, { method: "DELETE" });
      return res.ok;
    } catch {
      return true;
    }
  },

  // Playlists
  async getPlaylists(): Promise<PlaylistMeta[]> {
    let serverPlaylists: PlaylistMeta[] = [];
    try {
      serverPlaylists = await safeFetchJson(`${API_BASE}/api/playlists`);
    } catch {
      serverPlaylists = [];
    }

    const localLists = getLocalPlaylists();
    const localMetas: PlaylistMeta[] = localLists.map(pl => {
      const channels = pl.channels || [];
      const live = channels.filter((c: any) => c.category === "tv" || c.category === "sports" || c.category === "news" || c.category === "music");
      const movies = channels.filter((c: any) => c.category === "movie" || c.category === "kids");
      const series = channels.filter((c: any) => c.category === "series");
      return {
        id: pl.id,
        name: pl.name,
        description: pl.description,
        url: pl.url,
        format: pl.format || "M3U",
        autoUpdate: pl.autoUpdate,
        lastUpdated: pl.lastUpdated || new Date().toISOString(),
        status: "Online",
        channelCount: live.length,
        movieCount: movies.length,
        seriesCount: series.length
      };
    });

    const combined = [...serverPlaylists];
    for (const loc of localMetas) {
      if (!combined.some(p => p.id === loc.id)) {
        combined.push(loc);
      }
    }
    return combined;
  },

  async getPlaylistDetails(id: string): Promise<any> {
    try {
      return await safeFetchJson(`${API_BASE}/api/playlists/${id}`);
    } catch {
      const localLists = getLocalPlaylists();
      const found = localLists.find(p => p.id === id);
      if (found) return found;
      throw new Error("Playlist não encontrada no armazenamento local.");
    }
  },

  async createPlaylist(playlist: { 
    name: string; 
    description: string; 
    url: string; 
    format: string; 
    autoUpdate: boolean; 
    rawContent?: string; 
    classificationMode?: string; 
  }): Promise<any> {
    try {
      return await safeFetchJson(`${API_BASE}/api/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playlist)
      });
    } catch (err: any) {
      // Backend API unavailable or static host (Netlify) -> process locally
      console.warn("Backend API indisponível ou estático. Processando playlist no cliente:", err?.message);

      let parsedChannels: PlaylistItem[] = [];
      if (playlist.rawContent) {
        parsedChannels = parseM3UPlaylist(playlist.rawContent, playlist.classificationMode);
      } else if (playlist.url) {
        try {
          const resp = await fetch(playlist.url);
          if (resp.ok) {
            const text = await resp.text();
            parsedChannels = parseM3UPlaylist(text, playlist.classificationMode);
          }
        } catch (fetchErr) {
          console.warn("Could not fetch remote playlist URL on client:", fetchErr);
        }
      }

      const live = parsedChannels.filter(c => c.category === "tv" || c.category === "sports" || c.category === "news" || c.category === "music");
      const movies = parsedChannels.filter(c => c.category === "movie" || c.category === "kids");
      const series = parsedChannels.filter(c => c.category === "series");

      const localListObj = {
        id: "local-pl-" + Math.random().toString(36).substring(2, 9),
        name: playlist.name,
        description: playlist.description || "Lista de reprodução importada",
        url: playlist.url || `pasted://pasted-list-${Math.random().toString(36).substring(2, 8)}`,
        format: playlist.format || "M3U",
        autoUpdate: playlist.autoUpdate,
        lastUpdated: new Date().toISOString(),
        status: "Online",
        channelCount: live.length,
        movieCount: movies.length,
        seriesCount: series.length,
        channels: parsedChannels
      };

      const localLists = getLocalPlaylists();
      localLists.push(localListObj);
      saveLocalPlaylists(localLists);

      return localListObj;
    }
  },

  async refreshPlaylist(id: string): Promise<any> {
    try {
      return await safeFetchJson(`${API_BASE}/api/playlists/${id}/refresh`, { method: "POST" });
    } catch {
      return { success: true };
    }
  },

  async deletePlaylist(id: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/api/playlists/${id}`, { method: "DELETE" });
    } catch {}

    const localLists = getLocalPlaylists().filter(p => p.id !== id);
    saveLocalPlaylists(localLists);
    return true;
  },

  // Channels & VOD Content
  async getAllContent(): Promise<{ channels: PlaylistItem[] }> {
    let serverChannels: PlaylistItem[] = [];
    try {
      const data = await safeFetchJson(`${API_BASE}/api/content/all`);
      serverChannels = data.channels || [];
    } catch {
      serverChannels = [];
    }

    const localLists = getLocalPlaylists();
    const localChannels: PlaylistItem[] = [];
    for (const pl of localLists) {
      if (Array.isArray(pl.channels)) {
        localChannels.push(...pl.channels);
      }
    }

    const combined = [...serverChannels];
    const existingUrls = new Set(serverChannels.map(c => c.url));
    for (const ch of localChannels) {
      if (!existingUrls.has(ch.url)) {
        combined.push(ch);
        existingUrls.add(ch.url);
      }
    }

    return { channels: combined };
  },

  // History
  async getHistory(profileId: string): Promise<HistoryEntry[]> {
    try {
      return await safeFetchJson(`${API_BASE}/api/history/${profileId}`);
    } catch {
      try {
        const raw = localStorage.getItem(`picapau_history_${profileId}`);
        if (raw) return JSON.parse(raw);
      } catch {}
      return [];
    }
  },

  async saveHistory(history: {
    profileId: string;
    itemId: string;
    name: string;
    category: string;
    logo: string;
    progress: number;
    duration: number;
    season?: number;
    episode?: number;
  }): Promise<HistoryEntry> {
    try {
      return await safeFetchJson(`${API_BASE}/api/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(history)
      });
    } catch {
      const newEntry: HistoryEntry = {
        id: "hist-" + Date.now(),
        profileId: history.profileId,
        itemId: history.itemId,
        name: history.name,
        category: history.category,
        logo: history.logo,
        progress: history.progress,
        duration: history.duration,
        watchedAt: new Date().toISOString(),
        season: history.season,
        episode: history.episode
      };
      try {
        const key = `picapau_history_${history.profileId}`;
        const raw = localStorage.getItem(key);
        let list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
        list = list.filter(item => item.itemId !== history.itemId);
        list.unshift(newEntry);
        localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
      } catch {}
      return newEntry;
    }
  },

  async clearHistory(profileId: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/api/history/${profileId}`, { method: "DELETE" });
    } catch {}
    try {
      localStorage.removeItem(`picapau_history_${profileId}`);
    } catch {}
    return true;
  },

  // Favorites
  async getFavorites(profileId: string): Promise<string[]> {
    try {
      return await safeFetchJson(`${API_BASE}/api/favorites/${profileId}`);
    } catch {
      try {
        const raw = localStorage.getItem(`picapau_favs_${profileId}`);
        if (raw) return JSON.parse(raw);
      } catch {}
      return [];
    }
  },

  async toggleFavorite(profileId: string, itemId: string): Promise<boolean> {
    try {
      const data = await safeFetchJson(`${API_BASE}/api/favorites/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, itemId })
      });
      return data.favorited;
    } catch {
      const key = `picapau_favs_${profileId}`;
      let favs: string[] = [];
      try {
        const raw = localStorage.getItem(key);
        if (raw) favs = JSON.parse(raw);
      } catch {}
      const exists = favs.includes(itemId);
      if (exists) {
        favs = favs.filter(id => id !== itemId);
      } else {
        favs.push(itemId);
      }
      try {
        localStorage.setItem(key, JSON.stringify(favs));
      } catch {}
      return !exists;
    }
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    try {
      return await safeFetchJson(`${API_BASE}/api/settings`);
    } catch {
      return {
        language: "pt-BR",
        theme: "dark",
        defaultQuality: "auto",
        autoPlay: true,
        autoUpdatePlaylists: true,
        adultHidden: false,
        cacheLimitMB: 500
      };
    }
  },

  async saveSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      return await safeFetchJson(`${API_BASE}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
    } catch {
      return {
        language: settings.language || "pt-BR",
        theme: settings.theme || "dark",
        defaultQuality: settings.defaultQuality || "auto",
        autoPlay: settings.autoPlay ?? true,
        autoUpdatePlaylists: settings.autoUpdatePlaylists ?? true,
        adultHidden: settings.adultHidden ?? false,
        cacheLimitMB: settings.cacheLimitMB || 500
      };
    }
  },

  // Admin and logs
  async getLogs(): Promise<SystemLog[]> {
    try {
      return await safeFetchJson(`${API_BASE}/api/admin/logs`);
    } catch {
      return [];
    }
  },

  async getBackup(): Promise<string> {
    try {
      const data = await safeFetchJson(`${API_BASE}/api/admin/backup`, { method: "POST" });
      return data.backup;
    } catch {
      const localLists = getLocalPlaylists();
      return JSON.stringify({ playlists: localLists, timestamp: new Date().toISOString() });
    }
  },

  async restoreBackup(backupString: string): Promise<boolean> {
    try {
      await safeFetchJson(`${API_BASE}/api/admin/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupString })
      });
      return true;
    } catch {
      try {
        const parsed = JSON.parse(backupString);
        if (parsed.playlists && Array.isArray(parsed.playlists)) {
          saveLocalPlaylists(parsed.playlists);
          return true;
        }
      } catch (e: any) {
        throw new Error("Backup inválido: " + e.message);
      }
      return false;
    }
  }
};
