import React, { useState, useEffect } from "react";
import { PlaylistItem, HistoryEntry, PlaylistMeta } from "../types";
import { 
  Play, Plus, Heart, Tv, Film, Clapperboard, Star, 
  Search, Info, ChevronRight, Download, CheckCircle2, 
  Clock, Flame, HelpCircle, Layers, Radio, Sparkles
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  playlists: PlaylistMeta[];
  content: PlaylistItem[];
  history: HistoryEntry[];
  favorites: string[];
  onPlayMedia: (item: PlaylistItem) => void;
  onToggleFavorite: (itemId: string) => void;
  onClearHistory: () => void;
  profileIsKids: boolean;
}

// Banner Slides data (open source play items)
const BANNER_SLIDES = [
  {
    id: "live-nasa",
    title: "NASA TV HD: Missão Estelar",
    subtitle: "Acompanhe ao vivo as transmissões espaciais diretamente da Estação Espacial Internacional (ISS)",
    badge: "DOCUMENTÁRIO • AO VIVO",
    logo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&h=400&fit=crop",
    color: "from-blue-900/40"
  },
  {
    id: "movie-bunny",
    title: "Big Buck Bunny: A Vingança",
    subtitle: "Uma comédia animada premiada de código aberto que diverte todas as idades",
    badge: "INFANTIL • ANIMAÇÃO",
    logo: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1080&h=400&fit=crop",
    color: "from-green-900/40"
  },
  {
    id: "movie-tears",
    title: "Tears of Steel: Efeitos Especiais",
    subtitle: "Ação de ficção científica ambientada em um futuro distópico com visuais fantásticos",
    badge: "FILME • SCI-FI",
    logo: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1080&h=400&fit=crop",
    color: "from-purple-900/40"
  }
];

