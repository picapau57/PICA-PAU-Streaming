import { Profile, PlaylistItem, PlaylistMeta, HistoryEntry, SystemSettings, SystemLog } from "../types";

const API_BASE = "";

export const api = {
  // Authentication & Profiles
  async login(password: string): Promise<{ token: string; user: { username: string; role: string; profiles: Profile[] } }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "picapau", password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Senha inválida.");
    }
    return res.json();
  },

  async getProfiles(): Promise<Profile[]> {
    const res = await fetch(`${API_BASE}/api/admin/users`);
    if (res.ok) {
      const data = await res.json();
      return data[0]?.profiles || [];
    }
    return [];
  },

  async createProfile(name: string, avatar: string, isKids: boolean): Promise<Profile> {
    const res = await fetch(`${API_BASE}/api/auth/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileName: name, avatar, isKids })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha ao criar perfil.");
    }
    return res.json();
  },

  async deleteProfile(profileId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/auth/profiles/${profileId}`, {
      method: "DELETE"
    });
    return res.ok;
  },

  // Playlists
  async getPlaylists(): Promise<PlaylistMeta[]> {
    const res = await fetch(`${API_BASE}/api/playlists`);
    if (!res.ok) throw new Error("Falha ao buscar listas.");
    return res.json();
  },

  async getPlaylistDetails(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/playlists/${id}`);
    if (!res.ok) throw new Error("Falha ao carregar detalhes da lista.");
    return res.json();
  },

  async createPlaylist(playlist: { name: string; description: string; url: string; format: string; autoUpdate: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE}/api/playlists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(playlist)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha ao criar lista.");
    }
    return res.json();
  },

  async refreshPlaylist(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/playlists/${id}/refresh`, {
      method: "POST"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha ao atualizar lista.");
    }
    return res.json();
  },

  async deletePlaylist(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/playlists/${id}`, {
      method: "DELETE"
    });
    return res.ok;
  },

  // Channels & VOD Content
  async getAllContent(): Promise<{ channels: PlaylistItem[] }> {
    const res = await fetch(`${API_BASE}/api/content/all`);
    if (!res.ok) throw new Error("Falha ao buscar conteúdo das listas.");
    return res.json();
  },

  // History
  async getHistory(profileId: string): Promise<HistoryEntry[]> {
    const res = await fetch(`${API_BASE}/api/history/${profileId}`);
    if (!res.ok) return [];
    return res.json();
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
    const res = await fetch(`${API_BASE}/api/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(history)
    });
    if (!res.ok) throw new Error("Falha ao salvar histórico.");
    return res.json();
  },

  async clearHistory(profileId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/history/${profileId}`, {
      method: "DELETE"
    });
    return res.ok;
  },

  // Favorites
  async getFavorites(profileId: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/api/favorites/${profileId}`);
    if (!res.ok) return [];
    return res.json();
  },

  async toggleFavorite(profileId: string, itemId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/favorites/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, itemId })
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.favorited;
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (!res.ok) throw new Error("Falha ao obter configurações.");
    return res.json();
  },

  async saveSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error("Falha ao salvar configurações.");
    return res.json();
  },

  // Admin and logs
  async getLogs(): Promise<SystemLog[]> {
    const res = await fetch(`${API_BASE}/api/admin/logs`);
    if (!res.ok) return [];
    return res.json();
  },

  async getBackup(): Promise<string> {
    const res = await fetch(`${API_BASE}/api/admin/backup`, { method: "POST" });
    if (!res.ok) throw new Error("Falha ao exportar backup.");
    const data = await res.json();
    return data.backup;
  },

  async restoreBackup(backupString: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/admin/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backupString })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha ao restaurar backup.");
    }
    return true;
  }
};
