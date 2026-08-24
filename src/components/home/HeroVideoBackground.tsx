import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const YT_VIDEO_ID = "A4ahpJ7ZAaw";
const START_VOLUME = 12;

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
  setVolume: (n: number) => void;
  getVolume: () => number;
  destroy: () => void;
};

type YTNamespace = {
  Player: new (
    el: HTMLElement | string,
    opts: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: () => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; CUED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[data-yt-api]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.dataset["ytApi"] = "true";
      document.head.appendChild(s);
    }
  });

  return apiPromise;
}

type HeroVideoBackgroundProps = {
  className?: string;
};

export function HeroVideoBackground({ className }: HeroVideoBackgroundProps) {
  const { t } = useLang();
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(START_VOLUME);
  const [needsGesture, setNeedsGesture] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let player: YTPlayer | null = null;

    void loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT?.Player) return;

      player = new window.YT.Player(hostRef.current, {
        videoId: YT_VIDEO_ID,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          loop: 1,
          playlist: YT_VIDEO_ID,
          mute: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            playerRef.current = e.target;
            e.target.setVolume(START_VOLUME);
            e.target.unMute();
            e.target.playVideo();
            setReady(true);
            setMuted(false);
            setVolume(START_VOLUME);

            // Browsers often block unmuted autoplay — detect and offer a tap
            window.setTimeout(() => {
              if (cancelled) return;
              const state = e.target.getPlayerState();
              const playingNow = state === window.YT!.PlayerState.PLAYING;
              if (!playingNow) {
                e.target.mute();
                e.target.playVideo();
                setMuted(true);
                setNeedsGesture(true);
              }
              setPlaying(e.target.getPlayerState() === window.YT!.PlayerState.PLAYING);
            }, 700);
          },
          onStateChange: (e) => {
            if (cancelled || !window.YT) return;
            setPlaying(e.data === window.YT.PlayerState.PLAYING);
            if (e.data === window.YT.PlayerState.ENDED) {
              e.target.playVideo();
            }
          },
          onError: () => {
            if (!cancelled) setNeedsGesture(true);
          },
        },
      });
      playerRef.current = player;
    });

    const onVis = () => {
      const p = playerRef.current;
      if (!p) return;
      if (document.hidden) p.pauseVideo();
      else if (!needsGesture) p.playVideo();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
    // needsGesture intentionally omitted — only used inside visibility handler after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      p.setVolume(volume || START_VOLUME);
      setMuted(false);
      setNeedsGesture(false);
    } else {
      p.mute();
      setMuted(true);
    }
  };

  const onVolume = (v: number) => {
    const p = playerRef.current;
    setVolume(v);
    if (!p) return;
    p.setVolume(v);
    if (v === 0) {
      p.mute();
      setMuted(true);
    } else if (muted) {
      p.unMute();
      setMuted(false);
      setNeedsGesture(false);
    }
  };

  const enableSound = () => {
    const p = playerRef.current;
    if (!p) return;
    p.unMute();
    p.setVolume(volume || START_VOLUME);
    p.playVideo();
    setMuted(false);
    setNeedsGesture(false);
    setPlaying(true);
  };

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-[#0a0809]", className)}>
      {/* Fallback poster while YT boots */}
      <img
        src="/images/hero-bg.png"
        alt=""
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
          ready ? "opacity-0" : "opacity-100",
        )}
      />

      {/* Scale + shift past YouTube's baked-in letterbox (bars at top and bottom of the file). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: "-30vh",
            width: "max(100vw, 177.78vh)",
            height: "max(100vh, 56.25vw)",
            transform: "translateX(-50%) scale(2.05)",
            transformOrigin: "center top",
          }}
        >
          <div
            ref={hostRef}
            className="absolute inset-0 h-full w-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:!max-h-none [&_iframe]:!max-w-none [&_iframe]:border-0"
          />
        </div>
      </div>

      {/* Light vignette so text stays readable without fake black bars */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,4,6,0.18)_0%,rgba(5,4,6,0.05)_38%,rgba(5,4,6,0.18)_82%,rgba(5,4,6,0.32)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(225,29,46,0.1)_0%,transparent_58%)]" />

      {needsGesture && (
        <button
          type="button"
          onClick={enableSound}
          className="absolute start-1/2 top-[18%] z-20 flex -translate-x-1/2 items-center gap-2 border border-primary/40 bg-black/55 px-4 py-2.5 text-xs font-medium tracking-wide text-white backdrop-blur-md transition hover:border-primary hover:bg-black/70 sm:top-[22%]"
        >
          <Volume2 className="h-4 w-4 text-primary" />
          {t("hero_enable_sound")}
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 p-4 sm:p-5">
        <div className="mx-auto flex max-w-lg items-center gap-2 border border-white/12 bg-black/55 px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/15 text-white transition hover:border-primary/50 hover:text-primary"
            aria-label={playing ? t("hero_pause") : t("hero_play")}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/15 text-white transition hover:border-primary/50 hover:text-primary"
            aria-label={muted ? t("hero_unmute") : t("hero_mute")}
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="hidden text-[10px] tracking-[0.18em] text-white/45 uppercase sm:inline">
              {t("hero_volume")}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              className="hero-volume h-1.5 w-full cursor-pointer appearance-none bg-white/15 accent-primary [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              aria-label={t("hero_volume")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
