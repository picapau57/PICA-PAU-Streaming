import React, { useState, useEffect } from "react";
import { Profile, PlaylistItem, PlaylistMeta, HistoryEntry, SystemSettings } from "./types";
import { api } from "./lib/api";
import WelcomeScreen from "./components/WelcomeScreen";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import PremiumPlayer from "./components/PremiumPlayer";
import CastModal from "./components/CastModal";
import ManageListModal from "./components/ManageListModal";
import AdminPanel from "./components/AdminPanel";
import { 
  LogOut, Tv, Radio, Settings, ShieldCheck, Layers, 
  HelpCircle, MonitorPlay, Moon, Sun, Info, Sliders, CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Session / Profile state
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Global applet lists
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistMeta[]>([]);
  const [content, setContent] = useState<PlaylistItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    language: "pt-BR",
    theme: "dark",
    defaultQuality: "auto",
    autoPlay: true,
    autoUpdatePlaylists: true,
    adultHidden: true,
    cacheLimitMB: 512
  });

  // Navigation / Modal triggers
  const [currentTab, setCurrentTab] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCastOpen, setIsCastOpen] = useState(false);
  const [isManageListOpen, setIsManageListOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<PlaylistItem | null>(null);
  
  // Loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Load baseline configurations
  const loadBaseData = async () => {
    try {
      // Get profiles from admin
      const profileData = await api.getProfiles();
      setProfiles(profileData);

      // Get settings
      const settingsData = await api.getSettings();
      setSettings(settingsData);

      // Get playlists
      const playlistsData = await api.getPlaylists();
      setPlaylists(playlistsData);

      // Get all compiled contents
      const contentData = await api.getAllContent();
      setContent(contentData.channels);
    } catch (err) {
      console.error("Baseline loading failed", err);
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  // Sync profile-specific configurations when a profile is selected
  useEffect(() => {
    if (activeProfile) {
      const loadProfileData = async () => {
        try {
          const histData = await api.getHistory(activeProfile.id);
          setHistory(histData);

          const favData = await api.getFavorites(activeProfile.id);
          setFavorites(favData);
        } catch (err) {
          console.error("Profile sync failed", err);
        }
      };
      loadProfileData();
    }
  }, [activeProfile]);

  // Auth logins handlers
  const handleLoginSuccess = (userToken: string, remember: boolean) => {
    setToken(userToken);
    if (remember) {
      localStorage.setItem("picapau_token", userToken);
    }
  };

  const handleSelectProfile = (profile: Profile, visitorFlag: boolean) => {
    setActiveProfile(profile);
    setIsVisitor(visitorFlag);
    setCurrentTab("home");
    setActiveMedia(null);
  };

  const handleCreateProfile = async (name: string, avatar: string, isKids: boolean) => {
    setIsLoading(true);
    try {
      await api.createProfile(name, avatar, isKids);
      const updated = await api.getProfiles();
      setProfiles(updated);
    } catch (err: any) {
      alert("Falha ao criar perfil: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      await api.deleteProfile(id);
      const updated = await api.getProfiles();
      setProfiles(updated);
    } catch (err: any) {
      alert("Falha ao remover perfil: " + err.message);
    }
  };

  const handleLogout = () => {
    setActiveProfile(null);
    setIsVisitor(false);
    setToken(null);
    localStorage.removeItem("picapau_token");
    setActiveMedia(null);
  };

  // Playlists changes handlers
  const handleAddPlaylist = async (playlist: {
    name: string;
    description: string;
    url: string;
    format: "M3U" | "M3U8" | "XML" | "Xtream";
    autoUpdate: boolean;
  }) => {
    await api.createPlaylist(playlist);
    // Refresh applet states
    const playlistsData = await api.getPlaylists();
    setPlaylists(playlistsData);
    const contentData = await api.getAllContent();
    setContent(contentData.channels);
  };

  const handleRefreshPlaylist = async (id: string) => {
    await api.refreshPlaylist(id);
    const playlistsData = await api.getPlaylists();
    setPlaylists(playlistsData);
    const contentData = await api.getAllContent();
    setContent(contentData.channels);
  };

  const handleDeletePlaylist = async (id: string) => {
    await api.deletePlaylist(id);
    const playlistsData = await api.getPlaylists();
    setPlaylists(playlistsData);
    const contentData = await api.getAllContent();
    setContent(contentData.channels);
  };

  const handleImportBackup = async (backupStr: string) => {
    await api.restoreBackup(backupStr);
    const playlistsData = await api.getPlaylists();
    setPlaylists(playlistsData);
    const contentData = await api.getAllContent();
    setContent(contentData.channels);
    const profileData = await api.getProfiles();
    setProfiles(profileData);
  };

  const handleExportBackup = async () => {
    const backup = await api.getBackup();
    const blob = new Blob([backup], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `picapau-iptv-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Playback handlers
  const handlePlayMedia = (item: PlaylistItem) => {
    setActiveMedia(item);
    // Scroll player to top view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleFavorite = async (itemId: string) => {
    if (!activeProfile) return;
    const favorited = await api.toggleFavorite(activeProfile.id, itemId);
    if (favorited) {
      setFavorites(prev => [...prev, itemId]);
    } else {
      setFavorites(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSaveHistoryProgress = async (progress: number, duration: number) => {
    if (!activeProfile || !activeMedia) return;
    try {
      await api.saveHistory({
        profileId: activeProfile.id,
        itemId: activeMedia.id,
        name: activeMedia.name,
        category: activeMedia.category,
        logo: activeMedia.logo,
        progress,
        duration
      });

      // Silently sync local state
      const histData = await api.getHistory(activeProfile.id);
      setHistory(histData);
    } catch (err) {
      console.warn("Could not sync history progress", err);
    }
  };

  const handleClearHistory = async () => {
    if (!activeProfile) return;
    if (confirm("Deseja realmente limpar seu histórico de exibição?")) {
      await api.clearHistory(activeProfile.id);
      setHistory([]);
    }
  };

  // Navigation helper for adjacent episodes
  const handleNextEpisode = () => {
    if (!activeMedia || !activeMedia.season || !activeMedia.episode) return;
    const nextEp = content.find(item => 
      item.group === activeMedia.group && 
      item.season === activeMedia.season && 
      item.episode === (activeMedia.episode! + 1)
    );
    if (nextEp) {
      setActiveMedia(nextEp);
    } else {
      alert("Este é o último episódio disponível.");
    }
  };

  const handlePrevEpisode = () => {
    if (!activeMedia || !activeMedia.season || !activeMedia.episode) return;
    const prevEp = content.find(item => 
      item.group === activeMedia.group && 
      item.season === activeMedia.season && 
      item.episode === (activeMedia.episode! - 1)
    );
    if (prevEp) {
      setActiveMedia(prevEp);
    }
  };

  const activeSeriesEpisodes = activeMedia?.category === "series" 
    ? content.filter(c => c.group === activeMedia.group).sort((a,b) => (a.episode || 0) - (b.episode || 0))
    : [];

  // Theme application
  const activeThemeClass = settings.theme === "light" ? "bg-gray-50 text-gray-950" : "bg-[#050505] text-gray-100";

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
        {/* Background Mesh Glows */}
        <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-900/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center w-24 h-24 mb-6 rounded-3xl bg-gradient-to-tr from-[#b026ff] via-[#ff2a5f] to-[#00f0ff] p-[2px] animate-pulse">
            <div className="w-full h-full bg-[#0d0d16] rounded-3xl flex items-center justify-center text-5xl">
              🐦
            </div>
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white uppercase text-glow-blue">
            PICA-PAU IPTV
          </h1>
          <p className="text-xs font-mono text-neutral-500 mt-2 uppercase tracking-widest">
            Iniciando decodificadores e carregando listas premium...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in or no profile chosen yet: Render profile chooser grid
  if (!activeProfile) {
    return (
      <WelcomeScreen
        profiles={profiles}
        onSelectProfile={handleSelectProfile}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
        onLoginSuccess={handleLoginSuccess}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className={`min-h-screen flex ${activeThemeClass} transition-colors duration-300 relative overflow-hidden`}>
      {/* Background Mesh Glows */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-900/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none z-0"></div>
      
      {/* 1. LATERAL BAR */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenCast={() => setIsCastOpen(true)}
        onOpenManageList={() => setIsManageListOpen(true)}
        activeProfile={activeProfile}
        onLogout={handleLogout}
        isAdmin={!isVisitor}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 2. MAIN SECTION (DASHBOARD GRID) */}
      <div className="flex-1 lg:pl-64 min-w-0 flex flex-col min-h-screen">
        
        {/* Upper Header Nav */}
        <header className="sticky top-0 z-10 glass-panel border-b border-white/5 py-4 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black font-display tracking-tight text-white uppercase">
              PICA-PAU <span className="text-neon-blue">STREAM</span>
            </h1>
            <span className="hidden md:inline-block text-[9px] font-mono bg-[#b026ff]/20 text-[#b026ff] border border-[#b026ff]/30 px-2 py-0.5 rounded-md font-bold">
              PREMIUM IPTV
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Highlighted Casting Button */}
            <button
              onClick={() => setIsCastOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-xs font-bold text-[#00f0ff] border border-[#00f0ff]/30 transition-all active:scale-95 cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>📺 Transmitir para TV</span>
            </button>

            {/* Quick config shortcut */}
            <button
              onClick={() => setIsManageListOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-300 hover:text-white transition-all cursor-pointer"
              title="Gerenciar listas IPTV"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Core Frame Body */}
        <main className="flex-1 p-6 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* Active Cinema/VOD Player Stage (if set) */}
          <AnimatePresence>
            {activeMedia && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-neutral-400">Reproduzindo no Pica-Pau Player</span>
                  <button
                    onClick={() => setActiveMedia(null)}
                    className="text-xs text-neon-red hover:underline flex items-center gap-1 bg-neon-red/10 border border-neon-red/20 px-2.5 py-1 rounded-full font-bold transition-all"
                  >
                    ✕ Parar Reprodução
                  </button>
                </div>

                <PremiumPlayer
                  item={activeMedia}
                  onNextEpisode={activeMedia.category === "series" ? handleNextEpisode : undefined}
                  onPrevEpisode={activeMedia.category === "series" ? handlePrevEpisode : undefined}
                  onToggleFavorite={() => handleToggleFavorite(activeMedia.id)}
                  isFavorited={favorites.includes(activeMedia.id)}
                  onSaveHistoryProgress={handleSaveHistoryProgress}
                  episodesList={activeSeriesEpisodes}
                  onPlayEpisode={handlePlayMedia}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Active View tab */}
          {currentTab === "settings" ? (
            /* System Settings Form tab */
            <div className="space-y-6 max-w-2xl animate-fade-in">
              <div>
                <h3 className="text-xl font-bold font-display text-white">Configurações Gerais</h3>
                <p className="text-xs text-neutral-400">Personalize a qualidade de carregamento, tema e opções automáticas</p>
              </div>

              <div className="bg-dark-card/60 border border-white/5 rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Idioma Principal</label>
                    <select
                      value={settings.language}
                      onChange={(e) => {
                        const updated = { ...settings, language: e.target.value };
                        setSettings(updated);
                        api.saveSettings(updated);
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Tema Visual</label>
                    <select
                      value={settings.theme}
                      onChange={(e) => {
                        const updated = { ...settings, theme: e.target.value as any };
                        setSettings(updated);
                        api.saveSettings(updated);
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="dark">Modo Escuro (Recomendado)</option>
                      <option value="light">Modo Claro</option>
                      <option value="auto">Automático</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-medium text-gray-200">Reprodução Automática</span>
                      <span className="block text-xs text-neutral-400">Inicia canais ou episódios imediatamente ao abrir</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoPlay}
                      onChange={(e) => {
                        const updated = { ...settings, autoPlay: e.target.checked };
                        setSettings(updated);
                        api.saveSettings(updated);
                      }}
                      className="w-5 h-5 rounded border-white/10 bg-black text-neon-blue focus:ring-0"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-medium text-gray-200">Sincronização em Segundo Plano</span>
                      <span className="block text-xs text-neutral-400">Verifica atualizações das listas IPTV na inicialização</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoUpdatePlaylists}
                      onChange={(e) => {
                        const updated = { ...settings, autoUpdatePlaylists: e.target.checked };
                        setSettings(updated);
                        api.saveSettings(updated);
                      }}
                      className="w-5 h-5 rounded border-white/10 bg-black text-neon-blue focus:ring-0"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-medium text-gray-200">Ocultar Canais Adultos</span>
                      <span className="block text-xs text-neutral-400">Criptografa e remove conteúdos de faixa etária restrita XXX</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.adultHidden}
                      onChange={(e) => {
                        const updated = { ...settings, adultHidden: e.target.checked };
                        setSettings(updated);
                        api.saveSettings(updated);
                      }}
                      className="w-5 h-5 rounded border-white/10 bg-black text-neon-blue focus:ring-0"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-mono">Espaço de Cache Alocado: {settings.cacheLimitMB} MB</span>
                  <button
                    onClick={() => {
                      alert("Cache de mídia limpo com sucesso! 512MB desalocados.");
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-gray-300 transition-all active:scale-95 border border-white/5"
                  >
                    Limpar Cache de IPTV
                  </button>
                </div>
              </div>
            </div>
          ) : currentTab === "admin" ? (
            /* Privileged admin dashboard panel */
            <AdminPanel
              profiles={profiles}
              onRefreshProfiles={loadBaseData}
              onDeleteProfile={handleDeleteProfile}
            />
          ) : (
            /* Fallback to multi-categorized Dashboard component */
            <Dashboard
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              playlists={playlists}
              content={content}
              history={history}
              favorites={favorites}
              onPlayMedia={handlePlayMedia}
              onToggleFavorite={handleToggleFavorite}
              onClearHistory={handleClearHistory}
              profileIsKids={activeProfile.isKids}
            />
          )}

        </main>
      </div>

      {/* 3. FLOATING PORTAL OVERLAYS */}

      {/* Dedicated Playlist Management screen modal */}
      {isManageListOpen && (
        <ManageListModal
          playlists={playlists}
          onClose={() => setIsManageListOpen(false)}
          onAddPlaylist={handleAddPlaylist}
          onRefreshPlaylist={handleRefreshPlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onImportBackup={handleImportBackup}
          onExportBackup={handleExportBackup}
        />
      )}

      {/* Chromecast casting connection drawer modal */}
      {isCastOpen && (
        <CastModal
          activeMediaName={activeMedia?.name || "Transmissão IPTV Geral"}
          onClose={() => setIsCastOpen(false)}
        />
      )}

    </div>
  );
}
