import React, { useState, useEffect } from "react";
import { X, Tv, RefreshCw, Radio, Volume2, Play, Pause, Square, Wifi, Check, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface CastModalProps {
  onClose: () => void;
  activeMediaName: string;
}

interface CastDevice {
  id: string;
  name: string;
  type: "Chromecast" | "Android TV" | "Fire TV" | "Google TV";
  status: "idle" | "connecting" | "connected";
}

const SAMPLE_DEVICES: CastDevice[] = [
  { id: "dev-1", name: "Sala de Estar (Chromecast Ultra)", type: "Chromecast", status: "idle" },
  { id: "dev-2", name: "Quarto Principal (Android TV 4K)", type: "Android TV", status: "idle" },
  { id: "dev-3", name: "Cozinha (Fire TV Stick Lite)", type: "Fire TV", status: "idle" },
  { id: "dev-4", name: "Suíte (Google TV)", type: "Google TV", status: "idle" }
];

export default function CastModal({ onClose, activeMediaName }: CastModalProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [devices, setDevices] = useState<CastDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<CastDevice | null>(null);
  const [error, setError] = useState("");

  // Simulated playback controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(70);
  const [castTime, setCastTime] = useState(0);

  useEffect(() => {
    // Simulate searching for devices on local area network
    const timer = setTimeout(() => {
      setDevices(SAMPLE_DEVICES);
      setIsScanning(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Cast timer ticker
  useEffect(() => {
    let interval: any = null;
    if (connectedDevice && isPlaying) {
      interval = setInterval(() => {
        setCastTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [connectedDevice, isPlaying]);

  const handleScanRetry = () => {
    setIsScanning(true);
    setDevices([]);
    setError("");
    setTimeout(() => {
      setDevices(SAMPLE_DEVICES);
      setIsScanning(false);
    }, 1800);
  };

  const connectToDevice = (device: CastDevice) => {
    setError("");
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: "connecting" } : d));

    setTimeout(() => {
      // Complete connection
      const updatedDevice: CastDevice = { ...device, status: "connected" };
      setConnectedDevice(updatedDevice);
      setCastTime(0);
      setIsPlaying(true);
    }, 1500);
  };

  const disconnectDevice = () => {
    if (connectedDevice) {
      setDevices(prev => prev.map(d => d.id === connectedDevice.id ? { ...d, status: "idle" } : d));
      setConnectedDevice(null);
    }
  };

  const toggleCastPlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatCastTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div id="cast-modal-view" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-dark-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden glass-panel"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-[#121225] to-dark-card">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-neon-blue animate-pulse" />
            <span className="text-base font-bold font-display text-white">Transmitir para Smart TV</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          
          {/* STATE 1: Searching for devices */}
          {isScanning && !connectedDevice && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <div className="relative flex items-center justify-center">
                {/* Concentric radar effect */}
                <div className="absolute w-20 h-20 bg-neon-blue/10 rounded-full animate-ping" />
                <div className="absolute w-14 h-14 bg-neon-blue/20 rounded-full animate-pulse" />
                <div className="relative w-12 h-12 bg-neon-blue/30 text-neon-blue rounded-full flex items-center justify-center">
                  <Wifi className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-200">Buscando Smart TVs na rede...</h4>
                <p className="text-xs text-neutral-500 max-w-xs">Certifique-se de que sua TV, Chromecast ou Firestick estejam conectados no mesmo Wi-Fi.</p>
              </div>
            </div>
          )}

          {/* STATE 2: Devices list found */}
          {!isScanning && !connectedDevice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400 uppercase">Dispositivos compatíveis ({devices.length})</span>
                <button 
                  onClick={handleScanRetry}
                  className="text-xs text-neon-blue hover:underline flex items-center gap-1 focus:outline-none"
                >
                  <RefreshCw className="w-3 h-3" /> Atualizar
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {devices.length === 0 ? (
                  <div className="p-5 bg-white/5 border border-white/5 rounded-xl text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    <span>Nenhum dispositivo encontrado.</span>
                  </div>
                ) : (
                  devices.map((dev) => (
                    <button
                      key={dev.id}
                      onClick={() => dev.status === "idle" && connectToDevice(dev)}
                      disabled={dev.status === "connecting"}
                      className="w-full flex items-center justify-between p-3.5 bg-black/30 hover:bg-black/50 border border-white/5 hover:border-white/10 rounded-xl transition-all text-left group focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <Tv className={`w-5 h-5 ${dev.status === "connecting" ? "text-neon-purple animate-bounce" : "text-neutral-400 group-hover:text-neon-blue transition-colors"}`} />
                        <div>
                          <span className="block text-sm font-bold text-gray-200 group-hover:text-white">{dev.name}</span>
                          <span className="block text-[10px] text-neutral-500 uppercase font-mono">{dev.type}</span>
                        </div>
                      </div>

                      <div>
                        {dev.status === "connecting" ? (
                          <span className="text-[10px] font-mono text-neon-purple font-bold animate-pulse">Conectando...</span>
                        ) : (
                          <span className="text-xs text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity font-medium">Conectar →</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STATE 3: Connected & Active remote controls */}
          {connectedDevice && (
            <div className="space-y-6">
              
              {/* Media Card */}
              <div className="p-4 bg-neon-blue/5 border border-neon-blue/15 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-xl overflow-hidden shadow">
                  📺
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[9px] font-mono uppercase text-neon-blue">Transmitindo para {connectedDevice.name}</span>
                  <h5 className="text-sm font-bold text-white truncate">{activeMediaName || "Canal IPTV ao Vivo"}</h5>
                  <span className="block text-[10px] font-mono text-neutral-400 mt-0.5">Tempo transmitido: {formatCastTime(castTime)}</span>
                </div>
              </div>

              {/* Connected Status bar */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-green-500 animate-pulse" /> Sinal excelente
                </span>
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Conectado
                </span>
              </div>

              {/* On screen remote control dials */}
              <div className="bg-[#08080c] border border-white/5 rounded-2xl p-5 space-y-5 text-center">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase">Controle Remoto de Transmissão</span>
                
                {/* Play/Pause/Stop Dial */}
                <div className="flex items-center justify-center gap-5">
                  <button
                    onClick={toggleCastPlay}
                    className="p-4 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-md focus:outline-none cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-0.5" />}
                  </button>

                  <button
                    onClick={disconnectDevice}
                    className="p-4 rounded-full bg-neon-red text-white hover:scale-105 active:scale-95 transition-all shadow-md focus:outline-none cursor-pointer"
                    title="Parar transmissão"
                  >
                    <Square className="w-6 h-6 fill-current" />
                  </button>
                </div>

                {/* Volume slider */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Volume da TV</span>
                    <span className="font-mono">{volume}%</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-neutral-500" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neon-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleScanRetry}
                    className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-300 transition-all font-mono"
                  >
                    Reconectar
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(true);
                      setCastTime(0);
                    }}
                    className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-300 transition-all font-mono"
                  >
                    Retomar
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
}
