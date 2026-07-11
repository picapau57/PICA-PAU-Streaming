import React, { useState } from "react";
import { Profile } from "../types";
import { Lock, Eye, EyeOff, Plus, User, ShieldAlert, Sparkles, LogIn, MonitorPlay } from "lucide-react";
import { motion } from "motion/react";

interface WelcomeScreenProps {
  profiles: Profile[];
  onSelectProfile: (profile: Profile, isVisitor: boolean) => void;
  onCreateProfile: (name: string, avatar: string, isKids: boolean) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
  onLoginSuccess: (token: string, remember: boolean) => void;
  isLoading: boolean;
}

const AVATARS = ["🔴", "🟣", "🔵", "🟡", "🟢", "🔥", "🦄", "⚽", "🍿", "🚀", "🛸", "🐧", "🦁", "🦊", "👑", "🎸"];

export default function WelcomeScreen({
  profiles,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onLoginSuccess,
  isLoading
}: WelcomeScreenProps) {
  const [selectedProfileForLogin, setSelectedProfileForLogin] = useState<Profile | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileAvatar, setNewProfileAvatar] = useState("🔴");
  const [newProfileIsKids, setNewProfileIsKids] = useState(false);

  const [isVisitorMode, setIsVisitorMode] = useState(false);

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfileForLogin(profile);
    setPassword("");
    setError("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Por favor, digite a senha.");
      return;
    }

    try {
      // In the server.ts, username "picapau" is configured. 
      // The client calls the login API. Let's execute this.
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "picapau", password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Senha inválida.");
      }

      const data = await res.json();
      onLoginSuccess(data.token, rememberMe);
      if (selectedProfileForLogin) {
        onSelectProfile(selectedProfileForLogin, false);
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor.");
    }
  };

  const handleVisitorLogin = () => {
    // Visitor profile
    const visitorProfile: Profile = {
      id: "visitor",
      name: "Visitante",
      avatar: "👤",
      isKids: false
    };
    onSelectProfile(visitorProfile, true);
  };

  const handleCreateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    try {
      await onCreateProfile(newProfileName.trim(), newProfileAvatar, newProfileIsKids);
      setIsCreatingProfile(false);
      setNewProfileName("");
    } catch (err: any) {
      setError("Falha ao criar perfil: " + err.message);
    }
  };

  return (
    <div id="welcome-container" className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-gray-100 relative overflow-hidden">
      {/* Background Mesh Glows */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-900/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Splash Screen Brand Logo */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center mb-10 text-center relative z-10"
      >
        <div className="relative flex items-center justify-center w-24 h-24 mb-4 rounded-3xl bg-gradient-to-tr from-blue-500 via-purple-600 to-red-500 p-[1px] shadow-[0_0_30px_rgba(147,51,234,0.3)]">
          <div className="w-full h-full bg-[#050505] rounded-3xl flex items-center justify-center text-4xl font-bold select-none">
            🐦
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 mb-2 uppercase">
          PICA-PAU Streaming
        </h1>
        <p className="text-sm tracking-widest text-gray-400 uppercase font-mono">
          👑 Plataforma IPTV Pessoal Premium
        </p>
      </motion.div>

      {/* Profile Selection Grid */}
      {!selectedProfileForLogin && !isCreatingProfile && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-4xl flex flex-col items-center relative z-10"
        >
          <h2 className="text-2xl font-medium mb-8 text-gray-300 font-display">
            Quem está assistindo hoje?
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-10">
            {profiles.map((profile) => (
              <motion.div
                key={profile.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleProfileClick(profile)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleProfileClick(profile);
                  }
                }}
                tabIndex={0}
                role="button"
                className="group flex flex-col items-center focus:outline-none cursor-pointer select-none"
              >
                <div className="relative w-28 h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-5xl group-hover:border-blue-400 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] backdrop-blur shadow-md overflow-hidden mb-3">
                  {profile.avatar}
                  {profile.isKids && (
                    <span className="absolute bottom-1 right-1 text-[10px] font-mono bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-bold">
                      KIDS
                    </span>
                  )}
                </div>
                <span className="text-gray-300 group-hover:text-blue-400 font-medium transition-colors text-sm md:text-base">
                  {profile.name}
                </span>
                {profile.id !== "p1" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Excluir o perfil ${profile.name}?`)) {
                        onDeleteProfile(profile.id);
                      }
                    }}
                    className="mt-1 text-xs text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Excluir
                  </button>
                )}
              </motion.div>
            ))}

            {/* Create Profile Button */}
            {profiles.length < 5 && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreatingProfile(true)}
                className="group flex flex-col items-center focus:outline-none"
              >
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500 flex items-center justify-center transition-all duration-300 mb-3 bg-white/5 backdrop-blur">
                  <Plus className="w-8 h-8 text-neutral-500 group-hover:text-purple-400 transition-colors" />
                </div>
                <span className="text-neutral-500 group-hover:text-purple-400 font-medium transition-colors text-sm">
                  Adicionar Perfil
                </span>
              </motion.button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
            <button
              onClick={handleVisitorLogin}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 text-gray-200 rounded-xl transition-all font-medium text-sm backdrop-blur"
            >
              <User className="w-4 h-4 text-blue-400" />
              Modo Visitante
            </button>
          </div>
        </motion.div>
      )}

      {/* Login Password Screen */}
      {selectedProfileForLogin && !isCreatingProfile && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl relative z-10"
        >
          {/* Back to profiles button */}
          <button
            onClick={() => setSelectedProfileForLogin(null)}
            className="absolute top-4 left-4 text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full transition-all border border-white/5"
          >
            ← Perfis
          </button>

          <div className="flex flex-col items-center mb-6 mt-2">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-4xl mb-3 shadow-md backdrop-blur">
              {selectedProfileForLogin.avatar}
            </div>
            <h3 className="text-xl font-bold font-display text-gray-200">
              {selectedProfileForLogin.name}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Digite a senha de administrador para acessar
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Senha de Acesso (padrão: <span className="text-purple-400">picapau</span>)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 transition-all backdrop-blur"
                  autoFocus
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-xs text-red-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0 focus:ring-offset-0 focus:outline-none"
                />
                Lembrar neste navegador
              </label>
              <button
                type="button"
                onClick={handleVisitorLogin}
                className="text-blue-400 hover:underline font-medium"
              >
                Acessar sem senha (Visitante)
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? "Entrando..." : "Entrar no Sistema"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Create Profile Modal/Screen */}
      {isCreatingProfile && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl relative z-10"
        >
          <button
            onClick={() => setIsCreatingProfile(false)}
            className="absolute top-4 left-4 text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full transition-all border border-white/5"
          >
            ← Voltar
          </button>

          <h3 className="text-2xl font-bold font-display text-center text-gray-100 mb-6 mt-2">
            Criar Novo Perfil
          </h3>

          <form onSubmit={handleCreateProfileSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                Nome do Perfil
              </label>
              <input
                type="text"
                maxLength={18}
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Ex: Sala de TV, Meu Perfil"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 transition-all backdrop-blur"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                Escolha um Avatar
              </label>
              <div className="grid grid-cols-8 gap-2.5 p-3 bg-white/5 rounded-xl border border-white/10 max-h-36 overflow-y-auto backdrop-blur">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewProfileAvatar(emoji)}
                    className={`text-2xl p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all ${
                      newProfileAvatar === emoji ? "bg-purple-500/20 border border-purple-500/50 scale-110" : "border border-transparent"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur">
              <div>
                <span className="block text-sm font-medium text-gray-200">Perfil Infantil (Kids)</span>
                <span className="block text-xs text-gray-400">Oculta canais ou conteúdos de faixa etária restrita</span>
              </div>
              <input
                type="checkbox"
                checked={newProfileIsKids}
                onChange={(e) => setNewProfileIsKids(e.target.checked)}
                className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-purple-500 focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all cursor-pointer"
            >
              Criar Perfil
            </button>
          </form>
        </motion.div>
      )}

      {/* Desktop / TV Footer */}
      <div className="absolute bottom-6 flex items-center gap-2 text-xs font-mono text-neutral-500 select-none pointer-events-none">
        <MonitorPlay className="w-3.5 h-3.5" />
        <span>PICA-PAU IPTV PREMIUM ENGINE v1.2</span>
      </div>

    </div>
  );
}
