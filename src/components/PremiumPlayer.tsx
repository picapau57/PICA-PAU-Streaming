import React, { useRef, useState, useEffect } from "react";
import { PlaylistItem } from "../types";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, 
  Tv, Subtitles, Music, FastForward, SkipForward, SkipBack, 
  Layers, Info, Check, Monitor, Layout, PictureInPicture2, Sparkles, Star
} from "lucide-react";
import { motion } from "motion/react";
import Hls from "hls.js";

interface PremiumPlayerProps {
  item: PlaylistItem;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  onToggleFavorite?: () => void;
  isFavorited?: boolean;
  onSaveHistoryProgress?: (progress: number, duration: number) => void;
  onMarkEpisodeWatched?: (episodeId: string) => void;
  episodesList?: PlaylistItem[];
  onPlayEpisode?: (episode: PlaylistItem) => void;
}

export default function PremiumPlayer({
  item,
  onNextEpisode,
  onPrevEpisode,
  onToggleFavorite,
  isFavorited = false,
  onSaveHistoryProgress,
  onMarkEpisodeWatched,
  episodesList = [],
  onPlayEpisode
}: PremiumPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Settings dropdowns
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState<"Auto" | "1080p" | "720p" | "480p">("Auto");
  const [subtitle, setSubtitle] = useState<"Desativado" | "Português" | "Inglês">("Desativado");
  const [audioTrack, setAudioTrack] = useState<"Principal" | "Inglês (Original)" | "Comentários">("Principal");

  // Error/Fallback visualizer state (if source is blocked by CORS/cannot load in web frame)
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState(0);
  const [showUnlockInstructions, setShowUnlockInstructions] = useState(false);
  const [useProxy, setUseProxy] = useState(true);

  // EPG Mock updates for live channels
  const [epgTimeline, setEpgTimeline] = useState({
    title: "Programação ao Vivo",
    currentShow: "Transmissão Principal HD",
    start: "15:00",
    end: "17:00",
    progress: 45,
    nextShow: "Especiais da Noite Pica-Pau"
  });

  const hlsRef = useRef<Hls | null>(null);

  // Track Simulated streams if CORS or HLS fails
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasPlaybackError(false);
    setCurrentTime(0);
    setSimulatedTime(0);
    setIsPlaying(false);

    // Clean up any existing Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isM3U8 = item.url.includes(".m3u8") || item.url.includes("/m3u8") || item.url.includes("playlist");
    const finalUrl = useProxy && (item.url.startsWith("http://") || item.url.startsWith("https://"))
      ? `/api/stream-media?url=${encodeURIComponent(item.url)}`
      : item.url;

    if (isM3U8) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(finalUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.log("Autoplay blocked/failed, waiting for user interaction", err);
              setIsPlaying(false);
            });
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn("Fatal network error in HLS, attempting recovery...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn("Fatal media error in HLS, attempting recovery...");
                hls.recoverMediaError();
                break;
              default:
                console.error("Unrecoverable HLS error, showing fallback simulated player", data);
                setHasPlaybackError(true);
                hls.destroy();
                hlsRef.current = null;
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        video.src = finalUrl;
        video.addEventListener("loadedmetadata", () => {
          video.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.log("Autoplay blocked", err);
              setIsPlaying(false);
            });
        });
      } else {
        // HLS not supported at all, fallback
        setHasPlaybackError(true);
      }
    } else {
      // Standard video (MP4, etc.)
      video.src = finalUrl;
      video.load();
      video.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.log("Autoplay blocked or failed, waiting for user gesture", err);
          setIsPlaying(false);
        });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [item.url, useProxy]);

  // Handle Simulated time ticks
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && (hasPlaybackError || !videoRef.current)) {
      interval = setInterval(() => {
        setSimulatedTime((prev) => {
          const next = prev + 1;
          if (onSaveHistoryProgress && next % 5 === 0) {
            onSaveHistoryProgress(next, 7200); // simulate 2h duration
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, hasPlaybackError, item.url]);

  const togglePlay = () => {
    if (hasPlaybackError || !videoRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Failed to play on manual user trigger", err));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 0;
      setCurrentTime(current);
      setDuration(total);

      // Save watch progress to backend via prop callback every 5 seconds
      if (onSaveHistoryProgress && Math.floor(current) % 5 === 0) {
        onSaveHistoryProgress(current, total);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (hasPlaybackError || !videoRef.current) {
      setSimulatedTime(val);
      return;
    }
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleCinemaMode = () => {
    setIsCinemaMode(!isCinemaMode);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error("Fullscreen error", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  const triggerPictureInPicture = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.warn("PIP API failure", err);
      }
    }
  };

  // Format Helper: Seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    
    const mm = m < 10 ? `0${m}` : m;
    const ss = s < 10 ? `0${s}` : s;

    if (h > 0) {
      const hh = h < 10 ? `0${h}` : h;
      return `${hh}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const activeTime = hasPlaybackError ? simulatedTime : currentTime;
  const activeDuration = hasPlaybackError ? 7200 : (duration || 3600);

  return (
    <div id="premium-player-module" className="space-y-6">
      
      {/* Outer Video Frame with Cinema expansions */}
      <div 
        ref={containerRef}
        className={`relative rounded-2xl overflow-hidden bg-black border border-white/5 transition-all duration-500 shadow-2xl ${
          isCinemaMode ? "aspect-video md:aspect-[21/9] w-full" : "aspect-video w-full"
        }`}
      >
        {/* Real HTML5 Video element */}
        <video
          ref={videoRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onClick={togglePlay}
          onError={() => {
            console.warn("Video element triggered load error, reverting to simulated stream proxy screen");
            setHasPlaybackError(true);
          }}
          className={`w-full h-full object-contain ${hasPlaybackError ? "hidden" : "block"}`}
          muted={isMuted}
        />

        {hasPlaybackError && (
          showUnlockInstructions ? (
            /* Sandbox Fallback visualizer: Detailed Unblocking Instructions */
            <div className="absolute inset-0 bg-neutral-950/98 flex flex-col items-center justify-center p-6 text-white overflow-y-auto select-text">
              <div className="relative z-10 max-w-md w-full space-y-4">
                <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="tracking-wider">GUIA DE DESBLOQUEIO DE MÍDIA</span>
                </div>
                <h4 className="text-base font-bold text-white">Por que o player está simulado ("codificado")?</h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Este aplicativo roda sob uma conexão segura <strong>HTTPS</strong>. 
                  Sua lista IPTV e filmes utilizam links <strong>HTTP</strong> normais, ou possuem restrições de segurança <strong>CORS</strong>. 
                  Os navegadores modernos (Chrome, Edge, Firefox) bloqueiam este tipo de conteúdo misto por padrão para sua proteção.
                </p>
                
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs space-y-3 text-left">
                  <p className="font-semibold text-neon-blue">🔑 Como assistir de verdade em 30 segundos:</p>
                  <ol className="list-decimal pl-4 space-y-2 text-neutral-300">
                    <li>
                      <strong>Abra o App em Nova Guia:</strong> É mais fácil configurar fora do frame do AI Studio. 
                      <button 
                        onClick={() => window.open(window.location.origin, "_blank")}
                        className="ml-2 px-2 py-0.5 bg-neon-blue/20 text-neon-blue border border-neon-blue/40 rounded text-[10px] hover:bg-neon-blue/40 cursor-pointer font-bold inline-block"
                      >
                        Abrir em Nova Guia 🚀
                      </button>
                    </li>
                    <li>
                      No Chrome/Edge, clique no <strong>ícone de Ajustes / Cadeado 🔒 / Balões</strong> ao lado do link do site na barra de endereços (lado esquerdo).
                    </li>
                    <li>
                      Selecione <strong>"Configurações do site"</strong> (Site Settings).
                    </li>
                    <li>
                      Procure por <strong>"Conteúdo não seguro"</strong> (Insecure content) e mude para <strong>"Permitir"</strong> (Allow).
                    </li>
                    <li>
                      Retorne ao player e <strong>recarregue a página</strong>! A mídia carregará instantaneamente!
                    </li>
                  </ol>
                </div>

                <div className="flex gap-2 justify-end text-xs pt-1">
                  <button
                    onClick={() => window.open(item.url, "_blank")}
                    className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 text-neutral-300 cursor-pointer text-xs font-medium"
                  >
                    Abrir Link Direto do Canal 🔗
                  </button>
                  <button
                    onClick={() => setShowUnlockInstructions(false)}
                    className="px-4 py-2 bg-neon-blue text-white rounded-lg font-bold hover:bg-neon-blue/80 cursor-pointer text-xs"
                  >
                    Voltar ao Player
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Sandbox Fallback visualizer: Gorgeous IPTV simulated streaming display with info boxes */
            <div className="absolute inset-0 bg-radial from-[#131124] via-[#08080f] to-[#040408] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
              {/* Ambient Background Wave lines */}
              <div className="absolute inset-0 opacity-15 flex items-center justify-around pointer-events-none">
                <div className="w-[1px] h-full bg-gradient-to-t from-transparent via-neon-blue to-transparent animate-pulse" />
                <div className="w-[1px] h-full bg-gradient-to-t from-transparent via-neon-purple to-transparent animate-pulse" />
                <div className="w-[1px] h-full bg-gradient-to-t from-transparent via-neon-red to-transparent animate-pulse" />
              </div>

              {/* Glowing Sandbox stream screen */}
              <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
                <div className="relative w-20 h-20 mb-3 rounded-full bg-neutral-900 flex items-center justify-center text-3xl border-2 border-neon-blue/30 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
                  {item.logo ? (
                    <img src={item.logo} alt="" className="w-10 h-10 object-cover rounded-xl" referrerPolicy="no-referrer" />
                  ) : (
                    "🐦"
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-neon-purple text-white text-[8px] font-mono font-bold px-1 py-0.5 rounded-md">
                    LIVE PROXY
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-neon-blue uppercase">
                    📡 CONEXÃO SEGURA E ATIVA (SSL)
                  </span>
                  <h4 className="text-lg font-bold font-display text-white">{item.name}</h4>
                  <p className="text-xs text-neutral-400 max-w-xs line-clamp-2">
                    {item.description || "Iniciando codificador de mídia premium da lista IPTV pessoal..."}
                  </p>
                </div>

                {/* Warning box */}
                <div className="mt-3 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[11px] text-yellow-500 max-w-xs leading-relaxed">
                  ⚠️ Mídia bloqueada pelo navegador (Mixed Content / CORS). Os links HTTP são protegidos pelo HTTPS.
                </div>

                <div className="mt-3.5 flex items-center gap-2">
                  <button
                    onClick={() => setShowUnlockInstructions(true)}
                    className="px-3 py-1.5 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg text-xs font-bold hover:bg-neon-blue/40 cursor-pointer transition-all flex items-center gap-1"
                  >
                    🔓 Como Assistir?
                  </button>
                  <button
                    onClick={() => window.open(item.url, "_blank")}
                    className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg text-xs hover:bg-neutral-700 cursor-pointer transition-all flex items-center gap-1"
                  >
                    🔗 Abrir Link Direto
                  </button>
                </div>

                {/* Fluctuating equalizer wave bars to simulate live digital stream */}
                <div className="flex items-end justify-center gap-1 h-8 mt-5">
                  {[4, 8, 12, 6, 9, 14, 10, 5, 8, 11].map((h, idx) => (
                    <motion.div
                      key={idx}
                      animate={{
                        height: isPlaying ? [8, h * 2, 8] : 8,
                      }}
                      transition={{
                        duration: 0.8 + (idx * 0.1) % 0.5,
                        repeat: Infinity,
                      }}
                      className={`w-1 rounded-full ${
                        idx % 3 === 0 ? "bg-neon-blue" : idx % 3 === 1 ? "bg-neon-purple" : "bg-neon-red"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {/* Video Controls Layer (Shows on hover) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-20">
          
          {/* Top Controls: Meta Title */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-xl overflow-hidden border border-white/10">
                <img src={item.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-neon-blue uppercase tracking-wider font-bold">
                  {item.category === "tv" ? "TV ao Vivo" : item.category === "movie" ? "Filme" : "Série"}
                </span>
                <h4 className="text-sm font-bold text-white font-display leading-tight">{item.name}</h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={onToggleFavorite}
                className={`p-2 rounded-lg bg-black/40 hover:bg-black/60 border border-white/5 transition-all focus:outline-none cursor-pointer ${
                  isFavorited ? "text-yellow-500" : "text-white"
                }`}
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
              <div className="text-[10px] font-mono bg-neon-blue/10 text-neon-blue border border-neon-blue/30 px-2 py-0.5 rounded-full">
                720P MASTER
              </div>
            </div>
          </div>

          {/* Bottom Controls: Seek & Buttons */}
          <div className="space-y-3">
            {/* Progress Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-400">{formatTime(activeTime)}</span>
              <input
                type="range"
                min={0}
                max={activeDuration}
                value={activeTime}
                onChange={handleSeek}
                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neon-blue focus:outline-none"
              />
              <span className="text-xs font-mono text-neutral-400">
                {formatTime(activeDuration - activeTime)}
              </span>
            </div>

            {/* Buttons Bar */}
            <div className="flex items-center justify-between">
              
              {/* Playback actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onPrevEpisode}
                  disabled={!onPrevEpisode}
                  className="p-1.5 text-neutral-400 hover:text-white transition-colors disabled:opacity-35 focus:outline-none"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="p-2.5 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-md focus:outline-none cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
                </button>

                <button
                  onClick={onNextEpisode}
                  disabled={!onNextEpisode}
                  className="p-1.5 text-neutral-400 hover:text-white transition-colors disabled:opacity-35 focus:outline-none"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Volume slider */}
                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="text-neutral-400 hover:text-white focus:outline-none">
                    {isMuted ? <VolumeX className="w-5 h-5 text-neon-red" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/volume:w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white transition-all duration-300"
                  />
                </div>
              </div>

              {/* Format options */}
              <div className="flex items-center gap-3">
                {/* PIP / Cinema / Fullscreen */}
                <button
                  onClick={triggerPictureInPicture}
                  className="p-1.5 text-neutral-400 hover:text-neon-blue transition-colors focus:outline-none"
                  title="Picture in Picture"
                >
                  <PictureInPicture2 className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleCinemaMode}
                  className={`p-1.5 transition-colors focus:outline-none ${isCinemaMode ? "text-neon-purple" : "text-neutral-400 hover:text-white"}`}
                  title="Modo Cinema"
                >
                  <Layout className="w-4 h-4" />
                </button>

                {/* Settings Dropdown Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1.5 transition-colors focus:outline-none ${showSettings ? "text-neon-blue" : "text-neutral-400 hover:text-white"}`}
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Settings Menu Overlay */}
                  {showSettings && (
                    <div className="absolute bottom-10 right-0 w-52 bg-neutral-950/95 border border-white/10 rounded-xl p-3 space-y-3 shadow-2xl z-50 backdrop-blur-md">
                      <div>
                        <span className="block text-[9px] font-mono uppercase text-neutral-500 mb-1">Qualidade</span>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          {(["Auto", "1080p", "720p", "480p"] as const).map((q) => (
                            <button
                              key={q}
                              onClick={() => { setQuality(q); setShowSettings(false); }}
                              className={`py-1 rounded text-left px-2 flex items-center justify-between ${
                                quality === q ? "bg-neon-blue/20 text-neon-blue font-bold" : "hover:bg-white/5 text-neutral-400"
                              }`}
                            >
                              {q}
                              {quality === q && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[9px] font-mono uppercase text-neutral-500 mb-1">Legendas</span>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          {(["Desativado", "Português", "Inglês"] as const).map((sub) => (
                            <button
                              key={sub}
                              onClick={() => { setSubtitle(sub); setShowSettings(false); }}
                              className={`py-1 rounded text-left px-2 flex items-center justify-between ${
                                subtitle === sub ? "bg-neon-purple/20 text-neon-purple font-bold" : "hover:bg-white/5 text-neutral-400"
                              }`}
                            >
                              {sub}
                              {subtitle === sub && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[9px] font-mono uppercase text-neutral-500 mb-1">Velocidade</span>
                        <div className="grid grid-cols-3 gap-1 text-[9px] text-center">
                          {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => { handleSpeedChange(rate); setShowSettings(false); }}
                              className={`py-1 rounded ${
                                playbackRate === rate ? "bg-neon-red/20 text-neon-red font-bold" : "hover:bg-white/5 text-neutral-400"
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <span className="block text-[9px] font-mono uppercase text-neutral-500 mb-1">Servidor Proxy</span>
                        <button
                          onClick={() => setUseProxy(!useProxy)}
                          className={`w-full py-1.5 rounded text-left px-2 flex items-center justify-between text-[10px] ${
                            useProxy ? "bg-neon-blue/20 text-neon-blue font-bold" : "hover:bg-white/5 text-neutral-400"
                          }`}
                        >
                          <span>Proxy de Mídia</span>
                          <span className="text-[8px] px-1 py-0.5 bg-neutral-900 border border-white/10 rounded font-bold font-mono">
                            {useProxy ? "ON" : "OFF"}
                          </span>
                        </button>
                        <p className="text-[8px] text-neutral-500 mt-1 px-1 leading-tight">
                          Recomendado para burlar bloqueios (CORS/HTTP) do navegador.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 text-neutral-400 hover:text-white transition-colors focus:outline-none"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Under Player EPG info or Seasons/Episodes list */}
      <div className="bg-dark-card/50 border border-white/5 p-5 rounded-2xl">
        {item.category === "tv" || item.category === "sports" || item.category === "news" || item.category === "music" || item.category === "documentary" ? (
          /* Live EPG Timeline */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-neon-blue" />
                <span className="text-sm font-bold font-display text-white">Guia de Programação (EPG)</span>
              </div>
              <span className="text-xs font-mono text-neon-blue">Ao Vivo</span>
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-neutral-500">{epgTimeline.start} - {epgTimeline.end}</span>
                <h5 className="text-sm font-bold text-white">{epgTimeline.currentShow}</h5>
                <p className="text-xs text-neutral-400">Em exibição agora no sinal IPTV.</p>
              </div>
              
              <div className="w-full md:w-48 space-y-1.5">
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-neon-blue h-full rounded-full" style={{ width: `${epgTimeline.progress}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>Progresso: {epgTimeline.progress}%</span>
                  <span>Restam 55m</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-neutral-400 flex items-center gap-1.5 pl-1.5">
              <Info className="w-3.5 h-3.5 text-neon-purple" />
              <span>A seguir: <strong className="text-gray-200">{epgTimeline.nextShow}</strong></span>
            </div>
          </div>
        ) : item.category === "series" ? (
          /* Series episodes selector grid */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-neon-red" />
                <span className="text-sm font-bold font-display text-white">Episódios Disponíveis</span>
              </div>
              <span className="text-xs font-mono text-neutral-400">Temporada 1</span>
            </div>

            {episodesList.length === 0 ? (
              <p className="text-xs text-neutral-500 py-2">Nenhum episódio adicional encontrado nesta série.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {episodesList.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => onPlayEpisode && onPlayEpisode(ep)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left group/ep focus:outline-none ${
                      item.id === ep.id 
                        ? "bg-neon-red/10 border-neon-red/40" 
                        : "bg-black/20 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="relative w-20 aspect-video rounded-lg overflow-hidden shrink-0 bg-neutral-900">
                      <img src={ep.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white fill-current" />
                      </div>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h6 className="text-xs font-bold text-gray-200 truncate group-hover/ep:text-neon-red transition-colors">
                        S0{ep.season || 1}E0{ep.episode || 1}: {ep.name.replace(/.*Ep\s*\d+\s*:?/i, "") || "Episódio"}
                      </h6>
                      <p className="text-[10px] text-neutral-500 line-clamp-2 leading-tight">
                        {ep.description || "Reproduzir este episódio da série IPTV."}
                      </p>
                      {onMarkEpisodeWatched && (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkEpisodeWatched(ep.id);
                          }}
                          className="inline-flex items-center gap-1 text-[9px] font-mono text-neutral-500 hover:text-green-400 mt-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Assistido
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Movie details panel */
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-neutral-500">Sinopse de Cinema VOD</span>
                <h5 className="text-lg font-bold text-white font-display">{item.name}</h5>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {item.description || "Descrição detalhada do filme de ficção científica / drama importado da lista pessoal. Esta mídia possui codecs adaptáveis e reprodução continuada automática."}
                </p>
              </div>

              <div className="shrink-0 bg-[#0d0d16] border border-white/5 rounded-xl p-3 text-center space-y-2 min-w-[100px]">
                <span className="block text-[9px] font-mono text-neutral-500 uppercase">Duração</span>
                <span className="block text-xs font-bold text-neon-purple">{item.duration || "12m"}</span>
                <span className="block text-[9px] font-mono text-neutral-500 uppercase">Ano</span>
                <span className="block text-xs font-bold text-neon-blue">{item.year || "2012"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
