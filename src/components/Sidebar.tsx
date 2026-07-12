import React from "react";
import { 
  Home, Tv, Film, Clapperboard, Heart, ListCollapse, History, 
  Download, Settings, Radio, Layers, FolderHeart, User, 
  ShieldCheck, LogOut, Menu, X, ArrowLeftRight
} from "lucide-react";
import { motion } from "motion/react";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenCast: () => void;
  onOpenManageList: () => void;
  onOpenInstall: () => void;
  activeProfile: { name: string; avatar: string } | null;
  onLogout: () => void;
  isAdmin: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export default function Sidebar({
  currentTab,
  onTabChange,
  onOpenCast,
  onOpenManageList,
  onOpenInstall,
  activeProfile,
  onLogout,
  isAdmin,
  isOpen,
  onToggleOpen
}: SidebarProps) {
  
  const menuItems = [
    { id: "home", label: "Início", icon: Home, color: "text-neon-blue" },
    { id: "live", label: "TV Ao Vivo", icon: Tv, color: "text-neon-blue" },
    { id: "movies", label: "Filmes", icon: Film, color: "text-neon-purple" },
    { id: "series", label: "Séries", icon: Clapperboard, color: "text-neon-red" },
    { id: "favorites", label: "Favoritos", icon: Heart, color: "text-yellow-500" },
    { id: "categories", label: "Categorias", icon: ListCollapse, color: "text-neon-blue" },
    { id: "history", label: "Histórico", icon: History, color: "text-neutral-400" },
    { id: "downloads", label: "Downloads", icon: Download, color: "text-neon-blue" },
    { id: "library", label: "Biblioteca", icon: FolderHeart, color: "text-neon-purple" },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    if (window.innerWidth < 1024) {
      onToggleOpen(); // Close drawer on mobile click
    }
  };

  return (
    <>
      {/* Mobile Header Toggle hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={onToggleOpen}
          className="p-2.5 rounded-xl bg-dark-card border border-white/10 text-white shadow-lg shadow-black/50"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Frame container */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-black/40 backdrop-blur-2xl border-r border-white/5 p-5 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        
        {/* Brand Header */}
        <div className="space-y-6 pt-4 lg:pt-0">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-red-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)] p-[1px]">
              <span className="text-2xl font-black italic text-white">P</span>
            </div>
            <div>
              <span className="block text-sm font-extrabold font-display tracking-tight text-white uppercase leading-none">PICA-PAU</span>
              <span className="block text-[8px] font-mono text-neutral-400 tracking-widest uppercase">STREAMING IPTV</span>
            </div>
          </div>

          {/* Active Profile Info */}
          {activeProfile && (
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-red-500 border-2 border-white/20 flex items-center justify-center select-none shrink-0 shadow text-xl">
                {activeProfile.avatar}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] text-gray-500 font-mono">ASSISTINDO</span>
                <span className="block text-sm font-semibold text-gray-200 truncate">{activeProfile.name}</span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="block text-[9px] font-mono text-neutral-500 uppercase tracking-widest px-2 mb-2">MENU PRINCIPAL</span>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all text-left font-medium text-sm focus:outline-none cursor-pointer ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-500/20 to-transparent border-l-4 border-blue-500 text-blue-400" 
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-neutral-500"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions Area */}
        <div className="space-y-4">
          <span className="block text-[9px] font-mono text-neutral-500 uppercase tracking-widest px-2">UTILITÁRIOS</span>
          <div className="space-y-1">
            {/* Chromecast casting button */}
            <button
              onClick={onOpenCast}
              className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-neutral-300 hover:bg-neon-blue/10 hover:text-white transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-neon-blue" />
              <span>Transmitir para TV</span>
            </button>

            {/* Manage list modal button */}
            <button
              onClick={onOpenManageList}
              className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-neutral-300 hover:bg-neon-purple/10 hover:text-white transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-neon-purple" />
              <span>Gerenciar IPTV</span>
            </button>

            {/* Install app trigger */}
            <button
              onClick={onOpenInstall}
              className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200 transition-all cursor-pointer border border-cyan-500/10"
            >
              <Download className="w-4 h-4 text-cyan-400 animate-bounce" />
              <span className="flex items-center gap-1.5">
                Instalar Aplicativo
                <span className="bg-cyan-500/20 text-cyan-400 text-[8px] font-mono px-1.5 py-0.5 rounded-full uppercase leading-none font-extrabold shrink-0">PWA</span>
              </span>
            </button>

            {/* Configs tab */}
            <button
              onClick={() => handleTabClick("settings")}
              className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                currentTab === "settings" ? "bg-white/5 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 text-neutral-400" />
              <span>Configurações</span>
            </button>

            {/* Hidden admin trigger */}
            {isAdmin && (
              <button
                onClick={() => handleTabClick("admin")}
                className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === "admin" ? "bg-neon-red/10 text-white" : "text-neutral-300 hover:bg-neon-red/10 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-neon-red" />
                <span>Painel Admin</span>
              </button>
            )}

            {/* Switch user / log out */}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-neutral-400 hover:text-neon-red transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-neutral-500" />
              <span>Sair do Perfil</span>
            </button>
          </div>

          <div className="text-center pt-2 border-t border-white/5 text-[9px] font-mono text-neutral-600">
            Powered by Pica-Pau Core
          </div>
        </div>

      </div>

      {/* Sidebar background overlay on mobile */}
      {isOpen && (
        <div 
          onClick={onToggleOpen}
          className="lg:hidden fixed inset-0 bg-black/60 z-20"
        />
      )}
    </>
  );
}
