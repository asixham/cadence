"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

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
  const [isLoading, setIsLoading] = useState(false);

  const reactId = useId();
  const playerElementId = useMemo(
    () => `yt-player-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [reactId],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayFrameRef = useRef<number | null>(null);
  const overlayTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopOverlayLoop = useCallback(() => {
    if (overlayFrameRef.current !== null) {
      cancelAnimationFrame(overlayFrameRef.current);
      overlayFrameRef.current = null;
    }
  }, []);

  const drawOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (!video || !canvas || !ctx) return;

    const currentTime = video.currentTime;

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

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (!video || !canvas || !ctx || video.readyState < 2) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate aspect ratio and fit video to canvas
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (videoAspect > canvasAspect) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / videoAspect;
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    } else {
      drawHeight = canvas.height;
      drawWidth = canvas.height * videoAspect;
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = 0;
    }
    
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    drawOverlay();
  }, [drawOverlay]);

  const startVideoLoop = useCallback(() => {
    stopVideoLoop();
    const tick = () => {
      drawFrame();
      if (videoRef.current && !videoRef.current.paused) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [drawFrame]);

  const stopVideoLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

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
      const video = videoRef.current;
      if (!video) return;

      const currentTime = video.currentTime;
      const target = Math.max(0, currentTime + delta);

      stopVideoLoop();
      video.currentTime = target;
      setStatus(`Frame @ ${formatSeconds(target)}s`);

      if (overlayTimeoutRef.current) {
        window.clearTimeout(overlayTimeoutRef.current);
      }

      overlayTimeoutRef.current = window.setTimeout(() => {
        drawFrame();
        overlayTimeoutRef.current = null;
      }, 90);
    },
    [drawFrame, stopVideoLoop],
  );

  const handleStepForward = useCallback(() => seekBy(FRAME), [seekBy]);
  const handleStepBackward = useCallback(() => seekBy(-FRAME), [seekBy]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setStatus("Playing");
      startVideoLoop();
    } else {
      video.pause();
      setIsPlaying(false);
      setStatus("Paused");
      stopVideoLoop();
      drawFrame();
    }
  }, [startVideoLoop, stopVideoLoop, drawFrame]);

  const loadVideo = useCallback(async () => {
    if (!inputValue.trim()) {
      setStatus("Enter a YouTube URL or video ID.");
      return;
    }

    const videoId = extractVideoId(inputValue);
    if (!videoId) {
      setStatus("That doesn't look like a valid YouTube link yet.");
      return;
    }

    setStatus("Fetching video...");
    setHasVideo(false);
    setIsPlaying(false);
    setIsLoading(true);
    stopVideoLoop();

    if (overlayTimeoutRef.current) {
      window.clearTimeout(overlayTimeoutRef.current);
      overlayTimeoutRef.current = null;
    }

    try {
      // Get direct video URL using oembed endpoint
      const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (!oembedResponse.ok) {
        throw new Error('Video not found');
      }

      // For now, we'll use a placeholder approach since direct YouTube video URLs are complex
      // In a real implementation, you'd need a backend service to get the actual video URL
      setStatus("Direct video access requires backend service. Using demo mode.");
      
      // Create a demo video element for testing
      const video = videoRef.current;
      if (video) {
        // Using a sample video URL for demonstration
        video.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        video.crossOrigin = 'anonymous';
        
        video.addEventListener('loadeddata', () => {
          setHasVideo(true);
          setIsLoading(false);
          setStatus("Ready — space, ←, →, or the controls step frames.");
          video.pause();
          updateCanvasSize();
          drawFrame();
        }, { once: true });

        video.addEventListener('error', () => {
          setIsLoading(false);
          setStatus("Failed to load video. Try another URL.");
        }, { once: true });
      }
    } catch (error) {
      setIsLoading(false);
      setStatus("Failed to fetch video information.");
    }
  }, [inputValue, stopVideoLoop, updateCanvasSize, drawFrame]);


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
      stopVideoLoop();
      if (overlayTimeoutRef.current) {
        window.clearTimeout(overlayTimeoutRef.current);
      }
    };
  }, [stopVideoLoop]);

  return (
    <>
      <main className="flex min-h-dvh w-full items-stretch justify-center text-white">
        <div className="flex w-full flex-col bg-[var(--panel)]">
          <header className="flex items-center justify-between border-b border-white/10 px-10 py-6">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-white/30">Cadence</p>
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
                      loadVideo();
                    }
                  }}
                  placeholder="https://youtu.be/…"
                  className="w-full rounded-[14px] border border-white/12 bg-[#0d0f12] px-4 py-3 text-base text-white placeholder:text-white/25 focus:border-[var(--accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={loadVideo}
                  className="inline-flex w-full items-center justify-center rounded-[14px] bg-white/12 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/18 disabled:cursor-not-allowed disabled:bg-white/6"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Load Video"}
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
                <video
                  ref={videoRef}
                  className="hidden"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full"
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
