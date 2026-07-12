import React, { useState } from "react";
import { 
  X, Smartphone, Monitor, Tv, Download, Info, CheckCircle2, 
  HelpCircle, ExternalLink, Chrome, Apple
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InstallAppModalProps {
  onClose: () => void;
  deferredPrompt: any;
  onTriggerInstall: () => void;
  isInstalled: boolean;
}

type DeviceTab = "auto" | "android" | "ios" | "pc" | "tv";

export default function InstallAppModal({
  onClose,
  deferredPrompt,
  onTriggerInstall,
  isInstalled
}: InstallAppModalProps) {
  const [activeTab, setActiveTab] = useState<DeviceTab>(
    deferredPrompt ? "auto" : "android"
  );
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleNativeInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await onTriggerInstall();
      setInstallSuccess(true);
    } catch (err) {
      console.error("Installation failed or cancelled by user:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Main modal frame */}
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className="relative w-full max-w-2xl bg-dark-card/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 z-10 flex flex-col max-h-[90vh]"
      >
        {/* Neon glow effect top accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-600 to-red-500" />

        {/* Modal Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Instalar PICA-PAU IPTV</h2>
              <p className="text-xs text-neutral-400">Tenha acesso rápido e ícone oficial direto no seu dispositivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Info Bar */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 flex items-start gap-3.5">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-cyan-300">Vantagens do Aplicativo Instalado:</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Inicialização instantânea de canais, sem barras de navegador atrapalhando, menor consumo de memória, modo tela cheia automática e compatibilidade completa com controle remoto de Smart TVs e TV Box.
              </p>
            </div>
          </div>

          {/* Native 1-Click Install Banner (if deferredPrompt exists) */}
          {deferredPrompt && !installSuccess && !isInstalled && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-black/30 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1 text-center sm:text-left">
                <span className="inline-block bg-blue-500/20 text-blue-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase mb-1">
                  Compatibilidade Ativa
                </span>
                <h3 className="text-base font-bold text-white">Instalação Direta Disponível</h3>
                <p className="text-xs text-neutral-300">Seu navegador suporta a instalação rápida em 1-Clique.</p>
              </div>
              <button
                onClick={handleNativeInstallClick}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Instalar Agora</span>
              </button>
            </div>
          )}

          {/* Success screen if installed */}
          {(installSuccess || isInstalled) && (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Aplicativo Instalado!</h3>
                <p className="text-xs text-neutral-300">
                  O PICA-PAU IPTV já está disponível na sua lista de aplicativos do celular, computador ou TV Box. Pode fechar o navegador e abri-lo pelo ícone oficial!
                </p>
              </div>
            </div>
          )}

          {/* Instructions Tabs Selector */}
          <div className="space-y-4">
            <span className="block text-xs font-mono text-neutral-400 uppercase tracking-widest">
              Guias de Instalação por Dispositivo
            </span>

            {/* Nav tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setActiveTab("android")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "android" 
                    ? "bg-white/10 text-white border-white/20 shadow-md" 
                    : "bg-black/20 text-neutral-400 border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Smartphone className="w-4 h-4 text-green-400" />
                <span>Android / TV Box</span>
              </button>

              <button
                onClick={() => setActiveTab("ios")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "ios" 
                    ? "bg-white/10 text-white border-white/20 shadow-md" 
                    : "bg-black/20 text-neutral-400 border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Apple className="w-4 h-4 text-neutral-200" />
                <span>iPhone / iOS</span>
              </button>

              <button
                onClick={() => setActiveTab("pc")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "pc" 
                    ? "bg-white/10 text-white border-white/20 shadow-md" 
                    : "bg-black/20 text-neutral-400 border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Computador</span>
              </button>

              <button
                onClick={() => setActiveTab("tv")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "tv" 
                    ? "bg-white/10 text-white border-white/20 shadow-md" 
                    : "bg-black/20 text-neutral-400 border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Tv className="w-4 h-4 text-purple-400" />
                <span>Smart TV</span>
              </button>
            </div>

            {/* Tabs content render */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
              {activeTab === "android" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Chrome className="w-5 h-5 text-green-400 animate-pulse" />
                    <h4 className="text-sm font-bold text-white">Instalar no Android, Mi Box, FireStick ou TV Box</h4>
                  </div>
                  <ul className="space-y-3 text-xs text-neutral-300">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">1</span>
                      <p>Abra este site no navegador <strong>Google Chrome</strong> do seu dispositivo.</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">2</span>
                      <p>Clique no botão <strong>"Instalar Agora"</strong> no topo deste banner se disponível.</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">3</span>
                      <p>Caso não apareça o botão, toque nos <strong>três pontinhos (menu)</strong> no canto superior direito do Chrome.</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">4</span>
                      <p>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong> e confirme.</p>
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === "ios" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Apple className="w-5 h-5 text-neutral-300 animate-pulse" />
                    <h4 className="text-sm font-bold text-white">Instalar no iPhone, iPad ou Safari</h4>
                  </div>
                  <ul className="space-y-3 text-xs text-neutral-300">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">1</span>
                      <p>Abra o site obrigatoriamente no navegador padrão <strong>Safari</strong> do iOS.</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">2</span>
                      <p>Toque no ícone de <strong>Compartilhar</strong> (o quadrado com uma seta para cima, na barra inferior).</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">3</span>
                      <p>Role o menu para baixo e selecione a opção <strong>"Adicionar à Tela de Início"</strong>.</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">4</span>
                      <p>Toque em <strong>"Adicionar"</strong> no canto superior direito. O ícone oficial aparecerá na sua tela de apps!</p>
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === "pc" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Monitor className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <h4 className="text-sm font-bold text-white">Instalar no Computador ou Notebook</h4>
                  </div>
                  <ul className="space-y-3 text-xs text-neutral-300">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">1</span>
                      <p>No navegador <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>, olhe para a barra de digitação de URL.</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">2</span>
                      <p>No final da barra de endereço (onde você digita o site), procure por um pequeno ícone de <strong>computador com uma seta [🖥️+]</strong> ou <strong>"Instalar Aplicativo"</strong>.</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">3</span>
                      <p>Clique neste ícone e depois confirme em <strong>"Instalar"</strong>.</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">4</span>
                      <p>Pronto! O aplicativo abrirá em uma janela exclusiva sem bordas e criará um atalho oficial na sua Área de Trabalho.</p>
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === "tv" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Tv className="w-5 h-5 text-purple-400 animate-pulse" />
                    <h4 className="text-sm font-bold text-white">Instalar e Acessar na Smart TV (LG, Samsung, Android TV)</h4>
                  </div>
                  <ul className="space-y-3 text-xs text-neutral-300">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">1</span>
                      <p><strong>Navegador Web:</strong> Abra o navegador de internet da sua TV (LG WebOS browser, Samsung Tizen browser ou Chrome/Puffin na Android TV) e digite o endereço deste site.</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">2</span>
                      <p><strong>Favoritos/Atalho:</strong> Para evitar ter que digitar o endereço toda vez, salve a página nos <strong>favoritos</strong> da TV ou clique no ícone de "estrela/página inicial" no navegador da TV.</p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">3</span>
                      <p><strong>TV Box/Android TV (Dica de Ouro):</strong> Baixe o aplicativo gratuito <strong>"Downloader"</strong> na Google Play Store da sua TV, insira a URL e instale o PWA diretamente!</p>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/5 bg-black/25 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <HelpCircle className="w-4 h-4 text-neutral-500" />
            <span>Precisa de ajuda com o PWA?</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white transition-all cursor-pointer active:scale-95"
          >
            Fechar Janela
          </button>
        </div>
      </motion.div>
    </div>
  );
}
