import React, { useState } from "react";
import { PlaylistMeta } from "../types";
import { 
  X, Plus, RefreshCw, Trash2, Globe, FileText, CheckCircle2, 
  XCircle, Upload, Download, AlertCircle, Sparkles, Layers 
} from "lucide-react";
import { motion } from "motion/react";

interface ManageListModalProps {
  playlists: PlaylistMeta[];
  onClose: () => void;
  onAddPlaylist: (playlist: {
    name: string;
    description: string;
    url: string;
    format: "M3U" | "M3U8" | "XML" | "Xtream";
    autoUpdate: boolean;
  }) => Promise<void>;
  onRefreshPlaylist: (id: string) => Promise<void>;
  onDeletePlaylist: (id: string) => Promise<void>;
  onImportBackup: (backupStr: string) => Promise<void>;
  onExportBackup: () => Promise<void>;
}

export default function ManageListModal({
  playlists,
  onClose,
  onAddPlaylist,
  onRefreshPlaylist,
  onDeletePlaylist,
  onImportBackup,
  onExportBackup
}: ManageListModalProps) {
  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"M3U" | "M3U8" | "XML" | "Xtream">("M3U");
  const [autoUpdate, setAutoUpdate] = useState(true);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [backupInput, setBackupInput] = useState("");
  const [showBackupInput, setShowBackupInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name.trim() || !url.trim()) {
      setError("Por favor, preencha o Nome e a URL da Playlist.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPlaylist({
        name: name.trim(),
        description: description.trim(),
        url: url.trim(),
        format,
        autoUpdate
      });

      setSuccessMsg("Lista IPTV importada e organizada com sucesso!");
      // Reset form
      setName("");
      setDescription("");
      setUrl("");
      setFormat("M3U");
    } catch (err: any) {
      setError(err.message || "Erro ao importar playlist. Certifique-se de que a URL é acessível.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    setError("");
    setSuccessMsg("");
    try {
      await onRefreshPlaylist(id);
      setSuccessMsg("Lista atualizada com sucesso!");
    } catch (err: any) {
      setError("Falha ao sincronizar lista: " + err.message);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta playlist? Todos os canais associados serão removidos do catálogo.")) {
      return;
    }
    setError("");
    setSuccessMsg("");
    try {
      await onDeletePlaylist(id);
      setSuccessMsg("Playlist removida com sucesso.");
    } catch (err: any) {
      setError("Falha ao excluir lista: " + err.message);
    }
  };

  const handleBackupExportClick = async () => {
    setError("");
    setSuccessMsg("");
    try {
      await onExportBackup();
      setSuccessMsg("Cópia de segurança gerada. Ela foi gravada no histórico de logs.");
    } catch (err: any) {
      setError("Falha ao exportar backup: " + err.message);
    }
  };

  const handleBackupImportClick = async () => {
    setError("");
    setSuccessMsg("");
    if (!backupInput.trim()) {
      setError("Insira o texto de backup copiado anteriormente.");
      return;
    }

    try {
      await onImportBackup(backupInput.trim());
      setSuccessMsg("Backup restaurado e playlists carregadas com sucesso!");
      setBackupInput("");
      setShowBackupInput(false);
    } catch (err: any) {
      setError("Texto de backup inválido: " + err.message);
    }
  };

  // Preloaded sample IPTV list helper to simplify testing for the user
  const handleLoadDemoList = () => {
    setName("Canais Abertos Brasil");
    setDescription("Lista gratuita com canais nacionais abertos de notícias, cultura e entretenimento");
    setUrl("https://raw.githubusercontent.com/picapau/demo-iptv/main/playlist.m3u");
    setFormat("M3U");
  };

  return (
    <div id="manage-lists-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-4xl bg-dark-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden glass-panel"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-[#121225] to-dark-card">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-neon-blue" />
            <div>
              <h3 className="text-xl font-bold font-display text-white">Gerenciar Listas IPTV</h3>
              <p className="text-xs text-neutral-400">Insira, edite e sincronize suas playlists M3U / M3U8 autorizadas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-h-[80vh] overflow-y-auto">
          
          {/* Left Column: Register New Playlist */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0d0d16] p-5 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-display text-neon-blue">Adicionar Nova Lista</span>
                <button
                  type="button"
                  onClick={handleLoadDemoList}
                  className="text-[10px] font-mono text-neon-purple hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Preencher Demo
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Nome da Lista</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Canais Globais Premium"
                    className="w-full bg-dark-card border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-neon-blue transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Descrição</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Canais abertos de esportes e filmes"
                    className="w-full bg-dark-card border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-neon-blue transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">URL da Playlist (M3U, M3U8, XML)</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://exemplo.com/lista.m3u"
                    className="w-full bg-dark-card border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-neon-blue transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Formato</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as any)}
                      className="w-full bg-dark-card border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-neon-blue transition-all cursor-pointer"
                    >
                      <option value="M3U">M3U</option>
                      <option value="M3U8">M3U8</option>
                      <option value="XML">XML</option>
                      <option value="Xtream">Xtream</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400 select-none">
                      <input
                        type="checkbox"
                        checked={autoUpdate}
                        onChange={(e) => setAutoUpdate(e.target.checked)}
                        className="rounded border-white/10 bg-dark-card text-neon-blue focus:ring-0"
                      />
                      Auto-atualizar
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-neon-red/10 border border-neon-red/30 rounded-lg text-xs text-neon-red flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-neon-blue hover:bg-neon-blue/90 active:scale-95 text-black font-bold rounded-lg text-sm transition-all shadow-md shadow-neon-blue/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? "Organizando..." : "Adicionar Playlist"}
                </button>
              </form>
            </div>

            {/* Backup Operations */}
            <div className="bg-[#0d0d16]/50 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="block text-xs font-mono uppercase text-neutral-400">Backup & Manutenção</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleBackupExportClick}
                  className="flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-neon-blue" />
                  Exportar Configs
                </button>
                <button
                  onClick={() => setShowBackupInput(!showBackupInput)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 transition-all active:scale-95 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-neon-purple" />
                  Importar Backup
                </button>
              </div>

              {showBackupInput && (
                <div className="space-y-2 mt-2">
                  <textarea
                    value={backupInput}
                    onChange={(e) => setBackupInput(e.target.value)}
                    placeholder="Cole aqui o texto JSON de backup..."
                    className="w-full bg-[#08080d] border border-white/10 rounded-lg p-2 text-[10px] font-mono text-neutral-300 h-24 focus:outline-none focus:border-neon-purple"
                  />
                  <button
                    onClick={handleBackupImportClick}
                    className="w-full py-1.5 bg-neon-purple hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Restaurar Cópia
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Playlists Grid */}
          <div className="lg:col-span-7 space-y-4">
            <span className="block text-sm font-bold font-display text-gray-300">Suas Listas Importadas ({playlists.length})</span>
            
            <div className="space-y-4">
              {playlists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-xl border border-white/5 border-dashed">
                  <Globe className="w-10 h-10 text-neutral-600 mb-2" />
                  <p className="text-sm text-neutral-400 font-medium">Nenhuma lista IPTV cadastrada.</p>
                  <p className="text-xs text-neutral-500 max-w-xs mt-1">Carregue a nossa lista demonstrativa ou cole uma URL M3U autorizada para iniciar o catálogo de streaming.</p>
                </div>
              ) : (
                playlists.map((pl) => (
                  <div 
                    key={pl.id}
                    className="bg-[#0d0d16] border border-white/5 rounded-xl p-5 hover:border-white/15 transition-all relative overflow-hidden group"
                  >
                    {/* Status Glow Bar */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                      pl.status === "Online" ? "bg-green-500" : "bg-red-500"
                    }`} />

                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-gray-100 group-hover:text-neon-blue transition-colors">{pl.name}</h4>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            pl.status === "Online" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {pl.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{pl.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRefresh(pl.id)}
                          disabled={refreshingId === pl.id}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-neon-blue transition-all disabled:opacity-50 focus:outline-none"
                          title="Sincronizar com Servidor Remoto"
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshingId === pl.id ? "animate-spin" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(pl.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-neon-red/20 text-neutral-300 hover:text-neon-red transition-all focus:outline-none"
                          title="Remover Lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-dark-card/50 p-2.5 rounded-lg border border-white/5 text-center text-xs">
                      <div>
                        <span className="block font-mono text-xs font-bold text-neon-blue">{pl.channelCount}</span>
                        <span className="block text-[10px] text-neutral-500 uppercase font-mono">Canais Ao Vivo</span>
                      </div>
                      <div>
                        <span className="block font-mono text-xs font-bold text-neon-purple">{pl.movieCount}</span>
                        <span className="block text-[10px] text-neutral-500 uppercase font-mono">VOD Filmes</span>
                      </div>
                      <div>
                        <span className="block font-mono text-xs font-bold text-neon-red">{pl.seriesCount}</span>
                        <span className="block text-[10px] text-neutral-500 uppercase font-mono">VOD Séries</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-neutral-500">
                      <span className="truncate max-w-[200px]" title={pl.url}>URL: {pl.url}</span>
                      <span>Sincronia: {new Date(pl.lastUpdated).toLocaleDateString()}</span>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