export default function Dashboard({
  currentTab,
  onTabChange,
  playlists,
  content,
  history,
  favorites,
  onPlayMedia,
  onToggleFavorite,
  onClearHistory,
  profileIsKids
}: DashboardProps) {
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Downloads state
  const [downloads, setDownloads] = useState<Array<{ id: string; name: string; progress: number; speed: string; status: "downloading" | "paused" | "completed" }>>([
    { id: "dl-1", name: "Sintel (Sci-Fi Movie)", progress: 100, speed: "0 KB/s", status: "completed" },
    { id: "dl-2", name: "Tears of Steel: Ep 1", progress: 45, speed: "4.8 MB/s", status: "downloading" }
  ]);

  // Rotates banner slide automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter content based on Kids restriction
  const availableContent = content.filter(item => {
    if (profileIsKids) {
      return item.category === "kids" || item.group.toLowerCase().includes("kids") || item.group.toLowerCase().includes("infantil");
    }
    return true; // unrestricted
  });

  // Search filter
  const filteredContent = availableContent.filter((item) => {
    const matchesQuery = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategoryFilter === "all") return matchesQuery;
    return matchesQuery && item.category === selectedCategoryFilter;
  });

  // Group content by category for easy display
  const liveChannels = filteredContent.filter(c => ["tv", "sports", "news", "music", "documentary"].includes(c.category));
  const movies = filteredContent.filter(c => c.category === "movie");
  const series = filteredContent.filter(c => c.category === "series");
  const kidsItems = filteredContent.filter(c => c.category === "kids");

  // Favorites list full data matching
  const favoriteItemsFull = availableContent.filter(item => favorites.includes(item.id));

  // Handler for downloads simulation
  const handleTriggerDownload = (item: PlaylistItem) => {
    // Add item to simulated download row
    const exists = downloads.some(d => d.name === item.name);
    if (exists) {
      alert("Este arquivo já está na fila de downloads.");
      return;
    }
    setDownloads([
      ...downloads,
      {
        id: `dl-${Date.now()}`,
        name: item.name,
        progress: 1,
        speed: "3.2 MB/s",
        status: "downloading"
      }
    ]);
    alert(`Download de "${item.name}" iniciado. Acompanhe na aba Downloads.`);
  };

  // Simulates download ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setDownloads(prev => prev.map(dl => {
        if (dl.status === "downloading" && dl.progress < 100) {
          const nextProg = dl.progress + Math.floor(Math.random() * 8) + 2;
          return {
            ...dl,
            progress: nextProg >= 100 ? 100 : nextProg,
            speed: nextProg >= 100 ? "0 KB/s" : `${(Math.random() * 4 + 2).toFixed(1)} MB/s`,
            status: nextProg >= 100 ? "completed" : "downloading"
          };
        }
        return dl;
      }));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handlePauseDownload = (id: string) => {
    setDownloads(prev => prev.map(dl => {
      if (dl.id === id) {
        return {
          ...dl,
          status: dl.status === "downloading" ? "paused" : "downloading",
          speed: dl.status === "downloading" ? "0 KB/s" : "3.1 MB/s"
        };
      }
      return dl;
    }));
  };

  const handleCancelDownload = (id: string) => {
    setDownloads(prev => prev.filter(dl => dl.id !== id));
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* GLOBAL SEARCH & FILTER HEADER BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-black/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar canais, filmes, séries, documentários..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 transition-all backdrop-blur"
          />
          <Search className="absolute left-4 top-3 w-4 h-4 text-neutral-400" />
        </div>

        {/* Categorization filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 font-mono text-[11px] font-bold">
          {[
            { id: "all", label: "TODOS" },
            { id: "tv", label: "TV AO VIVO" },
            { id: "movie", label: "FILMES" },
            { id: "series", label: "SÉRIES" },
            { id: "kids", label: "INFANTIL" },
            { id: "sports", label: "ESPORTES" },
            { id: "documentary", label: "DOCUMENTÁRIOS" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-4 py-1.5 rounded-full border transition-all shrink-0 focus:outline-none cursor-pointer ${
                selectedCategoryFilter === cat.id
                  ? "bg-blue-600 border-blue-500 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  : "bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD TAB RENDERS */}
      
      {/* 1. HOME TAB */}
      {currentTab === "home" && !searchQuery && (
        <>
          {/* Animated Hero Rotativo Banner */}
          <div className="relative h-[250px] md:h-[350px] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            {BANNER_SLIDES.map((slide, idx) => {
              const isActive = idx === activeBannerIdx;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-1000 flex flex-col justify-end p-6 md:p-10 ${
                    isActive ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  {/* Background cover image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40 mix-blend-multiply z-0" />
                  <img
                    src={slide.logo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover -z-10"
                    referrerPolicy="no-referrer"
                  />

                  {/* Banner texts content */}
                  <div className="relative z-10 space-y-2 md:space-y-3 max-w-2xl">
                    <span className="inline-block text-[10px] font-mono font-bold bg-neon-purple text-white px-2.5 py-0.5 rounded-full">
                      {slide.badge}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-black font-display text-white tracking-tight leading-none text-glow-purple">
                      {slide.title}
                    </h2>
                    <p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-lg">
                      {slide.subtitle}
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          const target = availableContent.find(c => c.id === slide.id);
                          if (target) onPlayMedia(target);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-lg cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Assistir Agora
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Slider bullet dots indicators */}
            <div className="absolute bottom-4 right-6 z-20 flex gap-2">
              {BANNER_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBannerIdx(idx)}
                  className={`w-2 h-2 rounded-full transition-all focus:outline-none ${
                    idx === activeBannerIdx ? "bg-neon-blue w-6" : "bg-neutral-600"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Continuar Assistindo Section */}
          {history.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold font-display text-gray-200 flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-neon-blue" /> Continuar Assistindo
                </span>
                <button 
                  onClick={onClearHistory}
                  className="text-[10px] font-mono text-neutral-500 hover:text-neon-red transition-colors"
                >
                  Limpar histórico
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {history.slice(0, 5).map((entry) => {
                  const percent = Math.min(100, Math.floor((entry.progress / (entry.duration || 3600)) * 100));
                  return (
                    <div 
                      key={entry.id}
                      onClick={() => {
                        const original = availableContent.find(c => c.id === entry.itemId);
                        if (original) onPlayMedia(original);
                      }}
                      className="group bg-dark-card/60 border border-white/5 rounded-xl overflow-hidden hover:border-white/15 transition-all cursor-pointer relative"
                    >
                      <div className="aspect-video w-full bg-neutral-900 relative overflow-hidden">
                        <img src={entry.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>

                      <div className="p-3 space-y-1.5">
                        <span className="block text-[9px] font-mono text-neutral-500 uppercase">{entry.category}</span>
                        <h5 className="text-xs font-bold text-gray-200 truncate group-hover:text-neon-blue transition-colors">{entry.name}</h5>
                        
                        {/* Completion bar */}
                        <div className="space-y-1 pt-1">
                          <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                            <div className="bg-neon-blue h-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="block text-[8px] font-mono text-neutral-500">{percent}% assistido</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TV ao Vivo Row */}
          {liveChannels.length > 0 && (
            <div className="space-y-4">
              <span className="text-base font-bold font-display text-gray-200 flex items-center gap-2">
                <Tv className="w-4.5 h-4.5 text-neon-blue" /> TV ao Vivo Premium ({liveChannels.length})
              </span>

              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
                {liveChannels.map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => onPlayMedia(channel)}
                    className="w-36 bg-dark-card/60 border border-white/5 hover:border-neon-blue/40 rounded-xl p-3 text-center shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer group shadow"
                  >
                    <div className="w-20 h-20 bg-neutral-900 rounded-xl mx-auto flex items-center justify-center border border-white/5 group-hover:border-neon-blue/30 overflow-hidden shadow-inner mb-3">
                      <img src={channel.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <h5 className="text-xs font-bold text-gray-300 group-hover:text-white truncate" title={channel.name}>{channel.name}</h5>
                    <span className="text-[8px] font-mono text-neutral-500 uppercase mt-1 block">{channel.group}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VOD Filmes Row */}
          {movies.length > 0 && (
            <div className="space-y-4">
              <span className="text-base font-bold font-display text-gray-200 flex items-center gap-2">
                <Film className="w-4.5 h-4.5 text-neon-purple" /> Cinema VOD Filmes ({movies.length})
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="group bg-dark-card/60 border border-white/5 rounded-2xl overflow-hidden hover:border-neon-purple/40 hover:scale-[1.02] active:scale-[0.98] transition-all relative shadow-lg flex flex-col"
                  >
                    {/* Poster element */}
                    <div 
                      onClick={() => onPlayMedia(movie)}
                      className="aspect-[2/3] bg-neutral-900 relative overflow-hidden cursor-pointer shrink-0"
                    >
                      <img src={movie.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      
                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onPlayMedia(movie); }}
                          className="p-3 bg-white text-black rounded-full hover:scale-110 active:scale-90 transition-all shadow-lg cursor-pointer"
                        >
                          <Play className="w-5 h-5 fill-current pl-0.5" />
                        </button>
                      </div>

                      {/* Top float label */}
                      <span className="absolute top-2.5 left-2.5 text-[8px] font-mono font-bold bg-black/60 text-neon-purple px-1.5 py-0.5 rounded-md backdrop-blur">
                        {movie.year || "VOD"}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-gray-200 truncate group-hover:text-neon-purple transition-colors">{movie.name}</h5>
                        <p className="text-[10px] text-neutral-500 line-clamp-2 leading-tight">
                          {movie.description || "Filme em alta definição proveniente da playlist IPTV configurada pelo usuário."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] font-mono text-neutral-500">
                        <span>{movie.duration || "1h 45m"}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onToggleFavorite(movie.id)}
                            className={`hover:text-yellow-500 transition-colors ${favorites.includes(movie.id) ? "text-yellow-500" : ""}`}
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={() => handleTriggerDownload(movie)}
                            className="hover:text-neon-blue transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VOD Séries Row */}
          {series.length > 0 && (
            <div className="space-y-4">
              <span className="text-base font-bold font-display text-gray-200 flex items-center gap-2">
                <Clapperboard className="w-4.5 h-4.5 text-neon-red" /> Séries e Temporadas ({series.length})
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {series.map((show) => (
                  <div
                    key={show.id}
                    className="group bg-dark-card/60 border border-white/5 rounded-2xl overflow-hidden hover:border-neon-red/40 hover:scale-[1.02] active:scale-[0.98] transition-all relative shadow-lg flex flex-col"
                  >
                    <div 
                      onClick={() => onPlayMedia(show)}
                      className="aspect-[3/2] bg-neutral-900 relative overflow-hidden cursor-pointer shrink-0"
                    >
                      <img src={show.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                        <button className="p-2.5 bg-white text-black rounded-full hover:scale-110 active:scale-95 shadow-md">
                          <Play className="w-4 h-4 fill-current pl-0.5" />
                        </button>
                      </div>
                      <span className="absolute top-2.5 left-2.5 text-[8px] font-mono font-bold bg-neon-red text-white px-1.5 py-0.5 rounded-md">
                        S0{show.season || 1}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-1 flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-gray-200 truncate group-hover:text-neon-red transition-colors">{show.name}</h5>
                        <p className="text-[10px] text-neutral-500 line-clamp-2 leading-tight">
                          {show.description || `Temporada ${show.season || 1} • Episódio ${show.episode || 1} IPTV`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] font-mono text-neutral-500">
                        <span>Episódio {show.episode || 1}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onToggleFavorite(show.id)}
                            className={`hover:text-yellow-500 transition-colors ${favorites.includes(show.id) ? "text-yellow-500" : ""}`}
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={() => handleTriggerDownload(show)}
                            className="hover:text-neon-blue transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 2. SPECIFIC SECTION TABS (WHEN ACTIVE OR QUERY RUNNING) */}

      {(currentTab === "live" || searchQuery) && liveChannels.length > 0 && (
        <div className="space-y-4">
          <span className="text-base font-bold font-display text-gray-200 flex items-center gap-2">
            <Tv className="w-4.5 h-4.5 text-neon-blue" /> Canais Ao Vivo Filtrados ({liveChannels.length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
            {liveChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => onPlayMedia(channel)}
                className="bg-dark-card border border-white/5 hover:border-neon-blue/40 rounded-xl p-3 text-center hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-neutral-900 rounded-xl mx-auto flex items-center justify-center border border-white/5 overflow-hidden mb-2">
                  <img src={channel.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h5 className="text-xs font-bold text-gray-300 group-hover:text-white truncate">{channel.name}</h5>
                <span className="text-[8px] font-mono text-neutral-500 mt-1 block">{channel.group}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(currentTab === "movies" || searchQuery) && movies.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-base font-bold font-display text-gray-200 flex items-center gap-2">
            <Film className="w-4.5 h-4.5 text-neon-purple" /> Catálogo de Filmes VOD ({movies.length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="group bg-dark-card/60 border border-white/5 rounded-2xl overflow-hidden hover:border-neon-purple/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col shadow-md"
              >
                <div 
                  onClick={() => onPlayMedia(movie)}
                  className="aspect-[2/3] bg-neutral-900 relative overflow-hidden cursor-pointer"
                >
                  <img src={movie.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Play className="w-6 h-6 text-white fill-current" />
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h5 className="text-xs font-bold text-gray-300 truncate group-hover:text-white">{movie.name}</h5>
                    <p className="text-[10px] text-neutral-500 line-clamp-2 leading-tight">{movie.description || "Filme em HD"}</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-white/5">
                    <span>{movie.duration || "1h 30m"}</span>
                    <button onClick={() => onToggleFavorite(movie.id)} className={`hover:text-yellow-500 ${favorites.includes(movie.id) ? "text-yellow-500" : ""}`}>
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(currentTab === "series" || searchQuery) && series.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-base font-bold font-display text-gray-200 flex items-center gap-2">
            <Clapperboard className="w-4.5 h-4.5 text-neon-red" /> Temporadas e Episódios VOD ({series.length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {series.map((show) => (
              <div
                key={show.id}
                className="group bg-dark-card/60 border border-white/5 rounded-2xl overflow-hidden hover:border-neon-red/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col"
              >
                <div onClick={() => onPlayMedia(show)} className="aspect-[3/2] bg-neutral-900 relative overflow-hidden cursor-pointer">
                  <img src={show.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <span className="absolute top-2 left-2 text-[8px] font-mono font-bold bg-neon-red text-white px-1.5 py-0.5 rounded-md">S0{show.season || 1}</span>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <h5 className="text-xs font-bold text-gray-300 truncate">{show.name}</h5>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-white/5 mt-2">
                    <span>Episódio {show.episode || 1}</span>
                    <button onClick={() => onToggleFavorite(show.id)} className={`hover:text-yellow-500 ${favorites.includes(show.id) ? "text-yellow-500" : ""}`}>
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. FAVORITES TAB */}
      {currentTab === "favorites" && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-base font-bold font-display text-gray-200 flex items-center gap-2">
            <Star className="w-4.5 h-4.5 text-yellow-500 fill-current" /> Seus Conteúdos Favoritos ({favoriteItemsFull.length})
          </span>

          {favoriteItemsFull.length === 0 ? (
            <div className="py-12 bg-white/5 border border-white/5 border-dashed rounded-2xl text-center text-xs text-neutral-400">
              Nenhum canal, filme ou série adicionado aos favoritos ainda.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {favoriteItemsFull.map((item) => (
                <div
                  key={item.id}
                  className="group bg-dark-card/60 border border-white/5 rounded-xl overflow-hidden hover:border-white/15 transition-all flex flex-col"
                >
                  <div onClick={() => onPlayMedia(item)} className="aspect-video bg-neutral-900 relative overflow-hidden cursor-pointer shrink-0">
                    <img src={item.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5">
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-500 uppercase">{item.category}</span>
                      <h5 className="text-xs font-bold text-gray-300 truncate">{item.name}</h5>
                    </div>
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className="w-full py-1 bg-white/5 hover:bg-neon-red/10 border border-white/5 rounded text-[10px] font-mono text-neutral-400 hover:text-neon-red transition-all"
                    >
                      Remover dos Favoritos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. HISTORY TAB */}
      {currentTab === "history" && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-base font-bold font-display text-gray-200 flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-neon-blue" /> Histórico de Mídia Assistida ({history.length})
          </span>

          {history.length === 0 ? (
            <div className="py-12 bg-white/5 border border-white/5 border-dashed rounded-2xl text-center text-xs text-neutral-400">
              O histórico está vazio. Comece a assistir a um conteúdo para vê-lo listado aqui.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((hist) => (
                <div
                  key={hist.id}
                  className="flex items-center justify-between p-3.5 bg-dark-card border border-white/5 hover:border-white/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-neutral-900 overflow-hidden shrink-0">
                      <img src={hist.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-500 uppercase">{hist.category}</span>
                      <span className="block text-sm font-bold text-gray-200">{hist.name}</span>
                      <span className="block text-[10px] text-neutral-400">Progresso: {Math.min(100, Math.floor((hist.progress / (hist.duration || 3600)) * 100))}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const origin = availableContent.find(c => c.id === hist.itemId);
                      if (origin) onPlayMedia(origin);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-neon-blue text-black font-bold rounded-lg text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" /> Retomar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. DOWNLOADS TAB */}
      {currentTab === "downloads" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold font-display text-gray-200 flex items-center gap-2">
              <Download className="w-5 h-5 text-neon-blue" /> Downloads Organizados
            </h3>
            <p className="text-xs text-neutral-400">Os downloads dependem da autorização de cache da origem da lista IPTV configurada pelo usuário.</p>
          </div>

          <div className="space-y-3">
            {downloads.map((dl) => (
              <div
                key={dl.id}
                className="bg-dark-card border border-white/5 rounded-xl p-4 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-gray-200">{dl.name}</h5>
                    <span className="block text-[10px] font-mono text-neutral-500 uppercase mt-0.5">VELOCIDADE: {dl.speed}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => handlePauseDownload(dl.id)}
                      disabled={dl.status === "completed"}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-[10px]"
                    >
                      {dl.status === "downloading" ? "Pausar" : dl.status === "paused" ? "Retomar" : "Concluído"}
                    </button>
                    <button
                      onClick={() => handleCancelDownload(dl.id)}
                      className="px-2 py-1 bg-neon-red/15 hover:bg-neon-red/25 text-neon-red rounded font-mono text-[10px]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${dl.status === "completed" ? "bg-green-500" : "bg-neon-blue"}`} style={{ width: `${dl.progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>{dl.progress}% baixado</span>
                    <span>{dl.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. CATEGORIES TAB */}
      {currentTab === "categories" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold font-display text-gray-200 flex items-center gap-1.5">
              <Layers className="w-5 h-5 text-neon-blue" /> Divisão por Categorias Inteligentes
            </h3>
            <p className="text-xs text-neutral-400">Separação automática realizada pelo processador inteligente do PICA-PAU IPTV.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { id: "tv", label: "TV Ao Vivo Geral", count: liveChannels.filter(c => c.category === "tv").length, icon: Tv, color: "from-blue-900/20" },
              { id: "movie", label: "Cinema & Filmes VOD", count: movies.length, icon: Film, color: "from-purple-900/20" },
              { id: "series", label: "Séries e Temporadas", count: series.length, icon: Clapperboard, color: "from-red-900/20" },
              { id: "kids", label: "Infantil & Animações", count: kidsItems.length, icon: Sparkles, color: "from-yellow-900/20" },
              { id: "sports", label: "Canais de Esportes", count: liveChannels.filter(c => c.category === "sports").length, icon: Flame, color: "from-green-900/20" },
              { id: "documentary", label: "Documentários & Ciência", count: liveChannels.filter(c => c.category === "documentary").length, icon: Info, color: "from-cyan-900/20" }
            ].map((col) => {
              const Icon = col.icon;
              return (
                <div
                  key={col.id}
                  onClick={() => { setSelectedCategoryFilter(col.id); onTabChange("home"); }}
                  className={`bg-gradient-to-br ${col.color} to-dark-card border border-white/5 hover:border-white/15 p-5 rounded-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-between`}
                >
                  <div className="space-y-1.5">
                    <span className="block text-sm font-bold text-gray-200">{col.label}</span>
                    <span className="block text-xs font-mono text-neutral-400">{col.count} itens identificados</span>
                  </div>
                  <Icon className="w-8 h-8 text-neutral-500 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. LIBRARY TAB */}
      {currentTab === "library" && (
        <div className="space-y-8 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold font-display text-gray-200">Sua Biblioteca Pessoal</h3>
            <p className="text-xs text-neutral-400">Espaço consolidado integrando favoritos, downloads locais e mídias do histórico.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-card/60 border border-white/5 p-5 rounded-2xl space-y-3">
              <span className="text-sm font-bold text-white flex items-center gap-1.5"><Heart className="w-4 h-4 text-neon-red" /> Recentes nos Favoritos</span>
              {favoriteItemsFull.length === 0 ? (
                <p className="text-xs text-neutral-500">Nenhum favorito registrado.</p>
              ) : (
                favoriteItemsFull.slice(0, 3).map(f => (
                  <div key={f.id} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg text-xs text-gray-300">
                    <span>{f.name}</span>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">{f.category}</span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-dark-card/60 border border-white/5 p-5 rounded-2xl space-y-3">
              <span className="text-sm font-bold text-white flex items-center gap-1.5"><Download className="w-4 h-4 text-neon-blue" /> Seus Downloads Concluídos</span>
              {downloads.filter(d => d.status === "completed").map(d => (
                <div key={d.id} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg text-xs text-gray-300">
                  <span>{d.name}</span>
                  <span className="text-[10px] font-mono text-green-400 uppercase font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> PRONTO
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
