import React, { useState, useEffect } from "react";
import { SystemLog, Profile } from "../types";
import { api } from "../lib/api";
import { 
  ShieldCheck, Terminal, Users, Database, Clipboard, Check, 
  Trash2, AlertTriangle, Play, RefreshCw, Upload, Download 
} from "lucide-react";
import { motion } from "motion/react";

interface AdminPanelProps {
  profiles: Profile[];
  onRefreshProfiles: () => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
}

export default function AdminPanel({
  profiles,
  onRefreshProfiles,
  onDeleteProfile
}: AdminPanelProps) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [backupString, setBackupString] = useState("");
  const [copied, setCopied] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [adminMsg, setAdminMsg] = useState("");
  const [adminErr, setAdminErr] = useState("");

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportBackup = async () => {
    setAdminMsg("");
    setAdminErr("");
    try {
      const backup = await api.getBackup();
      setBackupString(backup);
      setAdminMsg("Backup gerado com sucesso! Copie a string abaixo.");
    } catch (err: any) {
      setAdminErr("Erro ao gerar backup: " + err.message);
    }
  };

  const handleCopyBackup = () => {
    if (!backupString) return;
    navigator.clipboard.writeText(backupString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = async () => {
    setAdminMsg("");
    setAdminErr("");
    if (!restoreInput.trim()) {
      setAdminErr("Cole um JSON de backup válido.");
      return;
    }

    try {
      await api.restoreBackup(restoreInput.trim());
      setAdminMsg("Backup restaurado! O sistema foi atualizado.");
      setRestoreInput("");
      onRefreshProfiles();
      fetchLogs();
    } catch (err: any) {
      setAdminErr("Erro ao restaurar backup: " + err.message);
    }
  };

  return (
    <div id="admin-panel-container" className="space-y-8 animate-fade-in">
      
      {/* Title section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-display text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-neon-red" />
            PAINEL ADMINISTRATIVO PRIVADO
          </h2>
          <p className="text-xs text-neutral-400">Gerenciamento avançado de usuários, auditoria de logs e backup do Pica-Pau Streaming</p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-mono text-gray-300 rounded-lg border border-white/5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recarregar Painel
        </button>
      </div>

      {adminMsg && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400">
          {adminMsg}
        </div>
      )}

      {adminErr && (
        <div className="p-4 bg-neon-red/10 border border-neon-red/30 rounded-xl text-xs text-neon-red">
          {adminErr}
        </div>
      )}

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel Left: Profiles management */}
        <div className="lg:col-span-4 bg-dark-card/60 p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Users className="w-5 h-5 text-neon-blue" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">Perfis Ativos</h3>
          </div>

          <div className="space-y-2">
            {profiles.map((p) => (
              <div 
                key={p.id}
                className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.avatar}</span>
                  <div>
                    <span className="block text-sm font-bold text-gray-200">{p.name}</span>
                    <span className="block text-[9px] font-mono text-neutral-500 uppercase">
                      {p.isKids ? "Restrito (KIDS)" : "Acesso Livre"}
                    </span>
                  </div>
                </div>

                {p.id !== "p1" && (
                  <button
                    onClick={() => {
                      if (confirm(`Excluir o perfil ${p.name}?`)) {
                        onDeleteProfile(p.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-neon-red/20 text-neutral-400 hover:text-neon-red transition-all focus:outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panel Middle: Backup and Restore operations */}
        <div className="lg:col-span-8 bg-dark-card/60 p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Database className="w-5 h-5 text-neon-purple" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">Manutenção de Banco de Dados</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400 uppercase">Fazer Cópia de Segurança</span>
                <button
                  onClick={handleExportBackup}
                  className="px-3 py-1.5 bg-neon-purple hover:opacity-90 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Gerar Backup
                </button>
              </div>

              {backupString ? (
                <div className="space-y-2">
                  <textarea
                    readOnly
                    value={backupString}
                    className="w-full h-32 bg-[#08080c] border border-white/10 rounded-xl p-2.5 text-[9px] font-mono text-neutral-400 select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyBackup}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    {copied ? "Copiado!" : "Copiar Backup"}
                  </button>
                </div>
              ) : (
                <div className="h-32 bg-[#08080c] border border-dashed border-neutral-800 rounded-xl flex items-center justify-center text-xs text-neutral-500 text-center px-4">
                  Clique no botão acima para gerar a string de backup unificada.
                </div>
              )}
            </div>

            {/* Import */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400 uppercase">Restaurar Banco de Dados</span>
                <button
                  onClick={handleRestore}
                  className="px-3 py-1.5 bg-neon-red hover:opacity-90 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Importar Backup
                </button>
              </div>

              <textarea
                value={restoreInput}
                onChange={(e) => setRestoreInput(e.target.value)}
                placeholder="Cole a string JSON de backup aqui..."
                className="w-full h-32 bg-[#08080c] border border-white/10 rounded-xl p-2.5 text-[9px] font-mono text-neutral-400 focus:outline-none focus:border-neon-red"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Auditing System Logs (Terminal-style display) */}
      <div className="bg-[#040408] border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">Logs de Auditoria de Segurança</h3>
          </div>
          <span className="text-[10px] font-mono text-green-500">REAL-TIME TELEMETRY</span>
        </div>

        <div className="bg-[#08080d] border border-white/10 rounded-xl p-4 font-mono text-[11px] text-green-400/90 h-64 overflow-y-auto space-y-2">
          {isLoadingLogs ? (
            <div className="text-center py-10 text-neutral-500">Lendo logs do terminal...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">Nenhum evento registrado.</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <span className="text-neutral-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                  log.type === "security" ? "bg-red-900/30 text-red-400" :
                  log.type === "warning" ? "bg-yellow-900/30 text-yellow-400" :
                  log.type === "error" ? "bg-neon-red/30 text-white" : "bg-blue-900/30 text-blue-400"
                }`}>
                  {log.type.toUpperCase()}
                </span>
                <span className="text-gray-300 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
