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
    rawContent?: string;
    classificationMode?: string;
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
  // Tab states
  const [activeFormTab, setActiveFormTab] = useState<"individual" | "full">("full");

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"M3U" | "M3U8" | "XML" | "Xtream">("M3U");
  const [autoUpdate, setAutoUpdate] = useState(true);

  // Raw Content form fields (Full List Tab)
  const [rawContent, setRawContent] = useState("");
  const [classificationMode, setClassificationMode] = useState<"auto" | "tv" | "movie" | "series">("auto");
  const [isDragging, setIsDragging] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [backupInput, setBackupInput] = useState("");
  const [showBackupInput, setShowBackupInput] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Live parser counter helper
  const countMediaInText = (text: string): number => {
    if (!text) return 0;
    const lines = text.split(/\r?\n/);
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("#EXTINF:")) {
        count++;
      }
    }
    // Fallback: if no #EXTINF but we have URLs (one link per line)
    if (count === 0) {
      const urls = lines.filter(line => {
        const l = line.trim();
        return l.startsWith("http://") || l.startsWith("https://") || l.includes("://");
      });
      count = urls.length;
    }
    return count;
  };

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setRawContent(text);
        if (!name) {
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          setName(baseName);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (activeFormTab === "individual") {
      if (!name.trim() || !url.trim()) {
        setError("Por favor, preencha o Nome e a URL da Playlist.");
        return;
      }
    } else {
      if (!name.trim() || !rawContent.trim()) {
        setError("Por favor, preencha o Nome e insira o Conteúdo da Lista.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (activeFormTab === "individual") {
        await onAddPlaylist({
          name: name.trim(),
          description: description.trim(),
          url: url.trim(),
          format,
          autoUpdate
        });
      } else {
        await onAddPlaylist({
          name: name.trim(),
          description: description.trim(),
          url: "", // empty URL for local direct paste
          format: "M3U",
          autoUpdate: false,
          rawContent: rawContent.trim(),
          classificationMode
        });
      }

      setSuccessMsg(
        activeFormTab === "individual" 
          ? "Lista IPTV importada e organizada com sucesso!" 
          : `Lista de reprodução importada com ${countMediaInText(rawContent)} mídias classificadas com sucesso!`
      );
      
      // Reset form fields
      setName("");
      setDescription("");
      setUrl("");
      setRawContent("");
      setFormat("M3U");
    } catch (err: any) {
      setError(err.message || "Erro ao importar playlist. Certifique-se de que o conteúdo ou URL é válido.");
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
    setActiveFormTab("individual");
  };

  return (
    <div id="manage-lists-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-5xl bg-dark-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden glass-panel"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-[#121225] to-dark-card">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-neon-blue" />
            <div>
              <h3 className="text-xl font-bold font-display text-white">+ Mídias ao Sistema</h3>
              <p className="text-xs text-neutral-400">Carregue vídeos, canais, músicas ou separe automaticamente filmes e séries por lote</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-h-[80vh] overflow-y-auto">
          
          {/* Left Column: Register New Playlist */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#0d0d16] p-5 rounded-xl border border-white/5 space-y-5">
              
              {/* Tab Toggles exactly like screenshot */}
              <div className="bg-black/40 p-1 rounded-2xl flex gap-2 border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveFormTab("individual")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    activeFormTab === "individual"
                      ? "bg-[#1f1f2e] text-white border border-white/10"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  + Mídia Individual
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab("full")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    activeFormTab === "full"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Importar Lista Completa (Filmes, Séries, Músicas...)
                </button>
              </div>

              {/* Form implementation */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {activeFormTab === "full" ? (
                  /* FULL LIST TAB */
                  <div className="space-y-5">
                    
                    {/* File Drop Area */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isDragging 
                          ? "border-cyan-400 bg-cyan-500/15 scale-[0.98]" 
                          : "border-white/10 hover:border-cyan-500/30 hover:bg-white/5"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".m3u,.m3u8,.txt"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileChange(e.target.files[0]);
                          }
                        }}
                      />
                      <Upload className={`w-10 h-10 mb-2 transition-transform ${isDragging ? "animate-bounce text-cyan-400" : "text-neutral-400"}`} />
                      <p className="text-xs font-bold text-gray-200">
                        Arraste sua lista de canais, filmes ou séries (.m3u ou .txt)
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        ou clique para <span className="text-cyan-400 font-semibold hover:underline">procurar arquivo</span>
                      </p>
                    </div>

                    {/* Copied text labels & Textarea with Auto Classify Shortcut */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-neutral-400">
                        <span className="font-extrabold uppercase tracking-wide">COLE AS MÍDIAS DA LISTA (FORMATO M3U OU UM LINK POR LINHA)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setClassificationMode("auto");
                            setSuccessMsg("Modo de classificação automática reativado com base em IA!");
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-extrabold flex items-center gap-1.5 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 hover:bg-cyan-500/25 transition-all cursor-pointer self-start sm:self-auto leading-none"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          SEPARAR AUTOMATICAMENTE CANAIS, SÉRIES E FILMES
                        </button>
                      </div>

                      <textarea
                        value={rawContent}
                        onChange={(e) => setRawContent(e.target.value)}
                        placeholder={`Exemplo de lista M3U:\n#EXTINF:-1 group-title="Filmes de Ação",Matrix (1999)\nhttps://servidor.com/matrix.mp4\n\n#EXTINF:-1 group-title="Séries",Stranger Things S01E01\nhttps://servidor.com/st_1_1.mp4`}
                        className="w-full h-44 bg-[#08080d] border border-white/10 rounded-2xl p-4 font-mono text-xs text-neutral-300 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                      />
                    </div>

                    {/* Metadata fields (Name & Description) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Nome da Lista</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Minha Lista IPTV"
                          className="w-full bg-dark-card border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                          required={activeFormTab === "full"}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Descrição</label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Ex: Canais do vovô e infantis"
                          className="w-full bg-dark-card border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    {/* MODO DE CLASSIFICAÇÃO / DESTINO PADRÃO */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wide">MODO DE CLASSIFICAÇÃO / DESTINO PADRÃO</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { value: "auto", label: "Automático (Ler tags)" },
                          { value: "tv", label: "Todos como Canais" },
                          { value: "movie", label: "Todos como Filmes" },
                          { value: "series", label: "Todos como Séries" }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setClassificationMode(opt.value as any)}
                            className={`py-2 px-3 rounded-xl text-[11px] font-extrabold transition-all border cursor-pointer text-center leading-tight ${
                              classificationMode === opt.value
                                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/5"
                                : "bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  /* INDIVIDUAL MEDIA TAB (CLASSIC WEB URL PLAYLIST) */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="text-xs font-bold text-neutral-400 uppercase">Registrar via Link de Internet</span>
                      <button
                        type="button"
                        onClick={handleLoadDemoList}
                        className="text-[10px] font-mono text-neon-purple hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Preencher Lista Demo
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Nome da Lista</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Canais Globais Premium"
                        className="w-full bg-dark-card border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-blue transition-all"
                        required={activeFormTab === "individual"}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Descrição</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Canais abertos de esportes e filmes"
                        className="w-full bg-dark-card border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-blue transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">URL da Playlist (M3U, M3U8, XML)</label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://exemplo.com/lista.m3u"
                        className="w-full bg-dark-card border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-blue transition-all"
                        required={activeFormTab === "individual"}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Formato</label>
                        <select
                          value={format}
                          onChange={(e) => setFormat(e.target.value as any)}
                          className="w-full bg-dark-card border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neon-blue transition-all cursor-pointer"
                        >
                          <option value="M3U">M3U</option>
                          <option value="M3U8">M3U8</option>
                          <option value="XML">XML</option>
                          <option value="Xtream">Xtream</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end pb-2">
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
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-neon-red/10 border border-neon-red/30 rounded-xl text-xs text-neon-red flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 flex items-start gap-2 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-95 text-xs font-bold text-white transition-all shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Importando...</span>
                    ) : (
                      <>
                        {activeFormTab === "individual" ? (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Adicionar Playlist</span>
                          </>
                        ) : (
                          <span>Importar {countMediaInText(rawContent)} Mídias →</span>
                        )}
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* Right Column: Active Playlists Grid & Backup Operations */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Playlists Active count */}
            <div className="space-y-4">
              <span className="block text-sm font-bold font-display text-gray-300">Suas Listas Importadas ({playlists.length})</span>
              
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {playlists.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-xl border border-white/5 border-dashed">
                    <Globe className="w-10 h-10 text-neutral-600 mb-2" />
                    <p className="text-sm text-neutral-400 font-medium">Nenhuma lista IPTV cadastrada.</p>
                    <p className="text-xs text-neutral-500 max-w-xs mt-1">Carregue a nossa lista demonstrativa ou cole uma lista completa para iniciar o catálogo de streaming.</p>
                  </div>
                ) : (
                  playlists.map((pl) => (
                    <div 
                      key={pl.id}
                      className="bg-[#0d0d16] border border-white/5 rounded-xl p-4 hover:border-white/15 transition-all relative overflow-hidden group"
                    >
                      {/* Status Glow Bar */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                        pl.status === "Online" ? "bg-green-500" : "bg-red-500"
                      }`} />

                      <div className="flex items-start justify-between mb-2">
                        <div className="truncate max-w-[180px]">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-100 group-hover:text-cyan-400 transition-colors truncate">{pl.name}</h4>
                            <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${
                              pl.status === "Online" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                            }`}>
                              {pl.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{pl.description}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Disable update for pasted static text lists */}
                          {!pl.url.startsWith("pasted://") && (
                            <button
                              onClick={() => handleRefresh(pl.id)}
                              disabled={refreshingId === pl.id}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-cyan-400 transition-all disabled:opacity-50 focus:outline-none cursor-pointer"
                              title="Sincronizar com Servidor Remoto"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${refreshingId === pl.id ? "animate-spin" : ""}`} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(pl.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-neon-red/20 text-neutral-300 hover:text-neon-red transition-all focus:outline-none cursor-pointer"
                            title="Remover Lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 bg-dark-card/50 p-2 rounded-lg border border-white/5 text-center text-[10px]">
                        <div>
                          <span className="block font-mono text-[11px] font-bold text-cyan-400">{pl.channelCount}</span>
                          <span className="block text-[8px] text-neutral-500 uppercase font-mono leading-none">Canais</span>
                        </div>
                        <div>
                          <span className="block font-mono text-[11px] font-bold text-neon-purple">{pl.movieCount}</span>
                          <span className="block text-[8px] text-neutral-500 uppercase font-mono leading-none">Filmes</span>
                        </div>
                        <div>
                          <span className="block font-mono text-[11px] font-bold text-neon-red">{pl.seriesCount}</span>
                          <span className="block text-[8px] text-neutral-500 uppercase font-mono leading-none">Séries</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 text-[9px] font-mono text-neutral-500">
                        <span className="truncate max-w-[130px]" title={pl.url}>URL: {pl.url.startsWith("pasted://") ? "Texto Colado" : pl.url}</span>
                        <span>Sinc: {new Date(pl.lastUpdated).toLocaleDateString()}</span>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Backup Operations */}
            <div className="bg-[#0d0d16]/50 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="block text-xs font-mono uppercase text-neutral-400">Backup & Manutenção</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleBackupExportClick}
                  className="flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-neon-blue" />
                  Exportar Configs
                </button>
                <button
                  onClick={() => setShowBackupInput(!showBackupInput)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 transition-all active:scale-95 cursor-pointer"
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
                    className="w-full bg-[#08080d] border border-white/10 rounded-xl p-2 text-[10px] font-mono text-neutral-300 h-24 focus:outline-none focus:border-neon-purple"
                  />
                  <button
                    onClick={handleBackupImportClick}
                    className="w-full py-1.5 bg-neon-purple hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Restaurar Cópia
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
