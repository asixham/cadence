"use client";

import Script from "next/script";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const FPS = 24;
const FRAME = 1 / FPS;

const extractVideoId = (value: string) => {
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const matches = trimmed.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return matches ? matches[1] : null;
};

const formatSeconds = (time: number) => time.toFixed(3);
const computeFrame = (time: number) => Math.max(0, Math.round(time * FPS));

export default function Home() {
  return <YouTubeFrameStudio />;
}

function YouTubeFrameStudio() {
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState("Enter a YouTube URL or ID to begin.");
  const [hasVideo, setHasVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);

  const reactId = useId();
  const playerElementId = useMemo(
    () => `yt-player-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [reactId],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const playerRef = useRef<any>(null);
  const overlayFrameRef = useRef<number | null>(null);
  const overlayTimeoutRef = useRef<number | null>(null);

  const stopOverlayLoop = useCallback(() => {
    if (overlayFrameRef.current !== null) {
      cancelAnimationFrame(overlayFrameRef.current);
      overlayFrameRef.current = null;
    }
  }, []);

  const drawOverlay = useCallback(() => {
    const player = playerRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (!player || !canvas || !ctx) return;

    const currentTime =
      typeof player.getCurrentTime === "function" ? player.getCurrentTime() : 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pad = 24;
    const boxWidth = 240;
    const boxHeight = 92;

    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "rgba(7, 11, 17, 0.72)";
    ctx.strokeStyle = "rgba(0, 255, 198, 0.4)";
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    traceRoundedRect(ctx, pad, pad, boxWidth, boxHeight, 18);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    ctx.font = "600 26px 'Barlow', sans-serif";
    ctx.fillStyle = "rgba(0, 255, 198, 0.92)";
    ctx.textBaseline = "top";
    ctx.fillText(`Frame ${computeFrame(currentTime)}`, pad + 24, pad + 22);

    ctx.font = "500 18px 'Barlow', sans-serif";
    ctx.fillStyle = "rgba(245, 247, 249, 0.82)";
    ctx.fillText(`${formatSeconds(currentTime)}s`, pad + 24, pad + 56);
  }, []);

  const startOverlayLoop = useCallback(() => {
    stopOverlayLoop();
    const tick = () => {
      drawOverlay();
      overlayFrameRef.current = requestAnimationFrame(tick);
    };
    overlayFrameRef.current = requestAnimationFrame(tick);
  }, [drawOverlay, stopOverlayLoop]);

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { clientWidth, clientHeight } = container;
    canvas.width = clientWidth;
    canvas.height = clientHeight;

    const context = canvas.getContext("2d");
    if (context) {
      ctxRef.current = context;
      context.setTransform(1, 0, 0, 1, 0, 0);
    }

    drawOverlay();
  }, [drawOverlay]);

  const seekBy = useCallback(
    (delta: number) => {
      const player = playerRef.current;
      if (!player) return;

      const currentTime =
        typeof player.getCurrentTime === "function"
          ? player.getCurrentTime()
          : 0;
      const target = Math.max(0, currentTime + delta);

      stopOverlayLoop();
      player.seekTo(target, true);
      setStatus(`Frame @ ${formatSeconds(target)}s`);

      if (overlayTimeoutRef.current) {
        window.clearTimeout(overlayTimeoutRef.current);
      }

      overlayTimeoutRef.current = window.setTimeout(() => {
        drawOverlay();
        overlayTimeoutRef.current = null;
      }, 90);
    },
    [drawOverlay, stopOverlayLoop],
  );

  const handleStepForward = useCallback(() => seekBy(FRAME), [seekBy]);
  const handleStepBackward = useCallback(() => seekBy(-FRAME), [seekBy]);

  const togglePlayback = useCallback(() => {
    const player = playerRef.current;
    const playerState = window.YT?.PlayerState;
    if (!player || !playerState) return;

    const state =
      typeof player.getPlayerState === "function" ? player.getPlayerState() : null;

    if (state === playerState.PLAYING) {
      player.pauseVideo?.();
    } else {
      player.playVideo?.();
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) {
      setStatus("Enter a YouTube URL or video ID.");
      return;
    }

    if (!isScriptReady || !window.YT?.Player) {
      setStatus("Preparing YouTube controls…");
      return;
    }

    const videoId = extractVideoId(inputValue);
    if (!videoId) {
      setStatus("That doesn't look like a valid YouTube link yet.");
      return;
    }

    setStatus("Linking to YouTube…");
    setHasVideo(false);
    setIsPlaying(false);
    stopOverlayLoop();

    if (overlayTimeoutRef.current) {
      window.clearTimeout(overlayTimeoutRef.current);
      overlayTimeoutRef.current = null;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    playerRef.current = new window.YT.Player(playerElementId, {
      videoId,
      height: "100%",
      width: "100%",
      playerVars: {
        controls: 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: (event: any) => {
          playerRef.current = event.target;
          setHasVideo(true);
          setStatus("Ready — space, ←, →, or the controls step frames.");
          event.target.pauseVideo();
          updateCanvasSize();
          drawOverlay();
        },
        onStateChange: (event: any) => {
          const playerState = window.YT?.PlayerState;
          if (!playerState) return;

          if (event.data === playerState.PLAYING) {
            setIsPlaying(true);
            setStatus("Playing");
            startOverlayLoop();
          } else if (event.data === playerState.PAUSED) {
            setIsPlaying(false);
            setStatus("Paused");
            stopOverlayLoop();
            drawOverlay();
          } else if (event.data === playerState.ENDED) {
            setIsPlaying(false);
            setStatus("Playback finished");
            stopOverlayLoop();
            drawOverlay();
          }
        },
        onError: (event: any) => {
          setIsPlaying(false);
          setStatus(`YouTube error: ${event?.data ?? "Unknown"}`);
          stopOverlayLoop();
        },
      },
    });
  }, [
    drawOverlay,
    inputValue,
    isScriptReady,
    playerElementId,
    startOverlayLoop,
    stopOverlayLoop,
    updateCanvasSize,
  ]);

  useEffect(() => {
    let isMounted = true;

    if (typeof window === "undefined") {
      return () => {};
    }

    if (window.YT && window.YT.Player) {
      setIsScriptReady(true);
      return () => {};
    }

    const readyHandler = () => {
      if (!isMounted) return;
      setIsScriptReady(true);
    };

    window.onYouTubeIframeAPIReady = readyHandler;

    return () => {
      isMounted = false;
      if (window.onYouTubeIframeAPIReady === readyHandler) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => updateCanvasSize();
    updateCanvasSize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateCanvasSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        handleStepForward();
      } else if (event.code === "ArrowLeft") {
        event.preventDefault();
        handleStepBackward();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleStepBackward, handleStepForward, togglePlayback]);

  useEffect(() => {
    return () => {
      stopOverlayLoop();
      if (overlayTimeoutRef.current) {
        window.clearTimeout(overlayTimeoutRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [stopOverlayLoop]);

  return (
    <>
      <Script
        src="https://www.youtube.com/iframe_api"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.YT?.Player) {
            setIsScriptReady(true);
          }
        }}
      />
      <main className="flex min-h-dvh w-full items-stretch justify-center text-white">
        <div className="flex w-full flex-col bg-[var(--panel)]">
          <header className="flex items-center justify-between border-b border-white/10 px-10 py-6">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-white/30">Cadence</p>
              <h1 className="text-2xl font-semibold text-white">Frame Studio</h1>
            </div>
            <div className="text-sm text-[var(--muted)]">{status}</div>
          </header>

          <div className="flex flex-1 flex-col lg:flex-row">
            <aside className="flex w-full flex-col gap-6 border-b border-white/10 px-10 py-8 lg:w-80 lg:border-b-0 lg:border-r">
              <div className="space-y-3">
                <label htmlFor="video-input" className="text-xs uppercase tracking-[0.35em] text-white/35">
                  Source
                </label>
                <input
                  id="video-input"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSubmit();
                    }
                  }}
                  placeholder="https://youtu.be/…"
                  className="w-full rounded-[14px] border border-white/12 bg-[#0d0f12] px-4 py-3 text-base text-white placeholder:text-white/25 focus:border-[var(--accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex w-full items-center justify-center rounded-[14px] bg-white/12 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/18 disabled:cursor-not-allowed disabled:bg-white/6"
                  disabled={!isScriptReady}
                >
                  {isScriptReady ? "Load Video" : "Connecting"}
                </button>
              </div>

              <div className="space-y-2 rounded-[14px] border border-white/12 bg-[#0d0f12] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.35em] text-white/35">Shortcuts</p>
                <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.3em] text-white/45">
                  <span className="rounded-full border border-white/12 px-3 py-[6px]">Space</span>
                  <span className="rounded-full border border-white/12 px-3 py-[6px]">←</span>
                  <span className="rounded-full border border-white/12 px-3 py-[6px]">→</span>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Quickly pause or step frames from the steering wheel controls.
                </p>
              </div>

              <div className="space-y-1 text-sm text-[var(--muted)]">
                <p>Frame precision: 24 fps locked.</p>
                <p>Optimized for low-glare Tesla displays.</p>
              </div>
            </aside>

            <section className="flex flex-1 flex-col">
              <div
                ref={containerRef}
                className="relative flex-1 overflow-hidden border-b border-white/10 bg-black/80"
              >
                <div id={playerElementId} className="absolute inset-0" />
                <canvas
                  ref={canvasRef}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                />
              </div>

              <footer className="flex items-center justify-between px-10 py-6">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-white/35">
                  <span className="inline-flex h-2 w-2 rounded-full bg-white/35" />
                  <span>24 fps overlay</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleStepBackward}
                    disabled={!hasVideo}
                    className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/12 bg-[#0d0f12] text-xl text-white transition hover:border-white/35 hover:bg-[#14171b] disabled:cursor-not-allowed disabled:border-white/6 disabled:text-white/20"
                  >
                    ⏮
                  </button>
                  <button
                    type="button"
                    onClick={togglePlayback}
                    disabled={!hasVideo}
                    className="flex h-12 min-w-[128px] items-center justify-center rounded-[14px] bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                  <button
                    type="button"
                    onClick={handleStepForward}
                    disabled={!hasVideo}
                    className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/12 bg-[#0d0f12] text-xl text-white transition hover:border-white/35 hover:bg-[#14171b] disabled:cursor-not-allowed disabled:border-white/6 disabled:text-white/20"
                  >
                    ⏭
                  </button>
                </div>
              </footer>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
