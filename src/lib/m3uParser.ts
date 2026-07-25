import { PlaylistItem } from "../types";

export function parseM3UPlaylist(m3uText: string, forcedCategory?: string): PlaylistItem[] {
  const items: PlaylistItem[] = [];
  if (!m3uText) return items;

  const lines = m3uText.split(/\r?\n/);
  
  let currentMeta: {
    name?: string;
    logo?: string;
    group?: string;
    epgId?: string;
    duration?: string;
    season?: number;
    episode?: number;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    if (rawLine.startsWith("#EXTINF:")) {
      const durationMatch = rawLine.match(/#EXTINF:(-?\d+)/);
      const duration = durationMatch ? durationMatch[1] : "";

      const logoMatch = rawLine.match(/tvg-logo="([^"]+)"/) || rawLine.match(/logo="([^"]+)"/);
      const groupMatch = rawLine.match(/group-title="([^"]+)"/) || rawLine.match(/group="([^"]+)"/);
      const nameMatch = rawLine.match(/tvg-name="([^"]+)"/) || rawLine.match(/name="([^"]+)"/);
      const epgMatch = rawLine.match(/tvg-id="([^"]+)"/) || rawLine.match(/epg-id="([^"]+)"/);

      const commaIndex = rawLine.lastIndexOf(",");
      let displayName = commaIndex !== -1 ? rawLine.substring(commaIndex + 1).trim() : "";
      if (!displayName && nameMatch) {
        displayName = nameMatch[1];
      }

      currentMeta = {
        name: displayName,
        logo: logoMatch ? logoMatch[1] : undefined,
        group: groupMatch ? groupMatch[1] : "Geral",
        epgId: epgMatch ? epgMatch[1] : "",
        duration: duration !== "-1" && duration ? `${Math.floor(parseInt(duration) / 60)}m` : undefined,
      };

      if (displayName) {
        const seMatch = displayName.match(/[Ss](\d+)[Ee](\d+)/);
        if (seMatch) {
          currentMeta.season = parseInt(seMatch[1]);
          currentMeta.episode = parseInt(seMatch[2]);
        }
      }
    } else if (rawLine.startsWith("#EXTGRP:")) {
      if (currentMeta) {
        currentMeta.group = rawLine.replace("#EXTGRP:", "").trim();
      }
    } else if (!rawLine.startsWith("#")) {
      // It's a media URL or stream link line!
      let url = rawLine;

      // Fix missing protocol if line looks like domain or path (e.g. fidew,1_imu.../a.m3u8...)
      if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("pasted://") && !url.startsWith("rtmp://")) {
        if (url.includes(".") || url.includes("/")) {
          url = "https://" + url;
        }
      }

      // Generate meta if missing (raw link paste)
      let name = currentMeta?.name;
      if (!name) {
        try {
          const urlObj = new URL(url.startsWith("http") ? url : "https://" + url);
          const pathParts = urlObj.pathname.split("/").filter(Boolean);
          const lastPart = pathParts[pathParts.length - 1] || "Mídia";
          name = decodeURIComponent(lastPart)
            .replace(/\.[^/.]+$/, "") // remove extension (.mp4, .m3u8, etc)
            .replace(/[-_]/g, " ");
        } catch {
          name = `Mídia ${items.length + 1}`;
        }
      }

      if (!name || name.trim().length === 0) {
        name = `Mídia ${items.length + 1}`;
      }

      const logo = currentMeta?.logo || "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=100&h=100&fit=crop";
      const group = currentMeta?.group || "Importados";
      const epgId = currentMeta?.epgId || "";

      // Determine category
      let category: "tv" | "movie" | "series" | "sports" | "kids" | "news" | "music" | "documentary" | "adult" = "movie";

      if (forcedCategory && forcedCategory !== "auto" && forcedCategory !== "all") {
        category = forcedCategory as any;
      } else {
        const combinedText = `${name} ${group} ${url}`.toLowerCase();

        if (combinedText.includes("kids") || combinedText.includes("infantil") || combinedText.includes("desenho") || combinedText.includes("disney") || combinedText.includes("cartoon")) {
          category = "kids";
        } else if (combinedText.includes("sports") || combinedText.includes("esporte") || combinedText.includes("premiere") || combinedText.includes("futebol") || combinedText.includes("combate") || combinedText.includes("espn")) {
          category = "sports";
        } else if (combinedText.includes("news") || combinedText.includes("noticia") || combinedText.includes("jornal") || combinedText.includes("cnn") || combinedText.includes("globonews")) {
          category = "news";
        } else if (combinedText.includes("music") || combinedText.includes("musica") || combinedText.includes("mtv")) {
          category = "music";
        } else if (combinedText.includes("documentary") || combinedText.includes("documentario") || combinedText.includes("discovery") || combinedText.includes("history")) {
          category = "documentary";
        } else if (combinedText.includes("adulto") || combinedText.includes("adult") || combinedText.includes("xxx")) {
          category = "adult";
        } else if (currentMeta?.season !== undefined || combinedText.includes("s0") || combinedText.includes("s1") || combinedText.includes("temporada") || combinedText.includes("serie")) {
          category = "series";
        } else if (combinedText.includes("tv") || combinedText.includes("canal") || combinedText.includes("ao vivo") || combinedText.includes("live")) {
          category = "tv";
        } else {
          category = "movie";
        }
      }

      items.push({
        id: `media-${Math.random().toString(36).substring(2, 9)}`,
        name,
        logo,
        group,
        category,
        url,
        epgId,
        duration: currentMeta?.duration,
        season: currentMeta?.season,
        episode: currentMeta?.episode
      });

      // Reset meta after applying to this URL line
      currentMeta = null;
    }
  }

  return items;
}
