export interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
}

export interface PlaylistItem {
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

export interface PlaylistMeta {
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
}

export interface HistoryEntry {
  id: string;
  profileId: string;
  itemId: string;
  name: string;
  category: string;
  logo: string;
  watchedAt: string;
  progress: number;
  duration: number;
  season?: number;
  episode?: number;
}

export interface SystemSettings {
  language: string;
  theme: "dark" | "light" | "auto";
  defaultQuality: "auto" | "1080p" | "720p" | "480p";
  autoPlay: boolean;
  autoUpdatePlaylists: boolean;
  adultHidden: boolean;
  cacheLimitMB: number;
}

export interface SystemLog {
  timestamp: string;
  type: "info" | "warning" | "error" | "security";
  message: string;
  user?: string;
}
